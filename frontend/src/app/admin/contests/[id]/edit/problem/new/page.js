"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import DescriptionEditor from '@/components/editor/DescriptionEditor';
import CodeWorkspace from '@/components/editor/CodeWorkspace';
import AIProblemGenerator from '@/components/editor/AIProblemGenerator'; 
import PackageManager from '@/components/editor/PackageManager'; // 🚀 Imported Package Manager
import { showToast } from '@/components/ui/Toast';
import '@/components/editor/editor.css';

export default function CreateProblemInNewContestPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const contestId = resolvedParams.id;

  const [problemTitle, setProblemTitle] = useState('');
  const [description, setDescription] = useState('');
  const [diff, setDiff] = useState('Medium');
  const [tag, setTag] = useState('');
  
  const [testCases, setTestCases] = useState([{ id: '1', input: '', expectedOutput: '', isHidden: false }]);
  const [codeStubs, setCodeStubs] = useState({});
  const [solutions, setSolutions] = useState({});
  const [driverCode, setDriverCode] = useState({}); 
  const [allowedLangs, setAllowedLangs] = useState(['Python', 'Java', 'C++']);

  // 🚀 State to control the Package Manager Modal
  const [showPackageManager, setShowPackageManager] = useState(false);

  const dataRef = useRef({ problemTitle, description, diff, tag, testCases, codeStubs, solutions, driverCode });

  const applyAIData = (data) => {
    if (data.title) setProblemTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.tag) setTag(data.tag);
    if (data.diff) setDiff(data.diff);
    if (data.testCases && data.testCases.length > 0) setTestCases(data.testCases);
    if (data.codeStubs) setCodeStubs(data.codeStubs);
    if (data.solutions) setSolutions(data.solutions);
    if (data.driverCode) setDriverCode(data.driverCode);
  };

  useEffect(() => {
    const savedProb = sessionStorage.getItem('currentProblemDraft');
    if (savedProb) {
      const parsed = JSON.parse(savedProb);
      setProblemTitle(parsed.problemTitle || '');
      setDescription(parsed.description || '');
      setDiff(parsed.diff || 'Medium');
      setTag(parsed.tag || '');
      if (parsed.testCases) setTestCases(parsed.testCases);
      if (parsed.codeStubs) setCodeStubs(parsed.codeStubs);
      if (parsed.solutions) setSolutions(parsed.solutions);
      if (parsed.driverCode) setDriverCode(parsed.driverCode);
    }

    const cachedContestData = sessionStorage.getItem(`edit_data_${contestId}`);
    if (cachedContestData) {
      const parsedContest = JSON.parse(cachedContestData);
      if (parsedContest.allowedLangs && parsedContest.allowedLangs.length > 0) {
        setAllowedLangs(parsedContest.allowedLangs);
      }
    }
  }, [contestId]);

  useEffect(() => {
    const stateObj = { problemTitle, description, diff, tag, testCases, codeStubs, solutions, driverCode };
    sessionStorage.setItem('currentProblemDraft', JSON.stringify(stateObj));
    dataRef.current = stateObj;
  }, [problemTitle, description, diff, tag, testCases, codeStubs, solutions, driverCode]);

  useEffect(() => {
    const executeSave = async () => {
      const { problemTitle: title, description: desc, diff: difficulty, tag: pTag, testCases: tcs, codeStubs: stubs, solutions: sols, driverCode: drivers } = dataRef.current;

      if (!title.trim() || !desc.trim()) return showToast('Title and Description are required', 'error');

      window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: true }));

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title, description: desc, diff: difficulty, tag: pTag, 
            testCases: tcs, codeStubs: stubs, solutions: sols, driverCode: drivers, contestId 
          })
        });

        if (!response.ok) throw new Error("Failed to create problem");

        showToast('Problem created successfully!', 'success');
        
        sessionStorage.removeItem('currentProblemDraft'); 
        sessionStorage.removeItem(`edit_probs_${contestId}`);
        
        router.push(`/admin/contests/${contestId}/edit`);
        
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: false }));
      }
    };

    window.addEventListener('trigger-save-problem', executeSave);
    return () => window.removeEventListener('trigger-save-problem', executeSave);
  }, [contestId, router]);

  useEffect(() => {
    const handleCancel = () => {
      sessionStorage.removeItem('currentProblemDraft');
      router.push(`/admin/contests/${contestId}/edit`);
    };
    window.addEventListener('trigger-cancel', handleCancel);
    return () => window.removeEventListener('trigger-cancel', handleCancel);
  }, [contestId, router]);

  return (
    <div className="problem-builder-wrapper">
      
      {/* 🚀 Top Controls: AI Generator & Package Manager Button */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <AIProblemGenerator allowedLangs={allowedLangs} onApply={applyAIData} />
        </div>
        <button 
          onClick={() => setShowPackageManager(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
            background: 'var(--bg-surface)', color: '#38bdf8', 
            border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', height: '40px', transition: 'background 0.2s' 
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>deployed_code</span>
          Manage Packages
        </button>
      </div>

      {/* 🚀 Package Manager Modal */}
      {showPackageManager && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPackageManager(false)}>
          <div style={{ width: '90%', maxWidth: '800px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowPackageManager(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>
            <PackageManager />
          </div>
        </div>
      )}

      <div>
        <input type="text" className="problem-title-input" placeholder="Enter Problem Title..." value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} />
      </div>
      <div className="pb-grid">
        <DescriptionEditor value={description} onChange={setDescription} />
        <CodeWorkspace 
          difficulty={diff} setDifficulty={setDiff} tag={tag} setTag={setTag} 
          testCases={testCases} setTestCases={setTestCases} codeStubs={codeStubs} setCodeStubs={setCodeStubs}
          solutions={solutions} setSolutions={setSolutions} driverCode={driverCode} setDriverCode={setDriverCode} 
          allowedLangs={allowedLangs} 
        />
      </div>
    </div>
  );
}