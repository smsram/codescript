import React from 'react';
import Link from 'next/link';
import './drafts.css';

// Mock Data structure based on new requirements
const DRAFTS_DATA = [
  { 
    id: "draft-101", 
    title: "Valid Sudoku Solver", 
    problemCount: 3, 
    missing: [
      { label: "Missing Test Cases", type: "rose" },
      { label: "No Python Stub", type: "amber" }
    ], 
    lastSaved: "2 hours ago" 
  },
  { 
    id: "draft-102", 
    title: "LRU Cache Implementation", 
    problemCount: 1, 
    missing: [
      { label: "Missing Edge Cases", type: "amber" }
    ], 
    lastSaved: "5 hours ago" 
  },
  { 
    id: "draft-103", 
    title: "Merge K Sorted Lists", 
    problemCount: 0, 
    missing: [
      { label: "No Description", type: "rose" },
      { label: "No Test Cases", type: "amber" }
    ], 
    lastSaved: "Yesterday" 
  },
  { 
    id: "draft-104", 
    title: "Binary Tree Zigzag Level Order Traversal", 
    problemCount: 5, 
    missing: [
      { label: "Initial Setup Only", type: "rose" }
    ], 
    lastSaved: "3 days ago" 
  }
];

export default function DraftsDirectoryPage() {
  return (
    <div className="drafts-container">
      
      {/* HEADER & SEARCH */}
      <div className="drafts-header">
        <div className="header-text">
          <h2>Drafts Directory</h2>
          <p>Manage and continue working on your unfinished coding challenges.</p>
        </div>
        
        <div className="drafts-toolbar">
          <div className="search-box-large">
            <span className="material-symbols-outlined search-icon">search</span>
            <input type="text" placeholder="Search draft titles..." />
          </div>
        </div>
      </div>

      {/* DRAFTS TABLE */}
      <div className="drafts-table-card">
        <div className="table-wrapper">
          <table className="drafts-table">
            <thead>
              <tr>
                <th>Problem Title</th>
                <th style={{ textAlign: 'center' }}>Problems Configured</th>
                <th>Missing Elements</th>
                <th>Last Saved</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {DRAFTS_DATA.map((draft) => (
                <tr key={draft.id}>
                  
                  {/* Title */}
                  <td>
                    <span className="draft-title">{draft.title}</span>
                  </td>

                  {/* Problem Count (Replaced Completion Status) */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="problem-count-badge" title={`${draft.problemCount} problems added to this draft`}>
                      {draft.problemCount}
                    </div>
                  </td>

                  {/* Missing Elements Tags */}
                  <td>
                    <div className="tag-container">
                      {draft.missing.map((tag, index) => (
                        <span key={index} className={`missing-tag tag-${tag.type}`}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Last Saved */}
                  <td>
                    <span className="last-saved">{draft.lastSaved}</span>
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/writer/drafts/${draft.id}`} className="btn-continue">
                      Continue
                    </Link>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="drafts-pagination">
        <p>Showing 1 to 4 of 4 drafts</p>
        <div className="pagination-controls">
          <button className="btn-page-icon" disabled>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="page-number">1</span>
          <button className="btn-page-icon" disabled>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

    </div>
  );
}