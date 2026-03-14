"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import '../login/login.css'; // Inherits your beautiful login styles

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Cooldown timer state for requesting a new link
  const [cooldown, setCooldown] = useState(0);

  // Form states
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 🚀 ACTION 1: Request a reset link (when NO token is present)
  const handleRequestLink = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // NOTE: Ensure you have a PUBLIC route for this in your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If backend returns a 429 Too Many Requests, extract the wait time if provided
        if (response.status === 429) {
           const waitMatch = data.error.match(/(\d+)/);
           if (waitMatch) setCooldown(parseInt(waitMatch[0], 10));
        }
        throw new Error(data.error || 'Failed to send reset link.');
      }

      setStatus({ type: 'success', message: 'If an account exists, a reset link has been sent.' });
      setCooldown(60); // Start 60-second cooldown
      setEmail('');

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ACTION 2: Execute password reset (when token IS present)
  const handleExecuteReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setStatus({ type: 'error', message: 'Passwords do not match.' });
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Execute the reset using the token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to reset password.');

      setStatus({ type: 'success', message: 'Password reset successfully! Redirecting...' });
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-wrapper">
      
      {/* --- LEFT PANE (FORM SIDE) --- */}
      <div className="login-left">
        <div className="form-container">
          
          {/* Mobile Logo */}
          <div className="mobile-logo">
            <img src="/CodeScriptLogo.png" alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            <span>CodeScript</span>
          </div>

          <div className="login-header">
            <h1>{token ? "Create New Password" : "Reset Password"}</h1>
            <p>{token ? "Your new password must be different from previously used passwords." : "Enter your email address and we'll send you a link to reset your password."}</p>
          </div>

          {/* Feedback Message Area */}
          {status.message && (
            <div className={`status-msg ${status.type === 'error' ? 'text-red-500' : 'text-green-500'} mb-4 text-sm font-semibold`} style={{ color: status.type === 'error' ? '#ef4444' : '#10b981', padding: '10px', background: status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: '6px' }}>
              {status.message}
            </div>
          )}

          {/* 🚀 CONDITIONAL FORM RENDERING */}
          {!token ? (
            /* FORM 1: REQUEST LINK */
            <form className="form-group" onSubmit={handleRequestLink}>
              <div className="input-wrapper">
                <input 
                  type="email" id="email" className="floating-input" placeholder=" " required 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="email" className="floating-label">Email address</label>
              </div>

              <button type="submit" className="btn-submit" disabled={loading || cooldown > 0}>
                {loading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send Reset Link"}
              </button>
            </form>
          ) : (
            /* FORM 2: SET NEW PASSWORD */
            <form className="form-group" onSubmit={handleExecuteReset}>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="newPassword" className="floating-input" placeholder=" " required minLength={6}
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                />
                <label htmlFor="newPassword" className="floating-label">New Password</label>
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>

              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="confirmPassword" className="floating-input" placeholder=" " required minLength={6}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <label htmlFor="confirmPassword" className="floating-label">Confirm Password</label>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="form-footer" style={{ marginTop: '1.5rem' }}>
            <Link href="/login" className="text-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              Back to Login
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
             <img src="/CodeScriptLogo.png" alt="CodeScript Logo" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
          </div>
          
          <div className="brand-text">
            <h2>Secure Recovery</h2>
            <div className="brand-line"></div>
            <p>
              Your security is our priority. Set a strong password to protect your Godavari Global University account.
            </p>
          </div>
        </div>

        <div className="copyright-footer">
          © {new Date().getFullYear()} Godavari Global University. All rights reserved.
        </div>
      </div>

    </div>
  );
}

// Next.js 13+ requires components using `useSearchParams` to be wrapped in a Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}