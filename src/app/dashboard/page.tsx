'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AddPetForm from '@/components/pets/AddPetForm';
import PetList from '@/components/pets/PetList';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePetAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="mm-page">
        <main className="mm-shell flex items-center justify-center">
          <p className="mm-muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="mm-page">
      <main className="mm-shell">
        {/* Hero header */}
        <section className="mm-section mb-6">
          <div className="rounded-lg border border-[#E5D9C6] bg-[#FDF7EE] px-4 py-4 sm:px-6 sm:py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mm-kicker text-[11px] tracking-[0.22em] text-[#8B7A65]">
                  Dashboard
                </p>
                <h1 className="mm-h1 mt-1">Manage your home</h1>
                <p className="mm-muted mt-1 text-sm max-w-xl">
                  Keep track of pets, plants, family, and housemates you&apos;re
                  caring for in one place.
                </p>
              </div>

              <div className="flex flex-col items-start gap-1 text-xs sm:items-end">
                <p className="mm-muted">
                  Signed in as{' '}
                  <span className="font-semibold text-mm-ink">
                    {session.user?.email}
                  </span>
                </p>
                <p className="text-[11px] uppercase tracking-wide text-[#A08C72]">
                  Household dashboard
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Add Pet panel */}
        <section className="mm-section mb-8">
          <AddPetForm onPetAdded={handlePetAdded} />
        </section>

        {/* Pet grid / list */}
        <section className="mm-section">
          <PetList refreshTrigger={refreshTrigger} />
        </section>
      </main>
    </div>
  );
}