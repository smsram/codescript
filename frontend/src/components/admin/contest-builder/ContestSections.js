import React, { useState, useRef } from 'react'; 
import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import './builder.css';

export function BasicDetails({ data, onChange }) {
  return (
    <div className="builder-card">
      <div className="card-icon-header">
        <div className="card-icon-header-left">
          <div className="icon-wrap">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>edit_document</span>
          </div>
          <h3>Basic Details</h3>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="builder-label">Contest Title</label>
          <input 
            type="text" 
            className="builder-input" 
            placeholder="e.g. Autumn Coding Sprint 2024" 
            value={data.title} 
            onChange={e => onChange({...data, title: e.target.value})} 
          />
        </div>
        <div>
          <label className="builder-label">Instructions / Description</label>
          <textarea 
            className="builder-textarea" 
            placeholder="Enter contest rules and guidelines..." 
            value={data.description || ''} 
            onChange={e => onChange({...data, description: e.target.value})} 
          />
        </div>
        <div className="date-grid">
          <div>
            <label className="builder-label">Start Time</label>
            <input 
              type="datetime-local" 
              className="builder-input" 
              value={data.startTime} 
              onChange={e => onChange({...data, startTime: e.target.value})} 
            />
          </div>
          <div>
            <label className="builder-label">End Time</label>
            <input 
              type="datetime-local" 
              className="builder-input" 
              value={data.endTime} 
              onChange={e => onChange({...data, endTime: e.target.value})} 
            />
          </div>
        </div>
        
        {/* Duration Field */}
        <div>
          <label className="builder-label">Exam Duration (Minutes) - Optional</label>
          <input 
            type="number" 
            className="builder-input" 
            placeholder="e.g. 30 (Leave blank to allow full window)" 
            value={data.durationMinutes || ''} 
            onChange={e => onChange({...data, durationMinutes: e.target.value === '' ? null : Number(e.target.value)})} 
          />
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Limits writing time once started. Overridden by End Time.</p>
        </div>
      </div>
    </div>
  );
}

