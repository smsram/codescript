"use client";

import React, { useState } from 'react';
import { auth } from '@/utils/firebase'; 
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function GoogleAuthButton({ actionText = "Continue", className = "btn-sso" }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.displayName })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Google Authentication failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }

    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert(error.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  return (
    <button className={className} type="button" onClick={handleGoogleSignIn} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
      {loading ? (
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        </svg>
      )}
      {/* 🚀 Removed the word "University" */}
      <span>{loading ? "Connecting..." : `${actionText} with Email`}</span>
    </button>
  );
}