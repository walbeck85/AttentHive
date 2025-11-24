'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Moon, Sun, Settings, LogOut } from 'lucide-react';

export default function NavBar() {
  const { data: session } = useSession();
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode init (logic can stay even if styling is minimal)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark =
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <nav className="bg-mm-green text-white shadow-md sticky top-0 z-50">
      {/* This container controls the horizontal position of "MIMAMORI" */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="
                text-lg sm:text-xl font-extrabold
                tracking-[0.16em] uppercase
                text-white visited:text-white
                hover:opacity-90 transition-opacity
              "
            >
              MIMAMORI
            </Link>

            {session && (
              <span className="hidden sm:inline-block text-[11px] tracking-[0.18em] uppercase text-mm-cream/80">
                Household Dashboard
              </span>
            )}
          </div>

          {/* Right: User actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {session && (
              <span className="hidden md:block text-xs font-medium text-mm-cream">
                Hi, {session.user?.name || 'Caregiver'}!
              </span>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="
                flex items-center justify-center
                h-8 w-8 rounded-full border border-white/60
                bg-mm-green
                text-white
                hover:bg-white hover:text-mm-green
                transition-colors
              "
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Settings */}
            <button
              type="button"
              aria-label="Open settings"
              className="
                hidden sm:flex items-center justify-center
                h-8 w-8 rounded-full border border-white/60
                bg-mm-green
                text-white
                hover:bg-white hover:text-mm-green
                transition-colors
              "
            >
              <Settings size={16} />
            </button>

            {/* Logout / Login */}
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="
                  flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase
                  tracking-[0.16em]
                  border border-white/70 rounded-full px-3 py-1
                  bg-mm-green text-white
                  hover:bg-white hover:text-mm-green
                  transition-colors
                "
              >
                <LogOut size={14} />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="
                  text-xs font-bold uppercase tracking-[0.16em]
                  border border-white/70 rounded-full px-3 py-1
                  bg-mm-green text-white
                  hover:bg-white hover:text-mm-green
                  transition-colors
                "
              >
                User Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}