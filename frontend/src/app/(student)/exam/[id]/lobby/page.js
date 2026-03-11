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
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

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

  // 🚀 FIXED TIME PARSER: Forces the browser to evaluate the DB string as IST (+05:30)
  const parseIST = (dateString) => {
    if (!dateString) return 0;
    const cleanStr = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
    return new Date(`${cleanStr}+05:30`).getTime();
  };

  const formatCountdown = (diff) => {
    if (diff <= 0) return "00:00:00";
    const h = Math.floor((diff / (1000 * 60 * 60)));
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleStartExam = () => {
    router.push(`/exam/${id}`);
  };

  const startTime = contest ? parseIST(contest.startTime) : 0;
  const endTime = contest ? parseIST(contest.endTime) : 0;
  
  // We add a 30 second buffer so if the student's PC clock is slightly slow, they can still click start!
  const isUpcoming = currentTime < (startTime - 30000); 
  const isCompleted = endTime > 0 && currentTime > endTime;
  const isLive = !isUpcoming && !isCompleted;

  return (
    <div className="lobby-wrapper">
      <header className="lobby-header">
        <div className="lobby-header-gradient"></div>
        <div className="lobby-header-content">
          <div className="lobby-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <div className="logo-box" style={{ 
    width: '32px', 
    height: '32px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
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
            </>
          ) : (
            <>
              <div className={`session-badge ${isLive ? 'live' : isUpcoming ? 'upcoming' : 'ended'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div className="ping-dot-container">
                  <span className="ping-dot"></span>
                  <span className="solid-dot"></span>
                </div>
                {isLive ? `Live Now • Remaining: ${formatCountdown(endTime - currentTime)}` : 
                 isUpcoming ? `Starts in ${formatCountdown(startTime - currentTime)}` : 'Contest Ended'}
              </div>
              <h1 className="lobby-title" style={{ marginTop: '1.5rem' }}>{contest.title}</h1>
              <div className="lobby-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>timer</span>
                  Duration: {Math.round((endTime - startTime) / 60000)} Mins
                </span>
              </div>
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
                  <div className="rule-item" style={{ display: 'flex', gap: '16px' }}>
                    <div className="rule-icon-box"><span className="material-symbols-outlined">lock</span></div>
                    <div className="rule-content">
                      <h3>Strict Mode & Environment</h3>
                      <p>Right-click, copy-paste, and external clipboard access are disabled. Tab switching results in strikes.</p>
                    </div>
                  </div>
                  <div className="rule-item" style={{ display: 'flex', gap: '16px' }}>
                    <div className="rule-icon-box"><span className="material-symbols-outlined">visibility</span></div>
                    <div className="rule-content">
                      <h3>Strike System</h3>
                      <p><strong>{contest.strikes} strikes</strong> will result in automatic submission of your exam attempt.</p>
                    </div>
                  </div>
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

        <div className="start-section">
          {loading || !contest ? (
            <Skeleton width="320px" height="56px" borderRadius="8px" />
          ) : (
            <>
              <button 
                className="btn-start-exam" 
                onClick={handleStartExam}
                disabled={!isLive}
                style={{ cursor: isLive ? 'pointer' : 'not-allowed' }}
              >
                <span>{isCompleted ? 'Exam Concluded' : isUpcoming ? 'Waiting for Start...' : 'Acknowledge & Start Exam'}</span>
                {isLive && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>
              <p className="integrity-note">
                {isLive ? 'By starting, you agree to the academic integrity policy.' : 'Button will unlock once the session is Live.'}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}