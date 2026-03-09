"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import DescriptionEditor from '@/components/editor/DescriptionEditor';
import CodeWorkspace from '@/components/editor/CodeWorkspace';
import { showToast } from '@/components/ui/Toast';
import '@/components/editor/editor.css';

export default function CreateProblemInNewContestPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const contestId = resolvedParams.id;

  const [problemTitle, setProblemTitle] = useState('');
  const [description, setDescription] = useState('');
  const [diff, setDiff] = useState('Medium');
  const [tag, setTag] = useState('Algorithms');
  
  const [testCases, setTestCases] = useState([{ id: '1', input: '', expectedOutput: '', isHidden: false }]);
  const [codeStubs, setCodeStubs] = useState({});
  const [solutions, setSolutions] = useState({});
  const [allowedLangs, setAllowedLangs] = useState(['Python', 'Java', 'C++']);

  const dataRef = useRef({ problemTitle, description, diff, tag, testCases, codeStubs, solutions });

  useEffect(() => {
    // 1. Recover Problem Draft if user accidentally refreshed
    const savedProb = sessionStorage.getItem('currentProblemDraft');
    if (savedProb) {
      const parsed = JSON.parse(savedProb);
      setProblemTitle(parsed.problemTitle || '');
      setDescription(parsed.description || '');
      setDiff(parsed.diff || 'Medium');
      if (parsed.testCases) setTestCases(parsed.testCases);
      if (parsed.codeStubs) setCodeStubs(parsed.codeStubs);
      if (parsed.solutions) setSolutions(parsed.solutions);
    }

    // 2. Inherit allowed languages from the contest
    const cachedContestData = sessionStorage.getItem(`edit_data_${contestId}`);
    if (cachedContestData) {
      const parsedContest = JSON.parse(cachedContestData);
      if (parsedContest.allowedLangs && parsedContest.allowedLangs.length > 0) {
        setAllowedLangs(parsedContest.allowedLangs);
      }
    }
  }, [contestId]);

  useEffect(() => {
    const stateObj = { problemTitle, description, diff, tag, testCases, codeStubs, solutions };
    sessionStorage.setItem('currentProblemDraft', JSON.stringify(stateObj));
    dataRef.current = stateObj;
  }, [problemTitle, description, diff, tag, testCases, codeStubs, solutions]);

  useEffect(() => {
    const executeSave = async () => {
      const { problemTitle: title, description: desc, diff: difficulty, tag: pTag, testCases: tcs, codeStubs: stubs, solutions: sols } = dataRef.current;

      if (!title.trim() || !desc.trim()) return showToast('Title and Description are required', 'error');

      window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: true }));

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title, description: desc, diff: difficulty, tag: pTag, 
            testCases: tcs,
            codeStubs: stubs,
            solutions: sols,
            contestId 
          })
        });

        if (!response.ok) throw new Error("Failed to create problem");

        showToast('Problem created successfully!', 'success');
        sessionStorage.removeItem('currentProblemDraft'); 
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

  return (
    <div className="problem-builder-wrapper">
      <div>
        <input 
          type="text" className="problem-title-input" placeholder="Enter Problem Title..."
          value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)}
        />
      </div>
      <div className="pb-grid">
        <DescriptionEditor value={description} onChange={setDescription} />
        <CodeWorkspace 
          difficulty={diff} setDifficulty={setDiff}
          testCases={testCases} setTestCases={setTestCases}
          codeStubs={codeStubs} setCodeStubs={setCodeStubs}
          solutions={solutions} setSolutions={setSolutions}
          allowedLangs={allowedLangs} 
        />
      </div>
    </div>
  );
}