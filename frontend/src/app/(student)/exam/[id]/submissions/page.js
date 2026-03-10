"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Dropdown from '@/components/ui/Dropdown';
import Skeleton from '@/components/ui/Skeleton';
import './submissions.css';

export default function ExamSubmissionsPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: examId } = use(params);
  
  const reason = searchParams.get('reason') || 'success'; // timeout, terminated, success

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCode, setSelectedCode] = useState(null); // For Modal

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Accepted', value: 'Accepted' },
    { label: 'Failed / Wrong Answer', value: 'Failed' },
    { label: 'Error / TLE', value: 'Error' },
    { label: 'Draft (Not Run)', value: 'DRAFT' }
  ];

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/my-submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.answers || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [examId, router]);

  // UI Helpers
  const getLangConfig = (lang) => {
    const l = lang.toLowerCase();
    if (l.includes('python')) return { icon: 'code', color: '#38bdf8' }; // Light blue
    if (l.includes('java') && !l.includes('script')) return { icon: 'local_fire_department', color: '#fb923c' }; // Orange
    if (l.includes('c++') || l.includes('cpp') || l.includes('c')) return { icon: 'data_object', color: '#3b82f6' }; // Blue
    if (l.includes('javascript') || l.includes('js')) return { icon: 'javascript', color: '#facc15' }; // Yellow
    return { icon: 'terminal', color: '#cbd5e1' };
  };

  const getStatusConfig = (status) => {
    if (status === 'Accepted') return { type: 'acc', icon: 'check_circle', label: 'Accepted' };
    if (status === 'Failed' || status === 'Wrong Answer') return { type: 'wa', icon: 'close', label: 'Failed' };
    if (status === 'TLE' || status.includes('Time Limit')) return { type: 'tle', icon: 'timer', label: 'Time Limit Exceeded' };
    if (status === 'Error' || status.includes('Runtime')) return { type: 'err', icon: 'error', label: 'Execution Error' };
    if (status === 'DRAFT') return { type: 'draft', icon: 'edit_document', label: 'Draft Saved' };
    return { type: 'err', icon: 'help', label: status };
  };

  // 🚀 FIXED: Tell the browser to format it strictly as UTC so NO offset is added.
  // Since the DB time is already IST, this guarantees it prints exactly what the DB has.
  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { 
      timeZone: 'UTC', // Forces the browser to not add the 5:30 offset
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  // Filtering
  const filteredSubmissions = submissions.filter(sub => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'Failed') return sub.status === 'Failed' || sub.status === 'Wrong Answer';
    if (statusFilter === 'Error') return sub.status === 'Error' || sub.status === 'TLE' || sub.status.includes('Runtime');
    return sub.status === statusFilter;
  });

  return (
    <div className="subs-wrapper">
      
      {/* HEADER */}
      <header className="subs-header">
        <div className="subs-header-gradient"></div>
        <div className="header-content">
          <div className="logo-group">
            <div className="logo-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>terminal</span>
            </div>
            <span className="logo-text">CodeScript</span>
          </div>
          
          <div className="header-right">
            <Link href="/dashboard" className="btn-dashboard">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
              <span className="hidden sm:inline">Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="subs-main">
        
        {/* Banner based on Reason */}
        <div className={`finish-banner banner-${reason}`}>
           <span className="material-symbols-outlined banner-icon">
             {reason === 'success' ? 'task_alt' : reason === 'timeout' ? 'timer_off' : 'gavel'}
           </span>
           <div className="banner-text">
              <h2>{reason === 'success' ? 'Exam Submitted Successfully' : reason === 'timeout' ? 'Time is Up!' : 'Exam Terminated'}</h2>
              <p>
                {reason === 'success' ? 'Your final code has been safely recorded.' : 
                 reason === 'timeout' ? 'Your exam time expired. Your last saved drafts were submitted.' : 
                 'You were removed from the session due to policy violations. Your last drafts were saved.'}
              </p>
           </div>
        </div>

        {/* Title & Filters */}
        <div className="page-title-row">
          <div className="page-title">
            <h1>Submission History</h1>
            <p>Review the code you wrote during this exam.</p>
          </div>
          
          <div style={{ width: '200px' }}>
            <Dropdown 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="subs-table">
              <thead>
                <tr>
                  <th>Time Saved</th>
                  <th>Problem Title</th>
                  <th>Language</th>
                  <th>Final Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="5" style={{ padding: '20px' }}><Skeleton count={3} height="40px" /></td></tr>
                ) : filteredSubmissions.length === 0 ? (
                   <tr><td colSpan="5" className="empty-state">No submissions match this filter.</td></tr>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const langConf = getLangConfig(sub.language);
                    const statConf = getStatusConfig(sub.status);

                    return (
                      <tr key={sub.id}>
                        <td className="td-time">{formatTime(sub.updatedAt)}</td>
                        <td className="td-title">{sub.problem?.title || 'Unknown Problem'}</td>
                        <td>
                          <div className="lang-badge">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: langConf.color }}>
                              {langConf.icon}
                            </span>
                            {sub.language}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${statConf.type}`}>
                            {statConf.type === 'acc' && <span className="status-dot"></span>}
                            {statConf.type !== 'acc' && <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{statConf.icon}</span>}
                            {statConf.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-view-code" onClick={() => setSelectedCode(sub)}>
                            View Code
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span className="page-info">
              Showing <span>{filteredSubmissions.length}</span> results
            </span>
          </div>
        </div>

      </main>

      {/* CODE VIEWER MODAL */}
      {selectedCode && (
        <div className="code-modal-overlay" onClick={() => setSelectedCode(null)}>
           <div className="code-modal" onClick={e => e.stopPropagation()}>
              <div className="code-modal-header">
                 <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{selectedCode.problem?.title}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Language: {selectedCode.language}</p>
                 </div>
                 <button className="btn-close-modal" onClick={() => setSelectedCode(null)}>
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="code-modal-body">
                 <pre><code>{selectedCode.code || "// No code saved."}</code></pre>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}