"use client";

import { useState } from 'react';
import Sidebar from '@/components/writer/Sidebar';
import Topbar from '@/components/writer/Topbar';
import './writer.css';

export default function WriterLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="writer-layout-wrapper">
      <div className="top-gradient-line"></div>
      
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        closeMenu={() => setIsMobileMenuOpen(false)} 
      />

      {isMobileMenuOpen && (
        <div className="writer-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className="writer-main">
        <Topbar toggleMenu={() => setIsMobileMenuOpen(true)} />
        <div className="writer-scroll-area">
          {children}
        </div>
      </main>
      
    </div>
  );
}