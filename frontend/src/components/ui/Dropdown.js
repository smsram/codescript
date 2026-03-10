"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function Dropdown({ value, onChange, options, prefix = "", minWidth = "160px" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { value: val } }); 
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', flex: 1, minWidth }}>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)', 
          border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border-light)'}`,
          color: 'var(--text-main)',
          fontSize: '0.875rem', fontWeight: '500',
          borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', width: '100%',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(7, 178, 213, 0.15)' : 'none',
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{prefix}</span>
          {selectedOption.label}
        </span>
        
        <span className="material-symbols-outlined" style={{ 
          fontSize: '18px', color: 'var(--text-muted)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease'
        }}>
          expand_more
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
            backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)',
            borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 100, overflow: 'hidden', padding: '4px',
            animation: 'fadeInDown 0.15s ease-out forwards'
          }}
        >
          {options.map((opt, index) => (
            <div
              key={index}
              onClick={() => handleSelect(opt.value)}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              style={{
                padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem',
                color: opt.value === value ? 'var(--primary)' : 'var(--text-main)',
                backgroundColor: opt.value === value ? 'rgba(7, 178, 213, 0.08)' : 'transparent',
                transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              {opt.label}
              {opt.value === value && (
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}