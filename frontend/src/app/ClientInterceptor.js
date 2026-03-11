"use client";

import { useEffect } from 'react';

export default function ClientInterceptor() {
  useEffect(() => {
    // Prevent React Strict Mode from patching fetch twice
    if (typeof window !== 'undefined' && !window.__fetchPatched) {
      window.__fetchPatched = true; 
      
      // 🚀 FIX: Bind to window context to prevent "Illegal Invocation" errors
      const originalFetch = window.fetch.bind(window); 
      
      window.fetch = async (...args) => {
        let [resource, config] = args;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const targetUrl = typeof resource === 'string' ? resource : resource?.url || '';
        
        // 🚀 SMART CHECK: Only modify if using ngrok
        if (apiUrl.includes('ngrok') || targetUrl.includes('ngrok')) {
            config = config || {};
            
            // Handle if the app uses a native Request object instead of a string
            if (resource instanceof Request) {
              resource.headers.set('ngrok-skip-browser-warning', 'true');
              return originalFetch(resource, config);
            } else {
              // Standard string URL fetch
              config.headers = {
                ...config.headers,
                'ngrok-skip-browser-warning': 'true'
              };
              return originalFetch(resource, config);
            }
        }
        
        // If NOT using ngrok, pass EXACTLY the original arguments untouched
        return originalFetch(...args);
      };
    }
  }, []);

  return null; 
}