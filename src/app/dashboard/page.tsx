'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AddPetForm from '@/components/pets/AddPetForm';
import PetList from '@/components/pets/PetList';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePetAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b" style={{ borderColor: '#F4D5B8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold" style={{ color: '#D17D45' }}>
                Mimamori
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm" style={{ color: '#4A4A4A' }}>
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#D17D45' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8663D'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D17D45'}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Add Pet Form */}
          <AddPetForm onPetAdded={handlePetAdded} />

          {/* Divider */}
          <div className="my-8"></div>

          {/* Pet List */}
          <PetList refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}