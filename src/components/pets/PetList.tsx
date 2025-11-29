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
  console.error('Error fetching pets:', err);
  setError('Failed to connect to server');
} finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, [refreshTrigger]);

  // API Handler for quick actions
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

      // Success feedback
      setSuccessMessage(
        `Logged ${pendingAction.actionType.toLowerCase()} for ${pendingAction.petName}.`,
      );
      setTimeout(() => setSuccessMessage(null), 2500);

      // Optimistic UI update – prepend a new log
      setPets((current) =>
        current.map((pet) =>
          pet.id === pendingAction.petId
            ? {
                ...pet,
                careLogs: [
                  {
                    id: Date.now().toString(),
                    activityType: pendingAction.actionType,
                    createdAt: new Date().toISOString(),
                    user: { name: session?.user?.name || 'You' },
                  },
                  ...(pet.careLogs || []),
                ],
              }
            : pet,
        ),
      );
    } catch (err) {
      console.error(err);
      alert('Failed to log activity. Please try again.');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  // Loading / Error / Empty States
  if (loading) {
    return (
      <div className="mm-section">
        <p className="mm-muted">Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mm-section">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <section className="mm-section space-y-6">
      {/* Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Header for list section */}
      <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#382110]">
            Manage your home ({pets.length})
          </h2>
          <p className="mm-muted text-sm">
            Log care for each member of your household.
          </p>
        </div>
      </header>

      {/* Card grid */}
      {pets.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              currentUserName={session?.user?.name}
              onQuickAction={(id, name, type) =>
                setPendingAction({ petId: id, petName: name, actionType: type })
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#E5D9C6] bg-white px-6 py-12 text-center">
          <p className="text-base font-medium text-[#382110]">
            No pets added yet.
          </p>
          <p className="mm-muted mt-1 text-sm">
            Use the “Add New Pet” panel above to start your home inventory.
          </p>
        </div>
      )}

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
    </section>
  );
}