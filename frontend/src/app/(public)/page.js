import React from 'react';
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
            <span className="material-symbols-outlined icon">code_blocks</span>
            <span>CodeScript</span>
          </div>

          {/* Links */}
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#ggu">GGU Mission</a>
          </div>

          {/* CTAs */}
          <div className="nav-actions">
            <button className="btn btn-ghost btn-login">Log In</button>
            <button className="btn btn-primary">Sign Up</button>
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
            Master Algorithms in <span className="text-gradient">Real-Time</span>
          </h1>

          <p className="hero-subtitle anim-fade-up delay-2">
            The official high-performance coding and examination platform designed for the next generation of engineers at Godavari Global University.
          </p>

          <div className="hero-buttons anim-fade-up delay-3">
            <button className="btn btn-primary btn-large">
              <span className="material-symbols-outlined">terminal</span>
              Start Coding Now
            </button>
            <button className="btn btn-outline btn-large">
              <span className="material-symbols-outlined">school</span>
              Professor Access
            </button>
          </div>

          {/* IDE Mockup */}
          <div className="ide-wrapper anim-fade-up delay-3">
            <div className="ide-glow-bg"></div>
            <div className="ide-container">
              
              {/* Mac-style Header */}
              <div className="ide-header">
                <div className="mac-dot mac-red"></div>
                <div className="mac-dot mac-yellow"></div>
                <div className="mac-dot mac-green"></div>
                <div className="ide-filename">main.cpp</div>
              </div>

              {/* Content */}
              <div className="ide-body">
                {/* Line Numbers */}
                <div className="ide-lines">
                  1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8<br/>9<br/>10<br/>11<br/>12<br/>13
                </div>

                {/* Code Area */}
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
            
            {/* Left: Image/Showcase */}
            <div className="showcase-img">
              <img 
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000" 
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

            {/* Right: Content */}
            <div className="showcase-content">
              <div className="icon-box">
                <span className="material-symbols-outlined">hub</span>
              </div>
              <h2>Powered by GGU Innovation</h2>
              <p>
                Experience the cutting-edge technology developed at Godavari Global University. Our platform is designed to foster coding excellence, academic integrity, and seamless integration with the university's curriculum.
              </p>
              
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-val">5k+</span>
                  <span className="stat-label">Students</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-val">200+</span>
                  <span className="stat-label">Courses</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-val">99.9%</span>
                  <span className="stat-label">Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Pillars Grid */}
        <section id="features" className="section-padding container">
          <div className="section-header anim-fade-up">
            <h2>Key Pillars of CodeScript</h2>
            <p>Built for performance, security, and real-world applicability using modern architecture.</p>
          </div>

          <div className="grid-3">
            <div className="feature-card anim-fade-up delay-1">
              <div className="feature-icon">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h3>Instant Execution</h3>
              <p>Run your code in milliseconds with our high-performance isolated execution engine. No waiting, just coding.</p>
            </div>

            <div className="feature-card anim-fade-up delay-2">
              <div className="feature-icon">
                <span className="material-symbols-outlined">shield</span>
              </div>
              <h3>Fair & Secure</h3>
              <p>Advanced proctoring and anti-cheat mechanisms ensure fair examinations and credible certifications for everyone.</p>
            </div>

            <div className="feature-card anim-fade-up delay-3">
              <div className="feature-icon">
                <span className="material-symbols-outlined">terminal</span>
              </div>
              <h3>Industry Standard</h3>
              <p>Develop skills using the same compilers, linters, and environments used by top tech companies globally.</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="footer-cta">
          <div className="footer-bg-glow"></div>
          <div className="container">
            <div className="cta-inner anim-fade-up">
              <div className="cta-text">
                <h2>Ready for your next challenge?</h2>
                <p>Join thousands of GGU students mastering their craft. Start solving real-world problems today.</p>
              </div>
              <button className="btn btn-large btn-white">Create Student Account</button>
            </div>

            {/* Simple Footer Links */}
            <div className="footer-bottom">
              <div className="copyright">
                © {new Date().getFullYear()} Godavari Global University. All rights reserved.
              </div>
              <div className="footer-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Support</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}