'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
      });
      // NextAuth will handle the redirect; no manual router.push needed here.
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Unable to sign in with Google right now. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="mm-page">
      <main className="mm-shell max-w-2xl mx-auto py-10">
        <section className="mm-card px-6 py-8 md:px-8 md:py-9">
          <div className="text-center mb-8">
            <p className="mm-kicker mb-2">Welcome back</p>
            <h1 className="mm-h2 tracking-[0.18em] uppercase text-[#382110]">
              Sign in to Mimamori
            </h1>
            <p className="mm-muted mt-3">
              Log in to view your household&apos;s care activity.
            </p>
          </div>

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
            {isGoogleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-[#E5D9C6]" />
            <span className="mx-3 text-[11px] uppercase tracking-[0.16em] text-[#8A7A62]">
              Or sign in with email
            </span>
            <div className="flex-1 h-px bg-[#E5D9C6]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mm-label mb-1 block">Password</label>
              <input
                type="password"
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
              {isEmailLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

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