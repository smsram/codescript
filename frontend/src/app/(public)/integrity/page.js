"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './integrity.css';

export default function IntegrityPage() {
  const router = useRouter();

  return (
    <div className="integrity-page-container">
      <div className="integrity-wrapper container">
        
        {/* Minimal Header with Back Button */}
        <nav className="integrity-nav-header anim-fade-up">
          <button onClick={() => router.back()} className="back-btn">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Go Back</span>
          </button>
          <div className="nav-brand">
             <span className="material-symbols-outlined text-primary">verified_user</span>
             <span>CodeScript <span className="hide-mobile">Security</span></span>
          </div>
        </nav>

        <main className="integrity-main">
          {/* Hero Section */}
          <header className="integrity-hero anim-fade-up">
            <div className="integrity-badge">GGU Mission</div>
            <h1>Academic Integrity & <span className="text-gradient">Honor Code</span></h1>
            <p>
              Godavari Global University (GGU) maintains the highest standards of academic excellence. 
              By utilizing this platform, you commit to demonstrating your own knowledge without unauthorized assistance.
            </p>
          </header>

          {/* Progressive Penalty Table */}
          <section className="penalty-section anim-fade-up delay-1">
            <div className="section-title-row">
              <span className="material-symbols-outlined text-amber-500">warning</span>
              <h2>Progressive Time-Out System</h2>
            </div>
            <div className="table-container">
              <table className="penalty-table">
                <thead>
                  <tr>
                    <th>Violation Tier</th>
                    <th>Immediate Penalty</th>
                    <th>System Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="tier-cell">
                      <span className="tier-num one">1</span>
                      <strong>1st Offense</strong>
                    </td>
                    <td><span className="penalty-badge warn">15s Terminal Lock</span></td>
                    <td className="desc-cell">Warning alert triggered. Input is disabled for 15 seconds.</td>
                  </tr>
                  <tr>
                    <td className="tier-cell">
                      <span className="tier-num two">2</span>
                      <strong>2nd Offense</strong>
                    </td>
                    <td><span className="penalty-badge danger">45s Terminal Lock</span></td>
                    <td className="desc-cell">Final warning. Input is disabled for 45 seconds. Proctors notified.</td>
                  </tr>
                  <tr>
                    <td className="tier-cell">
                      <span className="tier-num three">3</span>
                      <strong>3rd Offense</strong>
                    </td>
                    <td><span className="penalty-badge critical">Auto-Submission</span></td>
                    <td className="desc-cell">Session terminated. Current progress submitted for manual review.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Rules Accordions */}
          <div className="rules-layout anim-fade-up delay-2">
            <div className="rules-grid">
              <div className="rule-card">
                <div className="rule-header">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <h3>Allowed Resources</h3>
                </div>
                <ul className="rule-list">
                  <li>Official language documentation (Python, Java, C++)</li>
                  <li>One blank physical scratchpad and pen</li>
                  <li>Built-in CodeScript reference library</li>
                </ul>
              </div>

              <div className="rule-card">
                <div className="rule-header">
                  <span className="material-symbols-outlined text-red-500">block</span>
                  <h3>Prohibited Actions</h3>
                </div>
                <ul className="rule-list">
                  <li>Switching browser tabs (triggers Time-Out)</li>
                  <li>Using secondary devices (phones, smartwatches)</li>
                  <li>Copy-pasting external code into the editor</li>
                </ul>
              </div>

              <div className="rule-card full-width">
                <div className="rule-header">
                  <span className="material-symbols-outlined text-primary">videocam</span>
                  <h3>AI & Webcam Rules</h3>
                </div>
                <ul className="rule-list horizontal">
                  <li>Webcam must remain active with face fully visible.</li>
                  <li>Use of AI assistants (ChatGPT, Copilot) is strictly forbidden.</li>
                  <li>Background noise must be minimized to avoid proctor flags.</li>
                </ul>
              </div>
            </div>
            
            <div className="csm-tag">Made by CSM-3 (2024-28) @ GGU</div>
          </div>
        </main>
      </div>
    </div>
  );
}