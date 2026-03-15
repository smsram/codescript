"use client";

import { useEffect } from 'react';

export default function GlobalStorageFix() {
  useEffect(() => {
    // 1. Save the original browser function
    const originalGetItem = Storage.prototype.getItem;

    // 2. Override the browser's native getItem function
    Storage.prototype.getItem = function(key) {
      
      // 3. If a page asks for 'token' or 'user', apply our magic logic
      if (key === 'token' || key === 'user') {
        
        // First, check the storage the page originally asked for
        const val = originalGetItem.call(this, key);
        if (val !== null) return val;
        
        // If it's missing, automatically check the OTHER storage!
        if (this === window.localStorage) {
          return originalGetItem.call(window.sessionStorage, key);
        } else if (this === window.sessionStorage) {
          return originalGetItem.call(window.localStorage, key);
        }
      }

      // 4. For everything else (themes, preferences), behave normally
      return originalGetItem.call(this, key);
    };
  }, []);

  return null; // This component renders nothing, it just fixes the browser logic
}