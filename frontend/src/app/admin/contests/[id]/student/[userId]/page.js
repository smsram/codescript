"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { showToast } from '@/components/ui/Toast';
import { confirmAlert } from '@/components/ui/AlertConfirm';
import Skeleton from '@/components/ui/Skeleton'; 
import './student-logs.css';

export default function StudentExamLogs({ params }) {
  const router = useRouter();
  const { id: examId, userId } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  
  // Grouped answers & stats state
  const [groupedAnswers, setGroupedAnswers] = useState({});
  const [activeProblemId, setActiveProblemId] = useState(null);
  const [activeLang, setActiveLang] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0); 
  
  const socketRef = useRef(null);

  // 🚀 FIXED: Math-free formatter. Treats input as exact UTC and renders it without ANY timezone offset math.
  const formatIST = (dateInput, formatType = 'time') => {
    if (!dateInput) return '--:--';
    
    let dateObj;
    
    if (typeof dateInput === 'string') {
        const rawString = dateInput.includes('Z') ? dateInput.split('Z')[0] : dateInput.split('+')[0];
        dateObj = new Date(`${rawString}Z`); 
    } else {
        dateObj = new Date(dateInput);
    }
    
    if (isNaN(dateObj.getTime())) return '--:--';

    if (formatType === 'time') {
      return dateObj.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
    }
    if (formatType === 'full') {
      return dateObj.toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return dateObj.toLocaleDateString('en-US', { timeZone: 'UTC' });
  };

  const groupData = (answersData) => {
    const grouped = {};
    answersData.forEach(ans => {
      if (!grouped[ans.problemId]) {
        grouped[ans.problemId] = {
          id: ans.problemId,
          title: ans.problem?.title || `Problem ID: ${ans.problemId.substring(0, 8)}`,
          attempts: {}
        };
      }
      grouped[ans.problemId].attempts[ans.language] = ans;
    });
    return grouped;
  };

  // 🚀 Abstracted Fetch Logic for Reusability
  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/login');
        return null;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/student/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      setSession(data.session);
      
      const totalProbCount = data.totalProblems || data.session?.contest?._count?.problems || data.answers?.length || 0;
      setTotalQuestions(totalProbCount);

      const grouped = groupData(data.answers || []);
      setGroupedAnswers(grouped);
      
      // Only set active if not already set, to prevent UI jumping on refresh
      setActiveProblemId(prev => prev || (Object.keys(grouped).length > 0 ? Object.keys(grouped)[0] : null));
      setActiveLang(prev => prev || (Object.keys(grouped).length > 0 ? Object.keys(grouped[Object.keys(grouped)[0]].attempts)[0] : null));
      
      setLoading(false);
      return data;
    } catch (err) {
      showToast("Error loading logs", "error");
      router.push(`/admin/contests/${examId}/details`);
      return null;
    }
  }, [examId, userId, router]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const data = await fetchLogs();
      if (!data || !isMounted) return;

      const token = localStorage.getItem('token');

      // LIVE SOCKET CONNECTION
      if (!socketRef.current) {
          socketRef.current = io(process.env.NEXT_PUBLIC_API_URL, { auth: { token } });
          socketRef.current.on('connect', () => {
             socketRef.current.emit('join-admin-monitor', { examId });
          });

          socketRef.current.on('live-stats-update', (liveData) => {
            const currentStudent = liveData.sessions.find(s => s.userId === userId);
            if (currentStudent) {
                setSession(prev => ({ ...prev, ...currentStudent }));
            }
          });

          socketRef.current.on(`live-code-${userId}`, (update) => {
            setGroupedAnswers(prev => {
              const updated = { ...prev };
              if (!updated[update.problemId]) {
                updated[update.problemId] = {
                  id: update.problemId,
                  title: `Problem ID: ${update.problemId.substring(0, 8)}`,
                  attempts: {}
                };
              }
              updated[update.problemId].attempts[update.language] = {
                ...updated[update.problemId].attempts[update.language],
                code: update.code,
                status: update.status,
                updatedAt: Date.now() 
              };
              return updated;
            });
          });
      }
    };

    init();

    return () => { 
        isMounted = false;
        if (socketRef.current) socketRef.current.disconnect(); 
    };
  }, [fetchLogs, examId, userId]);

  // 🚀 ADMIN ACTIONS (Reset & Terminate)
  const handleResetExam = () => {
    confirmAlert({
      title: "Reset Student Exam?",
      message: `Resetting the exam for ${session.user.name} allows them to retake it with 0 strikes. Drafts are kept.`,
      confirmText: "Yes, Reset Exam", cancelText: "Cancel", isDanger: false, darkOverlay: true,
      onConfirm: async () => {
        setSession(prev => ({ ...prev, status: 'IN_PROGRESS', strikes: 0, camStrikes: 0 }));
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/reset-student`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          if (!res.ok) throw new Error("Backend database reset failed.");
          if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('admin-reset-student', { examId, userId });
          }
          showToast(`Exam reset for ${session.user.name}`, "success");
          fetchLogs(); 
        } catch (err) { 
          showToast("Failed to reset. Check server logs.", "error"); 
          fetchLogs(); 
        }
      }
    });
  };

  const handleTerminateSession = () => {
    confirmAlert({
      title: "Terminate Session?",
      message: `Forcibly end the exam for ${session.user.name}. They will be kicked immediately.`,
      confirmText: "Terminate Exam", cancelText: "Cancel", isDanger: true, darkOverlay: true,
      onConfirm: async () => {
        setSession(prev => ({ ...prev, status: 'KICKED' }));
        try {
          const token = localStorage.getItem('token');
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/terminate-student`, {
             method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ userId })
          });
          if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('admin-terminate-student', { examId, userId });
          }
          showToast(`Termination successful for ${session.user.name}`, "success");
          fetchLogs();
        } catch (err) {
          if (socketRef.current && socketRef.current.connected) {
             socketRef.current.emit('admin-terminate-student', { examId, userId });
             showToast(`Termination command sent for ${session.user.name}`, "success");
          } else {
             showToast("Failed to terminate student.", "error");
          }
          fetchLogs();
        }
      }
    });
  };

  const handleProblemClick = (pid) => {
    setActiveProblemId(pid);
    const langs = Object.keys(groupedAnswers[pid].attempts);
    if (!langs.includes(activeLang)) {
      setActiveLang(langs[0]);
    }
  };

  if (loading) {
    return (
      <div className="logs-container">
        <div style={{ marginBottom: '16px' }}>
          <Skeleton width="150px" height="20px" borderRadius="4px" />
        </div>
        <div className="meta-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
           <Skeleton circle width="60px" height="60px" />
           <div style={{ flex: 1 }}>
              <Skeleton width="200px" height="24px" className="mb-2" />
              <Skeleton width="150px" height="16px" />
           </div>
           <Skeleton width="100px" height="32px" borderRadius="20px" />
        </div>
        <div className="logs-grid">
           <div className="pane sidebar-pane" style={{ padding: '16px' }}>
              <Skeleton width="100%" height="60px" borderRadius="8px" className="mb-3" />
              <Skeleton width="100%" height="60px" borderRadius="8px" className="mb-3" />
              <Skeleton width="100%" height="60px" borderRadius="8px" />
           </div>
           <div className="pane code-pane" style={{ padding: '16px' }}>
              <Skeleton width="200px" height="24px" className="mb-4" />
              <Skeleton width="100%" height="400px" borderRadius="8px" />
           </div>
           <div className="pane timeline-pane" style={{ padding: '16px' }}>
              <Skeleton width="150px" height="20px" className="mb-4" />
              <Skeleton width="100%" height="30px" className="mb-2" />
              <Skeleton width="100%" height="30px" className="mb-2" />
              <Skeleton width="100%" height="30px" />
           </div>
        </div>
      </div>
    );
  }

  const isLive = session.status === 'IN_PROGRESS';
  const activeProblem = groupedAnswers[activeProblemId];
  const activeAttempt = activeProblem ? activeProblem.attempts[activeLang] : null;
  const problemsList = Object.values(groupedAnswers);

  const acceptedCount = problemsList.filter(prob => 
    Object.values(prob.attempts).some(a => a.status === 'Accepted')
  ).length;

  const actualCamStrikes = Math.max(0, (session.camStrikes || 0) - 1);

  return (
    <div className="logs-container">
      
      {/* Top Navigation */}
      <Link href={`/admin/contests/${examId}/details`} className="back-link">
        <span className="material-symbols-outlined">arrow_back</span> Back to Monitor
      </Link>

      {/* Hero Meta Card */}
      <div className="meta-card">
        <div className="meta-left">
          <div className={`meta-avatar ${session.strikes > 0 || actualCamStrikes > 0 ? 'anomaly' : 'normal'}`}>
            {session.user.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="meta-name">{session.user.name}</h1>
            {/* 🚀 Display Email and PIN clearly */}
            <p className="meta-email" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {session.user.email}
              {session.user.pin && (
                <span style={{ fontSize: '0.75rem', background: '#334155', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1', fontWeight: 600 }}>
                  PIN: {session.user.pin}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="meta-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           {/* 🚀 Admin Action Buttons */}
           <div style={{ display: 'flex', gap: '10px' }}>
              {(session.status === 'SUBMITTED' || session.status === 'KICKED' || session.strikes > 0 || session.camStrikes > 0) && (
                <button 
                   onClick={handleResetExam} 
                   style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span> Reset
                </button>
              )}
              {isLive && (
                <button 
                   onClick={handleTerminateSession} 
                   style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>block</span> Terminate
                </button>
              )}
           </div>

           <div className={`status-pill status-${session.status.toLowerCase()}`}>
              {isLive && <span className="status-pulse pulse-anim"></span>}
              {session.status.replace('_', ' ')}
           </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="logs-grid">
        
        {/* LEFT PANE: Problem Navigator */}
        <div className="pane sidebar-pane">
          <div className="pane-header">
            <h3>Questions Attempted</h3>
            <span className="count-badge">{problemsList.length}</span>
          </div>
          <div className="pane-content custom-scrollbar">
            {problemsList.length === 0 ? (
               <div className="empty-state">No progress recorded yet.</div>
            ) : (
              problemsList.map(prob => {
                const attempts = Object.values(prob.attempts);
                const hasAccepted = attempts.some(a => a.status === 'Accepted');
                const latestAttempt = attempts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
                const displayStatus = hasAccepted ? 'Accepted' : latestAttempt.status;
                
                return (
                  <button 
                    key={prob.id} 
                    className={`prob-nav-item ${activeProblemId === prob.id ? 'active' : ''}`}
                    onClick={() => handleProblemClick(prob.id)}
                  >
                    <div className="prob-nav-top">
                      <span className="prob-title">{prob.title}</span>
                    </div>
                    <div className="prob-nav-bottom">
                      <span className="prob-lang">{Object.keys(prob.attempts).length} Language(s)</span>
                      <span className={`prob-status status-text-${displayStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                        {displayStatus}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* CENTER PANE: Code Viewer */}
        <div className="pane code-pane">
          <div className="pane-header flex-between">
            <h3>Source Code</h3>
            {isLive && <div className="live-indicator"><span className="pulse-dot"></span> Live Feed</div>}
          </div>
          
          <div className="code-window">
             {activeProblem ? (
                <>
                  <div className="language-tabs custom-scrollbar">
                    {Object.keys(activeProblem.attempts).map(lang => (
                      <button 
                        key={lang} 
                        className={`lang-tab ${activeLang === lang ? 'active' : ''}`}
                        onClick={() => setActiveLang(lang)}
                      >
                        {lang === 'python3' ? 'Python 3' : lang === 'cpp' ? 'C++' : lang === 'java' ? 'Java' : lang === 'c' ? 'C' : lang}
                      </button>
                    ))}
                  </div>

                  {activeAttempt && (
                    <div className="code-window-header">
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <span className={`status-dot status-text-${activeAttempt.status.toLowerCase().replace(/\s+/g, '-')}`}>●</span>
                         <span className="file-name">Current Status: {activeAttempt.status}</span>
                       </div>
                       <span className="last-saved">Saved: {formatIST(activeAttempt.updatedAt, 'full')}</span>
                    </div>
                  )}

                  <div className="code-block-wrapper custom-scrollbar">
                    <pre className="code-block">
                      <code>{activeAttempt?.code || "// Awaiting code input..."}</code>
                    </pre>
                  </div>
                </>
             ) : (
                <div className="empty-state" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                  Select a question from the left to view code.
                </div>
             )}
          </div>
        </div>

        {/* RIGHT PANE: Metrics & Timeline */}
        <div className="pane timeline-pane">
          
          <div className="metrics-box">
             <div className="pane-header"><h3>Session Metrics</h3></div>
             
             <div className="metric-row">
                <span className="metric-label">Problems Solved</span>
                <span className="metric-value" style={{ color: '#10b981', fontWeight: 600 }}>
                   {acceptedCount} / {Math.max(totalQuestions, problemsList.length)}
                </span>
             </div>

             <div className="metric-row">
                <span className="metric-label">Joined Exam (IST)</span>
                <span className="metric-value">{formatIST(session.joinedAt, 'time')}</span>
             </div>
             
             {session.completedAt && (
               <div className="metric-row">
                 <span className="metric-label">Finished Exam (IST)</span>
                 <span className="metric-value">{formatIST(session.completedAt, 'time')}</span>
               </div>
             )}
             
             {/* 🚀 Tab Switch Metrics */}
             <div className="metric-row">
                <span className="metric-label">Tab Switch Strikes</span>
                <span className={`metric-value ${session.strikes > 0 ? 'text-danger' : 'text-success'}`}>
                   {session.strikes} 
                   {session.strikes > 0 && <span className="material-symbols-outlined strike-icon">warning</span>}
                </span>
             </div>

             {/* 🚀 NEW: Webcam Violations Row */}
             <div className="metric-row">
                <span className="metric-label">Webcam Violations</span>
                <span className={`metric-value ${actualCamStrikes > 0 ? 'text-danger' : 'text-success'}`}>
                   {actualCamStrikes} 
                   {actualCamStrikes > 0 && <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '4px', color: '#ec4899' }}>videocam_off</span>}
                </span>
             </div>
             
             {/* 🚀 Total "Hard" Strikes (Tab + Cam) */}
             {(session.strikes > 0 || actualCamStrikes > 0) && (
               <div className="metric-row" style={{ borderTop: '1px solid #334155', marginTop: '8px', paddingTop: '8px' }}>
                  <span className="metric-label" style={{ fontWeight: 700 }}>Total Penalty Score</span>
                  <span className="metric-value text-danger" style={{ fontWeight: 700 }}>
                     {session.strikes + actualCamStrikes}
                  </span>
               </div>
             )}
          </div>

          <div className="timeline-box">
             <div className="pane-header"><h3>Event Log</h3></div>
             <div className="timeline-content custom-scrollbar">
                
                {session.status === 'SUBMITTED' && (
                  <div className="timeline-item item-success">
                     <div className="tl-dot"></div>
                     <div className="tl-text">
                        <strong>Exam Submitted</strong>
                        <span>{formatIST(session.completedAt, 'time')}</span>
                     </div>
                  </div>
                )}

                {session.status === 'KICKED' && (
                  <div className="timeline-item item-danger">
                     <div className="tl-dot"></div>
                     <div className="tl-text">
                        <strong>Terminated by System</strong>
                        <span>{formatIST(session.completedAt, 'time')}</span>
                     </div>
                  </div>
                )}

                {/* Tab Switch Logs */}
                {session.strikes > 0 && [...Array(session.strikes)].map((_, i) => (
                  <div key={`tab-${i}`} className="timeline-item item-warning">
                     <div className="tl-dot"></div>
                     <div className="tl-text">
                        <strong>Tab Switch Detected</strong>
                        <span>Violation recorded automatically</span>
                     </div>
                  </div>
                ))}

                {/* 🚀 Webcam Logs */}
                {actualCamStrikes > 0 && [...Array(actualCamStrikes)].map((_, i) => (
                  <div key={`cam-${i}`} className="timeline-item item-danger">
                     <div className="tl-dot"></div>
                     <div className="tl-text">
                        <strong>Webcam Violation</strong>
                        <span>Captured by AI Proctor</span>
                     </div>
                  </div>
                ))}

                <div className="timeline-item item-info">
                   <div className="tl-dot"></div>
                   <div className="tl-text">
                      <strong>Session Started</strong>
                      <span>{formatIST(session.joinedAt, 'time')}</span>
                   </div>
                </div>

             </div>
          </div>

        </div>

      </div>
    </div>
  );
}