"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import './login.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // --- AUTH SUCCESS ---
      setStatus({ type: 'success', message: 'Login successful! Redirecting...' });

      // 1. Save Token and User Info to LocalStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 2. Role-Based Redirection Logic
      setTimeout(() => {
        if (data.user.role === 'ADMIN') {
          window.location.href = '/admin'; // Redirect admins to admin dashboard
        } else {
          window.location.href = '/dashboard'; // Redirect students to student dashboard
        }
      }, 1500);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="login-split-wrapper">
      
      {/* --- LEFT PANE (FORM SIDE) --- */}
      <div className="login-left">
        <div className="form-container">
          
          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Enter your credentials to access your portal</p>
          </div>

          {/* Feedback Message Area */}
          {status.message && (
            <div className={`status-msg ${status.type === 'error' ? 'text-red-500' : 'text-green-500'} mb-4 text-sm font-semibold`}>
              {status.message}
            </div>
          )}

          <button className="btn-sso" type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>Continue with University Email</span>
          </button>

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">OR</span>
            <div className="divider-line"></div>
          </div>

          <form className="form-group" onSubmit={handleLogin}>
            
            <div className="input-wrapper">
              <input 
                type="email" id="email" className="floating-input" placeholder=" " required 
                value={formData.email} onChange={handleInputChange}
              />
              <label htmlFor="email" className="floating-label">Email address</label>
            </div>

            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" className="floating-input" placeholder=" " required 
                value={formData.password} onChange={handleInputChange}
              />
              <label htmlFor="password" className="floating-label">Password</label>
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            <div className="form-controls">
              <label className="checkbox-group">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link href="#" className="text-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          <div className="form-footer">
            Don't have an account? 
            <Link href="/register" className="text-link" style={{ marginLeft: '0.25rem' }}>
              Sign up here
            </Link>
          </div>

        </div>
      </div>

      {/* --- RIGHT PANE (BRANDING SIDE) --- */}
      <div className="login-right">
        <div className="brand-glow-top"></div>
        <div className="brand-glow-bottom"></div>
        
        <div className="glass-card">
          <div className="icon-box">
            <span className="material-symbols-outlined">terminal</span>
          </div>
          
          <div className="brand-text">
            <h2>CodeScript</h2>
            <div className="brand-line"></div>
            <p>
              The secure execution environment for <br />
              <strong style={{ color: '#fff', fontWeight: 500 }}>Godavari Global University</strong>
            </p>
          </div>

          <div className="code-mockup">
            <div className="mac-dots">
              <div className="mac-dot" style={{ backgroundColor: '#ef4444' }}></div>
              <div className="mac-dot" style={{ backgroundColor: '#eab308' }}></div>
              <div className="mac-dot" style={{ backgroundColor: '#22c55e' }}></div>
            </div>
            <p><span style={{ color: '#c084fc' }}>const</span> <span style={{ color: '#07b2d5' }}>initSession</span> = <span style={{ color: '#60a5fa' }}>async</span> () =&gt; &#123;</p>
            <p style={{ paddingLeft: '1rem', color: '#64748b' }}>// Secure handshake</p>
            <p style={{ paddingLeft: '1rem' }}><span style={{ color: '#c084fc' }}>await</span> auth.<span style={{ color: '#60a5fa' }}>verify</span>(credentials);</p>
            <p style={{ paddingLeft: '1rem' }}><span style={{ color: '#c084fc' }}>return</span> <span style={{ color: '#4ade80' }}>true</span>;</p>
            <p>&#125;;</p>
          </div>
        </div>

        <div className="copyright-footer">
          © {new Date().getFullYear()} Godavari Global University. All rights reserved.
        </div>
      </div>

    </div>
  );
}