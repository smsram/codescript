"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dropdown from '@/components/ui/Dropdown';
import { MoreOptions, MoreOptionsItem } from '@/components/ui/MoreOptions';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { confirmAlert } from '@/components/ui/AlertConfirm';
import Pagination from '@/components/ui/Pagination'; // 🚀 Imported new component
import './users.css';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // 🚀 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'STUDENT', password: '' });

  // Role Change State
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState('STUDENT');

  const roleOptions = [
    { label: 'All Roles', value: 'all' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Writer', value: 'WRITER' },
    { label: 'Student', value: 'STUDENT' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Reset to page 1 whenever a filter or search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery, roleFilter]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return showToast("Name and Email required", "error");
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newUser)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      showToast("User created successfully!", "success");
      setUsers([data.user, ...users]); 
      setIsModalOpen(false);
      setNewUser({ name: '', email: '', role: 'STUDENT', password: '' });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChangeSubmit = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${roleModalUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!res.ok) throw new Error("Failed to update user role");

      showToast("User role updated successfully!", "success");
      setUsers(users.map(u => u.id === roleModalUser.id ? { ...u, role: newRole } : u));
      setRoleModalUser(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSuspend = (user) => {
    const isCurrentlySuspended = user.status === 'SUSPENDED';

    confirmAlert({
      title: isCurrentlySuspended ? "Reactivate Account?" : "Suspend Account?",
      message: isCurrentlySuspended 
        ? `Are you sure you want to restore access for ${user.name}?` 
        : `Are you sure you want to suspend ${user.name}? They will be immediately logged out and unable to access the platform.`,
      confirmText: isCurrentlySuspended ? "Reactivate" : "Suspend",
      cancelText: "Cancel",
      isDanger: !isCurrentlySuspended,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const newStatus = isCurrentlySuspended ? 'ACTIVE' : 'SUSPENDED';

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
          });
          
          if (!res.ok) throw new Error("Failed to update account status");

          showToast(`Account ${isCurrentlySuspended ? 'reactivated' : 'suspended'}.`, "success");
          setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        } catch (err) {
          showToast(err.message, "error");
        }
      }
    });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // 🚀 Text Truncation Helper
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // 🚀 Calculate Paginated Users instantly
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="users-container">
      
      {/* TOOLBAR */}
      <div className="users-toolbar">
        <div className="toolbar-search">
          <span className="material-symbols-outlined icon">search</span>
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="toolbar-actions" style={{ gap: '12px' }}>
          <Dropdown 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={roleOptions}
          />
          <button className="btn-add-user" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add User
          </button>
        </div>
      </div>

      {/* USER GRID */}
      <div className="users-grid">
        {loading ? (
          [...Array(itemsPerPage)].map((_, i) => (
            <div className="user-card" key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ alignSelf: 'flex-end', marginBottom: '8px' }}>
                <Skeleton width="24px" height="24px" borderRadius="4px" />
              </div>
              <Skeleton width="64px" height="64px" circle className="mb-4" />
              <Skeleton width="120px" height="20px" className="mb-2" />
              <Skeleton width="160px" height="14px" className="mb-4" />
              <Skeleton width="80px" height="24px" borderRadius="12px" />
            </div>
          ))
        ) : (
          paginatedUsers.map((user) => {
            const isSuspended = user.status === 'SUSPENDED';

            return (
              <div className="user-card" key={user.id} style={{ opacity: isSuspended ? 0.6 : 1 }}>
                <div className="card-menu-container">
                  <MoreOptions>
                    <MoreOptionsItem icon="manage_accounts" onClick={() => { setRoleModalUser(user); setNewRole(user.role); }}>
                      Change Role
                    </MoreOptionsItem>
                    <MoreOptionsItem icon="history_edu" onClick={() => router.push(`/admin/users/${user.id}/history`)}>
                      View History
                    </MoreOptionsItem>
                    <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }}></div>
                    <MoreOptionsItem icon={isSuspended ? "check_circle" : "block"} danger={!isSuspended} onClick={() => handleToggleSuspend(user)}>
                      {isSuspended ? "Reactivate Account" : "Suspend Account"}
                    </MoreOptionsItem>
                  </MoreOptions>
                </div>

                <div className="user-avatar-lg" style={{ filter: isSuspended ? 'grayscale(100%)' : 'none' }}>
                  <span>{getInitials(user.name)}</span>
                </div>
                
                {/* 🚀 Applied truncation and styling */}
                <h3 className="user-name" title={user.name}>
                  {truncateText(user.name, 50)}
                  {isSuspended && <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '16px', marginLeft: '6px' }} title="Suspended">block</span>}
                </h3>
                
                <p className="user-email" title={user.email}>
                  {truncateText(user.email, 50)}
                </p>
                
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </span>
              </div>
            );
          })
        )}
      </div>

      {(!loading && filteredUsers.length === 0) && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px', display: 'block' }}>group_off</span>
          <p>No users match your filters.</p>
        </div>
      )}

      {/* 🚀 Render Pagination Component */}
      {!loading && filteredUsers.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredUsers.length} 
          itemsPerPage={itemsPerPage} 
          onNext={() => setCurrentPage(p => p + 1)} 
          onPrev={() => setCurrentPage(p => p - 1)} 
        />
      )}

      {/* ADD USER MODAL */}
      {isModalOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }} onClick={() => setIsModalOpen(false)}></div>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', zIndex: 1000, width: '100%', maxWidth: '400px', border: '1px solid #334155' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add New User</h2>
            
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Full Name</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} placeholder="e.g. Jane Doe" />
              </div>
              
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email Address</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} placeholder="jane@example.com" />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  <option value="STUDENT">Student</option>
                  <option value="WRITER">Writer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Temporary Password (Optional)</label>
                <input type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} placeholder="Defaults to password123" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1.5rem', background: '#0ea5e9', color: 'white', borderRadius: '6px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* CHANGE ROLE MODAL */}
      {roleModalUser && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }} onClick={() => setRoleModalUser(null)}></div>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', zIndex: 1000, width: '100%', maxWidth: '400px', border: '1px solid #334155' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Change Role</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Updating permissions for <strong>{roleModalUser.name}</strong>.</p>
            
            <form onSubmit={handleRoleChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Select New Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  <option value="STUDENT">Student</option>
                  <option value="WRITER">Writer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setRoleModalUser(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1.5rem', background: '#0ea5e9', color: 'white', borderRadius: '6px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Saving...' : 'Confirm Role'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}