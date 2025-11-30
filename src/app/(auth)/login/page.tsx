// Mark as client component since we need interactivity (form handling, state)
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  // Router for programmatic navigation after successful login
  const router = useRouter();

  // Form field state - controlled inputs for email/password validation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Error state to display user-friendly messages on auth failures
  const [error, setError] = useState<string | null>(null);

  // Separate loading states prevent concurrent submissions and provide specific UI feedback
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    // Clear any previous errors before new attempt
    setError(null);
    setIsGoogleLoading(true);

    try {
      // signIn('google') triggers OAuth flow - NextAuth handles popup/redirect to Google
      await signIn('google', {
        callbackUrl: '/dashboard', // Where to send user after successful Google auth
      });
      // NextAuth will handle the redirect; no manual router.push needed here.
    } catch (err) {
      // Log full error for debugging while showing user-friendly message
      console.error('Google sign-in error:', err);
      setError('Unable to sign in with Google right now. Please try again.');
      // Reset loading only on error - success cases redirect away
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission - this handles auth client-side
    e.preventDefault();
    setIsEmailLoading(true);
    setError(null);

    try {
      // Use 'credentials' provider for email/password auth
      // redirect: false lets us handle errors before navigating
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Return result instead of auto-redirecting
      });

      if (result?.error) {
        // Generic message for security - don't reveal if email exists
        setError('Invalid email or password');
      } else {
        // Success: navigate to dashboard and refresh to update session
        router.push('/dashboard');
        router.refresh(); // Refresh server components to reflect new auth state
      }
    } catch (err) {
      // Catch network errors or other unexpected issues
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      // Always reset loading state when done
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="mm-page">
      <main className="mm-shell max-w-2xl mx-auto py-10">
        <section className="mm-card px-6 py-8 md:px-8 md:py-9">
          {/* Header section with brand messaging */}
          <div className="text-center mb-8">
            <p className="mm-kicker mb-2">Welcome back</p>
            <h1 className="mm-h2 tracking-[0.18em] uppercase text-[#382110]">
              Sign in to Mimamori
            </h1>
            <p className="mm-muted mt-3">
              Log in to view your household&apos;s care activity.
            </p>
          </div>

          {/* Google OAuth button - prioritized as faster/more secure option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isEmailLoading} // Prevent both methods running simultaneously
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
            {/* Conditional text shows loading state for better UX */}
            {isGoogleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Visual divider between OAuth and email/password options */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-[#E5D9C6]" />
            <span className="mx-3 text-[11px] uppercase tracking-[0.16em] text-[#8A7A62]">
              Or sign in with email
            </span>
            <div className="flex-1 h-px bg-[#E5D9C6]" />
          </div>

          {/* Email/password form - controlled inputs for validation */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Conditionally render error banner when auth fails */}
            {error && (
              <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="mm-label mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update state on each keystroke
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                placeholder="you@example.com"
                required // HTML5 validation for basic email format
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
              disabled={isEmailLoading || isGoogleLoading} // Prevent concurrent auth attempts
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
              {/* Dynamic button text for loading feedback */}
              {isEmailLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Link to signup page for new users */}
          <p className="mm-muted-sm text-center mt-5">
            New to Mimamori?{' '}
            <Link
              href="/signup"
              className="font-semibold text-[#382110] underline underline-offset-2"
            >
              Create an account
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}