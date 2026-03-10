"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Skeleton from '@/components/ui/Skeleton';

export default function Sidebar({ isOpen, closeMenu }) {
  const pathname = usePathname();
  const router = useRouter();

  const [admin, setAdmin] = useState({ name: '', initials: '', role: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        const user = data.user;

        const initials = user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);

        setAdmin({
          name: user.name,
          initials: initials,
          role: user.role,
        });
      } catch (error) {
        console.error("Sidebar fetch error:", error);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    if (confirm("Logout from CodeScript?")) {
      localStorage.removeItem('token');
      sessionStorage.clear();
      router.replace('/login');
    }
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard', active: pathname === '/admin' },
    { href: '/admin/users', label: 'Users', icon: 'group', active: pathname.startsWith('/admin/users') },
    { href: '/admin/contests', label: 'Contests', icon: 'emoji_events', active: pathname.startsWith('/admin/contests') },
    { href: '/admin/settings', label: 'Settings', icon: 'settings', active: pathname.startsWith('/admin/settings') },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        {/* 🚀 Replaced Circle with Logo Image */}
        <img 
          src="/CodeScriptLogo.png" 
          alt="CodeScript Logo" 
          style={{ height: '32px', width: '32px', objectFit: 'contain' }} 
        />
        <div className="sidebar-title">
          <h1>CodeScript</h1>
          <p>Admin Workspace</p>
        </div>
        <button className="close-sidebar-btn" onClick={closeMenu}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <Link 
            key={link.href} 
            href={link.href} 
            onClick={closeMenu} 
            className={`nav-link ${link.active ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* FOOTER WITH SKELETON LOADING */}
      <div className="sidebar-footer">
        <div className="admin-profile">
          {loading ? (
            <>
              <Skeleton width="40px" height="40px" borderRadius="10px" />
              <div className="admin-profile-info" style={{ marginLeft: '12px' }}>
                <Skeleton width="100px" height="14px" className="mb-2" />
                <Skeleton width="60px" height="10px" />
              </div>
            </>
          ) : (
            <>
              <div className="admin-avatar">{admin.initials}</div>
              <div className="admin-profile-info">
                <p className="admin-name">{admin.name}</p>
                <p className="admin-role">{admin.role.toLowerCase()}</p>
              </div>
              <button className="logout-btn-trigger" onClick={handleLogout} title="Sign Out">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}