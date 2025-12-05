// src/components/pets/PetCard.tsx
'use client';

// Imports ------------------------------------------------------
import React, { useState } from 'react';
import Link from 'next/link';
import ConfirmActionModal from './ConfirmActionModal';
import PetAvatar from './PetAvatar';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';

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
  imageUrl?: string | null; // Let the card render photos when available without forcing every caller to provide one.
  // Optional behavior/needs badges surfaced on the card so handlers
  // can see safety/accessibility context at a glance.
  characteristics?: PetCharacteristicId[];
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

// Helper: look up a human-readable label for a characteristic ID.
// This keeps rendering logic simple and resilient to future list changes.
function getCharacteristicLabel(id: PetCharacteristicId | string): string {
  const match = PET_CHARACTERISTICS.find((c) => c.id === id);
  return match?.label ?? id;
}

// Helper: map each characteristic to a distinct visual style so the most
// important safety flags stand out without overwhelming the card.
function getCharacteristicClasses(id: PetCharacteristicId | string): string {
  switch (id) {
    case 'AGGRESSIVE':
      // High-alert flag: strong red pill.
      return 'border-[#FCA5A5] bg-[#FEE2E2] text-[#991B1B]';
    case 'REACTIVE':
      // Medium-alert flag: warm amber pill.
      return 'border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]';
    case 'MOBILITY_ISSUES':
      // Accessibility-related: calming teal pill.
      return 'border-[#6EE7B7] bg-[#ECFDF5] text-[#065F46]';
    case 'BLIND':
      // Sensory note: cool indigo pill.
      return 'border-[#A5B4FC] bg-[#EEF2FF] text-[#3730A3]';
    case 'DEAF':
      // Sensory note: soft blue pill.
      return 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]';
    case 'SHY':
      // Temperament note: gentle mauve pill.
      return 'border-[#FBCFE8] bg-[#FDF2F8] text-[#9D174D]';
    default:
      // Fallback for any future flags we add.
      return 'border-[#E5E7EB] bg-[#F9FAFB] text-[#374151]';
  }
}

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
        <header className="border-b border-[#E5D9C6] bg-[#FDF7EE] px-5 py-4">
          <div className="flex flex-col gap-3">
            {/* Characteristics badges – surfaced at the very top of the card so safety / behavior flags
                are visible before anything else. */}
            {pet.characteristics && pet.characteristics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pet.characteristics.map((id) => (
                  <span
                    key={id}
                    className={[
                      'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
                      getCharacteristicClasses(id),
                    ].join(' ')}
                  >
                    {getCharacteristicLabel(id)}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Bounding the avatar keeps high‑resolution photos from stretching the card layout while still reusing shared avatar logic. */}
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden">
                <PetAvatar
                  name={pet.name}
                  imageUrl={pet.imageUrl ?? null}
                  size="md"
                />
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#382110] leading-tight">
                  {pet.name}
                </h3>
                <p className="text-sm font-medium uppercase tracking-wide text-[#A08C72]">
                  <span>{pet.breed}</span>
                </p>
              </div>
            </div>
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