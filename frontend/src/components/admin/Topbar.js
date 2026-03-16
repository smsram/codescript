"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreOptions, MoreOptionsItem } from '@/components/ui/MoreOptions';

export default function Topbar({ toggleMenu }) {
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false); 
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);

  useEffect(() => {
    const handleSetLoading = (e) => setIsSaving(e.detail);
    const handleSetDirty = (e) => setIsDirty(e.detail);
    
    window.addEventListener('set-topbar-loading', handleSetLoading);
    window.addEventListener('set-topbar-dirty', handleSetDirty);
    
    return () => {
        window.removeEventListener('set-topbar-loading', handleSetLoading);
        window.removeEventListener('set-topbar-dirty', handleSetDirty);
    };
  }, []);

  useEffect(() => {
    if (!saveMenuOpen) return;
    const closeMenu = () => setSaveMenuOpen(false);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [saveMenuOpen]);

  let pageTitle = "System Overview";
  let actionComponent = null;

  const isProblemPage = pathname.includes('/problem/');
  const isLivePage = pathname.includes('/live');
  const isContestBuilder = (pathname === '/admin/contests/new' || pathname.includes('/edit')) && !isProblemPage;

  const UnsavedBadge = () => (
    <div className="desktop-only" style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
      color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', 
      border: '1px solid rgba(245, 158, 11, 0.2)', padding: '5px 10px', 
      height: '32px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, marginRight: '12px'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
      <span>Unsaved</span>
    </div>
  );

  if (pathname === '/admin') {
    pageTitle = "System Overview";
    // 🚀 Search feature completely removed from here
    actionComponent = null; 
    
  } else if (isProblemPage) {
    const isNew = pathname.endsWith('/new');
    pageTitle = isNew ? "Create Problem" : "Edit Problem";

    actionComponent = (
      <div className="topbar-actions-group">
        {isDirty && <UnsavedBadge />}
        <button className="topbar-cancel-link desktop-only" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }} onClick={() => window.dispatchEvent(new Event('trigger-cancel'))}>
          Cancel
        </button>
        <button className="btn-primary topbar-btn" disabled={isSaving} onClick={() => window.dispatchEvent(new Event('trigger-save-problem'))}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isSaving ? 'hourglass_empty' : 'save'}</span>
          <span className="desktop-inline">{isSaving ? 'Saving...' : (isNew ? 'Create Problem' : 'Save Changes')}</span>
          <span className="mobile-inline">{isSaving ? 'Wait...' : 'Save'}</span>
        </button>
      </div>
    );
  } else if (isLivePage) {
    pageTitle = "Live Monitor";
    actionComponent = (
      <div className="topbar-actions-group">
        <div className="live-badge">
          <div className="live-dot-container"><span className="dot-ping"></span><span className="dot-solid"></span></div>
          <span className="desktop-inline" style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1' }}>LIVE</span>
        </div>
      </div>
    );
  } else if (isContestBuilder) {
    const isNew = pathname === '/admin/contests/new';
    pageTitle = isNew ? "Contest Builder" : "Edit Workspace";

    actionComponent = (
      <div className="topbar-actions-group">
        {isDirty && <UnsavedBadge />}
        <button className="topbar-cancel-link desktop-only" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }} onClick={() => window.dispatchEvent(new Event('trigger-cancel'))}>
          Cancel
        </button>
        
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button className="btn-primary topbar-btn" disabled={isSaving} onClick={() => setSaveMenuOpen(!saveMenuOpen)} style={{ paddingRight: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isSaving ? 'hourglass_empty' : 'save'}</span>
            <span className="desktop-inline">{isSaving ? 'Saving...' : 'Save'}</span>
            <span className="mobile-inline">{isSaving ? 'Wait...' : 'Save'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
          </button>
          
          {saveMenuOpen && !isSaving && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '4px', zIndex: 50, minWidth: '180px' }}>
              <button onClick={() => { setSaveMenuOpen(false); window.dispatchEvent(new CustomEvent('trigger-save-contest', { detail: 'DRAFT' })); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '6px', fontSize: '14px' }} onMouseOver={e=>e.currentTarget.style.background='#334155'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>draft</span> Save as Draft
              </button>
              <button onClick={() => { setSaveMenuOpen(false); window.dispatchEvent(new CustomEvent('trigger-save-contest', { detail: 'ACTIVE' })); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '6px', fontSize: '14px' }} onMouseOver={e=>e.currentTarget.style.background='rgba(16, 185, 129, 0.1)'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>rocket_launch</span> Save & Launch
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } else if (pathname.startsWith('/admin/contests')) {
    pageTitle = "Contest Directory";
    actionComponent = (
      <Link href="/admin/contests/new" className="btn-primary topbar-btn" style={{ textDecoration: 'none' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        <span className="desktop-inline">New Contest</span>
        <span className="mobile-inline">New</span>
      </Link>
    );
  }

  return (
    <header className="admin-topbar">
      <div className="topbar-main-row">
        <div className="topbar-left">
          <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Open Sidebar">
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <h2 className="topbar-title">{pageTitle}</h2>
        </div>
        
        <div className="topbar-right">
          {actionComponent}
        </div>
      </div>
    </header>
  );
}