export function SecuritySettings({ data, onChange }) {
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleTogglePrivate = (e) => {
    const isPrivate = e.target.checked;
    onChange({
      ...data,
      isPrivate,
      joinCode: isPrivate && !data.joinCode ? generateRandomCode() : data.joinCode
    });
  };

  return (
    <div className="builder-card">
      <div className="card-icon-header">
        <div className="card-icon-header-left">
          <div className="icon-wrap">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>security</span>
          </div>
          <h3>Access & Security</h3>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="flex-between-responsive">
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f1f5f9' }}>Private Contest</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Require access code to join</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {data.isPrivate && (
              <input 
                type="text" 
                value={data.joinCode || ''} 
                onChange={e => onChange({...data, joinCode: e.target.value.toUpperCase()})}
                maxLength={8}
                placeholder="e.g. CS101"
                style={{ 
                  fontFamily: 'monospace', color: 'var(--primary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', 
                  padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)', 
                  fontSize: '0.875rem', width: '110px', textAlign: 'center', outline: 'none' 
                }}
              />
            )}
            <label className="switch">
              <input type="checkbox" checked={data.isPrivate} onChange={handleTogglePrivate} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* 🚀 AI Webcam Proctoring Toggle with Strike Counter */}
        <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #334155' }}>
          <div className="flex-between-responsive">
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f1f5f9' }}>AI Webcam Proctoring</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '85%' }}>
                Exam requires a functional camera to start. Detects multiple faces and mobile phones.
              </p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={data.proctoringEnabled || false} 
                onChange={e => {
                  const isEnabled = e.target.checked;
                  // If turned on, default to 3 strikes. If turned off, reset to 0.
                  onChange({...data, proctoringEnabled: isEnabled, webcamStrikes: isEnabled ? 3 : 0});
                }} 
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* 🚀 Conditional WebCam Strike Controls */}
          {data.proctoringEnabled && (
            <div style={{ marginTop: '1rem', padding: '12px', background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f1f5f9' }}>Max Camera Violations</p>
                <p style={{ fontSize: '0.7rem', color: '#ec4899', marginTop: '2px' }}>Note: The 1st detection is always a free warning.</p>
              </div>
              <div className="stepper" style={{ borderColor: 'rgba(236, 72, 153, 0.4)' }}>
                <button type="button" className="btn-step" onClick={() => onChange({...data, webcamStrikes: Math.max(1, (data.webcamStrikes || 3) - 1)})}>-</button>
                <div className="stepper-val" style={{ color: '#ec4899' }}>{data.webcamStrikes || 3}</div>
                <button type="button" className="btn-step" onClick={() => onChange({...data, webcamStrikes: (data.webcamStrikes || 3) + 1})}>+</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export function EnvironmentRules({ data, onChange }) {
  const allLangs = ['Python', 'Python 3', 'Java', 'C', 'C++', 'C#'];

  const handleLangToggle = (lang) => {
    if (data.allowedLangs.includes(lang)) {
      onChange({ ...data, allowedLangs: data.allowedLangs.filter(l => l !== lang) });
    } else {
      onChange({ ...data, allowedLangs: [...data.allowedLangs, lang] });
    }
  };

  const toggleAll = () => {
    if (data.allowedLangs.length === allLangs.length) {
      onChange({ ...data, allowedLangs: [] });
    } else {
      onChange({ ...data, allowedLangs: [...allLangs] });
    }
  };

  return (
    <div className="builder-card">
      <div className="card-icon-header">
        <div className="card-icon-header-left">
          <div className="icon-wrap">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>settings_applications</span>
          </div>
          <h3>Environment Rules</h3>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Tab Strike toggle logic */}
        <div className="flex-between-responsive">
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f1f5f9' }}>Max Tab-Switch Strikes</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Enables Fullscreen lock. Auto-submits after limit reached.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {data.tabStrikes !== false && (
              <div className="stepper">
                <button type="button" className="btn-step" onClick={() => onChange({...data, strikes: Math.max(1, data.strikes - 1)})}>-</button>
                <div className="stepper-val">{data.strikes}</div>
                <button type="button" className="btn-step" onClick={() => onChange({...data, strikes: data.strikes + 1})}>+</button>
              </div>
            )}
            <label className="switch">
              <input type="checkbox" checked={data.tabStrikes !== false} onChange={e => {
                const isEnabled = e.target.checked;
                onChange({...data, tabStrikes: isEnabled, strikes: isEnabled ? 3 : 0});
              }} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="flex-between-responsive" style={{ paddingTop: '1.25rem', borderTop: '1px solid #334155' }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f1f5f9' }}>Strict Mode</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Disable right-click, copy/paste, and developer tools</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={data.strictMode} onChange={e => onChange({...data, strictMode: e.target.checked})} />
            <span className="slider"></span>
          </label>
        </div>
        
        {/* LANGUAGE SELECTOR */}
        <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #334155' }}>
          <div className="flex-between-responsive" style={{ marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f1f5f9' }}>Allowed Languages</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Select languages for this contest</p>
            </div>
            <button 
              type="button" 
              onClick={toggleAll} 
              style={{ fontSize: '0.75rem', color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              {data.allowedLangs.length === allLangs.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
             {allLangs.map(lang => {
               const isSelected = data.allowedLangs.includes(lang);
               return (
                 <button 
                   key={lang} 
                   type="button"
                   onClick={() => handleLangToggle(lang)}
                   style={{ 
                     padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500, transition: 'all 0.2s ease',
                     border: `1px solid ${isSelected ? '#0ea5e9' : '#334155'}`,
                     backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                     color: isSelected ? '#0ea5e9' : '#94a3b8',
                     cursor: 'pointer'
                   }}
                 >
                   {lang}
                 </button>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProblemManager({ 
  selected, 
  onReorder,
  onPermanentDelete,
  problemCreateUrl, 
  getProblemEditUrl 
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    let _selected = [...selected];
    const draggedItemContent = _selected.splice(dragItem.current, 1)[0];
    _selected.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    onReorder(_selected);
  };

  return (
    <div className="builder-card lg:col-span-2">
      <div className="card-icon-header" style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-icon-header-left">
          <div className="icon-wrap">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>format_list_numbered</span>
          </div>
          <h3>Contest Problems</h3>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={problemCreateUrl} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span className="hidden sm:inline">Create New Problem</span>
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {selected.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b', border: '1px dashed #334155', borderRadius: '8px', background: '#0f172a' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>post_add</span>
            <p style={{ fontSize: '1rem', fontWeight: 500, color: '#e2e8f0' }}>No problems created yet.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Problems you create will be securely locked to this contest.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selected.map((prob, index) => (
              <div 
                key={prob.id} 
                className="problem-item border-slate-600"
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                style={{ cursor: 'grab', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px' }}
              >
                <div className="problem-info-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="material-symbols-outlined text-slate-400" style={{ cursor: 'grab', userSelect: 'none' }}>drag_indicator</span>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>{prob.title}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <span className={`difficulty-tag diff-${prob.diff?.toLowerCase() || 'medium'}`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px' }}>{prob.diff}</span>
                      {prob.tag && <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: '12px', border: '1px solid #334155' }}>{prob.tag}</span>}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link href={getProblemEditUrl(prob.id)} title="Edit Problem" style={{ display: 'flex', padding: '8px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.color = '#0ea5e9'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                  </Link>

                  <button type="button" onClick={() => onPermanentDelete(prob)} title="Delete Problem" style={{ display: 'flex', padding: '8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete_forever</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}