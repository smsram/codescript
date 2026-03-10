"use client";

import React from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  // Prevents rendering the wrong icon before the client loads
  if (!mounted) return <div style={{ width: '36px', height: '36px' }} />;

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const getIcon = () => {
    if (theme === 'light') return 'light_mode';
    if (theme === 'dark') return 'dark_mode';
    return 'brightness_auto'; // System Icon
  };

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-light, #334155)',
        color: 'var(--text-main, #f8fafc)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '50%',
        transition: 'all 0.2s ease',
        width: '36px',
        height: '36px'
      }}
      title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover, rgba(255,255,255,0.05))'}
      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        {getIcon()}
      </span>
    </button>
  );
}