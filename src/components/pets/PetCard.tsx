'use client';

import Link from 'next/link';
import { Dog, Cat } from 'lucide-react';
import QuickActions from './QuickActions';

type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  user: { name: string };
};

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

type Props = {
  pet: PetData;
  currentUserName?: string | null;
  onQuickAction: (petId: string, petName: string, action: ActionType) => void;
};

// Helpers ------------------------------------------------------

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

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

function describeActivity(log: CareLog, currentUserName?: string | null): string {
  const actor =
    log.user?.name && log.user.name === currentUserName
      ? 'You'
      : log.user?.name || 'Someone';

  const noun = getActivityNoun(log.activityType);
  return `${actor} logged ${noun}`;
}

// Component -----------------------------------------------------

export default function PetCard({ pet, currentUserName, onQuickAction }: Props) {
  const lastLog = pet.careLogs?.[0];

  return (
    <article className="mm-card group">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-[#E5D9C6] bg-[#FDF7EE] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D17D45] bg-[#FAF3E7]">
            {pet.type === 'DOG'
              ? <Dog className="h-5 w-5 text-[#D17D45]" />
              : <Cat className="h-5 w-5 text-[#D17D45]" />}
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onQuickAction(pet.id, pet.name, 'FEED')}
              className="mm-chip"
            >
              Feed
            </button>

            <button
              onClick={() => onQuickAction(pet.id, pet.name, 'WALK')}
              className="mm-chip"
            >
              Walk
            </button>

            <button
              onClick={() => onQuickAction(pet.id, pet.name, 'MEDICATE')}
              className="mm-chip"
            >
              Meds
            </button>

            <button
              onClick={() => onQuickAction(pet.id, pet.name, 'ACCIDENT')}
              className="mm-chip mm-chip--danger"
            >
              Oops
            </button>
          </div>

          {/* FIX: add spacing between the two links */}
          <div className="flex gap-4 text-sm font-semibold uppercase tracking-wide">
            <Link
              href={`/pets/${pet.id}`}
              className="text-[#D17D45] underline-offset-2 hover:underline"
            >
              + Details
            </Link>

            <Link
              href={`/pets/${pet.id}/activity`}
              className="text-[#3E5C2E] underline-offset-2 hover:underline"
            >
              View History
            </Link>
          </div>
        </div>
      </footer>
    </article>
  );
}