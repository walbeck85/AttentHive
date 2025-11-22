'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ConfirmActionModal from './ConfirmActionModal';
import PetCard, { PetData } from './PetCard';

// Types for Local State
type PendingAction = {
  petId: string;
  petName: string;
  actionType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
} | null;

export default function PetList({ refreshTrigger }: { refreshTrigger?: number }) {
  const { data: session } = useSession();
  const [pets, setPets] = useState<PetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal & Action State
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch('/api/pets');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load pets');
        setPets(data.pets);
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, [refreshTrigger]);

  // API Handler
  const handleConfirmAction = async () => {
    if (!pendingAction || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: pendingAction.petId,
          activityType: pendingAction.actionType,
          notes: 'Logged via quick action',
        }),
      });

      if (!response.ok) throw new Error('Failed to log activity');

      // Success Feedback
      setSuccessMessage(`✅ Logged ${pendingAction.actionType.toLowerCase()} for ${pendingAction.petName}!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Optimistic UI Update
      setPets(current => current.map(pet => {
        if (pet.id === pendingAction.petId) {
          return {
            ...pet,
            careLogs: [{
              id: Date.now().toString(),
              activityType: pendingAction.actionType,
              createdAt: new Date().toISOString(),
              user: { name: session?.user?.name || 'You' }
            }]
          };
        }
        return pet;
      }));

    } catch (err) {
      console.error(err);
      // Optional: Use a better UI notification here instead of alert in future polish
      alert('Failed to log activity. Please try again.');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  // Loading / Error / Empty States
  if (loading) return <div className="max-w-6xl mx-auto p-6 text-[#4A4A4A]">Loading pets...</div>;
  if (error) return <div className="max-w-6xl mx-auto p-6 text-red-500">{error}</div>;
  if (pets.length === 0) return (
    <div className="max-w-6xl mx-auto p-6 text-center py-12 bg-white rounded-xl border-2 border-dashed border-[#F4D5B8]">
      <p className="text-lg text-[#4A4A4A]">No pets yet. Add your first pet above! 🐾</p>
    </div>
  );

  return (
    <>
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg bg-[#4CAF50] text-white animate-fade-in">
          {successMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6 text-[#D17D45]">
          My Pets ({pets.length})
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              currentUserName={session?.user?.name}
              onQuickAction={(id, name, type) => setPendingAction({ 
                petId: id, petName: name, actionType: type 
              })}
            />
          ))}
        </div>
      </div>

      {/* Shared Modal */}
      {pendingAction && (
        <ConfirmActionModal
          isOpen={true}
          petName={pendingAction.petName}
          actionType={pendingAction.actionType}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </>
  );
}