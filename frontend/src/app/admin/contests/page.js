"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Dropdown from '@/components/ui/Dropdown';
import { MoreOptions, MoreOptionsItem } from '@/components/ui/MoreOptions';
import { showToast } from '@/components/ui/Toast';
import { confirmAlert } from '@/components/ui/AlertConfirm';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination'; // 🚀 Imported Pagination Component
import './contests.css';

export default function ContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tick, setTick] = useState(0);

  // 🚀 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Adjust this if you want more/less items per page

  const fetchContests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setContests(data.contests || []);
    } catch (err) {
      showToast("Failed to load contests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContests(); }, []);

  // Timer for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🚀 Reset to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleDuplicate = async (id) => {
    showToast("Duplicating...", "info");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${id}/duplicate`, {
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error();
      
      showToast("Contest Duplicated!", "success");
      router.push(`/admin/contests/${data.id}/edit`);
    } catch (err) { 
      showToast("Duplication failed", "error"); 
    }
  };

  const handleDelete = (id) => {
    confirmAlert({
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this contest? This will also delete unique problems within this contest.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${id}`, {
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            showToast("Contest deleted successfully", "success");
            setContests(prev => prev.filter(c => c.id !== id));
          } else {
            throw new Error();
          }
        } catch (err) { 
          showToast("Delete failed", "error"); 
        }
      }
    });
  };

  const getStatusInfo = useCallback((c) => {
    if (c.status === "DRAFT") return { status: "Draft", timeStr: null };
    
    const now = new Date().getTime();

    const convertIstToLocal = (dateStr) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        return date.getTime() - (330 * 60000); 
    };

    const start = convertIstToLocal(c.startTime);
    const end = convertIstToLocal(c.endTime);

    const formatDiff = (ms) => {
      const d = Math.floor(ms / (1000 * 60 * 60 * 24));
      const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((ms % (1000 * 60)) / 1000);
      if (d > 0) return `${d}d ${h}h ${m}m`;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (now < start) return { status: "Scheduled", timeStr: `Starts in ${formatDiff(start - now)}` };
    if (now >= start && now <= end) return { status: "Live", timeStr: `Ends in ${formatDiff(end - now)}` };
    return { status: "Completed", timeStr: null };
  }, [tick]); // Ensure it recalculates on tick if needed

  // FILTERING LOGIC
  const filteredContests = useMemo(() => {
    return contests.filter((contest) => {
      // 1. Search Filter (Checks title and ID)
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        contest.title?.toLowerCase().includes(query) || 
        contest.id?.toLowerCase().includes(query);

      // 2. Status Filter
      const { status } = getStatusInfo(contest);
      let matchesStatus = true;
      
      if (statusFilter !== 'all') {
        matchesStatus = status.toLowerCase() === statusFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus;
    });
  }, [contests, searchQuery, statusFilter, getStatusInfo]);

  // 🚀 CALCULATE PAGINATED CONTESTS INSTANTLY
  const paginatedContests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContests, currentPage]);

  return (
    <div className="contests-container">
      <div className="contests-header">
        <div className="header-title">
          <h2>Contest Directory</h2>
          <p>Manage and monitor all active, scheduled, and past coding contests.</p>
        </div>
      </div>

      <div className="contests-toolbar">
        <div className="toolbar-search">
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            placeholder="Search by title or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-filters">
          <Dropdown 
            prefix="Status: " value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All', value: 'all' }, 
              { label: 'Live', value: 'Live' }, 
              { label: 'Scheduled', value: 'Scheduled' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Draft', value: 'Draft' }
            ]}
          />
        </div>
      </div>

      <div className="contests-table-card">
        <div className="table-responsive">
          {loading ? (
            <table style={{ width: '100%' }}>
              <thead><tr><th>Status</th><th>Contest Title</th><th style={{ textAlign: 'center' }}>Access</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton width="80px" height="26px" borderRadius="16px" /></td>
                    <td><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><Skeleton width="220px" height="18px" /><Skeleton width="140px" height="12px" /></div></td>
                    <td style={{ textAlign: 'center' }}><Skeleton width="80px" height="26px" borderRadius="6px" style={{ margin: '0 auto' }} /></td>
                    <td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}><Skeleton width="24px" height="24px" borderRadius="4px" /><Skeleton width="24px" height="24px" circle /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr><th>Status</th><th>Contest Title</th><th style={{ textAlign: 'center' }}>Access</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {filteredContests.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.5, marginBottom: '8px', display: 'block' }}>search_off</span>
                      No contests found matching your search or filters.
                    </td>
                  </tr>
                ) : (
                  // 🚀 Map over paginatedContests instead of filteredContests
                  paginatedContests.map((contest) => {
                    const { status, timeStr } = getStatusInfo(contest);
                    return (
                      <tr key={contest.id}>
                        <td>
                          <div className={`status-pill status-${status.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {status === "Live" && <span className="pulse-dot"></span>}
                            {status}
                          </div>
                        </td>
                        <td>
                          <div className="contest-info-main">
                            <button 
                              onClick={() => router.push(`/admin/contests/${contest.id}/details`)}
                              className="contest-title-btn"
                            >
                              {contest.title}
                            </button>
                            <span className="contest-id" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span>ID: {contest.id}</span>
                              {timeStr && <span style={{ color: status === 'Live' ? '#ef4444' : '#3b82f6', fontWeight: 500 }}>• {timeStr}</span>}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className={`access-badge ${contest.isPrivate ? 'access-private' : ''}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{contest.isPrivate ? 'lock' : 'public'}</span>
                            {contest.isPrivate ? 'Private' : 'Public'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Link href={`/admin/contests/${contest.id}/edit`} className="action-link" title="Edit Contest">
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            </Link>
                            <MoreOptions>
                              <MoreOptionsItem icon="visibility" onClick={() => router.push(`/admin/contests/${contest.id}/details`)}>
                                {status === "Live" ? "Monitor Live" : "View Details / Results"}
                              </MoreOptionsItem>
                              <MoreOptionsItem icon="content_copy" onClick={() => handleDuplicate(contest.id)}>Duplicate</MoreOptionsItem>
                              <div className="dropdown-divider"></div>
                              <MoreOptionsItem icon="delete" danger onClick={() => handleDelete(contest.id)}>Delete</MoreOptionsItem>
                            </MoreOptions>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🚀 Render Pagination Component */}
      {!loading && filteredContests.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <Pagination 
            currentPage={currentPage} 
            totalItems={filteredContests.length} 
            itemsPerPage={itemsPerPage} 
            onNext={() => setCurrentPage(p => p + 1)} 
            onPrev={() => setCurrentPage(p => p - 1)} 
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background-color: currentColor; animation: pulse 1.5s infinite; }
        .contest-title-btn { background: none; border: none; padding: 0; color: inherit; font: inherit; cursor: pointer; text-align: left; font-weight: 600; font-size: 1.05rem; transition: color 0.2s; }
        .contest-title-btn:hover { color: var(--accent-color, #3b82f6); text-decoration: underline; }
        .dropdown-divider { height: 1px; background-color: #334155; margin: 4px 0; }
      `}} />
    </div>
  );
}