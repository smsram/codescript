"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './legal.css';

export default function LegalPage() {
  const router = useRouter();

  return (
    <div className="legal-page-container">
      <div className="legal-wrapper container">
        
        {/* Minimal Header */}
        <nav className="legal-nav-header anim-fade-up">
          <Link href="/" className="back-btn">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back to Home</span>
          </Link>
          <div className="nav-brand">
             <img src="/CodeScriptLogo.png" alt="Logo" className="nav-logo-img" />
             <span>CodeScript <span className="hide-mobile">Legal</span></span>
          </div>
        </nav>

        <main className="legal-main">
          {/* Hero Section */}
          <header className="legal-hero anim-fade-up">
            <div className="legal-badge">Institutional Integrity</div>
            <h1>Legal & <span className="text-gradient">Privacy Center</span></h1>
            <p>
              Guidelines for Academic Integrity and Terms of Use for the 
              Godavari Global University assessment ecosystem.
            </p>
          </header>

          {/* Core Policy Grid */}
          <div className="info-grid anim-fade-up delay-1">
            <div className="info-card">
              <span className="material-symbols-outlined icon">verified_user</span>
              <h3>Data Privacy</h3>
              <p>Institutional data is encrypted and handled according to GGU's IT security standards.</p>
            </div>
            <div className="info-card">
              <span className="material-symbols-outlined icon">shield_person</span>
              <h3>No Recordings</h3>
              <p>AI proctoring happens in real-time. We never record video or audio of students.</p>
            </div>
            <div className="info-card">
              <span className="material-symbols-outlined icon">history_edu</span>
              <h3>IP Rights</h3>
              <p>Students retain the copyright to their original source code solutions.</p>
            </div>
          </div>

          <div className="content-layout anim-fade-up delay-2">
            {/* Articles */}
            <article className="legal-articles">
              <section id="data" className="policy-section">
                <h2><span className="num">01.</span> Data Usage</h2>
                <div className="policy-text">
                  <p>CodeScript collects Student IDs and official names to generate exam reports. We do not sell or share this data with third-party advertising entities.</p>
                  <p>Technical data (OS, Browser version) is collected only to debug execution container errors during live lab sessions.</p>
                </div>
              </section>

              <section id="proctoring" className="policy-section proctor-box">
                <h2><span className="num">02.</span> AI Proctoring</h2>
                <div className="policy-text">
                  <p className="bold-primary">By joining an assessment, you agree to:</p>
                  <ul className="custom-list">
                    <li>Automated tab-switch detection (Strikes).</li>
                    <li>Webcam-based person presence verification.</li>
                    <li>Strict clipboard monitoring in "Strict Mode" exams.</li>
                  </ul>
                  <div className="alert-box">
                    <span className="material-symbols-outlined">security</span>
                    Proctoring is active only during a joined exam session.
                  </div>
                </div>
              </section>

              <section id="conduct" className="policy-section">
                <h2><span className="num">03.</span> Academic Integrity</h2>
                <div className="policy-text">
                  <p>Usage of external AI tools (ChatGPT, Gemini) is strictly prohibited unless explicitly allowed by the instructor. Any attempt to exploit the Docker backend will result in an immediate permanent ban from the platform.</p>
                </div>
              </section>

              <section id="terms" className="policy-section">
                <h2><span className="num">04.</span> General Terms</h2>
                <div className="policy-text">
                  <p>This platform is provided "as-is" for educational purposes. CodeScript is not responsible for data loss due to students failing to save drafts during network outages.</p>
                </div>
              </section>
            </article>

            {/* Sidebar */}
            <aside className="legal-sidebar">
              <div className="sidebar-sticky">
                <h4 className="sidebar-title">Sections</h4>
                <nav className="sidebar-links">
                  <a href="#data">Data Usage</a>
                  <a href="#proctoring">AI Proctoring</a>
                  <a href="#conduct">Integrity</a>
                  <a href="#terms">Terms</a>
                </nav>
                <div className="sidebar-footer">
                  <p>Need clarification on a policy?</p>
                  <button 
                    className="sidebar-btn"
                    onClick={() => router.push('/support')}
                  >
                    Contact IT Support
                  </button>
                  <div className="csm-tag">Made by CSM-3 (2024-28)</div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}