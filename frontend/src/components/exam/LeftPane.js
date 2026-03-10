"use client";

import React, { useState, useRef } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function LeftPane({ loading, leftWidth, questions, activeIdx, setActiveIdx, statusMap, updateStatus }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toggleY, setToggleY] = useState(150);
  const toggleDragRef = useRef({ startY: 0, startTop: 0, isDragging: false });

  const handleToggleMouseDown = (e) => {
    e.preventDefault();
    toggleDragRef.current = { startY: e.clientY, startTop: toggleY, isDragging: false };
    const handleMouseMove = (me) => {
      const deltaY = me.clientY - toggleDragRef.current.startY;
      if (Math.abs(deltaY) > 3) {
        toggleDragRef.current.isDragging = true;
        let newY = Math.max(0, Math.min(window.innerHeight - 60, toggleDragRef.current.startTop + deltaY));
        setToggleY(newY);
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setTimeout(() => { toggleDragRef.current.isDragging = false; }, 0);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const currentProb = questions[activeIdx];

  return (
    <div className="problem-pane" style={{ width: `${leftWidth}%` }}>
      
      {/* FLOATING DRAWER */}
      <div className={`question-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">Exam Questions</div>
        <div className="drawer-content">
          {!loading && questions.map((q, idx) => (
            <div 
              key={q.id} 
              onClick={() => { setActiveIdx(idx); updateStatus(q.id, 'visited'); setIsDrawerOpen(false); }}
              className={`q-nav-item status-${statusMap[q.id]} ${activeIdx === idx ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {statusMap[q.id] === 'submitted' ? 'check_circle' : 'article'}
              </span>
              <span>{idx + 1}. {q.title}</span>
            </div>
          ))}
        </div>
        <button 
          className="drawer-toggle-btn" 
          style={{ top: `${toggleY}px`, display: loading ? 'none' : 'flex' }}
          onMouseDown={handleToggleMouseDown}
          onClick={() => !toggleDragRef.current.isDragging && setIsDrawerOpen(!isDrawerOpen)}
        >
          <span className="material-symbols-outlined">{isDrawerOpen ? 'chevron_left' : 'format_list_bulleted'}</span>
        </button>
      </div>

      {/* PROBLEM CONTENT */}
      <div className="problem-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="60%" height="32px" />
              <Skeleton width="60px" height="24px" borderRadius="12px" />
            </div>
            <Skeleton width="100%" height="16px" />
            <Skeleton width="100%" height="16px" />
            <Skeleton width="80%" height="16px" />
            <Skeleton width="100%" height="150px" borderRadius="8px" style={{ marginTop: '1rem' }} />
          </div>
        ) : currentProb ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{activeIdx + 1}. {currentProb.title}</h2>
              <span className={`diff-badge diff-${currentProb.diff?.toLowerCase()}`}>{currentProb.diff}</span>
            </div>
            
            <div className="exam-problem-prose" style={{ width: '100%', overflowX: 'hidden' }}>
              <MarkdownRenderer content={currentProb.description} />
            </div>
            
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No problem selected.</p>
        )}
      </div>
      
      {/* FOOTER NAV */}
      <div className="problem-footer">
        <button className="btn-nav" disabled={loading || activeIdx === 0} onClick={() => { setActiveIdx(prev => prev - 1); updateStatus(questions[activeIdx - 1].id, 'visited'); }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span> Prev
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {loading ? <Skeleton width="80px" height="12px" /> : `Question ${activeIdx + 1} of ${questions.length}`}
        </span>
        <button className="btn-nav" disabled={loading || activeIdx === questions.length - 1} onClick={() => { setActiveIdx(prev => prev + 1); updateStatus(questions[activeIdx + 1].id, 'visited'); }}>
          Next <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
        </button>
      </div>
    </div>
  );
}