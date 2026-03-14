"use client";

import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import Dropdown from '@/components/ui/Dropdown';
import { MoreOptions, MoreOptionsItem } from '@/components/ui/MoreOptions';
import { showToast } from '@/components/ui/Toast';
import { confirmAlert } from '@/components/ui/AlertConfirm';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination'; 
import './details.css'; 

export default function ContestDetailsPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  
  const [contestTitle, setContestTitle] = useState("");
  const [contestStatus, setContestStatus] = useState(""); 
  const [dynamicStatus, setDynamicStatus] = useState(""); 
  const [timeDisplay, setTimeDisplay] = useState("--:--");
  const [contestLimit, setContestLimit] = useState(3);
  const [camLimit, setCamLimit] = useState(3); 
  const [totalQuestions, setTotalQuestions] = useState(0); 
  
  const [hasTabStrikes, setHasTabStrikes] = useState(false);
  const [hasCamStrikes, setHasCamStrikes] = useState(false);
  const [durationMins, setDurationMins] = useState(null);

  const [dates, setDates] = useState({ start: null, end: null });
  const [scheduleText, setScheduleText] = useState("");
  const [durationText, setDurationText] = useState("");

  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [refreshInterval, setRefreshInterval] = useState(30);
  const [exportOpen, setExportOpen] = useState(false);
  
  // 🚀 Ticking clock to dynamically calculate "Time Spent" for active students
  const [currentTimeTick, setCurrentTimeTick] = useState(Date.now());
  
  const socketRef = useRef(null);
  const autoRefreshTimerRef = useRef(null);

  const convertIstToLocal = useCallback((dateStr) => {
    if (!dateStr) return 0;
    const cleanStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
    return new Date(`${cleanStr}+05:30`).getTime(); 
  }, []);

  const formatScheduleDetails = useCallback((startMs, endMs) => {
    if (!startMs || !endMs) return;

    const startDate = new Date(startMs);
    const endDate = new Date(endMs);
    const today = new Date();

    const isToday = startDate.toDateString() === today.toDateString();
    
    const timeOptions = { hour: 'numeric', minute: '2-digit' };
    const dateOptions = { month: 'short', day: 'numeric' };

    const startString = isToday 
      ? `Today, ${startDate.toLocaleTimeString([], timeOptions)}` 
      : `${startDate.toLocaleDateString([], dateOptions)}, ${startDate.toLocaleTimeString([], timeOptions)}`;
      
    const endString = startDate.toDateString() === endDate.toDateString()
      ? endDate.toLocaleTimeString([], timeOptions)
      : `${endDate.toLocaleDateString([], dateOptions)}, ${endDate.toLocaleTimeString([], timeOptions)}`;

    setScheduleText(`${startString} - ${endString}`);

    const diffMins = Math.round((endMs - startMs) / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    setDurationText(`${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`);
  }, []);

  const fetchContestData = useCallback(async (isSilentRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    if (!isSilentRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      setContestTitle(data.contestTitle);
      setContestStatus(data.contestStatus);
      
      setContestLimit(data.contestStrikes || 0);
      setHasTabStrikes(data.tabStrikes !== false && data.contestStrikes > 0);
      
      setCamLimit(data.webcamStrikes || 0);
      setHasCamStrikes(data.proctoringEnabled === true);
      
      setDurationMins(data.durationMinutes);
      setTotalQuestions(data.totalProblems || 0); 
      setDates({ start: data.startTime, end: data.endTime });
      
      const localStart = convertIstToLocal(data.startTime);
      const localEnd = convertIstToLocal(data.endTime);
      formatScheduleDetails(localStart, localEnd);

      setStudents(data.sessions || []);

      if (data.contestStatus !== 'DRAFT' && !isSilentRefresh && !socketRef.current) {
         const now = new Date().getTime();
         if (now <= localEnd) {
           socketRef.current = io(process.env.NEXT_PUBLIC_API_URL, { auth: { token } });
           socketRef.current.on('connect', () => {
             socketRef.current.emit('join-admin-monitor', { examId });
           });
           socketRef.current.on('live-stats-update', (liveData) => {
             // Will now correctly sync because backend includes Attempted and PIN!
             setStudents(liveData.sessions || []);
           });
         }
      }
    } catch (err) {
      if (!isSilentRefresh) showToast("Failed to load contest details", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examId, router, convertIstToLocal, formatScheduleDetails]);

  useEffect(() => {
    fetchContestData();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [fetchContestData]);

  // General Status Timer & Time Spent Tick
  useEffect(() => {
    if (!dates.start || !dates.end) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      setCurrentTimeTick(now); // Force re-render for Time Spent calculation

      const start = convertIstToLocal(dates.start);
      const end = convertIstToLocal(dates.end);

      const formatDiff = (ms) => {
        const d = Math.floor(ms / (1000 * 60 * 60 * 24));
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((ms % (1000 * 60)) / 1000);
        if (d > 0) return `${d}d ${h}h ${m}m`;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };

      if (contestStatus === 'DRAFT') {
        setDynamicStatus('DRAFT');
        clearInterval(timer);
      } else if (now < start) {
        setDynamicStatus('SCHEDULED');
      } else if (now >= start && now <= end) {
        setDynamicStatus('ACTIVE');
        setTimeDisplay(formatDiff(end - now));
      } else {
        setDynamicStatus('ENDED');
        if (socketRef.current && socketRef.current.connected) socketRef.current.disconnect();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dates, contestStatus, convertIstToLocal]);

  useEffect(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }
    if (dynamicStatus === 'ACTIVE' && refreshInterval > 0) {
      autoRefreshTimerRef.current = setInterval(() => fetchContestData(true), refreshInterval * 1000);
    }
    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [dynamicStatus, fetchContestData, refreshInterval]);

  const handleResetExam = (userId, studentName) => {
    confirmAlert({
      title: "Reset Student Exam?",
      message: `Resetting the exam for ${studentName} allows them to retake it with 0 strikes. Drafts are kept.`,
      confirmText: "Yes, Reset Exam", cancelText: "Cancel", isDanger: false, darkOverlay: true,
      onConfirm: async () => {
        setStudents(prev => prev.map(s => s.userId === userId ? { ...s, status: 'IN_PROGRESS', strikes: 0, camStrikes: 0 } : s));
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/reset-student`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          if (!res.ok) throw new Error("Backend database reset failed.");
          if (socketRef.current && socketRef.current.connected) socketRef.current.emit('admin-reset-student', { examId, userId });
          showToast(`Exam reset for ${studentName}`, "success");
          fetchContestData(true); 
        } catch (err) { 
          showToast("Failed to reset. Check server logs.", "error"); 
          fetchContestData(true); 
        }
      }
    });
  };

  const handleTerminateSession = (userId, studentName) => {
    confirmAlert({
      title: "Terminate Session?",
      message: `Forcibly end the exam for ${studentName}. They will be kicked immediately.`,
      confirmText: "Terminate Exam", cancelText: "Cancel", isDanger: true, darkOverlay: true,
      onConfirm: async () => {
        setStudents(prev => prev.map(s => s.userId === userId ? { ...s, status: 'KICKED' } : s));
        try {
          const token = localStorage.getItem('token');
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/terminate-student`, {
             method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ userId })
          });
          if (socketRef.current && socketRef.current.connected) socketRef.current.emit('admin-terminate-student', { examId, userId });
          showToast(`Termination successful for ${studentName}`, "success");
          fetchContestData(true);
        } catch (err) {
          if (socketRef.current && socketRef.current.connected) {
             socketRef.current.emit('admin-terminate-student', { examId, userId });
             showToast(`Termination command sent for ${studentName}`, "success");
          } else showToast("Failed to terminate student.", "error");
          fetchContestData(true);
        }
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "PIN", "Status", "Attempted", "Total Questions"];
    if (hasTabStrikes) headers.push("Tab Strikes");
    if (hasCamStrikes) headers.push("Cam Strikes");
    headers.push("Time Spent (Mins)");

    const rows = filteredStudents.map(s => {
      const row = [ `"${s.user.name}"`, `"${s.user.email}"`, `"${s.user.pin || 'N/A'}"`, s.status, s.attempted || 0, totalQuestions ];
      if (hasTabStrikes) row.push(s.strikes);
      if (hasCamStrikes) row.push(Math.max(0, s.camStrikes - 1));
      
      const startMs = convertIstToLocal(s.joinedAt);
      const endMs = s.status === 'IN_PROGRESS' ? Date.now() : (s.completedAt ? convertIstToLocal(s.completedAt) : Date.now());
      row.push(s.joinedAt ? Math.max(1, Math.round((endMs - startMs) / 60000)) : 0);
      return row;
    });
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${contestTitle.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportOpen(false);
  };

  useEffect(() => { setCurrentPage(1); }, [search, filter]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.user.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.user.email.toLowerCase().includes(search.toLowerCase()) ||
                          (s.user.pin && s.user.pin.toLowerCase().includes(search.toLowerCase()));
                          
    if (filter === 'all') return matchesSearch;
    if (filter === 'coding') return matchesSearch && s.status === 'IN_PROGRESS';
    if (filter === 'warning') return matchesSearch && s.status === 'IN_PROGRESS' && (
      (hasTabStrikes && s.strikes >= (contestLimit - 1)) || 
      (hasCamStrikes && Math.max(0, s.camStrikes - 1) >= (camLimit - 1)) // 🚀 Dynamic Alert Trigger
    );
    if (filter === 'submitted') return matchesSearch && s.status === 'SUBMITTED';
    if (filter === 'kicked') return matchesSearch && s.status === 'KICKED';
    return false;
  });

  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isLive = dynamicStatus === 'ACTIVE';

  const activeCount = students.filter(s => s.status === 'IN_PROGRESS').length;
  const warningCount = students.filter(s => s.status === 'IN_PROGRESS' && (
      (hasTabStrikes && s.strikes >= (contestLimit - 1)) || 
      (hasCamStrikes && Math.max(0, s.camStrikes - 1) >= (camLimit - 1))
  )).length;
  const submittedCount = students.filter(s => s.status === 'SUBMITTED').length;

  // 🚀 FIXED: Dynamic Time Spent calculation based on live status
  const calculateTimeSpent = (student) => {
      if (!student.joinedAt) return "--";
      const startMs = convertIstToLocal(student.joinedAt);
      
      // If they are writing right now, use currentTimeTick. Else use completedAt.
      const endMs = student.status === 'IN_PROGRESS' 
          ? currentTimeTick 
          : (student.completedAt ? convertIstToLocal(student.completedAt) : currentTimeTick);
          
      const diffMs = Math.max(0, endMs - startMs);
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${Math.max(1, mins)}m`;
  };

  return (
    <div className="live-monitor-container">
      
      <Link href="/admin/contests" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f8fafc'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Back to Contests
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', margin: 0, minHeight: '32px' }}>
              {loading ? <Skeleton width="300px" height="32px" /> : contestTitle}
            </h2>
            
            {!loading && (
              <button 
                onClick={() => fetchContestData(true)} 
                title="Force Refresh Data"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
              >
                <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`} style={{ fontSize: '20px' }}>refresh</span>
              </button>
            )}
            
            {!loading && isLive && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.5)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #334155' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>sync</span>
                 <input type="number" value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.75rem', outline: 'none', textAlign: 'center' }} />
                 <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>sec</span>
               </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minHeight: '24px', flexWrap: 'wrap' }}>
            {loading ? (
              <Skeleton width="400px" height="24px" borderRadius="6px" />
            ) : (
              <>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '4px 10px', borderRadius: '6px', 
                  backgroundColor: isLive ? 'rgba(239, 68, 68, 0.1)' : dynamicStatus === 'SCHEDULED' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  color: isLive ? '#ef4444' : dynamicStatus === 'SCHEDULED' ? '#3b82f6' : '#94a3b8',
                  fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {isLive && <span className="status-pulse pulse-anim" style={{ backgroundColor: '#ef4444' }}></span>}
                  {!isLive && <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {dynamicStatus === 'SCHEDULED' ? 'schedule' : dynamicStatus === 'DRAFT' ? 'edit_document' : 'history'}
                  </span>}
                  {dynamicStatus}
                </div>
                
                {scheduleText && (
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{color: '#334155'}}>|</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_month</span>
                    {scheduleText} <span style={{fontWeight: 600}}>({durationText})</span>
                  </span>
                )}

                {isLive && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>timer</span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700 }}>
                      {timeDisplay} left
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading ? (
            <Skeleton width="120px" height="38px" borderRadius="6px" />
          ) : (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setExportOpen(!exportOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.2s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{exportOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
              {exportOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', zIndex: 50, minWidth: '150px', overflow: 'hidden' }}>
                  <button onClick={handleExportCSV} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }} onMouseEnter={(e) => e.target.style.background='#334155'} onMouseLeave={(e) => e.target.style.background='transparent'}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>csv</span> Excel / CSV
                  </button>
                  <button onClick={handleExportPDF} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }} onMouseEnter={(e) => e.target.style.background='#334155'} onMouseLeave={(e) => e.target.style.background='transparent'}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ef4444' }}>picture_as_pdf</span> PDF Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="material-symbols-outlined stat-card-icon" style={{ color: '#06b6d4' }}>groups</span>
          <span className="stat-label">Active Participants</span>
          <div className="stat-value-row">
            <span className="stat-value">{loading ? <Skeleton width="40px" height="32px" /> : activeCount}</span>
            <span className="stat-trend" style={{ color: '#10b981' }}>{isLive ? 'Currently Coding' : 'Unfinished/Ongoing'}</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="material-symbols-outlined stat-card-icon" style={{ color: '#fbbf24' }}>task_alt</span>
          <span className="stat-label">Exams Submitted</span>
          <div className="stat-value-row">
            <span className="stat-value">{loading ? <Skeleton width="40px" height="32px" /> : submittedCount}</span>
            <span className="stat-trend" style={{ color: '#94a3b8' }}>Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="material-symbols-outlined stat-card-icon" style={{ color: '#ef4444' }}>warning</span>
          <span className="stat-label">Anomalies / Alerts</span>
          <div className="stat-value-row">
            <span className="stat-value" style={{ color: warningCount > 0 ? '#f87171' : '#94a3b8' }}>
              {loading ? <Skeleton width="40px" height="32px" /> : warningCount}
            </span>
            <span className="stat-trend" style={{ color: warningCount > 0 ? '#f87171' : '#94a3b8' }}>near strike limit</span>
          </div>
        </div>
      </div>

      <div className="activity-card">
        <div className="activity-header">
          <h3 className="activity-title">{isLive ? 'Real-time Student Activity' : 'Student Results & Sessions'}</h3>
          <div className="activity-filters">
             <div className="search-box-small">
                <input type="text" placeholder="Search name or PIN..." value={search} onChange={(e) => setSearch(e.target.value)} disabled={loading} />
                <span className="material-symbols-outlined search-icon">search</span>
             </div>
             <div style={{ width: '150px' }}>
                <Dropdown 
                  value={filter} onChange={(e) => setFilter(e.target.value)}
                  options={[
                    { label: 'All Status', value: 'all' }, { label: 'In Progress', value: 'coding' },
                    { label: 'Warning Level', value: 'warning' }, { label: 'Submitted', value: 'submitted' },
                    { label: 'Kicked Out', value: 'kicked' }
                  ]}
                  disabled={loading}
                />
             </div>
          </div>
        </div>

        <div className="table-wrapper" style={{ overflow: 'visible', paddingBottom: '10px' }}>
          <table className="live-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Attempted</th>
                <th>Status</th>
                {hasTabStrikes && <th>Tab Strikes</th>}
                {hasCamStrikes && <th>Webcam Strikes</th>}
                <th>Time Spent {durationMins ? `(Max: ${durationMins}m)` : ''}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="student-cell">
                        <Skeleton circle width="40px" height="40px" />
                        <div className="student-info"><Skeleton width="120px" height="16px" className="mb-1" /><Skeleton width="160px" height="12px" /></div>
                      </div>
                    </td>
                    <td><Skeleton width="40px" height="20px" borderRadius="10px" /></td>
                    <td><Skeleton width="90px" height="24px" borderRadius="12px" /></td>
                    {hasTabStrikes && <td><Skeleton width="40px" height="16px" /></td>}
                    {hasCamStrikes && <td><Skeleton width="40px" height="16px" /></td>}
                    <td><Skeleton width="60px" height="16px" /></td>
                    <td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Skeleton width="24px" height="24px" /></div></td>
                  </tr>
                ))
              ) : paginatedStudents.length === 0 ? (
                <tr><td colSpan={hasTabStrikes && hasCamStrikes ? 7 : hasTabStrikes || hasCamStrikes ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No students found matching your criteria.</td></tr>
              ) : paginatedStudents.map((student) => {
                
                const displayCamStrikes = Math.max(0, student.camStrikes - 1);

                const isAnomaly = student.status === 'IN_PROGRESS' && (
                    (hasTabStrikes && student.strikes >= (contestLimit - 1)) || 
                    (hasCamStrikes && displayCamStrikes >= (camLimit - 1))
                );
                
                // Constructing tooltip text to hide PIN & Email behind hover cleanly
                const hoverText = `Email: ${student.user.email}${student.user.pin ? `\nPIN: ${student.user.pin}` : ''}`;

                return (
                  <tr key={student.id} style={{ backgroundColor: isAnomaly ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                    <td>
                      {/* 🚀 Hover to see Email & PIN natively via title attribute */}
                      <div className="student-cell" title={hoverText} style={{ cursor: 'help' }}>
                        <div className={`student-avatar ${isAnomaly ? 'anomaly' : 'normal'}`}>
                          {student.user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="student-info">
                          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 500, color: '#f8fafc' }}>
                            {student.user.name}
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#64748b' }}>info</span>
                            {isAnomaly && <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '16px' }}>warning</span>}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit_document</span>
                        {student.attempted || 0} / {totalQuestions}
                      </div>
                    </td>

                    <td>
                      <span className={`live-badge badge-${student.status.toLowerCase()}`}>
                        {student.status === 'IN_PROGRESS' && isLive && <span className="status-pulse pulse-anim" style={{ backgroundColor: 'currentColor' }}></span>}
                        {student.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* 🚀 Dynamic Strike Columns Format: 1 / 3 */}
                    {hasTabStrikes && (
                       <td>
                          <span style={{ color: student.strikes >= contestLimit ? '#ef4444' : student.strikes > 0 ? '#f59e0b' : '#94a3b8', fontWeight: 600, background: 'rgba(15, 23, 42, 0.5)', padding: '4px 8px', borderRadius: '4px' }}>
                             {student.strikes} <span style={{color: '#475569'}}>/</span> {contestLimit}
                          </span>
                       </td>
                    )}

                    {hasCamStrikes && (
                       <td>
                          <span style={{ color: displayCamStrikes >= camLimit ? '#ef4444' : displayCamStrikes > 0 ? '#f59e0b' : '#94a3b8', fontWeight: 600, background: 'rgba(15, 23, 42, 0.5)', padding: '4px 8px', borderRadius: '4px' }}>
                             {displayCamStrikes} <span style={{color: '#475569'}}>/</span> {camLimit}
                          </span>
                       </td>
                    )}

                    {/* 🚀 Dynamic Time Spent Column */}
                    <td>
                       <span style={{ color: '#e2e8f0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '4px 10px', borderRadius: '4px', width: 'fit-content' }}>
                           <span className={`material-symbols-outlined ${student.status === 'IN_PROGRESS' ? 'animate-pulse' : ''}`} style={{ fontSize: '16px', color: student.status === 'IN_PROGRESS' ? '#10b981' : '#64748b' }}>schedule</span>
                           {calculateTimeSpent(student)}
                       </span>
                    </td>

                    <td>
                      <div className="actions-cell">
                        <MoreOptions>
                          <MoreOptionsItem icon="history" onClick={() => router.push(`/admin/contests/${examId}/student/${student.userId}`)}>
                            View Exam Logs
                          </MoreOptionsItem>
                          
                          {(student.status === 'SUBMITTED' || student.status === 'KICKED' || student.strikes > 0 || student.camStrikes > 0) && (
                            <MoreOptionsItem icon="restart_alt" onClick={() => handleResetExam(student.userId, student.user.name)}>
                              Reset Exam (Allow Retake)
                            </MoreOptionsItem>
                          )}
                          
                          {student.status === 'IN_PROGRESS' && isLive && (
                            <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }}></div>
                          )}
                          {student.status === 'IN_PROGRESS' && isLive && (
                            <MoreOptionsItem icon="block" danger onClick={() => handleTerminateSession(student.userId, student.user.name)}>
                              Terminate Session
                            </MoreOptionsItem>
                          )}
                        </MoreOptions>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 🚀 Pagination Component */}
        {!loading && filteredStudents.length > 0 && (
           <div style={{ padding: '16px' }}>
              <Pagination 
                 currentPage={currentPage}
                 totalItems={filteredStudents.length}
                 itemsPerPage={itemsPerPage}
                 onNext={() => setCurrentPage(p => p + 1)}
                 onPrev={() => setCurrentPage(p => p - 1)}
              />
           </div>
        )}

      </div>
    </div>
  );
}