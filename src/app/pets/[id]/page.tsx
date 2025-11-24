'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Dog, Cat } from 'lucide-react';

type Pet = {
  id: string;
  name: string;
  type: 'DOG' | 'CAT';
  breed: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  weight: number;
  specialNeeds: string | null;
};

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params?.id as string;

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!petId) return;

    const fetchPet = async () => {
      try {
        const response = await fetch(`/api/pets/${petId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to load pet');

        setPet(data.pet);
      } catch (_err) {
        setError('Failed to load pet details');
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [petId]);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="mm-page flex items-center justify-center">
        <p className="mm-muted">Loading profile...</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="mm-page flex items-center justify-center">
        <p className="text-sm text-red-600">{error || 'Pet not found'}</p>
      </div>
    );
  }

  const ageYears = calculateAge(pet.birthDate);

  return (
    <div className="mm-page">
      <main className="mm-shell py-6 space-y-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="
            inline-flex items-center gap-2
            rounded-full border border-[#E5D9C6]
            bg-[#FFF9F0] px-3 py-1
            text-[11px] font-semibold uppercase tracking-[0.16em]
            text-[#7A6A56]
            hover:bg-[#F5F3EA]
            transition-colors
          "
        >
          <span className="text-xs">←</span>
          Back to dashboard
        </button>

        {/* Hero profile card */}
        <section className="mm-card px-6 py-6 md:px-7 md:py-7">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D17D45] bg-[#FAF3E7]">
                {pet.type === 'DOG' ? (
                  <Dog className="h-4 w-4 text-[#D17D45]" />
                ) : (
                  <Cat className="h-4 w-4 text-[#D17D45]" />
                )}
              </div>
              <div>
                <p className="mm-kicker">Care profile</p>
                <h1 className="mm-h1 flex items-baseline gap-2">
                  {pet.name}
                </h1>
                <p className="mt-1 text-sm uppercase tracking-[0.16em] text-[#A08C72]">
                  {pet.breed}
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-[#A08C72] space-y-1">
              <div>
                {ageYears} yrs • {pet.weight} lbs
              </div>
              <div>{pet.gender === 'MALE' ? 'Male' : 'Female'}</div>
            </div>
          </div>

          {/* Divider + stats grid */}
          <div className="mt-6 border-t border-[#E5D9C6] pt-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B09A7C]">
                  Age
                </dt>
                <dd className="mt-1 text-base font-semibold text-[#382110]">
                  {ageYears} years
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B09A7C]">
                  Weight
                </dt>
                <dd className="mt-1 text-base font-semibold text-[#382110]">
                  {pet.weight} lbs
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B09A7C]">
                  Sex
                </dt>
                <dd className="mt-1 text-base font-semibold text-[#382110]">
                  {pet.gender === 'MALE' ? 'Male' : 'Female'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Special needs, if present */}
          {pet.specialNeeds && (
            <div className="mt-6 border-t border-[#E5D9C6] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B09A7C] mb-2">
                Special needs / notes
              </p>
              <div className="rounded-lg bg-[#FFF8E1] px-4 py-3 text-sm text-[#7A5A1F]">
                {pet.specialNeeds}
              </div>
            </div>
          )}
        </section>

        {/* Activity teaser card */}
        <section className="mm-card px-6 py-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B09A7C]">
            Activity
          </p>
          <p className="mm-muted">
            Review every walk, meal, medication, and oops moment for{' '}
            <span className="font-semibold text-[#382110]">{pet.name}</span>.
          </p>
          <div className="pt-2">
            <Link
              href={`/pets/${pet.id}/activity`}
              className="
                inline-flex w-full items-center justify-center
                rounded-full border border-[#3E5C2E]
                bg-[#3E5C2E] px-4 py-2.5
                text-[11px] font-bold uppercase tracking-[0.16em]
                text-white
                hover:bg-[#2f4a24]
                transition-colors
              "
            >
              View full activity log
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}