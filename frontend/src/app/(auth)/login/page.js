"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { showToast } from '@/components/ui/Toast'; // 🚀 Imported Toast
import './login.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State - 'identifier' will hold either the Email or the PIN
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.identifier,
          password: formData.password,
          rememberMe: rememberMe // Sends true or false to backend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // 🚀 Trigger Success Toast
      showToast('Login successful! Redirecting...', 'success');

      // Clear old tokens just in case
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Use sessionStorage if Remember Me is FALSE (deletes on window close)
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      storage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        if (data.user.role === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }, 1500);

    } catch (err) {
      // 🚀 Trigger Error Toast
      showToast(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="login-split-wrapper">
      
      {/* --- LEFT PANE (FORM SIDE) --- */}
      <div className="login-left">
        <div className="form-container">
          
          <div className="mobile-logo">
            <img 
              src="/CodeScriptLogo.png" 
              alt="Logo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
            />
            <span>CodeScript</span>
          </div>

          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Enter your credentials to access your portal</p>
          </div>

          <GoogleAuthButton actionText="Continue" className="btn-sso" rememberMe={rememberMe} />

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">OR</span>
            <div className="divider-line"></div>
          </div>

          <form className="form-group" onSubmit={handleLogin}>
            
            <div className="input-wrapper">
              <input 
                type="text" id="identifier" className="floating-input" placeholder=" " required 
                value={formData.identifier} onChange={handleInputChange}
              />
              <label htmlFor="identifier" className="floating-label">Email or PIN number</label>
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
              <label className="checkbox-group" style={{ cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <span style={{ fontSize: '0.9rem' }}>
                  Remember me <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>(for 1 week)</span>
                </span>
              </label>
              <Link href="/reset-password" className="text-link">Forgot password?</Link>
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
            <img 
              src="/CodeScriptLogo.png" 
              alt="CodeScript Logo" 
              style={{ width: '70%', height: '70%', objectFit: 'contain' }} 
            />
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