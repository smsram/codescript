"use client";

import { usePathname } from 'next/navigation';

export default function Topbar({ toggleMenu }) {
  const pathname = usePathname();

  let title = "Dashboard";
  if (pathname.startsWith('/writer/problems')) title = "Problem Bank";
  if (pathname.startsWith('/writer/drafts')) title = "Drafts";
  if (pathname.startsWith('/writer/reviews')) title = "Review Queue";

  return (
    <header className="writer-topbar">
      
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="topbar-title">{title}</span>
      </div>

      <div className="topbar-right">
        {/* Only the Notification Bell remains */}
        <button className="btn-icon-notify">
          <span className="material-symbols-outlined">notifications</span>
          <span className="notify-dot-red"></span>
        </button>
      </div>

    </header>
  );
}