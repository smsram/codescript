"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { showToast } from '@/components/ui/Toast';
import './student-logs.css';

export default function StudentExamLogs({ params }) {
  const router = useRouter();
  const { id: examId, userId } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  
  // Grouped answers state
  const [groupedAnswers, setGroupedAnswers] = useState({});
  const [activeProblemId, setActiveProblemId] = useState(null);
  const [activeLang, setActiveLang] = useState(null);
  
  const socketRef = useRef(null);

  // 🚀 Force display strictly in IST (Asia/Kolkata)
  const formatIST = (dateStr, formatType = 'time') => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    
    if (formatType === 'time') {
      return date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    }
    if (formatType === 'full') {
      return date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

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

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/student/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        setSession(data.session);
        
        const grouped = groupData(data.answers || []);
        setGroupedAnswers(grouped);
        
        const problemIds = Object.keys(grouped);
        if (problemIds.length > 0) {
          setActiveProblemId(problemIds[0]);
          setActiveLang(Object.keys(grouped[problemIds[0]].attempts)[0]);
        }
        
        setLoading(false);

        // LIVE SOCKET CONNECTION
        if (data.session.status === 'IN_PROGRESS') {
          socketRef.current = io(process.env.NEXT_PUBLIC_API_URL, { auth: { token } });
          socketRef.current.on('connect', () => {
             socketRef.current.emit('join-admin-monitor', { examId });
          });

          socketRef.current.on('live-stats-update', (liveData) => {
            const currentStudent = liveData.sessions.find(s => s.userId === userId);
            if (currentStudent) setSession(prev => ({ ...prev, ...currentStudent }));
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
                updatedAt: new Date()
              };
              return updated;
            });
          });
        }
      } catch (err) {
        showToast("Error loading logs", "error");
        router.push(`/admin/contests/${examId}/details`);
      }
    };

    fetchLogs();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [examId, userId, router]);

  // Handle Problem Selection
  const handleProblemClick = (pid) => {
    setActiveProblemId(pid);
    const langs = Object.keys(groupedAnswers[pid].attempts);
    if (!langs.includes(activeLang)) {
      setActiveLang(langs[0]);
    }
  };

  // --- RENDER SKELETON LOADER ---
  if (loading) {
    return (
      <div className="logs-container">
        <div className="skel-wrap"><div className="skel skel-line" style={{ width: '150px' }}></div></div>
        <div className="meta-card skel-wrap" style={{ display: 'flex', gap: '20px' }}>
           <div className="skel skel-circle"></div>
           <div style={{ flex: 1 }}><div className="skel skel-line" style={{ width: '200px', marginBottom: '8px' }}></div><div className="skel skel-line" style={{ width: '150px' }}></div></div>
        </div>
        <div className="logs-grid skel-wrap">
           <div className="pane sidebar-pane"><div className="skel skel-block" style={{ height: '100%' }}></div></div>
           <div className="pane code-pane"><div className="skel skel-block" style={{ height: '100%' }}></div></div>
           <div className="pane timeline-pane"><div className="skel skel-block" style={{ height: '100%' }}></div></div>
        </div>
      </div>
    );
  }

  const isLive = session.status === 'IN_PROGRESS';
  const activeProblem = groupedAnswers[activeProblemId];
  const activeAttempt = activeProblem ? activeProblem.attempts[activeLang] : null;
  const problemsList = Object.values(groupedAnswers);

  return (
    <div className="logs-container">
      
      {/* Top Navigation */}
      <Link href={`/admin/contests/${examId}/details`} className="back-link">
        <span className="material-symbols-outlined">arrow_back</span> Back to Monitor
      </Link>

      {/* Hero Meta Card */}
      <div className="meta-card">
        <div className="meta-left">
          <div className={`meta-avatar ${session.strikes > 0 ? 'anomaly' : 'normal'}`}>
            {session.user.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="meta-name">{session.user.name}</h1>
            <p className="meta-email">{session.user.email}</p>
          </div>
        </div>

        <div className="meta-right">
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
                // Determine overall status for this problem
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
                  {/* Internal Language Tabs */}
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

                  {/* 🚀 Flawless Scrollable Pre/Code Block */}
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
                <span className="metric-label">Joined Exam (IST)</span>
                <span className="metric-value">{formatIST(session.joinedAt, 'time')}</span>
             </div>
             {session.completedAt && (
               <div className="metric-row">
                  <span className="metric-label">Finished Exam (IST)</span>
                  <span className="metric-value">{formatIST(session.completedAt, 'time')}</span>
               </div>
             )}
             <div className="metric-row">
                <span className="metric-label">Security Strikes</span>
                <span className={`metric-value ${session.strikes > 0 ? 'text-danger' : 'text-success'}`}>
                   {session.strikes} 
                   {session.strikes > 0 && <span className="material-symbols-outlined strike-icon">warning</span>}
                </span>
             </div>
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

                {session.strikes > 0 && [...Array(session.strikes)].map((_, i) => (
                  <div key={i} className="timeline-item item-warning">
                     <div className="tl-dot"></div>
                     <div className="tl-text">
                        <strong>Tab Switch Detected</strong>
                        <span>Violation recorded automatically</span>
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