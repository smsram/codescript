"use client";

import React, { useState, useEffect } from 'react';
import { showToast } from '@/components/ui/Toast';
import Skeleton from '@/components/ui/Skeleton';
import './settings.css';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [system, setSystem] = useState({
    ramPercent: 0, freeRamMB: 0, diskPercent: 0, diskUsed: '0', diskTotal: '0'
  });

  const [engine, setEngine] = useState({
    maxMem: 256, maxCpu: 0.5, globalTle: 5.0
  });

  const fetchStatusAndSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystem(data.system);
        
        // Only set engine settings on initial load so we don't overwrite user typing
        if (loading) setEngine(data.settings);
        setLoading(false);
      }
    } catch (error) {
      console.error("Fetch failed");
    }
  };

  useEffect(() => {
    fetchStatusAndSettings();
    // Poll hardware stats every 3 seconds
    const interval = setInterval(fetchStatusAndSettings, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
            maxMem: Number(engine.maxMem),
            maxCpu: Number(engine.maxCpu),
            globalTle: Number(engine.globalTle)
        })
      });

      if (res.ok) showToast("Engine Limits saved successfully.", "success");
      else showToast("Failed to save settings.", "error");
    } catch (e) {
      showToast("Network error.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page-wrapper">
      <div className="settings-content-area" style={{ width: '100%' }}>
        <div className="settings-max-width">
          
          <h1 style={{ color: '#f8fafc', fontSize: '24px', marginBottom: '8px' }}>Execution Engine Status</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            Monitor server hardware and configure Docker limits to prevent Out-Of-Memory crashes.
          </p>

          {/* SECTION 1: LIVE HARDWARE STATUS */}
          <section className="settings-section">
            <div className="settings-section-header">
              <div className="header-text">
                <h3>System Hardware</h3>
                <p>Live metrics from the Debian VM.</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#08b2d4', fontSize: '28px' }}>speed</span>
            </div>

            <div className="settings-section-body">
              <div className="input-grid-settings">
                
                {/* RAM METRIC */}
                <div className="hardware-card">
                  <div className="hw-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ color: '#f43f5e' }}>memory</span> RAM Usage
                    </span>
                    <span style={{ color: system.ramPercent > 85 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                      {loading ? '...' : `${system.ramPercent}%`}
                    </span>
                  </div>
                  <div className="progress-bg" style={{ height: '6px', margin: '12px 0', backgroundColor: '#334155' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${system.ramPercent}%`, 
                        background: system.ramPercent > 85 ? '#ef4444' : 'linear-gradient(to right, #10b981, #08b2d4)',
                        transition: 'width 0.5s ease-in-out, background 0.5s ease-in-out' 
                      }}
                    ></div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{loading ? '...' : `${system.freeRamMB} MB Free`}</p>
                </div>

                {/* STORAGE METRIC */}
                <div className="hardware-card">
                  <div className="hw-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>hard_drive</span> Disk Storage
                    </span>
                    <span style={{ color: system.diskPercent > 85 ? '#ef4444' : '#08b2d4', fontWeight: 700 }}>
                      {loading ? '...' : `${system.diskPercent}%`}
                    </span>
                  </div>
                  <div className="progress-bg" style={{ height: '6px', margin: '12px 0', backgroundColor: '#334155' }}>
                    <div 
                      className="progress-fill" 
                      style={{ width: `${system.diskPercent}%`, backgroundColor: system.diskPercent > 85 ? '#ef4444' : '#3b82f6' }}
                    ></div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{loading ? '...' : `${system.diskUsed} used of ${system.diskTotal}`}</p>
                </div>

              </div>
            </div>
          </section>

          {/* SECTION 2: DOCKER LIMITS */}
          <section className="settings-section">
            <div className="settings-section-header">
              <div className="header-text">
                <h3>Docker Resource Limits</h3>
                <p>These limits are applied per code execution. Requests will be queued automatically if RAM is insufficient.</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '28px' }}>settings_applications</span>
            </div>

            <div className="settings-section-body">
              {loading ? (
                 <Skeleton width="100%" height="150px" borderRadius="12px" />
              ) : (
                <>
                  <div className="input-grid-settings">
                    <div className="field-group-settings">
                      <label>Max Memory per Container</label>
                      <select className="settings-select" value={engine.maxMem} onChange={(e) => setEngine({...engine, maxMem: e.target.value})}>
                        <option value="128">128 MB (Highly Restrictive)</option>
                        <option value="256">256 MB (Recommended)</option>
                        <option value="512">512 MB (Requires High Server RAM)</option>
                      </select>
                      <p className="description">Limits RAM allocated to student code.</p>
                    </div>

                    <div className="field-group-settings">
                      <label>Max CPU Cores</label>
                      <div className="input-unit-wrapper">
                        <input type="number" step="0.1" min="0.1" value={engine.maxCpu} onChange={(e) => setEngine({...engine, maxCpu: e.target.value})} />
                        <span className="unit-tag">Cores</span>
                      </div>
                      <p className="description">CPU share allocated per container.</p>
                    </div>
                  </div>

                  <div className="field-group-settings" style={{ maxWidth: '300px', marginTop: '8px' }}>
                    <label>Global TLE Threshold</label>
                    <div className="input-unit-wrapper">
                      <input type="number" step="0.5" min="1" value={engine.globalTle} onChange={(e) => setEngine({...engine, globalTle: e.target.value})} />
                      <span className="unit-tag">Sec</span>
                    </div>
                    <p className="description">Hard cutoff to prevent infinite loops.</p>
                  </div>
                </>
              )}
            </div>

            <div className="settings-section-footer">
              <button className="btn-settings-save" onClick={handleSave} disabled={isSaving || loading}>
                <span className="material-symbols-outlined">save</span>
                {isSaving ? "Saving Limits..." : "Apply & Save Limits"}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}