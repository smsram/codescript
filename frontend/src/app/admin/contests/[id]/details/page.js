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
import './details.css'; 

export default function ContestDetailsPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [contestTitle, setContestTitle] = useState("");
  const [contestStatus, setContestStatus] = useState(""); 
  const [dynamicStatus, setDynamicStatus] = useState(""); 
  const [timeDisplay, setTimeDisplay] = useState("--:--");
  const [contestLimit, setContestLimit] = useState(3);
  
  const [dates, setDates] = useState({ start: null, end: null });
  const [scheduleText, setScheduleText] = useState("");
  const [durationText, setDurationText] = useState("");

  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Export State
  const [exportOpen, setExportOpen] = useState(false);
  
  const socketRef = useRef(null);

  // Helper: Convert Backend IST strings to Local Browser Time (US/Local)
  const convertIstToLocal = useCallback((dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return date.getTime() - (330 * 60000); 
  }, []);

  // Helper: Format Schedule & Duration
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

    // Duration calculation
    const diffMins = Math.round((endMs - startMs) / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    setDurationText(`${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`);
  }, []);

  // ==========================================
  // 1. FETCH INITIAL DATA & SETUP SOCKET
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    let isMounted = true;

    const initPage = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        if (isMounted) {
          setContestTitle(data.contestTitle);
          setContestStatus(data.contestStatus);
          setContestLimit(data.contestStrikes);
          setDates({ start: data.startTime, end: data.endTime });
          
          const localStart = convertIstToLocal(data.startTime);
          const localEnd = convertIstToLocal(data.endTime);
          formatScheduleDetails(localStart, localEnd);

          setStudents(data.sessions || []);
          setLoading(false);
        }

        if (data.contestStatus !== 'DRAFT') {
           const now = new Date().getTime();
           const end = convertIstToLocal(data.endTime);
           
           if (now <= end) {
             socketRef.current = io(process.env.NEXT_PUBLIC_API_URL, { auth: { token } });
             socketRef.current.on('connect', () => {
               socketRef.current.emit('join-admin-monitor', { examId });
             });
             socketRef.current.on('live-stats-update', (liveData) => {
               if (isMounted) {
                 setStudents(liveData.sessions || []);
                 setContestLimit(liveData.contestStrikes || 3);
               }
             });
           }
        }
      } catch (err) {
        if (isMounted) {
          showToast("Failed to load contest details", "error");
          setLoading(false);
        }
      }
    };

    initPage();

    return () => {
      isMounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [examId, router, convertIstToLocal, formatScheduleDetails]);

  // ==========================================
  // 2. REAL-TIME COUNTDOWN ENGINE
  // ==========================================
  useEffect(() => {
    if (!dates.start || !dates.end) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
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

  // ==========================================
  // 3. ADMIN ACTIONS
  // ==========================================
  const handleResetExam = (userId, studentName) => {
    confirmAlert({
      title: "Reset Student Exam?",
      message: `Resetting the exam for ${studentName} allows them to retake it with 0 strikes. Drafts are kept.`,
      confirmText: "Yes, Reset Exam", cancelText: "Cancel", isDanger: false, darkOverlay: true,
      onConfirm: async () => {
        if (socketRef.current && socketRef.current.connected) {
           socketRef.current.emit('admin-reset-student', { examId, userId });
           showToast(`Reset command sent for ${studentName}`, "success");
        } else {
           try {
             const token = localStorage.getItem('token');
             await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/reset-student`, {
               method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
               body: JSON.stringify({ userId })
             });
             showToast(`Exam reset for ${studentName}`, "success");
             window.location.reload();
           } catch (err) { showToast("Failed to reset via HTTP", "error"); }
        }
      }
    });
  };

  const handleTerminateSession = (userId, studentName) => {
    confirmAlert({
      title: "Terminate Session?",
      message: `Forcibly end the exam for ${studentName}. They will be kicked immediately.`,
      confirmText: "Terminate Exam", cancelText: "Cancel", isDanger: true, darkOverlay: true,
      onConfirm: () => {
        if (socketRef.current && socketRef.current.connected) {
           socketRef.current.emit('admin-terminate-student', { examId, userId });
           showToast(`Termination command sent for ${studentName}`, "success");
        }
      }
    });
  };

  // ==========================================
  // 4. EXPORT LOGIC
  // ==========================================
  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Status", "Strikes", "Joined At"];
    const rows = filteredStudents.map(s => [
      `"${s.user.name}"`, 
      `"${s.user.email}"`, 
      s.status, 
      s.strikes, 
      `"${new Date(convertIstToLocal(s.joinedAt)).toLocaleString()}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${contestTitle.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportOpen(false);
  };

  const handleExportPDF = () => {
    window.print();
    setExportOpen(false);
  };

  // ==========================================
  // 5. FILTERING & STATS
  // ==========================================
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.user.name.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'coding' && s.status === 'IN_PROGRESS') return matchesSearch;
    if (filter === 'warning' && contestLimit > 0 && s.strikes >= (contestLimit - 1) && s.status === 'IN_PROGRESS') return matchesSearch;
    if (filter === 'submitted' && s.status === 'SUBMITTED') return matchesSearch;
    if (filter === 'kicked' && s.status === 'KICKED') return matchesSearch;
    return false;
  });

  const activeCount = students.filter(s => s.status === 'IN_PROGRESS').length;
  const warningCount = contestLimit > 0 ? students.filter(s => s.status === 'IN_PROGRESS' && s.strikes >= (contestLimit - 1)).length : 0;
  const submittedCount = students.filter(s => s.status === 'SUBMITTED').length;
  
  const isLive = dynamicStatus === 'ACTIVE';

  return (
    <div className="live-monitor-container">
      
      <Link href="/admin/contests" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f8fafc'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Back to Contests
      </Link>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 8px 0', minHeight: '32px' }}>
            {loading ? <Skeleton width="300px" height="32px" /> : contestTitle}
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minHeight: '24px' }}>
            {loading ? (
              <Skeleton width="200px" height="24px" borderRadius="6px" />
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
                
                {/* Timer (ONLY if Live) */}
                {isLive && (
                  <span style={{ color: '#ef4444', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600 }}>
                    {timeDisplay}
                  </span>
                )}

                {/* Schedule & Duration Display */}
                {scheduleText && (
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{color: '#334155'}}>|</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_month</span>
                    {scheduleText} <span style={{fontWeight: 600}}>({durationText})</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* EXPORT & ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading ? (
            <Skeleton width="120px" height="38px" borderRadius="6px" />
          ) : (
            <>
              {/* Export Dropdown */}
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
            </>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW */}
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

      {/* ACTIVITY MONITOR */}
      <div className="activity-card">
        <div className="activity-header">
          <h3 className="activity-title">{isLive ? 'Real-time Student Activity' : 'Student Results & Sessions'}</h3>
          <div className="activity-filters">
             <div className="search-box-small">
                <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} disabled={loading} />
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
                <th>Student Details</th>
                <th>Joined At</th>
                <th>Status</th>
                <th>Tab-Switch Strikes</th>
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
                    <td><Skeleton width="60px" height="16px" /></td>
                    <td><Skeleton width="90px" height="24px" borderRadius="12px" /></td>
                    <td><Skeleton width="80px" height="16px" /></td>
                    <td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Skeleton width="24px" height="24px" /></div></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No students found matching your criteria.</td></tr>
              ) : filteredStudents.map((student) => {
                const isAnomaly = contestLimit > 0 && student.status === 'IN_PROGRESS' && student.strikes >= (contestLimit - 1);
                
                return (
                  <tr key={student.id} style={{ backgroundColor: isAnomaly ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                    <td>
                      <div className="student-cell">
                        <div className={`student-avatar ${isAnomaly ? 'anomaly' : 'normal'}`}>
                          {student.user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="student-info">
                          <p>
                            {student.user.name}
                            {isAnomaly && <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '16px', marginLeft: '6px' }}>warning</span>}
                          </p>
                          <p>{student.user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="ip-text">
                      {new Date(convertIstToLocal(student.joinedAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td>
                      <span className={`live-badge badge-${student.status.toLowerCase()}`}>
                        {student.status === 'IN_PROGRESS' && isLive && <span className="status-pulse pulse-anim" style={{ backgroundColor: 'currentColor' }}></span>}
                        {student.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <div className="strike-container" title={`${student.strikes} strikes logged`}>
                        {contestLimit === 0 ? (
                           <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Indefinite</span>
                        ) : (
                          [...Array(contestLimit)].map((_, i) => {
                            let strikeClass = "strike-safe"; 
                            if (i < student.strikes) strikeClass = "strike-used"; 
                            if (student.strikes >= (contestLimit - 1) && i < student.strikes) strikeClass = "strike-danger"; 
                            return <div key={i} className={`strike-dot ${strikeClass}`}></div>;
                          })
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="actions-cell">
                        <MoreOptions>
                          <MoreOptionsItem icon="history" onClick={() => router.push(`/admin/contests/${examId}/student/${student.userId}`)}>
                            View Exam Logs
                          </MoreOptionsItem>
                          
                          {(student.status === 'SUBMITTED' || student.status === 'KICKED' || student.strikes > 0) && (
                            <MoreOptionsItem icon="restart_alt" onClick={() => handleResetExam(student.userId, student.user.name)}>
                              Reset Exam (Allow Retake)
                            </MoreOptionsItem>
                          )}
                          
                          {student.status === 'IN_PROGRESS' && isLive && (
                            <>
                              <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }}></div>
                              <MoreOptionsItem icon="block" danger onClick={() => handleTerminateSession(student.userId, student.user.name)}>
                                Terminate Session
                              </MoreOptionsItem>
                            </>
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

        {!loading && filteredStudents.length > 0 && (
           <div style={{ padding: '12px 24px', borderTop: '1px solid #1e293b', fontSize: '0.85rem', color: '#64748b' }}>
              Showing {filteredStudents.length} of {students.length} participants
           </div>
        )}

      </div>
    </div>
  );
}