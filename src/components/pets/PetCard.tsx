// src/components/pets/PetCard.tsx
'use client';

// Imports ------------------------------------------------------
import React, { useState } from 'react';
import Link from 'next/link';
import { Dog, Cat } from 'lucide-react';
import ConfirmActionModal from './ConfirmActionModal';

// Types --------------------------------------------------------
type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

// CareLog represents a single activity entry for a pet
type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  user: { name: string };
};

// PetData represents the main pet information along with care logs
export type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  careLogs: CareLog[];
};

// Component Props ----------------------------------------------
// onQuickAction is still required so existing parents don't break.
type Props = {
  pet: PetData;
  currentUserName?: string | null;
  onQuickAction: (petId: string, petName: string, action: ActionType) => void;
};

// Helpers ------------------------------------------------------
// Calculates age in years from birth date
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Formats a date string into a human-readable "time ago" format
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSecs < 60) return 'just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Returns the appropriate noun for an activity type
function getActivityNoun(type: ActionType): string {
  switch (type) {
    case 'FEED':
      return 'a meal';
    case 'WALK':
      return 'a walk';
    case 'MEDICATE':
      return 'medication';
    case 'ACCIDENT':
      return 'an accident';
    default:
      return 'care';
  }
}

// Describes an activity log entry in human-readable form
function describeActivity(
  log: CareLog,
  currentUserName?: string | null
): string {
  const actor =
    log.user?.name && log.user.name === currentUserName
      ? 'You'
      : log.user?.name || 'Someone';

  const noun = getActivityNoun(log.activityType);
  return `${actor} logged ${noun}`;
}

// Map for nicer labels in the modal + buttons
const ACTION_LABELS: Record<ActionType, string> = {
  FEED: 'Feed',
  WALK: 'Walk',
  MEDICATE: 'Medicate',
  ACCIDENT: 'Accident',
};

// Component -----------------------------------------------------
// Renders a card displaying pet information and quick actions
export default function PetCard({ pet, currentUserName, onQuickAction }: Props) {
  const lastLog = pet.careLogs?.[0];

  // Modal state: which action is waiting for confirmation?
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Centralized handler that *actually* logs the activity
  const persistQuickAction = async (action: ActionType) => {
    try {
      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: pet.id,
          activityType: action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to log care activity', data);
        throw new Error(data.error || 'Failed to log care activity');
      }

      // Let the parent react if it wants to (toasts, optimistic UI, etc.).
      if (onQuickAction) {
        onQuickAction(pet.id, pet.name, action);
      }
    } catch (err) {
      console.error('Error while logging care activity', err);
    }
  };

  // When a button is clicked, we *open the modal* instead of logging immediately.
  const handleRequestQuickAction = (action: ActionType) => {
    setPendingAction(action);
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    await persistQuickAction(pendingAction);
    setIsConfirmOpen(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setIsConfirmOpen(false);
    setPendingAction(null);
  };

  const pendingLabel = pendingAction ? ACTION_LABELS[pendingAction] : '';
  const modalTitle = pendingAction
    ? `Log ${pendingLabel.toLowerCase()} for ${pet.name}?`
    : '';
  const modalBody = pendingAction
    ? `This will add a “${pendingLabel}” entry to ${pet.name}'s activity log.`
    : '';

  // Render the pet card + modal
  return (
    <>
      <article className="mm-card group">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-[#E5D9C6] bg-[#FDF7EE] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D17D45] bg-[#FAF3E7]">
              {pet.type === 'DOG' ? (
                <Dog className="h-5 w-5 text-[#D17D45]" />
              ) : (
                <Cat className="h-5 w-5 text-[#D17D45]" />
              )}
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#382110] leading-tight">
                {pet.name}
              </h3>
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
        </header>

        {/* BODY */}
        <div className="px-5 py-4 text-sm text-[#7A6A56]">
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

          {/* Last log */}
          {lastLog && (
            <div className="mt-4 border-t border-dotted border-[#E5D9C6] pt-3 text-sm text-[#7A6A56]">
              <span className="font-semibold">
                {describeActivity(lastLog, currentUserName)}
              </span>{' '}
              <span className="text-[#A08C72]">
                {formatTimeAgo(lastLog.createdAt)}
              </span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="border-t border-[#E5D9C6] bg-[#FCF5EA] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Quick actions left */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleRequestQuickAction('FEED')}
                className="mm-chip"
              >
                Feed
              </button>

              <button
                onClick={() => handleRequestQuickAction('WALK')}
                className="mm-chip"
              >
                Walk
              </button>

              <button
                onClick={() => handleRequestQuickAction('MEDICATE')}
                className="mm-chip"
              >
                Meds
              </button>

              <button
                onClick={() => handleRequestQuickAction('ACCIDENT')}
                className="mm-chip mm-chip--danger"
              >
                Oops
              </button>
            </div>

            {/* Details / History right */}
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Link
                href={`/pets/${pet.id}`}
                className="mm-chip mm-chip--solid-primary"
              >
                + Details
              </Link>

              <Link
                href={`/pets/${pet.id}/activity`}
                className="mm-chip mm-chip--solid-green"
              >
                View History
              </Link>
            </div>
          </div>
        </footer>
      </article>

      <ConfirmActionModal
        open={isConfirmOpen}
        title={modalTitle}
        body={modalBody}
        confirmLabel={pendingLabel ? `Log ${pendingLabel}` : 'Confirm'}
        cancelLabel="Never mind"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
}