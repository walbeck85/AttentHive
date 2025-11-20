'use client';

import { useEffect, useState } from 'react';

type Pet = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  createdAt: string;
};

export default function PetList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch('/api/pets');
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load pets');
        } else {
          setPets(data.pets);
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p style={{ color: '#4A4A4A' }}>Loading pets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: '2px solid #EF5350' }}>
          {error}
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12 bg-white rounded-xl border-2" style={{ borderColor: '#F4D5B8', borderStyle: 'dashed' }}>
          <p className="text-lg" style={{ color: '#4A4A4A' }}>
            No pets yet. Add your first pet above! 🐾
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6" style={{ color: '#D17D45' }}>
        My Pets ({pets.length})
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="bg-white shadow-lg transition-all cursor-pointer"
            style={{ 
              borderRadius: '16px',
              border: '2px solid #F4D5B8',
              padding: '24px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(209, 125, 69, 0.15)';
              e.currentTarget.style.borderColor = '#D17D45';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '#F4D5B8';
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: '#D17D45' }}>
                {pet.name}
              </h3>
              <span className="text-3xl">
                {pet.type === 'DOG' ? '🐕' : '🐱'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm font-semibold" style={{ color: '#4A4A4A', minWidth: '80px' }}>
                  Breed:
                </span>
                <span className="text-sm" style={{ color: '#6B6B6B' }}>
                  {pet.breed}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-sm font-semibold" style={{ color: '#4A4A4A', minWidth: '80px' }}>
                  Gender:
                </span>
                <span className="text-sm" style={{ color: '#6B6B6B' }}>
                  {pet.gender === 'MALE' ? '♂️ Male' : '♀️ Female'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-sm font-semibold" style={{ color: '#4A4A4A', minWidth: '80px' }}>
                  Age:
                </span>
                <span className="text-sm" style={{ color: '#6B6B6B' }}>
                  {calculateAge(pet.birthDate)} years old
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-sm font-semibold" style={{ color: '#4A4A4A', minWidth: '80px' }}>
                  Weight:
                </span>
                <span className="text-sm" style={{ color: '#6B6B6B' }}>
                  {pet.weight} lbs
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}