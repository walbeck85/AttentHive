'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ConfirmActionModal from './ConfirmActionModal';

// 1. Types
type CareLog = {
  id: string;
  activityType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
};

type Pet = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  createdAt: string;
  careLogs: CareLog[];
};

type PendingAction = {
  petId: string;
  petName: string;
  actionType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
} | null;

export default function PetList({ refreshTrigger }: { refreshTrigger?: number }) {
  const { data: session } = useSession();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- Helpers --

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  const getActivityConfig = (type: string) => {
    switch (type) {
      case 'FEED': return { icon: '🍽️', verb: 'fed', color: '#D17D45' }; // Brand Orange
      case 'WALK': return { icon: '🚶', verb: 'walked', color: '#2E7D32' }; // Green
      case 'MEDICATE': return { icon: '💊', verb: 'medicated', color: '#7B1FA2' }; // Purple
      case 'ACCIDENT': return { icon: '⚠️', verb: 'reported accident for', color: '#C62828' }; // Red
      default: return { icon: '📝', verb: 'logged activity for', color: '#6B6B6B' };
    }
  };

  // -- Effects --

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

  // -- Handlers --

  const handleQuickAction = (petId: string, petName: string, actionType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT') => {
    setPendingAction({ petId, petName, actionType });
  };

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
          notes: `Logged via quick action`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log activity');
      }

      const actionText = pendingAction.actionType.toLowerCase();
      setSuccessMessage(`✅ Successfully logged ${actionText} for ${pendingAction.petName}!`);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Optimistic Update
      setPets(currentPets => currentPets.map(pet => {
        if (pet.id === pendingAction.petId) {
          return {
            ...pet,
            careLogs: [{
              id: Date.now().toString(),
              activityType: pendingAction.actionType,
              notes: null,
              createdAt: new Date().toISOString(),
              user: {
                id: session?.user?.name || 'unknown',
                name: session?.user?.name || 'You'
              }
            }]
          };
        }
        return pet;
      }));

      setPendingAction(null);

    } catch (err) {
      console.error('Error logging activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
  };

  // -- Render States --

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

  // -- Main Render --

  return (
    <>
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
          {pets.map((pet) => {
            const lastLog = pet.careLogs && pet.careLogs[0];
            const activityConfig = lastLog ? getActivityConfig(lastLog.activityType) : null;
            const isCurrentUser = lastLog?.user.name === session?.user?.name;
            const displayName = isCurrentUser ? 'You' : lastLog?.user.name;

            return (
              <div
                key={pet.id}
                className="bg-white shadow-lg transition-all flex flex-col"
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

                <div className="space-y-3 flex-grow">
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

                {/* --- Recent Activity Section --- */}
                <div className="mt-6 pt-4 border-t" style={{ borderColor: '#F4D5B8' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>
                      Recent Activity
                    </p>
                    <Link 
                      href={`/pets/${pet.id}/activity`}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#D17D45' }}
                    >
                      View All
                    </Link>
                  </div>
                  
                  {lastLog && activityConfig ? (
                    <div className="flex items-center text-sm rounded-lg p-2" style={{ backgroundColor: '#FAF7F2' }}>
                      <span className="text-lg mr-2" role="img" aria-label="activity icon">
                        {activityConfig.icon}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium" style={{ color: '#4A4A4A' }}>
                          {displayName} <span style={{ color: activityConfig.color }}>{activityConfig.verb}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(lastLog.createdAt)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-400 italic p-2">
                      <span className="mr-2">zzz</span>
                      No recent activity
                    </div>
                  )}
                </div>

                {/* --- Quick Actions Section --- */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#F4D5B8' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#4A4A4A' }}>
                    Quick Actions:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleQuickAction(pet.id, pet.name, 'FEED')}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#D17D45' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8663D'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D17D45'}
                    >
                      <span>🍽️</span> Feed
                    </button>
                    <button
                      onClick={() => handleQuickAction(pet.id, pet.name, 'WALK')}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#D17D45' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8663D'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D17D45'}
                    >
                      <span>🚶</span> Walk
                    </button>
                    <button
                      onClick={() => handleQuickAction(pet.id, pet.name, 'MEDICATE')}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#D17D45' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8663D'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D17D45'}
                    >
                      <span>💊</span> Meds
                    </button>
                    <button
                      onClick={() => handleQuickAction(pet.id, pet.name, 'ACCIDENT')}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFCDD2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFEBEE'}
                    >
                      <span>⚠️</span> Oops
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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