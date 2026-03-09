"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { MoreOptions, MoreOptionsItem } from '@/components/ui/MoreOptions';
import './dashboard.css';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Quick Join State
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Live Timer State
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [data, setData] = useState({
    user: { name: '', studentId: '' },
    exams: [],
    history: [],
    stats: { totalSolved: 0, avgPassRate: "0%" }
  });

  useEffect(() => {
    setMounted(true);
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to load dashboard");
        
        const json = await res.json();
        setData(json);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();

    // Start ticking clock for the countdown
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'ST';

  // HELPER: Convert the database's artificial UTC back into a real absolute timestamp
  const getRealTime = (dateString) => {
    if (!dateString) return 0;
    const fakeUtc = new Date(dateString).getTime(); 
    return fakeUtc - (330 * 60000); // Subtract 5 hours 30 mins to get true universal time
  };

  // HELPER: Format Upcoming Date explicitly to IST
  const formatUpcomingTime = (dateString) => {
    if (!dateString) return "TBA";
    const realTime = getRealTime(dateString);
    return new Date(realTime).toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) + ' IST';
  };

  // HELPER: Calculate live countdown string
  const getCountdown = (dateString) => {
    if (!dateString) return "";
    const targetTime = getRealTime(dateString);
    const diff = targetTime - currentTime;

    if (diff <= 0) return "Starting now...";

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);

    let res = [];
    if (d > 0) res.push(`${d}d`);
    if (h > 0 || d > 0) res.push(`${h}h`);
    res.push(`${m}m`);
    res.push(`${s}s`);
    return res.join(' ');
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('token');
      sessionStorage.clear();
      router.replace('/login');
    }
  };

  const handleExamClick = (exam) => {
    router.push(`/exam/${exam.id}/lobby`);
  };

  const handleJoinContest = async () => {
    if (!joinCode.trim()) {
      return showToast("Please enter a contest code.", "error");
    }
    
    setJoining(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${joinCode.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Invalid or unavailable contest code.");
      
      const json = await res.json();
      
      // Rule: Prevent joining if it's a draft
      if (json.contest.status === 'DRAFT') {
        throw new Error("This contest is still a draft and cannot be joined yet.");
      }

      // Success! Move to lobby
      router.push(`/exam/${json.contest.id}/lobby`);
      
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setJoining(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="student-dashboard-wrapper">
      
      <header className="sd-header">
        <div className="sd-header-gradient"></div>
        <div className="sd-header-content">
          
          <div className="sd-logo-group">
            <div className="sd-logo-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>terminal</span>
            </div>
            <span className="sd-logo-text">CodeScript</span>
          </div>

          <div className="sd-user-actions">
            <button className="sd-btn-notify">
              <span className="material-symbols-outlined">notifications</span>
              <span className="sd-notify-dot"></span>
            </button>
            <div className="sd-divider"></div>
            
            <div className="sd-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="sd-avatar" style={{ overflow: 'hidden' }}>
                {loading ? <Skeleton width="100%" height="100%" /> : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
                    {getInitials(data.user.name)}
                  </span>
                )}
              </div>
              <div className="sd-user-info">
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Skeleton width="100px" height="14px" />
                    <Skeleton width="80px" height="10px" />
                  </div>
                ) : (
                  <>
                    <h4>{data.user.name}</h4>
                    <p>ID: {data.user.studentId}</p>
                  </>
                )}
              </div>
              
              {!loading && (
                <div style={{ marginLeft: '4px' }}>
                  <MoreOptions>
                    <MoreOptionsItem icon="logout" danger onClick={handleLogout}>Logout</MoreOptionsItem>
                  </MoreOptions>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="sd-main">
        <div className="sd-welcome-header">
          <div className="sd-welcome-text">
            {loading ? (
              <div className="mb-2"><Skeleton width="300px" height="32px" /></div>
            ) : (
              <h1>Welcome back, {data.user.name.split(' ')[0]}!</h1>
            )}
            <p>Ready to solve some problems today?</p>
          </div>
          <div className="sd-date-badge">
            <span className="material-symbols-outlined" style={{ color: 'var(--sd-primary)', fontSize: '18px' }}>calendar_today</span>
            <span>{new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })} • Session</span>
          </div>
        </div>

        <div className="sd-hero-card">
          <div className="sd-glow-right"></div>
          <div className="sd-glow-left"></div>
          <div className="sd-hero-content">
            <div>
              <h2>Quick Join Contest</h2>
              <p>Enter your professor's unique contest code below to join the session immediately.</p>
            </div>
            <div className="sd-join-input-wrap">
              <span className="material-symbols-outlined icon-key">key</span>
              <input 
                type="text" 
                className="sd-join-input" 
                placeholder="Enter Contest Code..." 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinContest()}
              />
              <button 
                className="sd-btn-join" 
                onClick={handleJoinContest}
                disabled={joining}
                style={{ opacity: joining ? 0.7 : 1, cursor: joining ? 'wait' : 'pointer' }}
              >
                <span>{joining ? 'Joining...' : 'Join Contest'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <div className="sd-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="sd-section-header">
              <h3 className="sd-section-title">
                <span className="material-symbols-outlined" style={{ color: 'var(--sd-primary)' }}>code_blocks</span>
                Active & Upcoming Exams
              </h3>
            </div>

            <div className="sd-exam-list">
              {loading ? (
                [1, 2].map((i) => (
                  <div key={i} className="sd-exam-card">
                    <div className="sd-exam-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <Skeleton width="60%" height="20px" />
                      <Skeleton width="40%" height="14px" />
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <Skeleton width="80px" height="20px" borderRadius="10px" />
                        <Skeleton width="80px" height="20px" borderRadius="10px" />
                      </div>
                    </div>
                  </div>
                ))
              ) : data.exams.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#0f172a', borderRadius: '12px', border: '1px dashed #334155', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '8px' }}>event_available</span>
                  <p>No active exams right now.</p>
                </div>
              ) : (
                data.exams.map((exam) => {
                  const isLive = exam.status === 'Live' || (exam.startTime && getRealTime(exam.startTime) <= currentTime);
                  
                  return (
                    <div key={exam.id} className={`sd-exam-card ${isLive ? 'active' : ''}`} style={{ border: !isLive ? '1px solid rgba(251, 146, 60, 0.3)' : '' }}>
                      
                      {isLive ? (
                        <div className="sd-live-badge">
                          <div className="sd-dot-ping-wrap">
                            <span className="sd-dot-ping"></span>
                            <span className="sd-dot-solid"></span>
                          </div>
                          Live Now
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb923c', fontSize: '0.875rem', fontWeight: 600, paddingBottom: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>timer</span>
                          Starts in {getCountdown(exam.startTime)}
                        </div>
                      )}

                      <div className="sd-exam-info">
                        <h4>{exam.title}</h4>
                        <p className="sd-exam-prof">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                          {exam.professor}
                        </p>
                        <div className="sd-exam-meta">
                          <div className="sd-meta-item">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                            <span>{isLive ? 'In Progress' : formatUpcomingTime(exam.startTime)}</span>
                          </div>
                          <div className="sd-meta-item">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>quiz</span>
                            <span>{exam.problems} Problems</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleExamClick(exam)}
                        className={`sd-btn-exam ${isLive ? 'live' : ''}`} 
                        style={{ 
                          background: !isLive ? 'rgba(255,255,255,0.05)' : '', 
                          color: !isLive ? '#cbd5e1' : '' 
                        }}
                      >
                        {isLive ? 'Take Test' : 'View Details'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="sd-section-header">
              <h3 className="sd-section-title">
                <span className="material-symbols-outlined" style={{ color: 'var(--sd-primary)' }}>monitoring</span>
                Performance Stats
              </h3>
            </div>

            <div className="sd-stats-grid">
              <div className="sd-stat-card">
                <span className="material-symbols-outlined sd-stat-bg-icon">check_circle</span>
                <p className="sd-stat-label">Avg Pass Rate</p>
                <div className="sd-stat-val">
                  {loading ? <Skeleton width="60px" height="32px" /> : data.stats.avgPassRate}
                </div>
              </div>
              <div className="sd-stat-card">
                <span className="material-symbols-outlined sd-stat-bg-icon">bug_report</span>
                <p className="sd-stat-label">Problems Solved</p>
                <div className="sd-stat-val">
                  {loading ? <Skeleton width="40px" height="32px" /> : data.stats.totalSolved}
                </div>
              </div>
            </div>

            <div className="sd-history-card">
              <div className="sd-history-header">
                <h4>Attempted History</h4>
              </div>
              <div className="sd-history-list">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="sd-history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Skeleton width="140px" height="16px" />
                        <Skeleton width="80px" height="12px" />
                      </div>
                      <Skeleton width="60px" height="24px" borderRadius="12px" />
                    </div>
                  ))
                ) : data.history.length === 0 ? (
                   <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>No attempted exams yet.</p>
                ) : (
                  data.history.map((item) => (
                    <div key={item.id} className="sd-history-item">
                      <div className="sd-history-info">
                        <h5>{item.title}</h5>
                        <p>{item.date}</p>
                      </div>
                      <div>
                        <span className={`sd-score-badge ${item.scoreClass}`}>{item.score}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}