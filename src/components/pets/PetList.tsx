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

  // Calculate age from birth date
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

  // Fetch pets when component mounts
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
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-600">Loading pets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-100 text-red-800 rounded border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600">No pets yet. Add your first pet above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        My Pets ({pets.length})
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
              <span className="text-2xl">
                {pet.type === 'DOG' ? '🐕' : '🐱'}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Breed:</span> {pet.breed}
              </p>
              <p>
                <span className="font-medium">Gender:</span>{' '}
                {pet.gender === 'MALE' ? 'Male' : 'Female'}
              </p>
              <p>
                <span className="font-medium">Age:</span>{' '}
                {calculateAge(pet.birthDate)} years old
              </p>
              <p>
                <span className="font-medium">Weight:</span> {pet.weight} lbs
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}