"use client";

import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import ThemeToggle from '@/components/ui/ThemeToggle'; // 🚀 Imported ThemeToggle

export default function IdeHeader({ loading, contest, timeLeft, formatTime, strikes, isConnected, handleSubmitExam }) {
  return (
    <header className="ide-header">
      <div className="ide-header-gradient"></div>
      
      <div className="header-left">
        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <div 
    className="logo-icon" 
    style={{ 
      width: '24px', 
      height: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}
  >
    <img 
      src="/CodeScriptLogo.png" 
      alt="CodeScript Logo" 
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain' 
      }} 
    />
  </div>
  <span 
    className="logo-text" 
    style={{ 
      fontWeight: '600', 
      fontSize: '18px', 
      color: 'var(--text-main)' 
    }}
  >
    CodeScript
  </span>
</div>
        <div className="header-divider"></div>
        {loading ? (
          <Skeleton width="200px" height="24px" />
        ) : (
          <h1 className="exam-title">{contest?.title || 'Unknown Exam'}</h1>
        )}
      </div>

      <div className="header-center">
        <div className="timer-badge" style={{ borderColor: timeLeft < 300 ? 'rgba(239,68,68,0.3)' : '' }}>
          <span className="material-symbols-outlined" style={{ color: timeLeft < 300 ? '#ef4444' : '#f59e0b', fontSize: '18px' }}>timer</span>
          <span className="timer-text" style={{ color: timeLeft < 300 ? '#ef4444' : 'var(--text-main)' }}> {/* 🚀 Theme Variable */}
            {loading ? '--:--:--' : (timeLeft !== null ? formatTime(timeLeft) : '--:--:--')}
          </span>
        </div>
      </div>

      <div className="header-right">
        
        {/* 🚀 ADDED: Theme Toggle Button */}
        <ThemeToggle />

        {/* 🛑 ONLY SHOW STRIKES IF LIMIT IS GREATER THAN 0 */}
        {!loading && contest?.strictMode && contest?.strikes > 0 && (
           <div className="network-status" style={{ marginRight: '10px', color: strikes > 0 ? '#ef4444' : 'var(--text-muted)' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
             Strikes: {strikes}/{contest.strikes}
           </div>
        )}

        <div className="network-status">
          <div className="ping-dot-wrapper">
            <span className={`ping-dot ${isConnected ? '' : 'offline'}`}></span>
            <span className={`solid-dot ${isConnected ? '' : 'offline'}`}></span>
          </div>
          <span className="network-text">{isConnected ? 'Connected' : 'Offline'}</span>
        </div>

        <button className="btn-solid-danger" onClick={() => handleSubmitExam(false)} disabled={loading}>
          Submit Exam
        </button>
      </div>
    </header>
  );
}