"use client";

import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import ThemeToggle from '@/components/ui/ThemeToggle'; 

export default function IdeHeader({ loading, contest, timeLeft, globalTimeLeft, formatTime, strikes, camStrikes, isConnected, handleSubmitExam }) {
  
  const primaryTime = timeLeft !== null ? timeLeft : globalTimeLeft;
  const isDanger = primaryTime !== null && primaryTime < 300; 

  return (
    <header className="ide-header">
      <div className="ide-header-gradient"></div>
      
      <div className="header-left">
        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="logo-icon" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/CodeScriptLogo.png" alt="CodeScript Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span className="logo-text" style={{ fontWeight: '600', fontSize: '18px', color: 'var(--text-main)' }}>
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
        <div className="timer-badge" style={{ 
            borderColor: isDanger ? 'rgba(239,68,68,0.3)' : '',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '120px', padding: '6px 16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: isDanger ? '#ef4444' : '#f59e0b', fontSize: '18px' }}>timer</span>
            <span className="timer-text" style={{ color: isDanger ? '#ef4444' : 'var(--text-main)', fontWeight: '700', fontSize: '1.05rem', lineHeight: '1' }}>
              {loading ? '--:--:--' : (primaryTime !== null ? formatTime(primaryTime) : '--:--:--')}
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        
        <ThemeToggle />

        {/* 🚀 TAB STRIKES BADGE */}
        {!loading && contest?.strictMode && contest?.strikes > 0 && contest?.tabStrikes !== false && (
           <div className="network-status" style={{ marginRight: '10px', color: strikes > 0 ? '#ef4444' : 'var(--text-muted)' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
             Tab Strikes: {strikes}/{contest.strikes}
           </div>
        )}

        {/* 🚀 CAMERA STRIKES BADGE */}
        {!loading && contest?.proctoringEnabled && contest?.webcamStrikes > 0 && (
           <div className="network-status" style={{ marginRight: '10px', color: camStrikes > 0 ? '#ec4899' : 'var(--text-muted)' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>videocam</span>
             Cam Strikes: {camStrikes}/{contest.webcamStrikes}
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