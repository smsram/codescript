import React from 'react';
import Link from 'next/link';
import './dashboard.css';

export default function WriterDashboard() {
  return (
    <div className="writer-dashboard">
      
      <div className="dashboard-header">
        <h2>Overview</h2>
        <p>Welcome back, Alex. Here's what's happening with your content today.</p>
      </div>

      {/* METRICS GRID */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span>Total Published</span>
            <span className="material-symbols-outlined icon">publish</span>
          </div>
          <div className="metric-bottom">
            <h3>24</h3>
            <span className="trend-badge trend-up">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '2px' }}>trending_up</span>
              +3
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>Drafts in Progress</span>
            <span className="material-symbols-outlined icon">edit_document</span>
          </div>
          <div className="metric-bottom">
            <h3>5</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>Total Student Attempts</span>
            <span className="material-symbols-outlined icon">group</span>
          </div>
          <div className="metric-bottom">
            <h3>12.4k</h3>
            <span className="trend-badge trend-up">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '2px' }}>trending_up</span>
              +12%
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>Average Pass Rate</span>
            <span className="material-symbols-outlined icon">bar_chart</span>
          </div>
          <div className="metric-bottom">
            <h3>68%</h3>
            <span className="trend-badge trend-neutral">stable</span>
          </div>
        </div>
      </div>

      {/* CONTENT COLUMNS */}
      <div className="content-grid">
        
        {/* Left Column: Recent Activity */}
        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Activity</h3>
            <Link href="/writer/problems" className="panel-link">View all</Link>
          </div>
          <div className="activity-list">
            
            <div className="activity-item">
              <div className="activity-info">
                <div className="activity-icon">
                  <span className="material-symbols-outlined">code</span>
                </div>
                <div className="activity-text">
                  <h4>Dynamic Programming: Knapsack</h4>
                  <div className="activity-meta">
                    <span>Last saved 2 hours ago</span>
                    <span className="meta-dot"></span>
                    <span>Draft</span>
                  </div>
                </div>
              </div>
              <button className="btn-action-primary">Resume Editing</button>
            </div>

            <div className="activity-item">
              <div className="activity-info">
                <div className="activity-icon">
                  <span className="material-symbols-outlined">javascript</span>
                </div>
                <div className="activity-text">
                  <h4>Asynchronous JS Patterns</h4>
                  <div className="activity-meta">
                    <span>Last saved 5 hours ago</span>
                    <span className="meta-dot"></span>
                    <span>Draft</span>
                  </div>
                </div>
              </div>
              <button className="btn-action-primary">Resume Editing</button>
            </div>

            <div className="activity-item">
              <div className="activity-info">
                <div className="activity-icon">
                  <span className="material-symbols-outlined">data_object</span>
                </div>
                <div className="activity-text">
                  <h4>Graph Traversal Basics</h4>
                  <div className="activity-meta">
                    <span>Last saved yesterday</span>
                    <span className="meta-dot"></span>
                    <span>Review</span>
                  </div>
                </div>
              </div>
              <button className="btn-action-secondary">View Details</button>
            </div>

            <div className="activity-item">
              <div className="activity-info">
                <div className="activity-icon">
                  <span className="material-symbols-outlined">terminal</span>
                </div>
                <div className="activity-text">
                  <h4>Rust Memory Safety</h4>
                  <div className="activity-meta">
                    <span>Last saved 2 days ago</span>
                    <span className="meta-dot"></span>
                    <span>Published</span>
                  </div>
                </div>
              </div>
              <button className="btn-action-secondary">View Analytics</button>
            </div>

          </div>
        </div>

        {/* Right Column: Needs Attention */}
        <div className="panel-card" style={{ height: '100%' }}>
          <div className="panel-header">
            <h3>
              {/* Pinging Dot Indicator */}
              <div style={{ position: 'relative', display: 'flex', width: '12px', height: '12px' }}>
                <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fbbf24', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                <span style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
              </div>
              Needs Attention
            </h3>
          </div>
          <div className="attention-list">
            
            <div className="attention-item">
              <span className="material-symbols-outlined attention-icon amber">warning</span>
              <div className="attention-text">
                <h4>Changes Requested</h4>
                <p>"Advanced SQL Joins" requires clarification on step 3 examples.</p>
                <div className="attention-meta">
                  <span className="attention-tag tag-amber">High Priority</span>
                  <span className="time-text">1 hour ago</span>
                </div>
              </div>
            </div>

            <div className="attention-item">
              <span className="material-symbols-outlined attention-icon amber">rate_review</span>
              <div className="attention-text">
                <h4>Review Feedback</h4>
                <p>Reviewer left 3 comments on "Introduction to Python".</p>
                <div className="attention-meta">
                  <span className="attention-tag tag-slate">Pending</span>
                  <span className="time-text">4 hours ago</span>
                </div>
              </div>
            </div>

            <div className="attention-item critical">
              <span className="material-symbols-outlined attention-icon rose">error</span>
              <div className="attention-text">
                <h4>Broken Test Case</h4>
                <p>Test #4 failed in production for "Binary Search Trees".</p>
                <div className="attention-meta">
                  <span className="attention-tag tag-rose">Critical</span>
                  <span className="time-text">Yesterday</span>
                </div>
              </div>
            </div>

          </div>
          
          <div style={{ marginTop: 'auto' }}></div> {/* Pushes footer to bottom if content is short */}
          <div className="panel-footer">
            <button className="btn-block">View All Notifications</button>
          </div>
        </div>

      </div>

    </div>
  );
}