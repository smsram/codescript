"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import DescriptionEditor from '@/components/editor/DescriptionEditor';
import CodeWorkspace from '@/components/editor/CodeWorkspace';
import { showToast } from '@/components/ui/Toast';
import '@/components/editor/editor.css';

export default function EditProblemInNewContestPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const contestId = resolvedParams.id;
  const probId = resolvedParams.probId;

  const [problemTitle, setProblemTitle] = useState('');
  const [description, setDescription] = useState('');
  const [diff, setDiff] = useState('Medium');
  const [tag, setTag] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [codeStubs, setCodeStubs] = useState({});
  const [solutions, setSolutions] = useState({});
  const [allowedLangs, setAllowedLangs] = useState(['Python', 'Java', 'C++']);
  const [fetching, setFetching] = useState(true);

  const dataRef = useRef({ problemTitle, description, diff, tag, testCases, codeStubs, solutions });

  useEffect(() => {
    dataRef.current = { problemTitle, description, diff, tag, testCases, codeStubs, solutions };
  }, [problemTitle, description, diff, tag, testCases, codeStubs, solutions]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/${probId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        const p = data.problem;
        setProblemTitle(p.title || '');
        setDescription(p.description || '');
        setDiff(p.diff || 'Medium');
        setTag(p.tag || '');
        
        // Load Code Content from DB
        setCodeStubs(p.codeStubs || {});
        setSolutions(p.solution || {});
        
        if (p.testCases && p.testCases.length > 0) {
            setTestCases(p.testCases);
        } else {
            setTestCases([{ id: '1', input: '', expectedOutput: '', isHidden: false }]);
        }

        const cachedContestData = sessionStorage.getItem(`edit_data_${contestId}`);
        if (cachedContestData) {
          const parsedContest = JSON.parse(cachedContestData);
          if (parsedContest.allowedLangs && parsedContest.allowedLangs.length > 0) {
            setAllowedLangs(parsedContest.allowedLangs);
          }
        }
        
      } catch (error) {
        showToast('Failed to load problem data', 'error');
      } finally {
        setFetching(false);
      }
    };
    fetchProblem();
  }, [probId, contestId]);

  useEffect(() => {
    const executeUpdate = async () => {
      const { problemTitle: title, description: desc, diff: difficulty, tag: pTag, testCases: tcs, codeStubs: stubs, solutions: sols } = dataRef.current;

      if (!title.trim() || !desc.trim()) return showToast('Title and Description are required', 'error');

      window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: true }));

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/${probId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title, description: desc, diff: difficulty, tag: pTag, 
            testCases: tcs, 
            codeStubs: stubs, 
            solutions: sols 
          })
        });

        if (!response.ok) throw new Error("Update failed");

        showToast('Problem updated successfully!', 'success');
        router.push(`/admin/contests/${contestId}/edit`);
        
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      } finally {
        window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: false }));
      }
    };

    window.addEventListener('trigger-save-problem', executeUpdate);
    return () => window.removeEventListener('trigger-save-problem', executeUpdate);
  }, [probId, contestId, router]);

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

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