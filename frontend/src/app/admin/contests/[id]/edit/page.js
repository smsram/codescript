"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/Toast'; 
import { BasicDetails, SecuritySettings, EnvironmentRules, ProblemManager } from '@/components/admin/contest-builder/ContestSections';
import Skeleton from '@/components/ui/Skeleton';

export default function EditContestPage({ params }) {
  const router = useRouter(); 
  const resolvedParams = use(params);
  const contestId = resolvedParams.id;

  const [contestData, setContestData] = useState({
    title: '', description: '', startTime: '', endTime: '', 
    durationMinutes: '', proctoringEnabled: false, tabStrikes: true, 
    isPrivate: false, joinCode: '', strikes: 3, strictMode: true, 
    allowedLangs: [], status: 'DRAFT'
  });

  const [selectedProblems, setSelectedProblems] = useState([]);
  const [fetchingInitial, setFetchingInitial] = useState(true); 
  const [fetchingProblems, setFetchingProblems] = useState(false); 
  const [isDirty, setIsDirty] = useState(false); 

  const dataRef = useRef(contestData);
  const probsRef = useRef(selectedProblems);

  useEffect(() => {
    const loadData = async () => {
      const cachedData = sessionStorage.getItem(`edit_data_${contestId}`);
      const cachedProbs = sessionStorage.getItem(`edit_probs_${contestId}`);

      if (cachedData) {
        setContestData(JSON.parse(cachedData));
        setFetchingInitial(false); 
        setIsDirty(true);
      }

      if (cachedData && cachedProbs) {
        setSelectedProblems(JSON.parse(cachedProbs));
      } else {
        if (cachedData) setFetchingProblems(true); 
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${contestId}`, { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await response.json();
          if (!response.ok) throw new Error(json.error);
          
          const fetched = json.contest;
          if (!cachedData) {
            const formatForInput = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : '';
            setContestData({
              title: fetched.title || '', description: fetched.description || '',
              startTime: formatForInput(fetched.startTime), endTime: formatForInput(fetched.endTime),
              
              durationMinutes: fetched.durationMinutes || '',             
              proctoringEnabled: fetched.proctoringEnabled || false,      
              tabStrikes: fetched.tabStrikes !== undefined ? fetched.tabStrikes : true, 

              isPrivate: fetched.isPrivate, joinCode: fetched.joinCode || '', 
              strikes: fetched.strikes, strictMode: fetched.strictMode,
              allowedLangs: fetched.allowedLangs ? fetched.allowedLangs.split(',') : [],
              status: fetched.status || 'DRAFT'
            });
          }
          setSelectedProblems(fetched.problems || []);
        } catch (err) {
          showToast('Failed to load contest data', 'error');
        } finally {
          setFetchingInitial(false);
          setFetchingProblems(false);
        }
      }
    };
    loadData();
  }, [contestId]);

  useEffect(() => {
    if (!fetchingInitial && !fetchingProblems) {
      sessionStorage.setItem(`edit_data_${contestId}`, JSON.stringify(contestData));
      sessionStorage.setItem(`edit_probs_${contestId}`, JSON.stringify(selectedProblems));
      dataRef.current = contestData;
      probsRef.current = selectedProblems;
    }
  }, [contestData, selectedProblems, fetchingInitial, fetchingProblems, contestId]);

  // Sync to topbar safely
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('set-topbar-dirty', { detail: isDirty }));
    return () => window.dispatchEvent(new CustomEvent('set-topbar-dirty', { detail: false }));
  }, [isDirty]);

  const saveProblemOrder = async (newOrder) => {
    try {
      const token = localStorage.getItem('token');
      const orderedIds = newOrder.map(p => p.id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${contestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          ...dataRef.current, 
          orderedProblemIds: orderedIds 
        })
      });

      if (!response.ok) throw new Error("Auto-save order failed");
    } catch (err) {
      showToast("Order sync failed. Please save manually.", "warning");
    }
  };

  const handleReorderProblems = (newOrder) => { 
    setSelectedProblems(newOrder); 
    setIsDirty(true); 
    saveProblemOrder(newOrder); 
  };

  const handleLaunch = async (e) => {
    const targetStatus = e.detail || "ACTIVE";
    const currentData = dataRef.current;
    const currentProblemIds = probsRef.current.map(p => p.id);
    
    if (!currentData.title.trim() || !currentData.startTime) {
      return showToast('Title and Start Time required to save', 'error');
    }

    window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${contestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          ...currentData, 
          status: targetStatus,
          orderedProblemIds: currentProblemIds 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      showToast(targetStatus === 'ACTIVE' ? 'Contest Launched!' : 'Draft Saved!', 'success');
      sessionStorage.removeItem(`edit_data_${contestId}`);
      sessionStorage.removeItem(`edit_probs_${contestId}`);
      setIsDirty(false);
      router.push('/admin/contests');
    } catch (err) {
      showToast(err.message || 'Failed to update contest', 'error');
    } finally {
      window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: false }));
    }
  };

  useEffect(() => {
    window.addEventListener('trigger-save-contest', handleLaunch);
    return () => window.removeEventListener('trigger-save-contest', handleLaunch);
  }, [contestId, router]);

  useEffect(() => {
    const handleCancel = () => {
      sessionStorage.removeItem(`edit_data_${contestId}`);
      sessionStorage.removeItem(`edit_probs_${contestId}`);
      setIsDirty(false);
      router.push('/admin/contests');
    };
    window.addEventListener('trigger-cancel', handleCancel);
    return () => window.removeEventListener('trigger-cancel', handleCancel);
  }, [contestId, router]);

  const handleDataChange = (newData) => { 
      setContestData(newData); 
      setIsDirty(true); 
  };

  const handlePermanentDelete = async (problem) => {
    if (!confirm(`Permanently delete "${problem.title}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/${problem.id}`, { 
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Delete failed");
      setSelectedProblems(prev => prev.filter(p => p.id !== problem.id));
      showToast('Problem deleted', 'success');
    } catch (err) {
      showToast('Failed to delete problem', 'error');
    }
  };

  if (fetchingInitial) return (
    <div className="builder-container">
      <div className="flex justify-between items-center mb-8"><Skeleton width="300px" height="36px" borderRadius="8px" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton height="380px" borderRadius="12px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Skeleton height="150px" borderRadius="12px" /><Skeleton height="200px" borderRadius="12px" />
        </div>
        <div className="lg:col-span-2"><Skeleton height="250px" borderRadius="12px" /></div>
      </div>
    </div>
  );

  return (
    <div className="builder-container" style={{ paddingBottom: '4rem' }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-50">{contestData.title || "Untitled Contest"}</h2>
        {/* 🚀 Removed the old duplicate inline label here to keep the UI clean! */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicDetails data={contestData} onChange={handleDataChange} />
        <div className="flex flex-col gap-6">
          <SecuritySettings data={contestData} onChange={handleDataChange} />
          <EnvironmentRules data={contestData} onChange={handleDataChange} />
        </div>
        
        {fetchingProblems ? (
          <div className="lg:col-span-2 builder-card">
            <Skeleton height="80px" className="mb-2" borderRadius="8px" />
            <Skeleton height="80px" className="mb-2" borderRadius="8px" />
          </div>
        ) : (
          <ProblemManager 
            selected={selectedProblems}
            onReorder={handleReorderProblems} 
            onPermanentDelete={handlePermanentDelete}
            problemCreateUrl={`/admin/contests/${contestId}/edit/problem/new`}
            getProblemEditUrl={(probId) => `/admin/contests/${contestId}/edit/problem/${probId}`}
          />
        )}
      </div>
    </div>
  );
}