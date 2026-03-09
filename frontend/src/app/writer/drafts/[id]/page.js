"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreOptions, MoreOptionsItem } from '@/components/ui/MoreOptions';
import './draft-detail.css';

export default function DraftDetailPage({ params }) {
  // In Next.js App Router, dynamic routes pass 'params' automatically
  // For demonstration, we unwrap the param id.
  const draftId = params?.id || 'draft-101';
  
  const [tabStrikes, setTabStrikes] = useState(3);

  // MOCK DATA: Available in the Global Problem Bank
  const [availableBank, setAvailableBank] = useState([
    { id: 'p1', title: 'Two Sum Optimization', diff: 'Easy', tag: 'Arrays' },
    { id: 'p2', title: 'Graph Valid Tree', diff: 'Medium', tag: 'Graph' },
    { id: 'p3', title: 'Kth Largest Element', diff: 'Medium', tag: 'Heap' },
  ]);

  // MOCK DATA: Problems currently appended to THIS draft
  const [draftProblems, setDraftProblems] = useState([
    { id: 'd1', title: 'Binary Tree Max Path', diff: 'Hard', tag: 'Tree' },
    { id: 'd2', title: 'Merge Intervals', diff: 'Medium', tag: 'Arrays' },
    { id: 'd3', title: 'Valid Parentheses', diff: 'Easy', tag: 'Stack' },
  ]);

  // Handlers for Appending/Removing
  const handleAddToDraft = (problem) => {
    setAvailableBank(availableBank.filter(p => p.id !== problem.id));
    setDraftProblems([...draftProblems, problem]);
  };

  const handleRemoveFromDraft = (problem) => {
    setDraftProblems(draftProblems.filter(p => p.id !== problem.id));
    setAvailableBank([...availableBank, problem]);
  };

  return (
    <div className="draft-workspace">
      
      {/* HEADER */}
      <div className="workspace-header">
        <div className="workspace-title">
          <h2>Valid Sudoku Solver Workspace</h2>
          <p>Draft ID: {draftId} • Last auto-saved 2 minutes ago</p>
        </div>
        <div className="workspace-actions">
          <button className="btn-outline">Discard Changes</button>
          <button className="btn-cyan">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
            Save Draft
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTEST SETTINGS */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <div className="draft-card">
            <div className="card-icon-header">
              <div className="card-icon-header-left">
                <div className="icon-wrap">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>edit_document</span>
                </div>
                <h3>Contest Info</h3>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="draft-label">Contest Title</label>
                <input type="text" className="draft-input" defaultValue="Valid Sudoku Solver Challenge" />
              </div>
              <div>
                <label className="draft-label">Candidate Instructions</label>
                <textarea className="draft-textarea" defaultValue="Solve the standard 9x9 Sudoku validation problem ensuring optimal time complexity."></textarea>
              </div>
            </div>
          </div>

          <div className="draft-card">
            <div className="card-icon-header">
              <div className="card-icon-header-left">
                <div className="icon-wrap">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>settings_applications</span>
                </div>
                <h3>Rules</h3>
              </div>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-200">Tab-Switch Strikes</p>
                  <p className="text-xs text-slate-500">Auto-submit threshold</p>
                </div>
                <div className="stepper">
                  <button className="btn-step" onClick={() => setTabStrikes(Math.max(0, tabStrikes - 1))}>-</button>
                  <div className="stepper-val">{tabStrikes}</div>
                  <button className="btn-step" onClick={() => setTabStrikes(tabStrikes + 1)}>+</button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-200">Strict Mode</p>
                  <p className="text-xs text-slate-500">Block clipboard paste</p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PROBLEM MANAGER */}
        <div className="lg:col-span-2">
          <div className="draft-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div className="card-icon-header">
              <div className="card-icon-header-left">
                <div className="icon-wrap">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>library_books</span>
                </div>
                <h3>Problem Configuration</h3>
              </div>
              
              {/* CREATE NEW PROBLEM BUTTON -> Navigates to Problem Builder */}
              <Link href={`/writer/drafts/${draftId}/problem`} className="btn-cyan" style={{ padding: '0.375rem 1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                Create New Problem
              </Link>
            </div>

            <div className="problem-manager-grid">
              
              {/* PANE 1: GLOBAL PROBLEM BANK */}
              <div className="pane-column">
                <div className="pane-header">
                  <p className="text-sm font-semibold text-white mb-2">Problem Bank</p>
                  <div className="relative">
                     <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                     <input type="text" className="draft-input" style={{ paddingLeft: '2rem', paddingRight: '0.5rem', py: '0.375rem' }} placeholder="Search bank..." />
                  </div>
                </div>
                <div className="pane-scroll">
                  {availableBank.map((prob) => (
                    <div key={prob.id} className="problem-card">
                      <div className="problem-card-left">
                        <div>
                          <p className="prob-title">{prob.title}</p>
                          <div className="prob-meta">
                            <span className={`diff-tag diff-${prob.diff.toLowerCase()}`}>{prob.diff}</span>
                            <span className="topic-tag">{prob.tag}</span>
                          </div>
                        </div>
                      </div>
                      {/* ADD Button */}
                      <button onClick={() => handleAddToDraft(prob)} className="btn-icon-add" title="Add to Draft">
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                    </div>
                  ))}
                  {availableBank.length === 0 && <p className="text-xs text-slate-500 text-center mt-4">No remaining problems.</p>}
                </div>
              </div>

              {/* PANE 2: PROBLEMS IN THIS DRAFT */}
              <div className="pane-column" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                <div className="pane-header flex justify-between items-center">
                  <div>
                     <p className="text-sm font-semibold text-white">In This Draft</p>
                     <p className="text-xs text-primary mt-0.5">{draftProblems.length} Problems Configured</p>
                  </div>
                </div>
                <div className="pane-scroll">
                  {draftProblems.map((prob) => (
                    <div key={prob.id} className="problem-card border-slate-600">
                      <div className="problem-card-left">
                        <span className="material-symbols-outlined drag-handle">drag_indicator</span>
                        <div>
                          <p className="prob-title">{prob.title}</p>
                          <div className="prob-meta">
                            <span className={`diff-tag diff-${prob.diff.toLowerCase()}`}>{prob.diff}</span>
                            <span className="topic-tag">{prob.tag}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* MORE OPTIONS FOR DRAFT ITEMS */}
                      <MoreOptions>
                        {/* EDIT Navigates to the specific problem editor within this draft */}
                        <Link href={`/writer/drafts/${draftId}/problem/${prob.id}`} style={{ textDecoration: 'none' }}>
                          <MoreOptionsItem icon="edit">Edit Problem</MoreOptionsItem>
                        </Link>
                        <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }}></div>
                        
                        {/* REMOVE removes it from the contest but keeps it in the bank */}
                        <MoreOptionsItem icon="remove_circle" onClick={() => handleRemoveFromDraft(prob)} danger>
                          Remove from Draft
                        </MoreOptionsItem>
                        
                        {/* DELETE removes it entirely from the system */}
                        <MoreOptionsItem icon="delete_forever" onClick={() => console.log('Deleted entirely')} danger>
                          Delete Permanently
                        </MoreOptionsItem>
                      </MoreOptions>

                    </div>
                  ))}
                  {draftProblems.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">post_add</span>
                      <p className="text-sm text-slate-400">No problems added yet.</p>
                      <p className="text-xs text-slate-500 mt-1">Add from the bank or create a new one.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}