"use client";

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import "./student.css";

export default function StudentLayout({ children }) {
  return (
    // 🛡️ Only users with the STUDENT role can access these routes
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="student-layout-wrapper" style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </AuthGuard>
  );
}