"use client";

import React, { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { showToast } from '@/components/ui/Toast';
import { confirmAlert } from '@/components/ui/AlertConfirm';
import { useTheme } from '@/components/ui/ThemeProvider'; 
import IdeHeader from '@/components/exam/IdeHeader';
import LeftPane from '@/components/exam/LeftPane';
import RightPane from '@/components/exam/RightPane';
import ExamSecurity from '@/components/exam/ExamSecurity'; 
import './ide.css';

export default function ExamIDE({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const { theme } = useTheme();
  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const [loading, setLoading] = useState(true);
  const [examValidated, setExamValidated] = useState(false);

  const [leftWidth, setLeftWidth] = useState(40);
  const [isDraggingX, setIsDraggingX] = useState(false);

  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  
  const [codeMap, setCodeMap] = useState({}); 
  const [statusMap, setStatusMap] = useState({}); 
  const [lang, setLang] = useState('python3');
  const [langOptions, setLangOptions] = useState([]);
  
  const [output, setOutput] = useState(null); 
  const [isRunning, setIsRunning] = useState(false);
  const [execProgressMsg, setExecProgressMsg] = useState(""); 
  const activeJobId = useRef(null); 
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [localStrikes, setLocalStrikes] = useState(0); 
  const [isConnected, setIsConnected] = useState(false);
  
  const [userId, setUserId] = useState(null);
  const userIdRef = useRef(null); 

  const [syncStatus, setSyncStatus] = useState("All changes saved");
  const hasSubmittedRef = useRef(false);
  const lastSavedCodeMap = useRef({});
  const lastStrikeTime = useRef(0); 

  const socketRef = useRef(null);

  // Helper to parse IST strings safely from Backend
  const parseIST = (dateString) => {
    if (!dateString) return 0;
    const cleanStr = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
    return new Date(`${cleanStr}+05:30`).getTime();
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasSubmittedRef.current) return;
      e.preventDefault();
      e.returnValue = "You have an ongoing exam. If you reload, you may lose unsaved progress or receive a policy strike. Are you sure you want to leave?";
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.replace('/login');

        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          setUserId(decoded.userId || decoded.id);
          userIdRef.current = decoded.userId || decoded.id;
        } catch (e) {
          return router.replace('/login');
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!res.ok) {
            showToast(data.error || "Failed to load exam.", "error");
            return router.replace('/dashboard');
        }

        const c = data.contest;
        const now = Date.now();

        if (c.startTime) {
            const realStartTime = parseIST(c.startTime);
            if (now < (realStartTime - 30000)) {
                showToast("This exam has not started yet.", "warning");
                return router.replace(`/exam/${examId}/lobby`); 
            }
        }

        let realEndTime = null;
        if (c.endTime) {
            realEndTime = parseIST(c.endTime);
            if (now >= realEndTime) {
                hasSubmittedRef.current = true;
                showToast("Exam time is already over.", "info");
                return router.replace(`/exam/${examId}/submissions?reason=timeout`);
            }
        }

        if (data.session && (data.session.status === "SUBMITTED" || data.session.status === "KICKED")) {
            hasSubmittedRef.current = true;
            const reason = data.session.status === "KICKED" ? "terminated" : "success";
            showToast(data.session.status === "KICKED" ? "This exam was terminated due to violations." : "Exam already submitted.", "info");
            return router.replace(`/exam/${examId}/submissions?reason=${reason}`);
        }

        setContest(c);
        
        const rawLangs = c.allowedLangs ? c.allowedLangs.split(',') : ['Python 3'];
        const langs = rawLangs.map(l => {
            const label = l.trim();
            let value = label.toLowerCase().replace(/\s+/g, '');
            if (value === 'c++') value = 'cpp';
            if (value === 'c#') value = 'csharp';
            return { label, value };
        });
        
        const uniqueLangs = Array.from(new Map(langs.map(item => [item.value, item])).values());
        setLangOptions(uniqueLangs);
        setLang(uniqueLangs.length > 0 ? uniqueLangs[0].value : 'python3');

        const probs = c.problems || [];
        setQuestions(probs);
        
        const initCodeMap = {};
        const initStatusMap = {};
        
        probs.forEach(p => {
          initCodeMap[p.id] = {};
          let stubs = p.codeStubs;
          if (typeof stubs === 'string') { try { stubs = JSON.parse(stubs); } catch(e) { stubs = {}; } }
          if (!stubs) stubs = {};

          uniqueLangs.forEach(l => {
             const draftKey = `draft_${examId}_${p.id}_${l.value}`;
             const localDraft = localStorage.getItem(draftKey);
             
             let matchedStub = stubs[l.label] || stubs[l.value] || "";
             if (!matchedStub) {
                 const target = l.value.toLowerCase().replace(/\s+/g, '');
                 for (const [k, v] of Object.entries(stubs)) {
                     const normK = k.toLowerCase().replace(/\s+/g, '');
                     if (normK === target || normK.includes(target) || target.includes(normK)) {
                         matchedStub = v; break;
                     }
                 }
             }
             initCodeMap[p.id][l.value] = localDraft !== null ? localDraft : matchedStub; 
          });
          initStatusMap[p.id] = 'unvisited';
        });

        setCodeMap(initCodeMap);
        setStatusMap(prev => {
            const newMap = { ...initStatusMap, ...prev };
            if (probs.length > 0 && newMap[probs[0].id] !== 'submitted') newMap[probs[0].id] = 'visited';
            return newMap;
        });

        if (realEndTime) setTimeLeft(Math.max(0, Math.floor((realEndTime - now) / 1000)));

        setExamValidated(true);
        setLoading(false);

      } catch (err) {
        showToast("Error loading exam environment.", "error");
        router.replace('/dashboard');
      }
    };
    fetchExam();
  }, [examId, router]);


  useEffect(() => {
    if (!examValidated) return; 

    const token = localStorage.getItem('token');
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL, { auth: { token } });
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-exam', { examId, userId: userIdRef.current });
    });
    
    socketRef.current.on('disconnect', () => setIsConnected(false));

    socketRef.current.on('sync-session', (data) => {
      setLocalStrikes(data.strikes);
      if (data.status === "SUBMITTED" || data.status === "KICKED") {
         hasSubmittedRef.current = true;
         const reason = data.status === "KICKED" ? "terminated" : "success";
         showToast(data.status === "KICKED" ? "This exam was terminated due to violations." : "Exam already submitted.", "info");
         router.replace(`/exam/${examId}/submissions?reason=${reason}`);
      }
    });

    socketRef.current.on('exam-terminated', (data) => {
      hasSubmittedRef.current = true;
      router.replace(`/exam/${examId}/submissions?reason=terminated`);
    });

    socketRef.current.on('sync-solved', (solvedIds) => {
      setStatusMap(prev => {
        const updated = { ...prev };
        solvedIds.forEach(id => { updated[id] = 'submitted'; });
        return updated;
      });
    });

    socketRef.current.on('sync-drafts', (cloudDrafts) => {
      setCodeMap(prev => {
        const updatedMap = { ...prev };
        cloudDrafts.forEach(draft => {
          if (!updatedMap[draft.problemId]) updatedMap[draft.problemId] = {};
          updatedMap[draft.problemId][draft.language] = draft.code;
          lastSavedCodeMap.current[`${draft.problemId}_${draft.language}`] = draft.code;
        });
        return updatedMap;
      });
    });

    socketRef.current.on('strike-update', (data) => {
      setLocalStrikes(data.count);
      if (data.status === "KICKED" || data.count >= data.limit) {
        handleSubmitExam(true, "KICKED"); 
      } else {
        confirmAlert({
          title: "Violation Detected!", 
          message: `Strike ${data.count} of ${data.limit}. Please remain on this screen.`,
          confirmText: "I Understand", 
          cancelText: null, 
          isDanger: true, 
          darkOverlay: themeRef.current === 'dark'
        });
      }
    });

    socketRef.current.on('execution-progress', (data) => setExecProgressMsg(data.message));

    socketRef.current.on('code-output', (data) => {
      if (!activeJobId.current && data.status !== 'Stopped') return; 
      setOutput(data);
      setIsRunning(false);
      setExecProgressMsg("");
      activeJobId.current = null;
      if (data.problemId && data.status === 'Accepted') {
        setStatusMap(prev => ({ ...prev, [data.problemId]: 'submitted' }));
      }
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [examValidated, examId, router]); 

  const triggerSave = useCallback((forceUpdate = false, silent = false) => {
    const currentProb = questions[activeIdx];
    if (!currentProb || !socketRef.current || !socketRef.current.connected) return;

    const currentCode = codeMap[currentProb.id]?.[lang] || '';
    const trackingKey = `${currentProb.id}_${lang}`;
    const lastSavedCode = lastSavedCodeMap.current[trackingKey];

    if (currentCode !== lastSavedCode) {
      setSyncStatus("Saving...");
      // 🚀 Explicitly capturing Date.now() here bypasses any clock misalignments on backend
      socketRef.current.emit('save-draft', {
        examId, 
        userId, 
        problemId: currentProb.id, 
        language: lang, 
        code: currentCode,
        clientTimestamp: Date.now() // Send the exact millisecond it was saved to help backend log
      });
      lastSavedCodeMap.current[trackingKey] = currentCode;
      setTimeout(() => setSyncStatus("All changes saved"), 1500);
    } else if (forceUpdate && !silent) {
      setSyncStatus("All changes saved");
      showToast("Code is already synced.", "info");
    }
  }, [questions, activeIdx, lang, codeMap, userId, examId]);

  useEffect(() => {
    const saveTimer = setInterval(() => triggerSave(false, true), 10000); 
    return () => clearInterval(saveTimer);
  }, [triggerSave]);

  const logStrikeToBackend = useCallback((reason = "Tab/App Switch") => {
    const now = Date.now();
    if (now - lastStrikeTime.current > 2000) {
        lastStrikeTime.current = now;
        const uid = userIdRef.current; 
        if (socketRef.current && uid) {
            socketRef.current.emit('violation-tab-switch', { examId, userId: uid, reason });
        }
    }
  }, [examId]); 

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || hasSubmittedRef.current) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          showToast("Time is up!", "error");
          handleSubmitExam(true, "TIME_UP");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateStatus = (id, newStatus) => {
    setStatusMap(prev => ({ ...prev, [id]: prev[id] === 'submitted' ? 'submitted' : newStatus }));
  };

  useEffect(() => {
    setOutput(null);
    setExecProgressMsg("");
  }, [activeIdx, lang]);

  const handleStopCode = useCallback(() => {
    if (socketRef.current && activeJobId.current) {
        socketRef.current.emit('stop-execution', { jobId: activeJobId.current });
    }
    setIsRunning(false);
    setExecProgressMsg("");
    activeJobId.current = null; 
    
    setOutput({
      problemId: questions[activeIdx]?.id, status: 'Stopped',
      results: [{ index: 1, type: 'raw', output: 'Execution manually stopped by user.' }]
    });
  }, [questions, activeIdx]);

  const handleRunCode = useCallback(() => {
    const currentProb = questions[activeIdx];
    if (!currentProb || !socketRef.current || !socketRef.current.connected) return;

    const codeToRun = codeMap[currentProb.id]?.[lang] || '';
    if (!codeToRun.trim()) { showToast("Please write some code before running.", "error"); return; }

    setIsRunning(true);
    setOutput(null);
    setExecProgressMsg("Initializing environment...");
    
    const newJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    activeJobId.current = newJobId;

    triggerSave(true, true); 

    socketRef.current.emit('run-code', {
      examId, userId, problemId: currentProb.id, language: lang, code: codeToRun, jobId: newJobId
    });
  }, [questions, activeIdx, lang, codeMap, examId, userId, triggerSave]);

  const handleSubmitExam = async (force = false, type = "MANUAL") => {
    if (hasSubmittedRef.current) return; 
    
    const doSubmit = async () => {
      hasSubmittedRef.current = true;
      try {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/submit`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        
        Object.keys(localStorage).forEach(key => { if (key.startsWith(`draft_${examId}_`)) localStorage.removeItem(key); });
        
        let reason = "success";
        if (type === "KICKED") reason = "terminated";
        else if (type === "TIME_UP") reason = "timeout";
        
        router.replace(`/exam/${examId}/submissions?reason=${reason}`);
      } catch(err) {
        showToast("Error submitting exam.", "error");
        hasSubmittedRef.current = false;
      }
    };

    if (force) { doSubmit(); return; }

    confirmAlert({
      title: "Submit Exam?", 
      message: "Are you sure you want to finish? You cannot change your answers after proceeding.",
      confirmText: "Yes, Submit", 
      cancelText: "No, Continue", 
      isDanger: false, 
      darkOverlay: themeRef.current === 'dark', 
      onConfirm: doSubmit
    });
  };

  const handleDragXStart = (e) => {
    e.preventDefault(); setIsDraggingX(true);
    const handleDragX = (me) => {
      const w = (me.clientX / window.innerWidth) * 100;
      if (w > 20 && w < 70) setLeftWidth(w);
    };
    const handleDragXEnd = () => {
      setIsDraggingX(false);
      document.removeEventListener('mousemove', handleDragX); document.removeEventListener('mouseup', handleDragXEnd);
    };
    document.addEventListener('mousemove', handleDragX); document.addEventListener('mouseup', handleDragXEnd);
  };

  return (
    <ExamSecurity 
      isStrict={contest ? contest.strictMode : false} 
      allowedStrikes={contest ? contest.strikes : 0} 
      strikes={localStrikes} 
      logStrike={logStrikeToBackend}
      loading={loading}
    >
      <div className={`ide-wrapper ${isDraggingX ? 'is-dragging' : ''}`}>
        <IdeHeader 
          loading={loading} contest={contest} timeLeft={timeLeft} formatTime={formatTime} 
          strikes={localStrikes} isConnected={isConnected} handleSubmitExam={handleSubmitExam} 
        />
        
        <main className="ide-main relative">
          <LeftPane loading={loading} leftWidth={leftWidth} questions={questions} activeIdx={activeIdx} setActiveIdx={setActiveIdx} statusMap={statusMap} updateStatus={updateStatus} />
          <div className="resizer-x" onMouseDown={handleDragXStart}></div>

          <RightPane 
            loading={loading} currentProb={questions[activeIdx]} 
            currentCode={questions[activeIdx] ? (codeMap[questions[activeIdx].id]?.[lang] || '') : ''} 
            setCode={(val) => {
              const prob = questions[activeIdx];
              if (prob) {
                setSyncStatus("Saving...");
                setCodeMap(prev => ({ ...prev, [prob.id]: { ...prev[prob.id], [lang]: val } }));
                localStorage.setItem(`draft_${examId}_${prob.id}_${lang}`, val);
                
                if (statusMap[prob.id] === 'submitted') {
                    setStatusMap(prev => ({ ...prev, [prob.id]: 'visited' }));
                }
              }
            }} 
            lang={lang} setLang={setLang} langOptions={langOptions} 
            handleRunCode={handleRunCode} isRunning={isRunning} output={output} 
            syncStatus={syncStatus} triggerSave={triggerSave}
            execProgressMsg={execProgressMsg} 
            handleStopCode={handleStopCode} 
            isStrict={contest && contest.strikes > 0 ? contest.strictMode : false} 
          />
        </main>
      </div>
    </ExamSecurity>
  );
}