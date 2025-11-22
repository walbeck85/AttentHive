'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
      } catch (err) {
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

  if (loading) return <div className="p-6 text-center text-[#6B6B6B]">Loading profile...</div>;
  if (error || !pet) return <div className="p-6 text-center text-red-500">{error || 'Pet not found'}</div>;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-white border-b border-[#F4D5B8] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="mr-4 p-2 hover:bg-gray-100 rounded-full text-[#6B6B6B]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#4A4A4A]">{pet.name}</h1>
          </div>
          {/* Edit button could go here in future */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        
        {/* Main Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#F4D5B8]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-3xl mb-2">{pet.type === 'DOG' ? '🐕' : '🐱'}</p>
              <h2 className="text-2xl font-bold text-[#D17D45]">{pet.name}</h2>
              <p className="text-[#6B6B6B]">{pet.breed}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#FAF7F2] text-[#D17D45] rounded-full text-sm font-medium">
                {pet.gender === 'MALE' ? 'Male' : 'Female'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-t border-[#F4D5B8]">
            <div>
              <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-bold">Age</p>
              <p className="text-lg font-medium text-[#4A4A4A]">{calculateAge(pet.birthDate)} years</p>
            </div>
            <div>
              <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-bold">Weight</p>
              <p className="text-lg font-medium text-[#4A4A4A]">{pet.weight} lbs</p>
            </div>
          </div>

          {/* Special Needs Section - Only shows if data exists */}
          {pet.specialNeeds && (
            <div className="mt-4 pt-4 border-t border-[#F4D5B8]">
              <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-bold mb-2">
                Special Needs / Notes
              </p>
              <div className="bg-[#FFF8E1] p-3 rounded-lg text-[#F57F17] text-sm">
                {pet.specialNeeds}
              </div>
            </div>
          )}
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-[#F4D5B8]">
          <h3 className="font-bold text-[#4A4A4A] mb-4">Actions</h3>
          <Link 
            href={`/pets/${pet.id}/activity`}
            className="block w-full py-3 px-4 bg-[#FAF7F2] text-[#D17D45] text-center rounded-lg font-medium hover:bg-[#F4D5B8] transition-colors"
          >
            View Full Activity Log →
          </Link>
        </div>
      </div>
    </div>
  );
}