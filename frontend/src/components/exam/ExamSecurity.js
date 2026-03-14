"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { showToast } from '@/components/ui/Toast';

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; 
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';

export default function ExamSecurity({ children, isStrict, allowedStrikes, logStrike, loading, proctoringEnabled, logCamStrike }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [camActive, setCamActive] = useState(false);
  
  const enforceSecurity = (isStrict && allowedStrikes > 0) || proctoringEnabled;
  const isTabStrikesEnabled = isStrict && allowedStrikes > 0; 

  const enforceRef = useRef(enforceSecurity);
  const tabStrikesRef = useRef(isTabStrikesEnabled);
  const logStrikeRef = useRef(logStrike);
  const logCamStrikeRef = useRef(logCamStrike);
  const lastToastTime = useRef(0);
  const lastCamStrikeTime = useRef(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isScanning = useRef(false);

  useEffect(() => {
    enforceRef.current = enforceSecurity;
    tabStrikesRef.current = isTabStrikesEnabled;
    logStrikeRef.current = logStrike;
    logCamStrikeRef.current = logCamStrike;
  }, [enforceSecurity, isTabStrikesEnabled, logStrike, logCamStrike]);

  // ==========================================
  // 1. ADVANCED AI PROCTORING LOGIC
  // ==========================================
  useEffect(() => {
    if (!proctoringEnabled || loading) return;

    let isMounted = true;
    let detectionInterval;
    let faceDetector;
    let objectDetector;

    const initializeAI = async () => {
      try {
        tf.env().set('DEBUG', false); 
        await tf.setBackend('webgl');
        await tf.ready();
        
        [faceDetector, objectDetector] = await Promise.all([
            blazeface.load(),
            cocoSsd.load()
        ]);
        
        if (!isMounted) return;
        setAiLoaded(true);

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" },
            audio: false 
        });
        
        if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play();
                setCamActive(true);
            };
        }

        detectionInterval = setInterval(async () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );

            if (!videoRef.current || videoRef.current.readyState !== 4) return;
            if (isScanning.current) return;
            if (!isCurrentlyFullscreen) return; 

            isScanning.current = true;

            try {
                const video = videoRef.current;
                let violation = null;

                const [faces, objects] = await Promise.all([
                    faceDetector.estimateFaces(video, false),
                    objectDetector.detect(video)
                ]);

                if (faces.length === 0) {
                    violation = "No face detected in frame";
                } else if (faces.length > 1) {
                    violation = "Multiple faces detected";
                } else {
                    const phone = objects.find(obj => obj.class === 'cell phone' && obj.score > 0.50);
                    if (phone) {
                        violation = "Mobile device detected";
                    }
                }

                if (violation) {
                    const now = Date.now();
                    if (now - lastCamStrikeTime.current > 6000) { 
                        lastCamStrikeTime.current = now;
                        
                        // 🚀 INSTANT LOCAL UI FEEDBACK
                        showToast(`⚠️ AI Violation: ${violation}`, "error");
                        
                        // Send to backend to track actual strikes
                        logCamStrikeRef.current(violation);
                    }
                }
            } catch (err) {
                console.warn("[AI Proctor] Frame Scan Error:", err);
            } finally {
                isScanning.current = false;
            }

        }, 1500); 

      } catch (err) {
        console.error("[AI Proctor] Init Error:", err);
      }
    };

    initializeAI();

    return () => {
      isMounted = false;
      if (detectionInterval) clearInterval(detectionInterval);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, [proctoringEnabled, loading]);


  // ==========================================
  // 2. STRICT MODE LOGIC
  // ==========================================
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

  useEffect(() => {
    const blockNativeMenu = (e) => {
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

    document.oncontextmenu = blockNativeMenu;
    window.oncontextmenu = blockNativeMenu;
    window.addEventListener('contextmenu', blockNativeMenu, { capture: true, passive: false });
    document.addEventListener('contextmenu', blockNativeMenu, { capture: true, passive: false });
    window.addEventListener('keydown', blockDevTools, { capture: true, passive: false });

    const handleVisibilityChange = () => {
      if (!enforceRef.current) return;
      if (document.hidden || document.visibilityState === 'hidden') {
        if (tabStrikesRef.current) {
            logStrikeRef.current("Tab Switch");
            showToast("Tab switching is not allowed! Strike recorded.", "error");
        }
      }
    };

    const handleWindowBlur = () => {
      if (!enforceRef.current) return;
      setTimeout(() => {
        if (!document.hasFocus()) {
           if (tabStrikesRef.current) {
               logStrikeRef.current("App Switch / Lost Focus");
               showToast("Clicking outside the exam is not allowed! Strike recorded.", "error");
           }
        }
      }, 300); 
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

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
        if (tabStrikesRef.current) {
            logStrikeRef.current("Exited Fullscreen"); 
            showToast("Fullscreen exited! A policy violation strike has been recorded.", "error");
        } else {
            showToast("Please return to Fullscreen to continue your exam.", "warning");
        }
      }
    };

    const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    fsEvents.forEach(evt => document.addEventListener(evt, handleFullscreenChange));

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
  }, []); 

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
          showToast("Failed to enter fullscreen. Please try again.", "error");
      }
  };

  return (
    <div 
      onContextMenuCapture={(e) => {
        if (!enforceSecurity) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
    >
      
      {/* FULLSCREEN LOCK OVERLAY */}
      {!loading && enforceSecurity && !isFullscreen && (
          <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, 
              background: 'var(--bg-main)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-main)', padding: '2rem', textAlign: 'center'
          }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#ef4444', marginBottom: '24px' }}>
                  fullscreen
              </span>
              <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Strict Exam Environment</h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '32px', lineHeight: 1.6 }}>
                  This exam requires fullscreen mode. {isTabStrikesEnabled && "Navigating away from this tab or exiting fullscreen will result in a strike."}
              </p>
              
              {proctoringEnabled && !aiLoaded && (
                 <p style={{ color: '#0ea5e9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined animate-spin">sync</span> Loading AI Proctoring Engine...
                 </p>
              )}

              <button 
                  onClick={handleEnterFullscreen}
                  disabled={proctoringEnabled && !aiLoaded}
                  style={{
                      background: (proctoringEnabled && !aiLoaded) ? '#475569' : 'var(--primary)', 
                      color: '#fff', border: 'none', padding: '12px 24px',
                      borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: (proctoringEnabled && !aiLoaded) ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s'
                  }}
              >
                  <span className="material-symbols-outlined">launch</span>
                  Enter Exam (Fullscreen)
              </button>
          </div>
      )}

      {/* WEBCAM PREVIEW */}
      {proctoringEnabled && (
         <div style={{
             position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
             width: '180px', height: '120px', background: '#000', borderRadius: '8px', 
             border: '2px solid #334155', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
             opacity: isFullscreen ? 1 : 0, 
             pointerEvents: isFullscreen ? 'auto' : 'none',
             transition: 'opacity 0.3s'
         }}>
             <video 
                ref={videoRef} 
                muted 
                playsInline
                width={640} 
                height={480} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
             />
             {!camActive && (
                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>
                     Starting Camera...
                 </div>
             )}
         </div>
      )}

      <div style={{ height: '100%', visibility: (!loading && enforceSecurity && !isFullscreen) ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </div>
  );
}