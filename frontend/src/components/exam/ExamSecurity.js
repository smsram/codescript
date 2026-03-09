"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { showToast } from '@/components/ui/Toast';

export default function ExamSecurity({ children, isStrict, allowedStrikes, logStrike, loading }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 1. Calculate Security State
  const enforceSecurity = isStrict && allowedStrikes > 0;

  // 🚀 THE MAGIC: Store states in Refs so the event listeners NEVER have to detach/reattach!
  const enforceRef = useRef(enforceSecurity);
  const logStrikeRef = useRef(logStrike);
  const lastToastTime = useRef(0);

  // Update the refs quietly in the background when props change
  useEffect(() => {
    enforceRef.current = enforceSecurity;
    logStrikeRef.current = logStrike;
  }, [enforceSecurity, logStrike]);

  // 2. Cross-Browser Fullscreen Checker
  const checkFullscreen = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }, []);

  useEffect(() => {
    setIsFullscreen(checkFullscreen());
  }, [checkFullscreen]);

  // 3. 🚀 THE IMMORTAL EVENT LISTENERS
  // The empty array [] means this runs exactly ONCE and never detaches during the exam.
  useEffect(() => {
    
    // --- A. RIGHT CLICK & DEV TOOLS ---
    const blockNativeMenu = (e) => {
      // If security is off, let the click happen normally
      if (!enforceRef.current) return true; 

      e.preventDefault();
      e.stopPropagation();
      
      const now = Date.now();
      if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          showToast("Right-click is strictly disabled.", "error");
      }
      return false;
    };

    const blockDevTools = (e) => {
      if (!enforceRef.current) return true;
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) || ((e.ctrlKey || e.metaKey) && ['U', 'u'].includes(e.key))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Brute Force DOM Level 0
    document.oncontextmenu = blockNativeMenu;
    window.oncontextmenu = blockNativeMenu;

    // Standard DOM Level 2 Capture
    window.addEventListener('contextmenu', blockNativeMenu, { capture: true, passive: false });
    document.addEventListener('contextmenu', blockNativeMenu, { capture: true, passive: false });
    window.addEventListener('keydown', blockDevTools, { capture: true, passive: false });


    // --- B. TAB & APP SWITCH ---
    const handleVisibilityChange = () => {
      if (!enforceRef.current) return;
      if (document.hidden || document.visibilityState === 'hidden') {
        logStrikeRef.current("Tab Switch");
        showToast("Tab switching is not allowed! Strike recorded.", "error");
      }
    };

    const handleWindowBlur = () => {
      if (!enforceRef.current) return;
      setTimeout(() => {
        if (!document.hasFocus()) {
           logStrikeRef.current("App Switch / Lost Focus");
           showToast("Clicking outside the exam is not allowed! Strike recorded.", "error");
        }
      }, 300); 
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);


    // --- C. FULLSCREEN EXIT ---
    const handleFullscreenChange = () => {
      if (!enforceRef.current) return;
      
      const currentlyInFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      setIsFullscreen(currentlyInFullscreen);

      if (!currentlyInFullscreen) {
        logStrikeRef.current("Exited Fullscreen"); 
        showToast("Fullscreen exited! A policy violation strike has been recorded.", "error");
      }
    };

    const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    fsEvents.forEach(evt => document.addEventListener(evt, handleFullscreenChange));

    // CLEANUP ON DISMOUNT
    return () => {
      document.oncontextmenu = null;
      window.oncontextmenu = null;
      window.removeEventListener('contextmenu', blockNativeMenu, { capture: true });
      document.removeEventListener('contextmenu', blockNativeMenu, { capture: true });
      window.removeEventListener('keydown', blockDevTools, { capture: true });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);

      fsEvents.forEach(evt => document.removeEventListener(evt, handleFullscreenChange));
    };
  }, []); // <--- This empty array is the silver bullet.

  const handleEnterFullscreen = async () => {
      try {
          const el = document.documentElement;
          if (el.requestFullscreen) {
              await el.requestFullscreen();
          } else if (el.webkitRequestFullscreen) {
              await el.webkitRequestFullscreen();
          } else if (el.msRequestFullscreen) {
              await el.msRequestFullscreen();
          }
          setIsFullscreen(true);
      } catch (err) {
          console.error("Failed to enter fullscreen", err);
          showToast("Failed to enter fullscreen. Please try again.", "error");
      }
  };

  return (
    <div 
      // Keep this as a tertiary backup layer
      onContextMenuCapture={(e) => {
        if (!enforceSecurity) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
    >
      
      {!loading && enforceSecurity && !isFullscreen && (
          <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, background: '#020617', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#f8fafc', padding: '2rem', textAlign: 'center'
          }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#ef4444', marginBottom: '24px' }}>
                  fullscreen
              </span>
              <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Strict Exam Environment</h1>
              <p style={{ color: '#94a3b8', maxWidth: '500px', marginBottom: '32px', lineHeight: 1.6 }}>
                  This exam requires fullscreen mode. Navigating away from this tab, opening developer tools, or exiting fullscreen will result in a strike. If you exceed the allowed strikes, your exam will be terminated.
              </p>
              <button 
                  onClick={handleEnterFullscreen}
                  style={{
                      background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px',
                      borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s'
                  }}
              >
                  <span className="material-symbols-outlined">launch</span>
                  Enter Exam (Fullscreen)
              </button>
          </div>
      )}

      <div style={{ height: '100%', visibility: (!loading && enforceSecurity && !isFullscreen) ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </div>
  );
}