"use client";
import React, { useState, useEffect } from 'react';
import { showToast } from '@/components/ui/Toast';
import Dropdown from '@/components/ui/Dropdown';

export default function PackageManager() {
  const [packages, setPackages] = useState({ python: [], cpp: [], java: [], csharp: [] });
  const [selectedLang, setSelectedLang] = useState('python');
  const [pkgName, setPkgName] = useState('');
  const [loading, setLoading] = useState(false);

  const langOptions = [
    { label: 'Python (pip)', value: 'python' },
    { label: 'C/C++ (apt-get)', value: 'cpp' },
    { label: 'Java (apt-get)', value: 'java' },
    { label: 'C# (apt-get)', value: 'csharp' }
  ];

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/packages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || { python: [], cpp: [], java: [], csharp: [] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleInstall = async () => {
    if (!pkgName.trim()) return showToast("Enter a package name", "warning");
    
    setLoading(true);
    showToast(`Installing ${pkgName}... This may take a few minutes.`, "info");

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/packages/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language: selectedLang, packageName: pkgName.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, "success");
      setPkgName('');
      fetchPackages(); // Refresh the list
    } catch (err) {
      showToast(`Install failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: 'var(--bg-surface, #1e293b)', border: '1px solid var(--border-light, #334155)', 
      borderRadius: '12px', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
    }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#10b981' }}>deployed_code</span>
          Global Package Manager
        </h3>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
          Install external libraries persistently into the Docker engine. Packages installed here are instantly available to all students during exams without downloading again.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ flex: '1 1 150px', maxWidth: '250px' }}>
          <Dropdown value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} options={langOptions} />
        </div>
        
        <input 
          type="text" 
          placeholder="e.g., scikit-learn, numpy, libcurl4-openssl-dev" 
          value={pkgName} 
          onChange={(e) => setPkgName(e.target.value)}
          disabled={loading}
          style={{ 
            flex: '2 1 250px', padding: '12px', borderRadius: '8px', border: '1px solid #334155', 
            background: '#0f172a', color: '#f8fafc', outline: 'none', fontFamily: 'monospace'
          }}
        />
        
        <button 
          onClick={handleInstall} 
          disabled={loading} 
          style={{ 
            background: '#10b981', color: '#020617', border: 'none', padding: '10px 24px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">download</span>}
          {loading ? 'Installing...' : 'Install'}
        </button>
      </div>

      {/* Installed Packages View */}
      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#e2e8f0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Already Installed</h4>
        
        {(!packages[selectedLang] || packages[selectedLang].length === 0) ? (
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No custom packages installed for {selectedLang} yet.
            </div>
        ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {packages[selectedLang].map(pkg => (
                <span key={pkg} style={{ 
                  background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', 
                  border: '1px solid rgba(56, 189, 248, 0.2)', padding: '4px 10px', 
                  borderRadius: '999px', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                  {pkg}
                </span>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}

// Backend commands to support package installs with one time runs
// Step 1: Install pip3 (This time it will actually run)
// docker run --name pip_fix_v2 --user root --network host codescript-polyglot sh -c "apt-get update && apt-get install -y python3-pip"

// Step 2: Commit the successful installation
// docker commit pip_fix_v2 codescript-polyglot

// Step 3: Clean up the container
// docker rm -f pip_fix_v2

// Step 4: Verify it worked
// docker run --rm codescript-polyglot pip3 --version