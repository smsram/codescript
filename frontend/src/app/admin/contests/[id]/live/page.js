"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Dropdown from '@/components/ui/Dropdown';
import { MoreOptions, MoreOptionsItem } from '@/components/ui/MoreOptions';
import { showToast } from '@/components/ui/Toast';
import { confirmAlert } from '@/components/ui/AlertConfirm';
import './live.css';

export default function LiveMonitorPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [contestLimit, setContestLimit] = useState(3);

  // ==========================================
  // 1. FETCH LIVE DATA
  // ==========================================
  const fetchLiveStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/live-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.sessions || []);
        setContestLimit(data.contestStrikes || 3);
      }
    } catch (err) {
      console.error("Failed to fetch live stats", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for live updates every 5 seconds
  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 5000);
    return () => clearInterval(interval);
  }, [examId]);

  // ==========================================
  // 2. ACTIONS (Reset & Terminate)
  // ==========================================
  const handleResetExam = (userId, studentName) => {
    confirmAlert({
      title: "Reset Student Exam?",
      message: `Are you sure you want to reset the exam for ${studentName}? This will reset their strikes to 0 and allow them to start over. Their previous code drafts will NOT be deleted.`,
      confirmText: "Yes, Reset Exam",
      cancelText: "Cancel",
      isDanger: false,
      darkOverlay: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/reset-student`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
          });

          if (res.ok) {
            showToast(`Exam reset for ${studentName}`, "success");
            fetchLiveStats(); // Instantly refresh UI
          } else {
            const data = await res.json();
            showToast(data.message || "Failed to reset exam", "error");
          }
        } catch (err) {
          showToast("Server error during reset", "error");
        }
      }
    });
  };

  const handleTerminateSession = (userId, studentName) => {
    confirmAlert({
      title: "Terminate Session?",
      message: `You are about to forcibly end the exam for ${studentName}. They will be kicked out immediately.`,
      confirmText: "Terminate Exam",
      cancelText: "Cancel",
      isDanger: true,
      darkOverlay: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/terminate-student`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
          });

          if (res.ok) {
            showToast(`Terminated ${studentName}'s session`, "success");
            fetchLiveStats();
          } else {
            showToast("Failed to terminate", "error");
          }
        } catch (err) {
          showToast("Server error during termination", "error");
        }
      }
    });
  };

  // ==========================================
  // 3. FILTERING & STATS LOGIC
  // ==========================================
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.user.name.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'coding' && s.status === 'IN_PROGRESS') return matchesSearch;
    if (filter === 'warning' && s.strikes >= (contestLimit - 1) && s.status === 'IN_PROGRESS') return matchesSearch;
    if (filter === 'submitted' && s.status === 'SUBMITTED') return matchesSearch;
    if (filter === 'kicked' && s.status === 'KICKED') return matchesSearch;
    return false;
  });

  const activeCount = students.filter(s => s.status === 'IN_PROGRESS').length;
  const warningCount = students.filter(s => s.status === 'IN_PROGRESS' && s.strikes >= (contestLimit - 1)).length;
  const submittedCount = students.filter(s => s.status === 'SUBMITTED').length;

  return (
    <div className="live-monitor-container">
      {/* 1. STATS OVERVIEW */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="material-symbols-outlined stat-card-icon" style={{ color: '#06b6d4' }}>groups</span>
          <span className="stat-label">Active Participants</span>
          <div className="stat-value-row">
            <span className="stat-value">{loading ? '--' : activeCount}</span>
            <span className="stat-trend" style={{ color: '#10b981' }}>Currently Coding</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="material-symbols-outlined stat-card-icon" style={{ color: '#fbbf24' }}>task_alt</span>
          <span className="stat-label">Exams Submitted</span>
          <div className="stat-value-row">
            <span className="stat-value">{loading ? '--' : submittedCount}</span>
            <span className="stat-trend" style={{ color: '#94a3b8' }}>Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="material-symbols-outlined stat-card-icon" style={{ color: '#ef4444' }}>warning</span>
          <span className="stat-label">Anomalies / Alerts</span>
          <div className="stat-value-row">
            <span className="stat-value" style={{ color: warningCount > 0 ? '#f87171' : '#94a3b8' }}>{loading ? '--' : warningCount}</span>
            <span className="stat-trend" style={{ color: warningCount > 0 ? '#f87171' : '#94a3b8' }}>near strike limit</span>
          </div>
        </div>
      </div>

      {/* 2. ACTIVITY MONITOR */}
      <div className="activity-card">
        <div className="activity-header">
          <h3 className="activity-title">Real-time Student Activity</h3>
          <div className="activity-filters">
             <div className="search-box-small">
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="material-symbols-outlined search-icon">search</span>
             </div>
             <div style={{ width: '150px' }}>
                <Dropdown 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'In Progress', value: 'coding' },
                    { label: 'Warning Level', value: 'warning' },
                    { label: 'Submitted', value: 'submitted' },
                    { label: 'Kicked Out', value: 'kicked' }
                  ]}
                />
             </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="live-table">
            <thead>
              <tr>
                <th>Student Details</th>
                <th>Joined At</th>
                <th>Current Status</th>
                <th>Tab-Switch Strikes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                   <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      {loading ? 'Loading live data...' : 'No students found matching your criteria.'}
                   </td>
                </tr>
              ) : filteredStudents.map((student) => {
                const isAnomaly = student.status === 'IN_PROGRESS' && student.strikes >= (contestLimit - 1);
                
                return (
                  <tr key={student.id} style={{ backgroundColor: isAnomaly ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                    <td>
                      <div className="student-cell" onClick={() => console.log("Show Student Log", student.userId)} style={{ cursor: 'pointer' }}>
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
                      {new Date(student.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td>
                      <span className={`live-badge badge-${student.status.toLowerCase()}`}>
                        {student.status === 'IN_PROGRESS' && <span className="status-pulse pulse-anim" style={{ backgroundColor: 'currentColor' }}></span>}
                        {student.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <div className="strike-container" title={`${student.strikes} / ${contestLimit} strikes`}>
                        {contestLimit === 0 ? (
                           <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Indefinite</span>
                        ) : (
                          [...Array(contestLimit)].map((_, i) => {
                            let strikeClass = "strike-safe"; // Safe (Green/Gray)
                            if (i < student.strikes) strikeClass = "strike-used"; // Used (Orange/Red)
                            if (student.strikes >= (contestLimit - 1) && i < student.strikes) strikeClass = "strike-danger"; // Danger (Red)
                            return <div key={i} className={`strike-dot ${strikeClass}`}></div>;
                          })
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="actions-cell">
                        <MoreOptions>
                          <MoreOptionsItem icon="history" onClick={() => console.log('View Full Log for', student.userId)}>
                            View Exam Logs
                          </MoreOptionsItem>
                          
                          {/* Reset Exam Option */}
                          {(student.status === 'SUBMITTED' || student.status === 'KICKED' || student.strikes > 0) && (
                            <MoreOptionsItem icon="restart_alt" onClick={() => handleResetExam(student.userId, student.user.name)}>
                              Reset Exam (Allow Retake)
                            </MoreOptionsItem>
                          )}
                          
                          {/* Terminate Option */}
                          {student.status === 'IN_PROGRESS' && (
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

        <div className="table-footer">
           <p className="pagination-info">Showing {filteredStudents.length} of {students.length} participants</p>
           {/* Pagination logic can be added here if students > 50 */}
        </div>

      </div>
    </div>
  );
}