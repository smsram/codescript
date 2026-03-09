"use client";

import React, { useState, useRef, useEffect } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import Dropdown from '@/components/ui/Dropdown';
import { showToast } from '@/components/ui/Toast';
import { confirmAlert } from '@/components/ui/AlertConfirm';

export default function RightPane({ 
  loading, currentProb, currentCode, setCode, lang, setLang, langOptions, 
  handleRunCode, handleStopCode, isRunning, output, syncStatus, triggerSave, execProgressMsg,
  isStrict 
}) {
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [isDraggingY, setIsDraggingY] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const preRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);

  // 🚀 CUSTOM UNDO/REDO HISTORY STACK
  const historyRef = useRef({ stack: [], index: -1 });

  // Initialize history on first load
  useEffect(() => {
    if (currentCode && historyRef.current.stack.length === 0) {
      historyRef.current.stack = [currentCode];
      historyRef.current.index = 0;
    }
  }, [currentCode]);

  const saveToHistory = (newCode) => {
    const h = historyRef.current;
    // If we altered the past and type again, wipe the "future" (redo) stack
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(newCode);
    if (h.stack.length > 50) h.stack.shift(); // Keep last 50 edits to save memory
    h.index = h.stack.length - 1;
  };

  const updateAndSaveCode = (newCode, cursorStart, cursorEnd) => {
    setCode(newCode);
    saveToHistory(newCode);
    if (textareaRef.current && cursorStart !== undefined) {
      setTimeout(() => {
        textareaRef.current.selectionStart = cursorStart;
        textareaRef.current.selectionEnd = cursorEnd || cursorStart;
      }, 0);
    }
  };

  const handleDragYStart = (e) => {
    e.preventDefault(); 
    setIsDraggingY(true);
    const handleDragY = (me) => {
      const h = window.innerHeight - me.clientY;
      if (h > 36 && h < window.innerHeight * 0.8) setConsoleHeight(h);
      else if (h <= 36) setConsoleHeight(36);
    };
    const handleDragYEnd = () => {
      setIsDraggingY(false);
      document.removeEventListener('mousemove', handleDragY); 
      document.removeEventListener('mouseup', handleDragYEnd);
    };
    document.addEventListener('mousemove', handleDragY); 
    document.addEventListener('mouseup', handleDragYEnd);
  };

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const spaces = "    "; // 4 spaces for tabs

    // 🚀 EXTREME COPY/PASTE BLOCKER via KEYSTROKES
    if (isStrict && (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'C', 'V', 'X'].includes(e.key)) {
        e.preventDefault();
        showToast("Copying/Pasting is strictly disabled in Strict Mode.", "error");
        return;
    }

    // 1. 🚀 CTRL + ENTER (Run Code)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      setConsoleHeight(300);
      setActiveTab(0);
      handleRunCode();
      return;
    }

    // 2. 🚀 CTRL + Z (Undo)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      const h = historyRef.current;
      if (h.index > 0) {
        h.index -= 1;
        setCode(h.stack[h.index]);
      }
      return;
    }

    // 3. 🚀 CTRL + Y or CTRL + SHIFT + Z (Redo)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      const h = historyRef.current;
      if (h.index < h.stack.length - 1) {
        h.index += 1;
        setCode(h.stack[h.index]);
      }
      return;
    }

    // Helper for line manipulations
    const getLineBounds = () => {
      const startLineIdx = val.lastIndexOf('\n', start - 1) + 1;
      let endLineIdx = val.indexOf('\n', end);
      if (endLineIdx === -1) endLineIdx = val.length;
      return { startLineIdx, endLineIdx };
    };

    // 4. 🚀 ALT + UP / DOWN (Move Lines)
    if (e.altKey && !e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const { startLineIdx, endLineIdx } = getLineBounds();
      const selectedLines = val.substring(startLineIdx, endLineIdx);

      if (e.key === 'ArrowUp' && startLineIdx > 0) {
        const prevLineStart = val.lastIndexOf('\n', startLineIdx - 2) + 1;
        const prevLine = val.substring(prevLineStart, startLineIdx - 1);
        const newCode = val.substring(0, prevLineStart) + selectedLines + '\n' + prevLine + val.substring(endLineIdx);
        updateAndSaveCode(newCode, prevLineStart, prevLineStart + selectedLines.length);
      } 
      else if (e.key === 'ArrowDown' && endLineIdx < val.length) {
        let nextLineEnd = val.indexOf('\n', endLineIdx + 1);
        if (nextLineEnd === -1) nextLineEnd = val.length;
        const nextLine = val.substring(endLineIdx + 1, nextLineEnd);
        const newCode = val.substring(0, startLineIdx) + nextLine + '\n' + selectedLines + val.substring(nextLineEnd);
        const newStart = startLineIdx + nextLine.length + 1;
        updateAndSaveCode(newCode, newStart, newStart + selectedLines.length);
      }
      return;
    }

    // 5. 🚀 ALT + SHIFT + UP / DOWN (Copy Lines)
    if (e.altKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const { startLineIdx, endLineIdx } = getLineBounds();
      const selectedLines = val.substring(startLineIdx, endLineIdx);
      const newCode = val.substring(0, endLineIdx) + '\n' + selectedLines + val.substring(endLineIdx);
      
      if (e.key === 'ArrowUp') {
        updateAndSaveCode(newCode, startLineIdx, endLineIdx); // Keep focus on original
      } else {
        const newStart = endLineIdx + 1;
        updateAndSaveCode(newCode, newStart, newStart + selectedLines.length); // Focus on copy
      }
      return;
    }

    // 6. 🚀 SMART TAB (Insert 4 spaces)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const newCode = val.substring(0, start) + spaces + val.substring(end);
      updateAndSaveCode(newCode, start + spaces.length);
      return;
    } 
    
    // 7. 🚀 SMART ENTER (Auto-indentation)
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLine = val.substring(0, start).split('\n').pop();
      const match = currentLine.match(/^\s*/);
      const currentIndent = match ? match[0] : '';
      
      let extraIndent = '';
      if (currentLine.trim().endsWith(':') || currentLine.trim().endsWith('{')) {
          extraIndent = spaces;
      }
      
      const newCode = val.substring(0, start) + '\n' + currentIndent + extraIndent + val.substring(end);
      updateAndSaveCode(newCode, start + 1 + currentIndent.length + extraIndent.length);
      return;
    }

    // 8. 🚀 SMART BACKSPACE (Delete 4 spaces at once)
    if (e.key === 'Backspace' && start === end) {
      if (start >= spaces.length && val.substring(start - spaces.length, start) === spaces) {
        e.preventDefault();
        const newCode = val.substring(0, start - spaces.length) + val.substring(end);
        updateAndSaveCode(newCode, start - spaces.length);
        return;
      }
    }

    // 9. Auto-Close Brackets & Quotes
    const closingPairs = { '{': '}', '[': ']', '(': ')', '"': '"', "'": "'" };
    if (closingPairs[e.key]) {
      e.preventDefault();
      const newCode = val.substring(0, start) + e.key + closingPairs[e.key] + val.substring(end);
      updateAndSaveCode(newCode, start + 1);
      return;
    }

    // Default typings (Need to manually save to history for basic typing)
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
        // Only save to history if they paused typing (debouncing history could be better, but this works)
        setTimeout(() => {
           if (textareaRef.current) saveToHistory(textareaRef.current.value);
        }, 10);
    }
  };

  const preventCopyPaste = (e) => {
      if (isStrict) {
          e.preventDefault();
          showToast("Copying/Pasting is strictly disabled.", "error");
      }
  };

  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const highlightSyntax = (text) => {
    if (!text) return "";
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const masterRegex = /(#.*|\/\/.*)|(['"])(?:(?!\2)[^\\]|\\.)*\2|\b(def|class|pass|return|if|else|elif|import|from|try|except|for|while|in|public|private|protected|static|void|int|string|bool|namespace|using|include|char|float|double|System|out|print|println|Console|WriteLine)\b|\b(True|False|None|List|Dict|String|Integer|Boolean)\b/g;
    return html.replace(masterRegex, (match, comment, string, keyword, type) => {
        if (comment) return `<span style="color: #5c6370;">${match}</span>`;
        if (string) return `<span style="color: #98c379;">${match}</span>`;
        if (keyword) return `<span style="color: #c678dd;">${match}</span>`;
        if (type) return `<span style="color: #e5c07b;">${match}</span>`;
        return match;
    });
  };

  const handleResetCode = () => {
    if (!currentProb) return;

    confirmAlert({
      title: "Reset to Default Code?",
      message: "This will permanently erase your current code and reset the editor to the initial starting code. Do you wish to proceed?",
      confirmText: "Yes, Reset",
      cancelText: "Cancel",
      isDanger: true,
      darkOverlay: true,
      onConfirm: () => {
        let stubs = currentProb.codeStubs;
        if (typeof stubs === 'string') {
            try { stubs = JSON.parse(stubs); } catch(e) { stubs = {}; }
        }
        if (!stubs) stubs = {};

        let matchedStub = stubs[lang] || "";
        if (!matchedStub) {
            const target = lang.toLowerCase().replace(/\s+/g, '');
            for (const [k, v] of Object.entries(stubs)) {
                const normK = k.toLowerCase().replace(/\s+/g, '');
                if (normK === target || normK.includes(target) || target.includes(normK)) {
                    matchedStub = v; break;
                }
            }
        }

        updateAndSaveCode(matchedStub, 0); // Reset pushes to history too
        showToast("Code reset to default.", "success");
      }
    });
  };

  const renderConsoleBody = () => {
    if (isRunning) {
      return (
        <div style={{ color: '#3b82f6', padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
          {execProgressMsg || "Executing code..."}
        </div>
      );
    }
    
    if (!output) return <div style={{ color: '#94a3b8', padding: '16px' }}>Run your code to see test case results here.</div>;

    if (!output.results) {
      return (
        <div style={{ padding: '16px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', color: '#ef4444', whiteSpace: 'pre-wrap' }}>
            {output.output || output.error || "Unknown compilation error."}
          </pre>
        </div>
      );
    }

    const { results, status } = output;
    const activeResult = results[activeTab] || results[0];

    const publicCases = results.filter(r => !r.isHidden);
    const hiddenCases = results.filter(r => r.isHidden);
    const passedPublic = publicCases.filter(r => r.passed).length;
    const passedHidden = hiddenCases.filter(r => r.passed).length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '12px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: status === 'Accepted' ? '#10b981' : status === 'Stopped' ? '#f59e0b' : '#ef4444' }}>{status}</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '8px' }}>
             {publicCases.length > 0 && <span>Passed {passedPublic}/{publicCases.length} Public</span>}
             {publicCases.length > 0 && hiddenCases.length > 0 && <span>|</span>}
             {hiddenCases.length > 0 && <span>Passed {passedHidden}/{hiddenCases.length} Hidden</span>}
          </span>
        </div>

        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #1e293b', padding: '0 8px' }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              background: 'transparent', padding: '10px 16px', cursor: 'pointer', border: 'none', borderBottom: activeTab === i ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === i ? '#f8fafc' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap'
            }}>
              {r.isHidden && <span className="material-symbols-outlined" style={{ fontSize: '14px', opacity: 0.7 }}>lock</span>}
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.passed ? '#10b981' : (r.status === 'Runtime Error' || r.status === 'Time Limit Exceeded') ? '#ef4444' : '#f59e0b' }}></span> 
              Case {r.index}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', background: '#020617' }}>
          {activeResult && activeResult.type === 'raw' ? (
            <pre style={{ margin: 0, color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{activeResult.output}</pre>
          ) : activeResult ? (
            <>
              {activeResult.isHidden ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#64748b', background: '#0f172a', borderRadius: '8px', border: '1px dashed #1e293b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>lock</span>
                  <h3 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '1.1rem' }}>Hidden Test Case</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', textAlign: 'center', maxWidth: '300px' }}>
                    Input and expected output are hidden.
                  </p>
                </div>
              ) : activeResult.status === 'Runtime Error' || activeResult.status === 'Time Limit Exceeded' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>{activeResult.status} message</div>
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontFamily: 'monospace', color: '#ef4444', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                      {activeResult.actual}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>Input</div>
                    <div style={{ padding: '10px', background: '#1e293b', borderRadius: '6px', fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{activeResult.input}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>Expected Output</div>
                    <div style={{ padding: '10px', background: '#1e293b', borderRadius: '6px', fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{activeResult.expected}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>Your Output</div>
                    <div style={{ padding: '10px', background: activeResult.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${activeResult.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, borderRadius: '6px', fontFamily: 'monospace', color: activeResult.passed ? '#10b981' : '#ef4444', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                      {activeResult.actual}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  };

  // 🚀 MODERN FONT STACK (Replaced Courier New)
  const editorFontStyles = { 
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', 
    fontSize: '14.5px', 
    lineHeight: '1.6', 
    letterSpacing: '0.3px',
    tabSize: 4 
  };

  return (
    <div className={`editor-wrapper ${isDraggingY ? 'is-dragging' : ''}`}>
      <div className="editor-toolbar">
        {loading ? (
          <>
            <Skeleton width="130px" height="36px" borderRadius="6px" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Skeleton width="40px" height="36px" borderRadius="6px" />
              <Skeleton width="80px" height="36px" borderRadius="6px" />
            </div>
          </>
        ) : (
          <>
            <div style={{ width: '130px' }}>
              <Dropdown value={lang} onChange={(e) => setLang(e.target.value)} options={langOptions.length > 0 ? langOptions : [{label: 'Python', value: 'python3'}]} />
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              
              <button className="btn-ghost" onClick={() => triggerSave(true)} title={`Backup Code to Cloud (${syncStatus})`} style={{ color: syncStatus.includes('saved') ? '#10b981' : '#3b82f6', borderColor: syncStatus.includes('saved') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)' }}>
                <span className={`material-symbols-outlined ${syncStatus.includes('Saving') ? 'animate-bounce' : ''}`} style={{ fontSize: '18px' }}>
                  {syncStatus.includes('saved') ? 'cloud_done' : syncStatus.includes('Saving') ? 'cloud_upload' : 'cloud'}
                </span>
              </button>

              <button className="btn-ghost" onClick={handleResetCode} title="Reset Code to Default">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restart_alt</span>
              </button>

              {isRunning ? (
                <button 
                  className="btn-ghost" 
                  onClick={handleStopCode} 
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>stop_circle</span> Stop
                </button>
              ) : (
                <button 
                  className="btn-ghost" 
                  onClick={() => { setConsoleHeight(300); setActiveTab(0); handleRunCode(); }} 
                  style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.5)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span> Run
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="code-area" style={{ position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '16px', width: '100%' }}>
            {[70, 45, 85, 30, 60].map((w, i) => <Skeleton key={i} width={`${w}%`} height="18px" className="mb-2" />)}
          </div>
        ) : (
          <>
            <div ref={lineNumbersRef} className="line-numbers" style={{ padding: '16px 8px', textAlign: 'right', color: '#475569', userSelect: 'none', borderRight: '1px solid #1e293b', overflow: 'hidden', ...editorFontStyles }}>
              {currentCode.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
              <pre ref={preRef} style={{ position: 'absolute', inset: 0, margin: 0, padding: '16px', color: '#abb2bf', whiteSpace: 'pre', overflow: 'hidden', pointerEvents: 'none', ...editorFontStyles }} dangerouslySetInnerHTML={{ __html: highlightSyntax(currentCode) }} />
              
              <textarea 
                ref={textareaRef}
                value={currentCode} 
                onChange={(e) => setCode(e.target.value)} 
                onKeyDown={handleKeyDown} 
                onScroll={handleScroll} 
                onCopy={preventCopyPaste}
                onPaste={preventCopyPaste}
                onCut={preventCopyPaste}
                spellCheck="false" 
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: '16px', margin: 0, border: 'none', resize: 'none', color: 'transparent', background: 'transparent', caretColor: '#56b6c2', outline: 'none', whiteSpace: 'pre', overflow: 'auto', ...editorFontStyles }} 
              />
            </div>
          </>
        )}
      </div>

      <div className="resizer-y" onMouseDown={handleDragYStart}></div>

      <div className="console-pane" style={{ height: `${consoleHeight}px`, display: 'flex', flexDirection: 'column' }}>
        <div className="console-header" onClick={() => setConsoleHeight(prev => prev <= 36 ? 300 : 36)}>
          <span className="console-title"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>terminal</span> Console</span>
          <span className="material-symbols-outlined">{consoleHeight > 36 ? 'expand_more' : 'expand_less'}</span>
        </div>
        {consoleHeight > 36 && <div style={{ flex: 1, overflow: 'hidden' }}>{renderConsoleBody()}</div>}
      </div>
    </div>
  );
}