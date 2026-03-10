"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import './dashboard.css';

// 🚀 FIXED: Bulletproof IST string parsing to strip fake UTC 'Z' markers
const getRealTime = (dateString) => {
  if (!dateString) return 0;
  const cleanStr = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
  return new Date(`${cleanStr}+05:30`).getTime();
};

const timeAgo = (dateString) => {
  const targetTime = getRealTime(dateString);
  const diffMins = Math.floor((Date.now() - targetTime) / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  return `${Math.floor(diffHrs / 24)} days ago`;
};

const calculateProgress = (start, end) => {
  if (!start || !end) return { percent: 0, text: 'No Time Limit', color: '#08b2d4', bg: 'rgba(8, 178, 212, 0.1)' };
  
  const now = Date.now();
  const s = getRealTime(start);
  const e = getRealTime(end);
  
  if (now >= e) return { percent: 100, text: 'Finished', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  if (now <= s) return { percent: 0, text: 'Not Started', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
  
  const percent = ((now - s) / (e - s)) * 100;
  const leftMs = e - now;
  const h = Math.floor(leftMs / 3600000);
  const m = Math.floor((leftMs % 3600000) / 60000);
  
  const isUrgent = percent > 85;
  return { 
    percent, 
    text: h > 0 ? `${h}h ${m}m left` : `${m}m left`, 
    color: isUrgent ? '#f87171' : '#08b2d4',
    bg: isUrgent ? 'rgba(248, 113, 113, 0.1)' : 'rgba(8, 178, 212, 0.1)'
  };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0, activeContests: 0, submissions: 0, ramUsage: 0,
    chartData: [0, 0, 0, 0, 0, 0, 0],
    systemLogs: [], 
    contests: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          users: data.totalUsers || 0,
          activeContests: data.activeContests || 0,
          submissions: data.submissionsToday || 0,
          ramUsage: data.ramUsage || 0,
          chartData: data.chartData || [0, 0, 0, 0, 0, 0, 0],
          systemLogs: data.systemLogs || [], 
          contests: data.activeContestsList || []
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); 
    return () => clearInterval(interval);
  }, []);

  const { linePath, fillPath, pulsePoint } = useMemo(() => {
    const data = stats.chartData;
    const max = Math.max(...data, 10); 
    const points = data.map((val, i) => {
      const x = Math.round((i / 6) * 1000);
      const y = Math.round(250 - (val / max) * 180); 
      return { x, y };
    });
    const lPath = `M ${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ');
    const fPath = `${lPath} V 300 H 0 Z`;
    return { linePath: lPath, fillPath: fPath, pulsePoint: points[points.length - 1] };
  }, [stats.chartData]);

  // UI mapping for different log types
  const getLogStyles = (type) => {
    switch(type) {
      case 'error': return { color: '#ef4444', icon: 'error', class: 'red' };
      case 'warning': return { color: '#f59e0b', icon: 'memory', class: 'amber' };
      default: return { color: '#3b82f6', icon: 'info', class: 'blue' };
    }
  };

  return (
    <div className="dash-container">
      
      {/* 4 METRIC CARDS */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon" style={{ backgroundColor: 'rgba(8, 178, 212, 0.1)', color: '#08b2d4' }}>
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <p>Total Students</p>
          <div style={{ marginTop: '0.25rem', height: '36px', display: 'flex', alignItems: 'center' }}>
            {loading ? <Skeleton width="80px" height="28px" borderRadius="6px" /> : <h3>{stats.users.toLocaleString()}</h3>}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <span className="material-symbols-outlined">emoji_events</span>
            </div>
          </div>
          <p>Active Contests</p>
          <div style={{ marginTop: '0.25rem', height: '36px', display: 'flex', alignItems: 'center' }}>
            {loading ? <Skeleton width="50px" height="28px" borderRadius="6px" /> : <h3>{stats.activeContests.toLocaleString()}</h3>}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <span className="material-symbols-outlined">code</span>
            </div>
          </div>
          <p>Submissions Today</p>
          <div style={{ marginTop: '0.25rem', height: '36px', display: 'flex', alignItems: 'center' }}>
            {loading ? <Skeleton width="70px" height="28px" borderRadius="6px" /> : <h3>{stats.submissions.toLocaleString()}</h3>}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
              <span className="material-symbols-outlined">dns</span>
            </div>
            {!loading && (
              <span className={`metric-badge ${stats.ramUsage > 85 ? 'badge-danger' : 'badge-neutral'}`} style={stats.ramUsage > 85 ? { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' } : {}}>
                {stats.ramUsage > 85 ? 'Critical' : 'Stable'}
              </span>
            )}
          </div>
          <p>Debian VM RAM Load</p>
          <div style={{ marginTop: '0.25rem', height: '36px', display: 'flex', alignItems: 'center' }}>
             {loading ? <Skeleton width="60px" height="28px" borderRadius="6px" /> : <h3>{stats.ramUsage}%</h3>}
          </div>
          <div className="progress-bg" style={{ height: '4px', marginTop: '16px', backgroundColor: '#334155' }}>
            {!loading && (
                <div className="progress-fill" style={{ width: `${stats.ramUsage}%`, background: stats.ramUsage > 85 ? '#ef4444' : 'linear-gradient(to right, #10b981, #08b2d4)', transition: 'width 0.5s ease-in-out' }}></div>
            )}
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="chart-section">
        <div className="chart-header">
          <div>
            <h3>Code Submissions</h3>
            <p>Submission volume over the last 24 hours</p>
          </div>
        </div>
        <div className="chart-container">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#08b2d4" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#08b2d4" stopOpacity="0.0"></stop>
              </linearGradient>
            </defs>
            <line stroke="#334155" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="225" y2="225"></line>
            <line stroke="#334155" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150"></line>
            <line stroke="#334155" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="75" y2="75"></line>
            <path d={fillPath} fill="url(#chartGradient)" style={{ transition: 'd 1s ease' }}></path>
            <path d={linePath} fill="none" stroke="#08b2d4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" style={{ transition: 'd 1s ease' }}></path>
            <circle cx={pulsePoint.x} cy={pulsePoint.y} fill="#08b2d4" r="6" stroke="white" strokeWidth="2" style={{ transition: 'cx 1s ease, cy 1s ease', animation: 'pulse 2s infinite' }}></circle>
          </svg>
          <div className="chart-labels">
            <span>-24h</span><span>-20h</span><span>-16h</span><span>-12h</span><span>-8h</span><span>-4h</span><span>Now</span>
          </div>
        </div>
      </div>

      {/* BOTTOM PANELS */}
      <div className="bottom-grid">
        
        {/* 🚀 DYNAMIC SYSTEM ALERTS PANEL */}
        <div className="panel-card">
          <div className="panel-header">
            <h3><span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>warning</span> Recent System Alerts</h3>
            <button className="panel-link">Auto-refreshing...</button>
          </div>
          <div className="alert-list">
            {loading && stats.systemLogs.length === 0 ? (
              [1, 2, 3].map(i => <Skeleton key={i} width="100%" height="60px" borderRadius="8px" />)
            ) : stats.systemLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.5, marginBottom: '8px' }}>check_circle</span>
                <p>System operating normally.</p>
              </div>
            ) : (
              stats.systemLogs.map((log) => {
                const style = getLogStyles(log.type);
                return (
                  <div key={log.id} className={`alert-item ${style.class}`}>
                    <span className="material-symbols-outlined" style={{ color: style.color }}>
                       {style.icon}
                    </span>
                    <div className="alert-content">
                      <p>{log.message}</p>
                      <p>{log.detail} • {timeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ACTIVE CONTESTS */}
        <div className="panel-card">
          <div className="panel-header">
            <h3><span className="material-symbols-outlined" style={{ color: '#08b2d4' }}>assignment</span> Active Contests</h3>
          </div>
          <div className="contest-list">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} width="100%" height="70px" borderRadius="8px" />)
            ) : stats.contests.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No active contests right now.</p>
            ) : (
              stats.contests.map((c) => {
                const progress = calculateProgress(c.startTime, c.endTime);
                return (
                  <div key={c.id} className="contest-item">
                    <div className="contest-header">
                      <div className="contest-info">
                        <p>{c.title}</p>
                        <p>Started {timeAgo(c.startTime)} • {c._count?.sessions || 0} Candidates</p>
                      </div>
                      <span className="contest-time-badge" style={{ color: progress.color, backgroundColor: progress.bg }}>
                        {progress.text}
                      </span>
                    </div>
                    <div className="progress-bg">
                      <div className="progress-fill" style={{ width: `${progress.percent}%`, backgroundColor: progress.color, boxShadow: `0 0 10px ${progress.bg}` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}