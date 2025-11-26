// src/components/NavBar.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'var(--mm-green)' }} // <- use token
    >
      <div className="mm-page flex items-center justify-between py-3">
        <span className="mm-nav-brand text-sm sm:text-base tracking-[0.16em]">
          MIMAMORI
        </span>

        <div className="flex items-center gap-3">
          {session?.user?.email && (
            <span className="hidden sm:inline text-xs text-white/80">
              {session.user.email}
            </span>
          )}

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] rounded-full border border-white/80 bg-white/10 text-white px-3 py-1 hover:bg-white hover:text-[color:var(--mm-green)] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}