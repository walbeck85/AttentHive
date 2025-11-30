// Mark as client component for form handling and state management
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignupPage() {
  // Router for navigation after successful signup
  const router = useRouter();

  // Form state - name is required for signup but not for login
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Separate loading states for different signup methods
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      // OAuth flow handles both signup and login - Google creates account if new
      await signIn('google', {
        callbackUrl: '/dashboard',
      });
      // NextAuth handles redirects; nothing else to do here.
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError('Unable to sign up with Google right now. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailLoading(true);

    try {
      // Step 1: Create user account via custom API route
      // Separate from NextAuth to hash password and store in database
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        // Try to parse error message from API response
        const data = await res.json().catch(() => null);
        const message =
          data?.error ||
          data?.message ||
          'Unable to create your account. Please check your details and try again.';
        setError(message);
        return; // Exit early on signup failure
      }

      // Step 2: Auto-login after successful signup for better UX
      // Avoids requiring users to manually log in after creating account
      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false, // Handle navigation manually below
      });

      if (loginResult?.error) {
        // Account exists but login failed - inform user to try manually
        console.error('Auto-login after signup failed:', loginResult.error);
        setError(
          'Your account was created, but we could not log you in automatically. Please try signing in.'
        );
        return;
      }

      // Step 3: Navigate to dashboard on successful signup + login
      router.push('/dashboard');
      router.refresh(); // Update server components with new session
    } catch (err) {
      // Catch network errors or other unexpected failures
      console.error('Signup error:', err);
      setError('An unexpected error occurred while creating your account.');
    } finally {
      // Always reset loading state when done
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="mm-page">
      <main className="mm-shell max-w-2xl mx-auto py-10">
        <section className="mm-card px-6 py-8 md:px-8 md:py-9">
          {/* Header with messaging tailored for new users */}
          <div className="text-center mb-8">
            <p className="mm-kicker mb-2">Get started</p>
            <h1 className="mm-h2 tracking-[0.18em] uppercase text-[#382110]">
              Create your Mimamori account
            </h1>
            <p className="mm-muted mt-3">
              Set up your household so you can start logging care activity.
            </p>
          </div>

          {/* Google OAuth - same signIn call works for both signup and login */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isEmailLoading}
            className="
              w-full mb-4 rounded-full
              border border-[#E5D9C6] bg-white
              text-[11px] font-bold uppercase tracking-[0.16em]
              py-2.5
              hover:bg-[#FAF7F2]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isGoogleLoading ? 'Continuing with Google…' : 'Continue with Google'}
          </button>

          {/* Visual divider between auth methods */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-[#E5D9C6]" />
            <span className="mx-3 text-[11px] uppercase tracking-[0.16em] text-[#8A7A62]">
              Or sign up with email
            </span>
            <div className="flex-1 h-px bg-[#E5D9C6]" />
          </div>

          {/* Signup form - includes name field unlike login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error banner for signup or auto-login failures */}
            {error && (
              <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="mm-label mb-1 block">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                placeholder="Alex Example"
                required
              />
            </div>

            <div>
              <label className="mm-label mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                placeholder="you@example.com"
                required // HTML5 validation for email format
              />
            </div>

            <div>
              <label className="mm-label mb-1 block">Password</label>
              <input
                type="password" // Masks input for security
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                required
              />
            </div>

            <button
              type="submit"
              disabled={isEmailLoading || isGoogleLoading}
              className="
                w-full mt-2 rounded-full
                bg-[#3E5C2E] text-white
                text-[11px] font-bold uppercase tracking-[0.16em]
                py-2.5
                hover:bg-[#2f4a24]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {/* Dynamic button text shows progress through multi-step signup */}
              {isEmailLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Link to login for existing users */}
          <p className="mm-muted-sm text-center mt-5">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#382110] underline underline-offset-2"
            >
              Sign in instead
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}