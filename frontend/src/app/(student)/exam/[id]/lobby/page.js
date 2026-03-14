"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import './lobby.css';

export default function ExamLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState(null);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [camStatus, setCamStatus] = useState('idle'); // 'idle' | 'checking' | 'granted' | 'error'
  const [camError, setCamError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);

        const contestRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!contestRes.ok) {
            const errorData = await contestRes.json();
            throw new Error(errorData.error || "Failed to load exam details");
        }
        
        const json = await contestRes.json();
        
        if (json.contest.status === 'DRAFT') {
          throw new Error("This contest is not yet available.");
        }
        
        setContest(json.contest);
        setSession(json.session || null);
      } catch (err) {
        showToast(err.message, "error");
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();

    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [id, router]);

  const parseIST = (dateString) => {
    if (!dateString) return 0;
    const cleanStr = typeof dateString === 'string' && dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
    return new Date(`${cleanStr}+05:30`).getTime();
  };

  const formatCountdown = (diff) => {
    if (diff <= 0) return "00:00:00";
    const h = Math.floor((diff / (1000 * 60 * 60)));
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const checkCameraAccess = async () => {
    setCamStatus('checking');
    setCamError('');
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access. Please use a modern browser like Chrome or Edge.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      setCamStatus('granted');
      showToast("Camera access verified!", "success");

    } catch (err) {
      setCamStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCamError("Permission denied. Please click the lock icon in your browser's address bar, allow camera access, and try again.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCamError("No webcam detected. Please connect a functional camera to your device.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCamError("Your camera is currently being used by another application (like Zoom or Teams). Please close it and retry.");
      } else {
        setCamError(err.message || "An unknown error occurred while accessing the camera.");
      }
    }
  };

  const handleStartExam = () => {
    router.push(`/exam/${id}`);
  };

  const startTime = contest ? parseIST(contest.startTime) : 0;
  const globalEndTime = contest ? parseIST(contest.endTime) : 0;
  
  let activeEndTime = globalEndTime;

  if (session && contest?.durationMinutes) {
      const joinedAtMs = parseIST(session.joinedAt);
      const durationLimitMs = joinedAtMs + (contest.durationMinutes * 60000);
      activeEndTime = globalEndTime > 0 ? Math.min(globalEndTime, durationLimitMs) : durationLimitMs;
  }
  
  const isUpcoming = startTime > 0 && currentTime < (startTime - 30000); 
  const isTimeUp = activeEndTime > 0 && currentTime >= activeEndTime;
  const isAlreadySubmitted = session && (session.status === 'SUBMITTED' || session.status === 'KICKED');
  
  const isCompleted = isTimeUp || isAlreadySubmitted;
  const isLive = !isUpcoming && !isCompleted;

  const windowDurationMins = globalEndTime > 0 ? Math.round((globalEndTime - startTime) / 60000) : null;
  const writingDurationMins = contest?.durationMinutes || windowDurationMins || 'No Limit';

  const canEnterExam = isLive && (!contest?.proctoringEnabled || camStatus === 'granted');

  return (
    <div className="lobby-wrapper">
      <header className="lobby-header">
        <div className="lobby-header-gradient"></div>
        <div className="lobby-header-content">
          <div className="lobby-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-box" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/CodeScriptLogo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="logo-text" style={{ fontWeight: 700, fontSize: '1.25rem' }}>CodeScript</span>
          </div>

          <div className="lobby-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="lobby-back-btn" 
              onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span> Back
            </button>

            <div className="lobby-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {loading || !user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <Skeleton width="80px" height="14px" />
                    <Skeleton width="50px" height="10px" style={{ marginTop: '4px' }} />
                  </div>
                  <Skeleton width="38px" height="38px" borderRadius="50%" />
                </div>
              ) : (
                <>
                  <div className="user-text" style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>ID: #{user.id.substring(0, 6).toUpperCase()}</p>
                  </div>
                  <div className="user-avatar" style={{ width: '38px', height: '38px', background: 'var(--sd-primary, #3b82f6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="lobby-main">
        <div className="lobby-intro">
          {loading || !contest ? (
            <>
              <Skeleton width="220px" height="32px" borderRadius="20px" />
              <div style={{ marginTop: '1.5rem' }}><Skeleton width="450px" height="48px" /></div>
              <div style={{ marginTop: '1rem' }}><Skeleton width="120px" height="24px" /></div>
              <div style={{ marginTop: '2rem' }}><Skeleton width="100%" height="80px" borderRadius="8px" /></div>
            </>
          ) : (
            <>
              <div className={`session-badge ${isLive ? 'live' : isUpcoming ? 'upcoming' : 'ended'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div className="ping-dot-container">
                  <span className="ping-dot"></span>
                  <span className="solid-dot"></span>
                </div>
                {isCompleted ? 'Exam Concluded' : 
                 isLive ? (session ? `Live Now • Your Time Left: ${formatCountdown(activeEndTime - currentTime)}` : `Live Now • Window Closes: ${formatCountdown(activeEndTime - currentTime)}`) : 
                 isUpcoming ? `Starts in ${formatCountdown(startTime - currentTime)}` : 'Contest Ended'}
              </div>
              
              <h1 className="lobby-title" style={{ marginTop: '1.5rem' }}>{contest.title}</h1>
              
              <div className="lobby-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>timer</span>
                  Total Allowed Time: {writingDurationMins} {writingDurationMins !== 'No Limit' && 'Mins'}
                </span>
                {contest.durationMinutes && windowDurationMins && (
                   <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8, fontSize: '0.8rem' }}>
                     (Exam Window: {windowDurationMins} Mins)
                   </span>
                )}
              </div>

              {contest.description && contest.description.trim() !== '' && (
                <div style={{ 
                  marginTop: '2.5rem', 
                  paddingTop: '1.5rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
                  textAlign: 'left',
                  width: '100%'
                }}>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '0.85rem', 
                    fontWeight: 600,
                    color: '#94a3b8', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
                    Instructions / Description
                  </h3>
                  <div style={{ 
                    color: '#cbd5e1', 
                    fontSize: '0.95rem', 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap' 
                  }}>
                    {contest.description}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rules-outer-card">
          <div className="rules-inner-card">
            <div className="rules-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#06b6d4' }}>gavel</span>
              <h2>Exam Rules & Security</h2>
            </div>
            <div className="rules-list">
              {loading || !contest ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="rule-item-skeleton" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <Skeleton width="48px" height="48px" borderRadius="10px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="180px" height="20px" />
                      <div style={{ marginTop: '8px' }}><Skeleton width="100%" height="32px" /></div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {contest.strictMode && (
                    <div className="rule-item" style={{ display: 'flex', gap: '16px' }}>
                      <div className="rule-icon-box"><span className="material-symbols-outlined">lock</span></div>
                      <div className="rule-content">
                        <h3>Strict Workspace Environment</h3>
                        <p>Right-click, copy-paste, keyboard shortcuts, and external clipboard access are strictly disabled.</p>
                      </div>
                    </div>
                  )}

                  {/* 🚀 UPDATED: Dynamic Webcam Strike Text */}
                  {contest.proctoringEnabled && (
                    <div className="rule-item" style={{ display: 'flex', gap: '16px' }}>
                      <div className="rule-icon-box" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                        <span className="material-symbols-outlined">videocam</span>
                      </div>
                      <div className="rule-content">
                        <h3>AI Webcam Proctoring</h3>
                        <p>
                          <strong>A functional webcam is required.</strong> The AI actively monitors for multiple faces and mobile devices. 
                          The 1st detection is a free warning. <strong>{contest.webcamStrikes || 3} camera strikes</strong> will result in automatic submission.
                        </p>
                      </div>
                    </div>
                  )}

                  {contest.strikes > 0 && contest.tabStrikes !== false && (
                    <div className="rule-item" style={{ display: 'flex', gap: '16px' }}>
                      <div className="rule-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <span className="material-symbols-outlined">visibility</span>
                      </div>
                      <div className="rule-content">
                        <h3>Fullscreen & Tab Switch Penalty</h3>
                        <p>You must remain in Fullscreen mode. Exiting fullscreen or switching tabs will result in a strike. <strong>{contest.strikes} strikes</strong> will result in automatic submission.</p>
                      </div>
                    </div>
                  )}

                  <div className="rule-item" style={{ display: 'flex', gap: '16px' }}>
                    <div className="rule-icon-box"><span className="material-symbols-outlined">code</span></div>
                    <div className="rule-content">
                      <h3>Allowed Languages</h3>
                      <p>{contest.allowedLangs.split(',').join(', ')}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="start-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          {loading || !contest ? (
            <Skeleton width="100%" height="56px" borderRadius="8px" />
          ) : (
            <>
              {contest.proctoringEnabled && camStatus !== 'granted' && !isCompleted && (
                <div style={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '12px', padding: '20px', width: '100%', marginBottom: '20px', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem' }}>
                    <span className="material-symbols-outlined">videocam</span> Hardware Verification
                  </h4>
                  
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                    This exam requires camera proctoring. You must verify your camera works before the start button unlocks.
                  </p>

                  {camStatus === 'error' && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'left' }}>
                      <strong>Error:</strong> {camError}
                    </div>
                  )}

                  <button 
                    onClick={checkCameraAccess}
                    disabled={camStatus === 'checking'}
                    style={{ 
                      background: 'transparent', color: '#ec4899', border: '1px solid #ec4899', 
                      padding: '10px 24px', borderRadius: '8px', cursor: camStatus === 'checking' ? 'wait' : 'pointer', 
                      fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {camStatus === 'checking' ? (
                      <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>sync</span> Checking...</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>fact_check</span> {camStatus === 'error' ? 'Retry Camera Check' : 'Check Camera Access'}</>
                    )}
                  </button>
                </div>
              )}

              <button 
                className="btn-start-exam" 
                onClick={handleStartExam}
                disabled={!canEnterExam}
                style={{ 
                  cursor: canEnterExam ? 'pointer' : 'not-allowed',
                  opacity: canEnterExam ? 1 : 0.6,
                  width: '100%'
                }}
              >
                <span>
                  {isAlreadySubmitted ? 'Exam Already Submitted' : 
                   isCompleted ? 'Exam Concluded' : 
                   isUpcoming ? 'Waiting for Start...' : 
                   (contest.proctoringEnabled && camStatus !== 'granted') ? 'Awaiting Camera Verification' : 
                   (session ? 'Resume Exam' : 'Acknowledge & Start Exam')}
                </span>
                {canEnterExam && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>
              
              <p className="integrity-note" style={{ marginTop: '12px' }}>
                {canEnterExam ? 'By starting, you agree to the academic integrity policy.' : 'Button will unlock once the session is Live and requirements are met.'}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}