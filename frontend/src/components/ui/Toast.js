"use client";
import React, { useState, useEffect, useCallback } from 'react';
import './toast.css';

export const showToast = (message, type = 'info') => {
  // Prevent firing if the message is empty or undefined
  if (!message || message.trim() === '') return;
  
  // Generate a strictly unique ID
  const id = Date.now() + Math.random().toString(36).substring(2, 9);
  
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { id, message, type } }));
  }, 0);
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleAdd = (e) => {
      const { id, message, type } = e.detail;
      
      // Secondary safety check
      if (!message) return;

      setToasts((prev) => [...prev, { id, message, type }]);
      
      // Auto-remove after 3.5 seconds
      const timer = setTimeout(() => removeToast(id), 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('show-toast', handleAdd);
    return () => window.removeEventListener('show-toast', handleAdd);
  }, [removeToast]);

  return (
    <div className="toast-wrapper">
      {toasts.map((t) => {
        // Tertiary safety check before rendering
        if (!t.message) return null;
        
        return (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <div className="toast-icon-wrap">
              <span className="material-symbols-outlined">
                {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
              </span>
            </div>
            <span className="toast-message">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="toast-btn-close">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}