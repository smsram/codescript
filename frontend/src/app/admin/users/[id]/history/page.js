"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';

export default function UserHistoryPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to load history");

        setUserData(data.user);
        setHistory(data.history || []);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Submitted</span>;
      case 'KICKED':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Kicked</span>;
      default:
        return <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>In Progress</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Header & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
        <button 
          onClick={() => router.push('/admin/users')}
          style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc' }}>Student History</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>View contest participation and violation logs.</p>
        </div>
      </div>

      {loading ? (
        <Skeleton width="100%" height="150px" borderRadius="12px" className="mb-6" />
      ) : userData && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0f172a', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#f8fafc', flexShrink: 0 }}>
            {getInitials(userData.name)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {userData.name}
              {userData.status === 'SUSPENDED' && <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '18px' }} title="Account Suspended">block</span>}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>{userData.email} • Joined {formatDate(userData.createdAt)}</p>
            <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              {userData.role}
            </span>
          </div>
        </div>
      )}

      {/* History Table */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', background: 'rgba(255, 255, 255, 0.01)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>Contest Participation</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Contest</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Joined At</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Violations</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Logs</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '1rem' }}><Skeleton width="150px" height="16px" /></td>
                    <td style={{ padding: '1rem' }}><Skeleton width="120px" height="16px" /></td>
                    <td style={{ padding: '1rem' }}><Skeleton width="80px" height="24px" borderRadius="4px" /></td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><Skeleton width="30px" height="16px" style={{ margin: '0 auto' }} /></td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}><Skeleton width="80px" height="30px" borderRadius="6px" style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.5, marginBottom: '8px', display: 'block' }}>history</span>
                    This user has not participated in any contests yet.
                  </td>
                </tr>
              ) : (
                history.map((session) => (
                  <tr key={session.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', color: '#f1f5f9', fontWeight: '500' }}>
                      {session.contest?.title || "Unknown Contest"}
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '14px' }}>
                      {formatDate(session.joinedAt)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(session.status)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {session.strikes > 0 ? (
                        <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                          {session.strikes}
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => router.push(`/admin/contests/${session.contestId}/student/${userId}`)}
                        style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3b82f6'; }}
                      >
                        View Submissions
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}