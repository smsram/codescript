"use client";

import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import AuthGuard from '@/components/auth/AuthGuard';
import './admin.css';

export default function AdminLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // 🛡️ Wrap the layout in the AuthGuard. Only ADMINs can pass.
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="admin-layout-wrapper">
        
        {/* SIDEBAR */}
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          closeMenu={() => setIsMobileMenuOpen(false)} 
        />

        {/* MOBILE OVERLAY */}
        {isMobileMenuOpen && (
          <div 
            className="admin-sidebar-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* MAIN CONTENT */}
        <main className="admin-main-content">
          <Topbar toggleMenu={() => setIsMobileMenuOpen(true)} />

          <div className="admin-scroll-area">
            <div className="admin-content-max">
              {children}
            </div>
          </div>
        </main>

      </div>
    </AuthGuard>
  );
}