import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle'; 
import './page.css'; 

export default function Home() {
  return (
    <>
      {/* Sticky Top Nav */}
      <nav className="navbar glass-nav">
        <div className="nav-gradient-line"></div>
        <div className="container nav-inner">
          {/* Logo */}
          <div className="nav-logo">
            <img 
              src="/CodeScriptLogo.png" 
              alt="CodeScript Logo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
            />
            <span className="logo-text">CodeScript</span>
          </div>

          {/* Links */}
          <div className="nav-links">
            <a href="#features">Platform Features</a>
            <a href="#ggu">GGU Mission</a>
          </div>

          {/* CTAs */}
          <div className="nav-actions">
            <ThemeToggle />
            
            {/* 🚀 Hidden on mobile to save space */}
            <div className="sd-divider hide-mobile" style={{ height: '20px', width: '1px', background: 'var(--border-light)' }}></div>
            
            <Link href="/login" className="btn btn-ghost btn-login">Log In</Link>
            <Link href="/register" className="btn btn-primary">
              {/* 🚀 Hides the word "Student" on small screens so the button fits perfectly */}
              <span className="hide-mobile">Student&nbsp;</span>Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <main>
        {/* Hero Section */}
        <section className="hero-section container">
          <div className="hero-glow"></div>
          
          <div className="badge anim-fade-up">
            <div className="dot-wrapper">
              <span className="dot-ping"></span>
              <span className="dot-solid"></span>
            </div>
            Official Platform of Godavari Global University
          </div>

          <h1 className="hero-title anim-fade-up delay-1">
            Seamless Academic Examinations in <span className="text-gradient">Real-Time</span>
          </h1>

          <p className="hero-subtitle anim-fade-up delay-2">
            The official secure assessment, lab execution, and grading platform designed exclusively for the next generation of engineers at Godavari Global University.
          </p>

          <div className="hero-buttons anim-fade-up delay-3">
            <Link href="/dashboard" className="btn btn-primary btn-large">
              <span className="material-symbols-outlined">dashboard</span>
              Student Portal
            </Link>
            <Link href="/login" className="btn btn-outline btn-large">
              <span className="material-symbols-outlined">school</span>
              Professor Access
            </Link>
          </div>

          {/* IDE Mockup */}
          <div className="ide-wrapper anim-fade-up delay-3">
            <div className="ide-glow-bg"></div>
            <div className="ide-container">
              
              <div className="ide-header">
                <div className="mac-dot mac-red"></div>
                <div className="mac-dot mac-yellow"></div>
                <div className="mac-dot mac-green"></div>
                <div className="ide-filename">CS201_Midterm.cpp</div>
              </div>

              <div className="ide-body">
                <div className="ide-lines">
                  1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8<br/>9<br/>10<br/>11<br/>12<br/>13
                </div>

                <div className="ide-code">
<span className="syn-purple">#include</span> <span className="syn-green">&lt;iostream&gt;</span><br/>
<span className="syn-purple">#include</span> <span className="syn-green">&lt;vector&gt;</span><br/>
<span className="syn-purple">using namespace</span> std;<br/><br/>
<span className="syn-blue">int</span> <span className="syn-yellow">binarySearch</span>(<span className="syn-blue">vector</span>&lt;<span className="syn-blue">int</span>&gt;&amp; arr, <span className="syn-blue">int</span> target) &#123;<br/>
&nbsp;&nbsp;<span className="syn-blue">int</span> left = <span className="syn-orange">0</span>;<br/>
&nbsp;&nbsp;<span className="syn-blue">int</span> right = arr.<span className="syn-yellow">size</span>() - <span className="syn-orange">1</span>;<br/>
&nbsp;&nbsp;<span className="syn-purple">while</span> (left &lt;= right) &#123;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-blue">int</span> mid = left + (right - left) / <span className="syn-orange">2</span>;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-purple">if</span> (arr[mid] == target) <span className="syn-purple">return</span> mid;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-purple">if</span> (arr[mid] &lt; target) left = mid + <span className="syn-orange">1</span>;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-purple">else</span> right = mid - <span className="syn-orange">1</span>;<br/>
&nbsp;&nbsp;&#125;<br/>
&nbsp;&nbsp;<span className="syn-purple">return</span> <span className="syn-orange">-1</span>;<br/>
&#125;<br/>
<span className="typing-cursor"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GGU Showcase Section */}
        <section id="ggu" className="section-padding container">
          <div className="grid-2 anim-fade-up">
            <div className="showcase-img">
              <img 
                src="https://tse4.mm.bing.net/th/id/OIP.QYMqbF1d_Fo6b6DM_9fUOgHaE8" 
                alt="Modern university campus"
              />
              <div className="img-overlay"></div>
              <div className="img-badge">
                <span className="material-symbols-outlined icon">school</span>
                <div>
                  <h4>Godavari Global University</h4>
                  <p>Excellence in Technology</p>
                </div>
              </div>
            </div>

            <div className="showcase-content">
              <div className="icon-box">
                <span className="material-symbols-outlined">hub</span>
              </div>
              <h2>Powered by GGU Innovation</h2>
              <p>
                Experience the cutting-edge educational technology developed exclusively for Godavari Global University. Our platform is designed to maintain academic integrity, automate grading for professors, and provide a seamless examination experience for students.
              </p>
              
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-val">5k+</span>
                  <span className="stat-label">Students</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-val">Automated</span>
                  <span className="stat-label">Grading</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-val">100%</span>
                  <span className="stat-label">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Pillars Grid */}
        <section id="features" className="section-padding container">
          <div className="section-header anim-fade-up">
            <h2>Key Pillars of CodeScript</h2>
            <p>Built to enforce academic integrity and streamline the university examination process.</p>
          </div>

          <div className="grid-3">
            <div className="feature-card anim-fade-up delay-1">
              <div className="feature-icon">
                <span className="material-symbols-outlined">gavel</span>
              </div>
              <h3>Strict Proctoring</h3>
              <p>Advanced anti-cheat mechanisms, tab-switch monitoring, and automated webcam warnings ensure fair and credible examinations.</p>
            </div>

            <div className="feature-card anim-fade-up delay-2">
              <div className="feature-icon">
                <span className="material-symbols-outlined">sync</span>
              </div>
              <h3>Cloud Auto-Save</h3>
              <p>Never lose your progress during a test. CodeScript automatically syncs your drafts to the cloud every few seconds.</p>
            </div>

            <div className="feature-card anim-fade-up delay-3">
              <div className="feature-icon">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <h3>Professor Analytics</h3>
              <p>Instructors get real-time dashboards to monitor student progress, review code submissions, and export detailed CSV/PDF reports.</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="footer-cta">
          <div className="footer-bg-glow"></div>
          <div className="container">
            <div className="cta-inner anim-fade-up">
              <div className="cta-text">
                <h2>Ready for your upcoming assessments?</h2>
                <p>Log in to access your scheduled lab sessions, midterms, and final examinations.</p>
              </div>
              <Link href="/register" className="btn btn-large btn-white">Create Student Account</Link>
            </div>

            <div className="footer-bottom">
              <div className="copyright">
                <div style={{ marginBottom: '8px' }}>
                  © {new Date().getFullYear()} Godavari Global University. All rights reserved.
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>code</span>
                  Made by CSM-3 students (2024 - 2028 batch)
                </div>
              </div>
              <div className="footer-links">
                <Link href="/legal">Privacy Policy</Link>
                <Link href="/integrity">Academic Integrity Policy</Link>
                <Link href="/support">IT Support</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}