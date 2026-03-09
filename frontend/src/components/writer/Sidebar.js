"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isOpen, closeMenu }) {
  const pathname = usePathname();

  const isDashboard = pathname === '/writer';
  const isBank = pathname.startsWith('/writer/problems');
  const isDrafts = pathname.startsWith('/writer/drafts');
  const isQueue = pathname.startsWith('/writer/reviews');

  return (
    <aside className={`writer-sidebar ${isOpen ? 'open' : ''}`}>
      
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo-box">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>code</span>
          </div>
          <h1>CodeWriter</h1>
        </div>
        <button className="close-sidebar-btn" onClick={closeMenu}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        
        <Link href="/writer" onClick={closeMenu} className={`nav-link ${isDashboard ? 'active' : ''}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
          <span>Dashboard</span>
        </Link>
        
        <Link href="/writer/problems" onClick={closeMenu} className={`nav-link ${isBank ? 'active' : ''}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>database</span>
          <span>Problem Bank</span>
        </Link>
        
        <Link href="/writer/drafts" onClick={closeMenu} className={`nav-link ${isDrafts ? 'active' : ''}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
          <span>Drafts</span>
          <span className="nav-badge">4</span>
        </Link>
        
        <Link href="/writer/reviews" onClick={closeMenu} className={`nav-link ${isQueue ? 'active' : ''}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>fact_check</span>
          <span>Review Queue</span>
        </Link>
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="writer-profile">
          <div className="writer-avatar-wrap">
            <div className="writer-avatar">AC</div>
            <div className="status-dot-online"></div>
          </div>
          <div className="writer-info">
            <p>Alex Chen</p>
            <p>Senior Editor</p>
          </div>
        </div>
      </div>

    </aside>
  );
}