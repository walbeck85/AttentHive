'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mm-page">
      <main className="mm-shell max-w-2xl mx-auto py-10">
        <section className="mm-card px-6 py-8 md:px-8 md:py-9">
          <div className="text-center mb-8">
            <p className="mm-kicker mb-2">Create account</p>
            <h1 className="mm-h2 tracking-[0.18em] uppercase text-[#382110]">
              Join Mimamori
            </h1>
            <p className="mm-muted mt-3">
              Set up a shared space to track care across your household.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="mm-label mb-1 block">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                required
              />
            </div>

            <div>
              <label className="mm-label mb-1 block">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                required
              />
            </div>

            <div>
              <label className="mm-label mb-1 block">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="
                  w-full rounded-md border border-[#E5D9C6] bg-white
                  px-3 py-2 text-sm text-[#382110]
                  focus:outline-none focus:ring-2 focus:ring-[#3E5C2E] focus:border-[#3E5C2E]
                "
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mm-muted-sm text-center mt-5">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#382110] underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}