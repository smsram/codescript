"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { showToast } from '@/components/ui/Toast'; 
import { BasicDetails, SecuritySettings, EnvironmentRules } from '@/components/admin/contest-builder/ContestSections';

export default function NewContestPage() {
  const router = useRouter(); 
  const [contestData, setContestData] = useState({
    title: '', description: '', startTime: '', endTime: '', 
    isPrivate: false, joinCode: '', strikes: 3, strictMode: true, // 👈 Added joinCode
    allowedLangs: ['Python', 'Python 3', 'Java', 'C', 'C++', 'C#'] 
  });

  const dataRef = useRef(contestData);

  useEffect(() => {
    const savedData = sessionStorage.getItem('newContestDraftData');
    if (savedData) setContestData(JSON.parse(savedData));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('newContestDraftData', JSON.stringify(contestData));
    dataRef.current = contestData;
  }, [contestData]);

  useEffect(() => {
    const executeSave = async (e) => {
      const targetStatus = e.detail || "ACTIVE"; 
      const currentData = dataRef.current;

      if (!currentData.title.trim() || !currentData.startTime) {
        return showToast('Title and Start Time required', 'error');
      }

      if (currentData.isPrivate && !currentData.joinCode.trim()) {
        return showToast('A Join Code is required for private contests', 'error');
      }

      window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: true }));

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            ...currentData,
            status: targetStatus,
            problemIds: [] 
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showToast(targetStatus === 'ACTIVE' ? 'Contest Launched!' : 'Draft Saved!', 'success');
        
        sessionStorage.removeItem('newContestDraftData');
        router.push('/admin/contests');
        
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        window.dispatchEvent(new CustomEvent('set-topbar-loading', { detail: false }));
      }
    };

    window.addEventListener('trigger-save-contest', executeSave);
    return () => window.removeEventListener('trigger-save-contest', executeSave);
  }, [router]);

  // 🚀 Listen for Cancel trigger from Topbar
  useEffect(() => {
    const handleCancel = () => {
      // Clear the temporary draft from session storage
      sessionStorage.removeItem('newContestDraftData');
      // Redirect back to the directory
      router.push('/admin/contests');
    };

    window.addEventListener('trigger-cancel', handleCancel);
    return () => window.removeEventListener('trigger-cancel', handleCancel);
  }, [router]);

  return (
    <div className="builder-container">
      <div className="flex flex-col mb-8">
        <h2 className="text-2xl font-bold text-slate-50">Contest Builder</h2>
        <p className="text-slate-400 mt-1">Configure environment rules. Save to start adding problems.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicDetails data={contestData} onChange={setContestData} />
        <div className="flex flex-col gap-6">
          <SecuritySettings data={contestData} onChange={setContestData} />
          <EnvironmentRules data={contestData} onChange={setContestData} />
        </div>
      </div>
    </div>
  );
}