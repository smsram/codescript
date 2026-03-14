"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import './register.css';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for form inputs (Added pin)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    pin: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const keyMap = {
      'first-name': 'firstName',
      'last-name': 'lastName',
      'email': 'email',
      'pin': 'pin',
      'password': 'password',
      'confirm-password': 'confirmPassword'
    };
    setFormData(prev => ({ ...prev, [keyMap[id]]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match!' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          pin: formData.pin.trim() || undefined, // 🚀 Send PIN to backend if entered
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setStatus({ type: 'success', message: 'Account created! Redirecting to login...' });
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="register-split-wrapper">
      
      {/* --- LEFT SIDE: FORM --- */}
      <div className="register-left" style={{ width: '100%', flex: '1 1 50%' }}>
        <div className="register-form-container">
          
          <div className="mobile-logo-reg">
            <img 
              src="/CodeScriptLogo.png" 
              alt="Logo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
            />
            <span>CodeScript</span>
          </div>

          <div className="register-header">
            <h1>Create your account</h1>
            <p>Join the CodeScript platform</p>
          </div>

          {status.message && (
            <div className={`status-msg ${status.type === 'error' ? 'text-red-500' : 'text-green-500'} mb-4 text-sm font-semibold`}>
              {status.message}
            </div>
          )}

          <GoogleAuthButton actionText="Sign up" className="btn-sso-reg" />

          <div className="reg-divider">
            <div className="reg-divider-line"></div>
            <span className="reg-divider-text">OR</span>
            <div className="reg-divider-line"></div>
          </div>

          <form className="register-form-fields" onSubmit={handleSubmit}>
            
            <div className="reg-name-row">
              <div className="reg-input-group">
                <label htmlFor="first-name">First Name</label>
                <input 
                  type="text" id="first-name" className="reg-input" placeholder="John" required 
                  value={formData.firstName} onChange={handleInputChange} 
                />
              </div>
              <div className="reg-input-group">
                <label htmlFor="last-name">Last Name</label>
                <input 
                  type="text" id="last-name" className="reg-input" placeholder="Doe" required 
                  value={formData.lastName} onChange={handleInputChange} 
                />
              </div>
            </div>

            {/* 🚀 Changed to generic "Email Address" */}
            <div className="reg-input-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" id="email" className="reg-input" placeholder="student@example.com" required 
                value={formData.email} onChange={handleInputChange} 
              />
            </div>

            {/* 🚀 Added PIN Input for Students */}
            <div className="reg-input-group">
              <label htmlFor="pin">PIN / Roll Number <span style={{fontSize:'0.75rem', fontWeight:'normal', opacity: 0.7}}>(Optional)</span></label>
              <input 
                type="text" id="pin" className="reg-input" placeholder="e.g. 241UAI0XXX" 
                value={formData.pin} onChange={handleInputChange} 
              />
            </div>

            <div className="reg-input-group">
              <label htmlFor="password">Password</label>
              <div className="reg-pass-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  className="reg-input" 
                  placeholder="••••••••" 
                  required 
                  value={formData.password} onChange={handleInputChange} 
                />
                <button 
                  type="button" 
                  className="reg-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="reg-input-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="reg-pass-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirm-password" 
                  className="reg-input" 
                  placeholder="••••••••" 
                  required 
                  value={formData.confirmPassword} onChange={handleInputChange} 
                />
                <button 
                  type="button" 
                  className="reg-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <p className="reg-terms-text">
              By creating an account, you agree to the <Link href="#">Academic Honor Code</Link> and <Link href="#">Terms of Service</Link>.
            </p>

            <button type="submit" className="reg-btn-submit" disabled={loading}>
              {loading ? "Processing..." : "Create Student Account"}
            </button>
          </form>

          <div className="reg-footer">
            <p>
              Already have an account? <Link href="/login">Log in here</Link>
            </p>
          </div>

        </div>
      </div>

      {/* --- RIGHT SIDE: BRANDING --- */}
      <div className="register-right" style={{ flex: '1 1 50%' }}>
        <div className="reg-bg-glow-top"></div>
        <div className="reg-bg-glow-bottom"></div>

        <div className="reg-glass-card">
          <div className="reg-icon-container">
            <img 
              src="/CodeScriptLogo.png" 
              alt="CodeScript Logo" 
              style={{ width: '70%', height: '70%', objectFit: 'contain' }} 
            />
          </div>

          <h2 className="reg-quote">
            "Join hundreds of peers mastering algorithms in real-time."
          </h2>

          <div className="reg-accent-line"></div>

          <div className="reg-code-box">
            <div className="reg-mac-controls">
              <div className="reg-dot dot-r"></div>
              <div className="reg-dot dot-y"></div>
              <div className="reg-dot dot-g"></div>
            </div>
            
            <div className="reg-code-text">
              <p><span style={{ color: '#c084fc' }}>class</span> <span style={{ color: '#fde047' }}>Student</span> <span style={{ color: '#c084fc' }}>extends</span> <span style={{ color: '#fde047' }}>User</span> &#123;</p>
              <p style={{ paddingLeft: '1rem' }}><span style={{ color: '#c084fc' }}>constructor</span>(id) &#123;</p>
              <p style={{ paddingLeft: '2rem' }}><span style={{ color: '#c084fc' }}>super</span>(id);</p>
              <p style={{ paddingLeft: '2rem' }}><span style={{ color: '#60a5fa' }}>this</span>.status = <span style={{ color: '#4ade80' }}>'active'</span>;</p>
              <p style={{ paddingLeft: '1rem' }}>&#125;</p>
              <p>&#125;</p>
            </div>
          </div>
        </div>

        <div className="reg-copyright">
          © {new Date().getFullYear()} Godavari Global University. All rights reserved.
        </div>
      </div>

    </div>
  );
}