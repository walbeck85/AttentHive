'use client';

import { useEffect, useState } from 'react';
import ConfirmActionModal from './ConfirmActionModal';

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

type PendingAction = {
  petId: string;
  petName: string;
  actionType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
} | null;

export default function PetList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


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

  // Step 1: User clicks a button - show modal
const handleQuickAction = (petId: string, petName: string, actionType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT') => {
  setPendingAction({ petId, petName, actionType });
};

  // Step 2: User confirms - call API
  const handleConfirmAction = async () => {
    if (!pendingAction || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/care-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: pendingAction.petId,
          activityType: pendingAction.actionType,
          notes: `Logged via quick action`, // Optional notes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log activity');
      }

      // Success! Show message
      const actionText = pendingAction.actionType.toLowerCase();
      setSuccessMessage(`✅ Successfully logged ${actionText} for ${pendingAction.petName}!`);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Close modal
      setPendingAction(null);

    } catch (err) {
      console.error('Error logging activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: User cancels - close modal
  const handleCancelAction = () => {
    setPendingAction(null);
  };

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
    <>
      {/* Success Toast */}
      {successMessage && (
        <div 
          className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-fade-in"
          style={{ backgroundColor: '#4CAF50', color: 'white' }}
        >
          {successMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#D17D45' }}>
          My Pets ({pets.length})
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white shadow-lg transition-all"
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

              {/* Quick Actions Section */}
              <div className="mt-6 pt-4 border-t-2" style={{ borderColor: '#F4D5B8' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#4A4A4A' }}>
                  Quick Actions:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickAction(pet.id, pet.name, 'FEED')}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: '#D17D45' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8663D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D17D45'}
                  >
                    🍽️ Feed
                  </button>
                  <button
                    onClick={() => handleQuickAction(pet.id, pet.name, 'WALK')}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: '#D17D45' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8663D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D17D45'}
                  >
                    🚶 Walk
                  </button>
                  <button
                    onClick={() => handleQuickAction(pet.id, pet.name, 'MEDICATE')}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: '#D17D45' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8663D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D17D45'}
                  >
                    💊 Medicate
                  </button>
                  <button
                    onClick={() => handleQuickAction(pet.id, pet.name, 'ACCIDENT')}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFCDD2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFEBEE'}
                  >
                    ⚠️ Accident
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingAction && (
        <ConfirmActionModal
          isOpen={true}
          petName={pendingAction.petName}
          actionType={pendingAction.actionType}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
        />
      )}
    </>
  );
}