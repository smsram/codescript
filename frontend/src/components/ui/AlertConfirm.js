"use client";
import React, { useState, useEffect, useCallback } from 'react';
import './alert.css';

// Global helper function to trigger the alert from ANYWHERE
export const confirmAlert = ({ 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Proceed", 
  cancelText = "Cancel", 
  onConfirm = () => {}, 
  onCancel = () => {},
  darkOverlay = true, // The boolean prop to control the dark background
  isDanger = false // Changes proceed button to red if true
}) => {
  // Push to the end of the event loop to avoid React render conflicts
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('show-alert', { 
      detail: { title, message, confirmText, cancelText, onConfirm, onCancel, darkOverlay, isDanger } 
    }));
  }, 0);
};

export default function AlertContainer() {
  const [alert, setAlert] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const closeAlert = useCallback(() => {
    setIsClosing(true);
    // Wait for the slide-up animation to finish before unmounting
    setTimeout(() => {
      setAlert(null);
      setIsClosing(false);
    }, 300);
  }, []);

  useEffect(() => {
    const handleShow = (e) => {
      setAlert(e.detail);
      setIsClosing(false);
    };

    window.addEventListener('show-alert', handleShow);
    return () => window.removeEventListener('show-alert', handleShow);
  }, []);

  if (!alert) return null;

  return (
    <div className="alert-portal">
      {/* Dark Overlay (Conditional) */}
      {alert.darkOverlay && (
        <div 
          className={`alert-overlay ${isClosing ? 'overlay-fade-out' : 'overlay-fade-in'}`}
          onClick={() => {
            if (alert.onCancel) alert.onCancel();
            closeAlert();
          }}
        ></div>
      )}

      {/* Alert Dialog at the Top */}
      <div className={`alert-dialog ${isClosing ? 'alert-slide-out' : 'alert-slide-in'}`}>
        <div className="alert-header">
          <span className="material-symbols-outlined alert-icon" style={{ color: alert.isDanger ? '#ef4444' : '#3b82f6' }}>
            {alert.isDanger ? 'warning' : 'info'}
          </span>
          <h3 className="alert-title">{alert.title}</h3>
        </div>
        
        <div className="alert-body">
          <p className="alert-message">{alert.message}</p>
        </div>

        <div className="alert-footer">
          {/* 🚀 THE FIX: Only render the cancel button if cancelText exists and is not null/empty */}
          {alert.cancelText && (
            <button 
              className="alert-btn alert-btn-cancel" 
              onClick={() => {
                if (alert.onCancel) alert.onCancel();
                closeAlert();
              }}
            >
              {alert.cancelText}
            </button>
          )}

          <button 
            className={`alert-btn ${alert.isDanger ? 'alert-btn-danger' : 'alert-btn-primary'}`} 
            onClick={() => {
              if (alert.onConfirm) alert.onConfirm();
              closeAlert();
            }}
          >
            {alert.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}