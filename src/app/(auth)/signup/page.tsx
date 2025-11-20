'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
      } else {
        router.push('/login?signup=success');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-md w-full bg-white shadow-lg p-8" style={{ borderRadius: '16px' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#D17D45' }}>
            Mimamori
          </h1>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Create your account to get started.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: '2px solid #EF5350' }}>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
              style={{
                borderRadius: '12px',
                borderColor: '#F4D5B8',
                backgroundColor: '#FEFEFE'
              }}
              onFocus={(e) => e.target.style.borderColor = '#D17D45'}
              onBlur={(e) => e.target.style.borderColor = '#F4D5B8'}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
              style={{
                borderRadius: '12px',
                borderColor: '#F4D5B8',
                backgroundColor: '#FEFEFE'
              }}
              onFocus={(e) => e.target.style.borderColor = '#D17D45'}
              onBlur={(e) => e.target.style.borderColor = '#F4D5B8'}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
              style={{
                borderRadius: '12px',
                borderColor: '#F4D5B8',
                backgroundColor: '#FEFEFE'
              }}
              onFocus={(e) => e.target.style.borderColor = '#D17D45'}
              onBlur={(e) => e.target.style.borderColor = '#F4D5B8'}
            />
            <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
              Must be at least 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 font-semibold text-white text-lg transition-all shadow-md"
            style={{
              borderRadius: '12px',
              backgroundColor: isLoading ? '#D1D5DB' : '#D17D45',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#B8663D')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#D17D45')}
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#D17D45' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}