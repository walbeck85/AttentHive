// src/app/pets/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dog, Cat } from 'lucide-react';

type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  notes?: string | null;
  user: { name: string | null };
};

type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  careLogs: CareLog[];
};

// helpers ------------------------------------------------------

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

function getActivityLabel(type: ActionType): string {
  switch (type) {
    case 'FEED':
      return 'Feed';
    case 'WALK':
      return 'Walk';
    case 'MEDICATE':
      return 'Medicate';
    case 'ACCIDENT':
      return 'Accident';
    default:
      return 'Log';
  }
}

// page --------------------------------------------------------

export default function PetDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const petId = params?.id;

  const [pet, setPet] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!petId) return;

    const fetchPet = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/pets/${petId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load pet details');
        }

        setPet(data.pet);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : 'Failed to load pet details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [petId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex items-center justify-center">
        <p className="mm-muted">Loading pet details…</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex flex-col items-center justify-center gap-4">
        <p className="text-[#382110] text-lg font-semibold">
          Failed to load pet details
        </p>
        {error && <p className="mm-muted text-sm">{error}</p>}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mm-chip mm-chip--solid-primary"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const lastLog = pet.careLogs[0];

  return (
    <div className="mm-page">
      <main className="mm-shell space-y-6">
        {/* Back + header */}
        <section className="mm-section">
          <button
            type="button"
            onClick={() => router.back()}
            className="mm-chip"
          >
            ← Back
          </button>

          <div className="mt-4 mm-card px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D17D45] bg-[#FAF3E7]">
                {pet.type === 'DOG' ? (
                  <Dog className="h-5 w-5 text-[#D17D45]" />
                ) : (
                  <Cat className="h-5 w-5 text-[#D17D45]" />
                )}
              </div>

              <div>
                <h1 className="mm-h2">{pet.name}</h1>
                <p className="text-sm font-medium uppercase tracking-wide text-[#A08C72]">
                  {pet.breed}
                </p>
              </div>
            </div>

            <div className="text-right text-sm text-[#A08C72]">
              <div>
                {calculateAge(pet.birthDate)} yrs • {pet.weight} lbs
              </div>
              <div>{pet.gender === 'MALE' ? 'Male' : 'Female'}</div>
            </div>
          </div>
        </section>

        {/* Stats / attributes */}
        <section className="mm-section">
          <div className="mm-card px-5 py-4">
            <dl className="grid grid-cols-3 gap-y-2 text-xs uppercase tracking-wide text-[#B09A7C]">
              <div>
                <dt>Age</dt>
                <dd className="mt-1 font-medium normal-case text-[#382110]">
                  {calculateAge(pet.birthDate)} yrs
                </dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd className="mt-1 font-medium normal-case text-[#382110]">
                  {pet.weight} lbs
                </dd>
              </div>
              <div>
                <dt>Sex</dt>
                <dd className="mt-1 font-medium normal-case text-[#382110]">
                  {pet.gender === 'MALE' ? 'Male' : 'Female'}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Recent activity */}
        <section className="mm-section">
          <div className="mm-card px-5 py-4">
            <h2 className="mm-h3 mb-3">Recent activity</h2>

            {pet.careLogs.length === 0 && (
              <p className="mm-muted-sm">No activity logged yet.</p>
            )}

            {pet.careLogs.length > 0 && (
              <ul className="space-y-3 text-sm">
                {pet.careLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start justify-between border-b border-[#E5D9C6]/60 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-[#382110]">
                        {getActivityLabel(log.activityType)}
                      </p>
                      <p className="mm-muted-sm">
                        by{' '}
                        <span className="text-[#D17D45] font-medium">
                          {log.user?.name || 'Someone'}
                        </span>
                      </p>
                      {log.notes && (
                        <p className="mt-1 text-xs text-[#7A6A56]">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <p className="mm-meta">{formatDateTime(log.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}