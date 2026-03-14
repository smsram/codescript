"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AuthGuard Component
 * @param {ReactNode} children - The protected content
 * @param {Array} allowedRoles - Optional list of roles permitted (e.g., ['ADMIN', 'STUDENT'])
 */
export default function AuthGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Check for token in localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      // 2. Decode the JWT Payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      // 3. Verify Token Expiration gracefully
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.warn("Auth Guard: Token expired. Redirecting to login...");
        localStorage.clear();
        router.replace('/login');
        return; // Stop execution here
      }

      // 4. Role Authorization Check
      if (allowedRoles.length > 0) {
        if (!payload.role || !allowedRoles.includes(payload.role)) {
          const fallback = payload.role === 'ADMIN' ? '/admin' : '/dashboard';
          router.replace(fallback);
          return; // Stop execution here
        }
      }

      // 5. Success!
      setIsAuthorized(true);

    } catch (error) {
      console.warn("Auth Guard: Invalid token format. Wiping token.");
      localStorage.clear();
      router.replace('/login');
    }
  }, [router, allowedRoles]); 

  // Loading UI with the animated sync icon
  if (!isAuthorized) {
    return (
      <div style={{ 
        display: 'flex', height: '100vh', width: '100vw', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a',
        color: '#f8fafc', gap: '16px', position: 'fixed', top: 0, left: 0, zIndex: 9999
      }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '56px', color: '#0ea5e9' }}>
          sync
        </span>
        <p style={{ fontSize: '14px', fontWeight: 500, opacity: 0.8, letterSpacing: '0.05em' }}>
          VERIFYING ACCESS...
        </p>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { display: inline-block; animation: spin 1.2s linear infinite; }
        `}} />
      </div>
    );
  }

  return <>{children}</>;
}