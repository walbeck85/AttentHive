// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function NavBar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    // Client-side sign out; NextAuth will clear the session and bounce to /login
    signOut({ callbackUrl: "/login" });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5D9C6] bg-[#3E5C2E]">
      {/* Top bar ------------------------------------------------------------ */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
        <div className="flex items-center gap-5">
          {/* Mobile hamburger – hidden on desktop */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/80 bg-[#2F4A24] text-white shadow-sm"
          >
            {/* Use a literal hamburger glyph so Tailwind can't mangle it */}
            <span className="text-2xl leading-none">≡</span>
          </button>

          {/* Brand */}
          <span className="mm-nav-brand text-sm sm:text-base font-extrabold tracking-[0.16em] text-white uppercase">MIMAMORI</span>
        </div>

        {/* Desktop nav pills ------------------------------------------------ */}
        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          {session?.user && (
            <span className="text-xs text-white/80 mr-2">
              {session.user.name || session.user.email}
            </span>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
            >
              Dashboard
            </Link>

            <Link
              href="/care-circle"
              className="inline-flex items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
            >
              Care Circle
            </Link>

            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
            >
              My Profile
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile slide-out drawer ------------------------------------------- */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className="fixed inset-0 z-40 bg-black/25 sm:hidden"
          />

          {/* Drawer panel (left side, narrow like GitHub) */}
          <div className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[#3E5C2E] px-4 py-4 shadow-xl sm:hidden">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.18em] text-white">
                MENU
              </span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-md border border-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
              >
                Close
              </button>
            </div>

            {/* We intentionally do NOT show "Signed in as…" here – it already
               appears in the page header and would just add noise in this panel. */}

            <div className="mt-2 flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-[0.4375rem] text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>

              <Link
                href="/care-circle"
                className="inline-flex w-full items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-[0.4375rem] text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
                onClick={closeMobileMenu}
              >
                Care Circle
              </Link>

              <Link
                href="/account"
                className="inline-flex w-full items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-[0.4375rem] text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
                onClick={closeMobileMenu}
              >
                My Profile
              </Link>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-full border border-[#382110] bg-white px-4 py-[0.4375rem] text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-[#382110] hover:bg-[#f4ede4] hover:no-underline"
                onClick={() => {
                  closeMobileMenu();
                  handleLogoutClick();
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}