'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Mimamori</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {session.user?.name}! 🎉
            </h2>
            <p className="text-gray-600 mb-4">
              You're successfully logged in to Mimamori.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800 font-semibold">
                ✅ Authentication working!
              </p>
              <p className="text-sm text-green-700 mt-2">
                Next steps: Build pet dashboard, activity logging, and care circles.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
