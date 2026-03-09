"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import './register.css';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for form inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // State for feedback and loading
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Single handler for all inputs
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // Map hyphenated IDs to camelCase state keys
    const keyMap = {
      'first-name': 'firstName',
      'last-name': 'lastName',
      'email': 'email',
      'password': 'password',
      'confirm-password': 'confirmPassword'
    };
    setFormData(prev => ({ ...prev, [keyMap[id]]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    // Client-side Validation
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
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setStatus({ type: 'success', message: 'Account created! Redirecting to login...' });
      
      // Clear form and redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setLoading(false);
    }
  };
  console.log("Current API URL:", process.env.NEXT_PUBLIC_API_URL);

  return (
    <div className="register-split-wrapper">
      
      {/* --- LEFT SIDE: FORM --- */}
      <div className="register-left">
        <div className="register-form-container">
          
          <div className="register-header">
            <h1>Create your account</h1>
            <p>Join the CodeScript platform</p>
          </div>

          {/* Feedback Message Area */}
          {status.message && (
            <div className={`status-msg ${status.type === 'error' ? 'text-red-500' : 'text-green-500'} mb-4 text-sm font-semibold`}>
              {status.message}
            </div>
          )}

          {/* SSO Button */}
          <button className="btn-sso-reg" type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>Sign up with University Email</span>
          </button>

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

            <div className="reg-input-group">
              <label htmlFor="email">University Email Address</label>
              <input 
                type="email" id="email" className="reg-input" placeholder="student@university.edu" required 
                value={formData.email} onChange={handleInputChange} 
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
      <div className="register-right">
        <div className="reg-bg-glow-top"></div>
        <div className="reg-bg-glow-bottom"></div>

        <div className="reg-glass-card">
          <div className="reg-icon-container">
            <span className="material-symbols-outlined">data_object</span>
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