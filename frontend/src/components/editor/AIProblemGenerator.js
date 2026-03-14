import React, { useState } from 'react';
import { showToast } from '@/components/ui/Toast';
import Dropdown from '@/components/ui/Dropdown'; 

export default function AIProblemGenerator({ allowedLangs, onApply }) {
  const [isOpen, setIsOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [difficulty, setDifficulty] = useState('Medium'); 
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('auto'); 
  const [manualJson, setManualJson] = useState('');

  const difficultyOptions = [
    { label: 'Easy', value: 'Easy' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Hard', value: 'Hard' }
  ];

  // 🚀 UPDATED PROMPT: Synced Rule #4 to prevent duplicate method generation in driver code
  const generateInternalPrompt = () => {
    return `You are an expert competitive programming problem setter. Create a professional coding problem based on this request: "${promptText}".
Difficulty Level: ${difficulty}.
Allowed Languages: ${(allowedLangs || ['Python 3', 'Java', 'C++']).join(', ')}.

Return STRICTLY a valid JSON object matching this exact schema:
{
  "title": "Problem Title",
  "description": "Full markdown description.",
  "tag": "Primary topic tag",
  "codeStubs": { "Python 3": "...", "Java": "..." },
  "solutions": { "Python 3": "...", "Java": "..." },
  "driverCode": { "Python 3": "...", "Java": "..." },
  "testCases": [
    { "input": "...", "expectedOutput": "...", "isHidden": false },
    { "input": "...", "expectedOutput": "...", "isHidden": true }
  ]
}

CRITICAL RULES:
1. DESCRIPTION STRUCTURE: The description MUST follow the professional structure of top-tier competitive programming platforms (Problem Statement, Constraints, Input/Output formats, and at least two well-explained examples).
   - DO NOT mention brand names like "LeetCode" or "HackerRank".
   - DO NOT include the Problem Title as a heading inside the description. Start directly with the problem statement text.
2. CODE STUBS (STUDENT TEMPLATE): The "codeStubs" MUST be a clean starter template (e.g., a class with an empty method signature) that the student must COMPLETE.
   - DO NOT include boilerplate or example logic that the student needs to delete.
   - Include a helpful comment like "// Write your code here" inside the empty method body.
3. LANGUAGE KEYS: You MUST use exactly "Python 3" as the dictionary key for Python. NEVER use "Python" or "python3".
4. DRIVER CODE LOGIC: The "driverCode" MUST NEVER redefine the method that the student is supposed to write. It MUST NOT contain the solution logic. Its ONLY job is to read input from standard input (stdin), call the student's method (which exists in the codeStub), and print the result. For example, if the student is writing \`class Solution { public int solve() {...} }\`, the driver code should just be \`class Main { public static void main(...) { ... new Solution().solve(); ... } }\` WITHOUT recreating the \`solve\` method.
5. ESCAPING: Use single quotes for strings inside code. Double escape LaTeX backslashes (\\\\le).
6. FORMATTING: Use \\n for EVERY newline and \\t for EVERY tab.
7. EXAMPLES & BLOCKS: Put Input/Output examples and multi-line text inside triple backticks (e.g., \`\`\`text\\n...\\n\`\`\`). NEVER wrap individual lines of a block in single backticks.
8. TEST CASES: You MUST generate at least 3 test cases. AT LEAST ONE of these test cases MUST be a hidden test case ("isHidden": true) to test for edge cases or performance invisibly.

DESCRIPTION FORMATTING GUIDE (Use these exact options):
* Headings: # (H1), ## (H2), ### (H3), #### (H4)
* Text Styles: **bold**, _italic_
* Lists: - for bullet points
* Inline Code: Use single backticks (\`var\`) ONLY for inline variables/words.
* Code Blocks: Use triple backticks (\`\`\`text\\n...\\n\`\`\`) for multi-line inputs, outputs, and code.
* Math: Use LaTeX enclosed in $ (e.g., $O(N^2)$).
* Alignment: <div align="center">...</div> (can also use "left" or "right")
* Font Family/Size: <span style="font-family: 'Courier New', monospace; font-size: 16px;">...</span> (use sparingly)
* Links: [Link Text](https://...)`;
  };

  const processAndApplyData = (parsed) => {
    if (parsed.testCases) {
      parsed.testCases = parsed.testCases.map((tc, i) => ({
        ...tc,
        id: tc.id || `ai-tc-${Date.now()}-${i}`,
        isHidden: tc.isHidden || false
      }));
    }

    onApply(parsed);
    setIsOpen(false);
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) return showToast("Enter a prompt.", "warning");
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/generate-problem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ promptText, difficulty, allowedLangs })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      processAndApplyData(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!promptText.trim()) return showToast("Enter a prompt first to generate instructions.", "warning");
    navigator.clipboard.writeText(generateInternalPrompt());
    showToast("Prompt copied! Paste it into ChatGPT/Claude.", "info");
    setMode('manual');
  };

  const handleApplyManualJson = () => {
    try {
      let cleanJson = manualJson.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      processAndApplyData(parsed);
      showToast("Applied successfully!", "success");
    } catch (e) {
      showToast("Invalid JSON formatting.", "error");
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', 
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
          marginBottom: '16px', alignSelf: 'flex-start', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
        Generate with AI
      </button>
    );
  }

  return (
    <div style={{ 
      background: 'var(--bg-surface, #1e293b)', 
      border: '1px solid var(--border-light, #334155)', 
      borderRadius: '12px', 
      padding: '1.5rem', 
      marginBottom: '1.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>auto_awesome</span>
          AI Problem Builder
        </h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="e.g., 'A hard DP problem about robbing houses in a circle'" 
          value={promptText} 
          onChange={(e) => setPromptText(e.target.value)}
          style={{ 
            flex: '1 1 250px', 
            padding: '12px', borderRadius: '8px', border: '1px solid #334155', 
            background: '#0f172a', color: '#f8fafc', outline: 'none',
            fontFamily: 'inherit', fontSize: '0.9rem'
          }}
        />
        
        <div style={{ flex: '1 1 140px', maxWidth: '200px' }}>
          <Dropdown 
            minWidth="100%"
            value={difficulty} 
            options={difficultyOptions} 
            onChange={(e) => setDifficulty(e.target.value)} 
          />
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        borderBottom: mode === 'manual' ? '1px solid #334155' : 'none', 
        paddingBottom: mode === 'manual' ? '1.5rem' : '0', 
        marginBottom: mode === 'manual' ? '1.5rem' : '0' 
      }}>
        <button 
          onClick={handleGenerate} 
          disabled={loading} 
          style={{ 
            background: '#38bdf8', color: '#020617', border: 'none', 
            padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', 
            cursor: loading ? 'not-allowed' : 'pointer', flex: '1 1 200px',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
            <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>sync</span> Generating...</>
          ) : (
            <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span> Ask Gemini</>
          )}
        </button>
        
        <button 
          onClick={handleCopyPrompt} 
          style={{ 
            background: 'transparent', color: '#cbd5e1', border: '1px solid #475569', 
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', flex: '1 1 200px',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
          Copy Prompt for External AI
        </button>
      </div>

      {mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease-in-out' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>Paste External JSON Output:</label>
          <textarea 
            rows="6" 
            value={manualJson} 
            onChange={(e) => setManualJson(e.target.value)}
            style={{ 
              padding: '12px', borderRadius: '8px', border: '1px solid #334155', 
              background: '#020617', color: '#22d3ee', fontFamily: 'monospace',
              fontSize: '0.85rem', resize: 'vertical', outline: 'none'
            }}
            placeholder="{ ... }"
          />
          <button 
            onClick={handleApplyManualJson} 
            style={{ 
              background: '#10b981', color: '#020617', border: 'none', 
              padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', 
              cursor: 'pointer', alignSelf: 'flex-end', display: 'flex', gap: '8px', alignItems: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
            Apply JSON
          </button>
        </div>
      )}
    </div>
  );
}