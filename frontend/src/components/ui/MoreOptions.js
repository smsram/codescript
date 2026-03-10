"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function MoreOptions({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [openUpward, setOpenUpward] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const toggleMenu = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 160; 
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenUp = spaceBelow < menuHeight;
      
      setCoords({
        top: shouldOpenUp ? rect.top + window.scrollY : rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
        width: rect.width
      });
      setOpenUpward(shouldOpenUp);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) window.addEventListener("scroll", () => setIsOpen(false), { passive: true });
    return () => window.removeEventListener("scroll", () => setIsOpen(false));
  }, [isOpen]);

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        style={{
          background: isOpen ? 'var(--bg-surface-hover)' : 'transparent',
          border: 'none',
          color: isOpen ? 'var(--text-main)' : 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: 'absolute',
            top: openUpward ? 'auto' : `${coords.top + 8}px`,
            bottom: openUpward ? `${window.innerHeight - coords.top + 8}px` : 'auto',
            left: `${coords.left - 180}px`,
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 99999,
            minWidth: '180px',
            padding: '4px 0',
            display: 'flex',
            flexDirection: 'column',
            animation: openUpward ? 'fadeInUp 0.15s ease-out' : 'fadeInDown 0.15s ease-out'
          }}
        >
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { 
                onClick: (e) => {
                  setIsOpen(false);
                  if (child.props.onClick) child.props.onClick(e);
                }
              });
            }
            return child;
          })}
        </div>,
        document.body 
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

export function MoreOptionsItem({ children, onClick, danger = false, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
        padding: '10px 16px', background: 'transparent', border: 'none',
        fontSize: '14px', 
        color: danger ? '#ef4444' : 'var(--text-main)',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>}
      {children}
    </button>
  );
}