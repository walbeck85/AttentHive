// src/components/NavBar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function NavBar() {
  const { data: session } = useSession();

  const handleLogoutClick = () => {
    // Client-side sign out; NextAuth will clear the session and bounce to /login
    signOut({ callbackUrl: '/login' });
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'var(--mm-green)' }}
    >
      <div className="mm-page flex items-center justify-between py-3">
        <span className="mm-nav-brand text-xs sm:text-sm">
          MIMAMORI
        </span>

        <div className="flex items-center gap-2 sm:gap-3">
          {session?.user && (
            <span className="hidden sm:inline text-xs text-white/80">
              {session.user.name || session.user.email}
            </span>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard" className="nav-pill">
              Dashboard
            </Link>

            <Link href="/care-circle" className="nav-pill">
              Care Circle
            </Link>

            <Link href="/account" className="nav-pill">
              My Profile
            </Link>

            <button
              type="button"
              className="nav-pill"
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}