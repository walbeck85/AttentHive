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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-50 dark:bg-dark-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-500 mb-2 tracking-wide uppercase">User Login</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome to Mimamori</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Username / Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              placeholder="user"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-500 text-white font-bold rounded hover:bg-primary-600 transition-colors disabled:opacity-50 uppercase tracking-wide"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          New user?{' '}
          <Link href="/signup" className="text-primary-500 hover:text-primary-600 hover:underline font-bold">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}