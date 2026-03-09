"use client";
import React, { useState, useEffect } from 'react';
import Dropdown from '@/components/ui/Dropdown';
import { showToast } from '@/components/ui/Toast';

export default function CodeWorkspace({ 
  difficulty, 
  setDifficulty,
  tag,            
  setTag,         
  testCases, 
  setTestCases,
  codeStubs,
  setCodeStubs,
  solutions,
  setSolutions,
  driverCode,         
  setDriverCode,      
  allowedLangs = ['Python 3', 'Java', 'C++', 'JavaScript'] 
}) {
  const [activeTab, setActiveTab] = useState('code'); 
  const [selectedLang, setSelectedLang] = useState(allowedLangs[0] || 'Python 3');
  const [showDriver, setShowDriver] = useState(false); 

  const [isExecuting, setIsExecuting] = useState(false);
  const [execResults, setExecResults] = useState(null);

  useEffect(() => {
    if (allowedLangs.length > 0 && !allowedLangs.includes(selectedLang)) {
      setSelectedLang(allowedLangs[0]);
    }
  }, [allowedLangs, selectedLang]);

  // Fallbacks
  const [internalDiff, setInternalDiff] = useState('Medium');
  const [internalTag, setInternalTag] = useState(''); 
  const [internalTCs, setInternalTCs] = useState([{ id: '1', input: '', expectedOutput: '', isHidden: false }]);
  const [internalStubs, setInternalStubs] = useState({});
  const [internalSols, setInternalSols] = useState({});
  const [internalDrivers, setInternalDrivers] = useState({}); 

  const activeDiff = difficulty !== undefined ? difficulty : internalDiff;
  const onDiffChange = setDifficulty || setInternalDiff;
  const activeTag = tag !== undefined ? tag : internalTag; 
  const onTagChange = setTag || setInternalTag;            
  const activeTCs = testCases || internalTCs;
  const onTCsChange = setTestCases || setInternalTCs;
  
  const activeStubs = codeStubs || internalStubs;
  const onStubsChange = setCodeStubs || setInternalStubs;
  const activeSols = solutions || internalSols;
  const onSolsChange = setSolutions || setInternalSols;
  const activeDrivers = driverCode || internalDrivers;
  const onDriversChange = setDriverCode || setInternalDrivers;

  const langOptions = allowedLangs.map(l => ({ label: l, value: l }));
  const diffOptions = [
    { label: 'Easy', value: 'Easy' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Hard', value: 'Hard' }
  ];

  const handleAddTC = () => onTCsChange([...activeTCs, { id: Date.now().toString(), input: '', expectedOutput: '', isHidden: false }]);
  const handleUpdateTC = (id, field, value) => onTCsChange(activeTCs.map(tc => tc.id === id ? { ...tc, [field]: value } : tc));
  const handleRemoveTC = (id) => onTCsChange(activeTCs.filter(tc => tc.id !== id));

  // 🚀 SMART RESOLVER: Fixes mismatches between "Python" and "Python 3" automatically
  const getLangValue = (mapObj, langKey) => {
    if (!mapObj || typeof mapObj !== 'object') return '';
    if (mapObj[langKey] !== undefined) return mapObj[langKey];
    
    const target = langKey.toLowerCase().replace(/\s+/g, '');
    for (const [k, v] of Object.entries(mapObj)) {
        const current = k.toLowerCase().replace(/\s+/g, '');
        if (
            current === target || 
            (target.includes('python') && current.includes('python')) ||
            (target.includes('c++') && current === 'cpp') ||
            (target === 'cpp' && current.includes('c++'))
        ) {
            return v;
        }
    }
    return '';
  };

  const handleRunTests = async () => {
    // 🚀 Uses the smart resolver to fetch the actual code to execute
    const currentSol = getLangValue(activeSols, selectedLang);
    const currentDriver = getLangValue(activeDrivers, selectedLang);

    if (!currentSol?.trim()) return showToast(`Please provide a Reference Solution for ${selectedLang}.`, "warning");
    if (!activeTCs || activeTCs.length === 0) return showToast("Please add at least one test case to run.", "warning");

    setIsExecuting(true);
    setExecResults(null);

    let normalizedLang = selectedLang.toLowerCase().replace(/\s+/g, '');
    if (normalizedLang === 'c++') normalizedLang = 'cpp';
    if (normalizedLang === 'c#') normalizedLang = 'csharp';

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/test-solution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          language: normalizedLang,
          solutionCode: currentSol,
          driverCode: currentDriver || "", 
          testCases: activeTCs
        })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to execute code.");
      
      setExecResults(data); 
      showToast("Execution completed!", "success");
    } catch (error) {
      console.error("Execution Error:", error);
      showToast(error.message, "error");
      setExecResults({ error: error.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const textAreaStyle = { width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '14px', resize: 'none', outline: 'none' };

  return (
    <div className="pb-panel" style={{ overflow: 'hidden', position: 'relative' }}>
      <div className="pb-tabs">
        <button className={`pb-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
          Code & Solution
        </button>
        <button className={`pb-tab ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
          Test Cases ({activeTCs.length})
        </button>
      </div>

      <div className="pb-panel-body" style={{ padding: 0 }}>
        
        {activeTab === 'code' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div className="code-header" style={{ display: 'flex', gap: '1rem', padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '150px' }}>
                <Dropdown value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} options={langOptions} />
              </div>
              <div style={{ width: '150px' }}>
                <Dropdown value={activeDiff} onChange={(e) => onDiffChange(e.target.value)} options={diffOptions} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
                <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '18px' }}>sell</span>
                <input 
                  type="text" 
                  placeholder="Tags (e.g. Arrays, Dynamic Programming)" 
                  value={activeTag} 
                  onChange={(e) => onTagChange(e.target.value)}
                  style={{ 
                    flex: 1, background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #334155', 
                    borderRadius: '6px', padding: '6px 12px', color: '#f8fafc', fontSize: '13px', outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setShowDriver(!showDriver)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                    background: showDriver ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.05)', 
                    color: showDriver ? '#38bdf8' : '#cbd5e1', 
                    border: `1px solid ${showDriver ? '#38bdf8' : '#334155'}`, 
                    borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', fontWeight: 600
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>integration_instructions</span>
                  {showDriver ? 'Hide Driver' : 'Edit Driver (Optional)'}
                </button>

                <button 
                  onClick={handleRunTests}
                  disabled={isExecuting}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                    background: isExecuting ? '#059669' : '#10b981', 
                    color: '#020617', 
                    border: 'none', 
                    borderRadius: '6px', cursor: isExecuting ? 'not-allowed' : 'pointer', fontSize: '13px', transition: 'all 0.2s', fontWeight: 700
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isExecuting ? 'sync' : 'play_arrow'}</span>
                  {isExecuting ? 'Running...' : 'Run Tests'}
                </button>
              </div>
            </div>

            <div className={`grid ${showDriver ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              
              {!showDriver ? (
                <>
                  <div style={{ borderRight: '1px solid #334155', background: '#0f172a' }}>
                    <div style={{ padding: '8px 16px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Initial Code Stub</span>
                    </div>
                    <div className="code-area" style={{ height: '350px', padding: '16px' }}>
                      <textarea 
                        spellCheck="false" 
                        value={getLangValue(activeStubs, selectedLang)}
                        onChange={(e) => onStubsChange({ ...activeStubs, [selectedLang]: e.target.value })}
                        style={textAreaStyle} 
                        placeholder={`// Write initial ${selectedLang} stub...\n// E.g. def twoSum(nums): pass`}
                      />
                    </div>
                  </div>

                  <div style={{ background: '#0f172a' }}>
                    <div style={{ padding: '8px 16px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>Reference Solution (Full Program OR Method)</span>
                    </div>
                    <div className="code-area" style={{ height: '350px', padding: '16px' }}>
                      <textarea 
                        spellCheck="false" 
                        value={getLangValue(activeSols, selectedLang)}
                        onChange={(e) => onSolsChange({ ...activeSols, [selectedLang]: e.target.value })}
                        style={textAreaStyle} 
                        placeholder={`// Write your ${selectedLang} solution here...\n// If you omit Driver Code, this must be a full program that reads from STDIN and prints to STDOUT.`}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ background: '#0f172a' }}>
                  <div style={{ padding: '8px 16px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>Hidden Driver Code</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Leave empty if Reference Solution is a full executable program</span>
                  </div>
                  <div className="code-area" style={{ height: '350px', padding: '16px' }}>
                    <textarea 
                      spellCheck="false" 
                      value={getLangValue(activeDrivers, selectedLang)}
                      onChange={(e) => onDriversChange({ ...activeDrivers, [selectedLang]: e.target.value })}
                      style={textAreaStyle} 
                      placeholder={`// (OPTIONAL) Write the hidden execution logic here...\n// Python Example:\n// if __name__ == '__main__':\n//    import sys, json\n//    lines = sys.stdin.read().splitlines()\n//    print(Solution().func(json.loads(lines[0])))\n\n// Java Example:\n// public class Main {\n//    public static void main(String[] args) {\n//        // logic...\n//    }\n// }`}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="tc-list" style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
            {activeTCs.map((tc, index) => (
              <div key={tc.id} className="tc-card" style={{ background: '#0f172a', border: '1px solid #334155', marginBottom: '16px' }}>
                <div className="tc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tc-title">Test Case #{index + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Hidden</span>
                      <label className="switch-sm">
                        <input type="checkbox" checked={tc.isHidden} onChange={(e) => handleUpdateTC(tc.id, 'isHidden', e.target.checked)} />
                        <span className="slider-sm"></span>
                      </label>
                    </div>
                    <button type="button" onClick={() => handleRemoveTC(tc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Test Case">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                </div>

                <div className="tc-grid">
                  <div className="tc-field">
                    <label>Standard Input</label>
                    <textarea rows="2" value={tc.input} onChange={(e) => handleUpdateTC(tc.id, 'input', e.target.value)} placeholder="e.g. 5\n1 2 3 4 5" />
                  </div>
                  <div className="tc-field">
                    <label>Expected Output</label>
                    <textarea rows="2" value={tc.expectedOutput} onChange={(e) => handleUpdateTC(tc.id, 'expectedOutput', e.target.value)} placeholder="e.g. 15" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add-tc" onClick={handleAddTC} style={{ width: '100%', marginTop: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Add Test Case
            </button>
          </div>
        )}

      </div>

      {execResults && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setExecResults(null)}>
          <div style={{ background: '#0f172a', width: '90%', maxWidth: '800px', maxHeight: '80vh', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#10b981' }}>terminal</span>
                Execution Results
              </h3>
              <button onClick={() => setExecResults(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {execResults.error ? (
                <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>Execution Error:</strong>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px' }}>{execResults.error}</pre>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {execResults.results?.map((res, i) => (
                    <div key={i} style={{ padding: '16px', border: `1px solid ${res.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
                      <div style={{ fontWeight: 'bold', color: res.passed ? '#10b981' : '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{res.passed ? 'check_circle' : 'cancel'}</span>
                        Test Case {i + 1}: {res.passed ? 'PASSED' : 'FAILED'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Expected Output</div>
                          <pre style={{ margin: 0, padding: '8px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>{activeTCs[i]?.expectedOutput || "N/A"}</pre>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Actual Output</div>
                          <pre style={{ margin: 0, padding: '8px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', fontSize: '13px', color: res.passed ? '#cbd5e1' : '#ef4444', whiteSpace: 'pre-wrap' }}>{res.actualOutput || res.error || "No Output"}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}