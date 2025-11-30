"use client";

// Pet card for the dashboard grid; this is the main summary view for each pet.
import Link from "next/link";
import { Dog, Cat } from "lucide-react";

// Keeping this aligned with the ActivityType enum in Prisma so we do not drift.
export type ActionType = "FEED" | "WALK" | "MEDICATE" | "ACCIDENT";

// CareLog represents a single activity entry for a pet.
type CareLog = {
  id: string;
  activityType: ActionType;
  // Prisma hands us Date objects, but if this ever crosses a JSON boundary
  // it can become a string; supporting both here keeps us from chasing type ghosts later.
  createdAt: string | Date;
  user: { name: string };
};

// PetData represents the main pet information along with care logs.
export type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  // Same Date-or-string story as care logs; the UI just needs something that `new Date` can digest.
  birthDate: string | Date;
  weight: number;
  specialNeeds?: string | null;
  ownerId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Making this optional because the dashboard does not always eager-load logs.
  careLogs?: CareLog[];
};

// Component props for the card.
type Props = {
  pet: PetData;
  // When we know who is viewing, we can show "You" in activity descriptions instead of a raw name.
  currentUserName?: string | null;
  // Quick action callback is optional; some contexts just want a display card with no logging.
  onQuickAction?: (petId: string, petName: string, action: ActionType) => void;
};

// Calculates age in years from birth date.
function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  // Handling the "has not had their birthday yet this year" case so the age readout feels sane.
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

// Formats a date into a quick "time ago" string so the dashboard stays scannable.
function formatTimeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Returns the appropriate noun for an activity type.
function getActivityNoun(type: ActionType): string {
  switch (type) {
    case "FEED":
      return "a meal";
    case "WALK":
      return "a walk";
    case "MEDICATE":
      return "medication";
    case "ACCIDENT":
      return "an accident";
    default:
      // If we ever add a new enum value and forget to update this, we still get vaguely useful copy.
      return "care";
  }
}

// Describes an activity log entry in human-readable form.
function describeActivity(log: CareLog, currentUserName?: string | null): string {
  const actor =
    currentUserName && log.user?.name === currentUserName
      ? "You"
      : log.user?.name || "Someone";

  const noun = getActivityNoun(log.activityType);
  return `${actor} logged ${noun}`;
}

// Renders a card displaying pet information and quick actions.
export default function PetCard({
  pet,
  currentUserName,
  onQuickAction,
}: Props) {
  // Using the first entry because upstream queries should already sort logs by recency;
  // no point re-sorting on the client and adding more moving parts.
  const lastLog =
    pet.careLogs && pet.careLogs.length > 0 ? pet.careLogs[0] : undefined;

  return (
    <article className="mm-card group">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-[#E5D9C6] bg-[#FDF7EE] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D17D45] bg-[#FAF3E7]">
            {pet.type === "DOG" ? (
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
          <div>{pet.gender === "MALE" ? "Male" : "Female"}</div>
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
              {pet.gender === "MALE" ? "Male" : "Female"}
            </dd>
          </div>
        </dl>

        {/* Last log */}
        {lastLog && (
          <div className="mt-4 border-t border-dotted border-[#E5D9C6] pt-3 text-sm text-[#7A6A56]">
            <span className="font-semibold">
              {describeActivity(lastLog, currentUserName)}
            </span>{" "}
            <span className="text-[#A08C72]">
              {formatTimeAgo(lastLog.createdAt)}
            </span>
          </div>
        )}

        {!lastLog && (
          <div className="mt-4 border-t border-dotted border-[#E5D9C6] pt-3 text-sm text-[#A08C72]">
            {/* Making the empty-state explicit so users do not wonder if data is just slow to load. */}
            No activity logged yet.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E5D9C6] bg-[#FCF5EA] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Quick actions left */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onQuickAction?.(pet.id, pet.name, "FEED")}
              className="mm-chip"
            >
              Feed
            </button>

            <button
              type="button"
              onClick={() => onQuickAction?.(pet.id, pet.name, "WALK")}
              className="mm-chip"
            >
              Walk
            </button>

            <button
              type="button"
              onClick={() => onQuickAction?.(pet.id, pet.name, "MEDICATE")}
              className="mm-chip"
            >
              Meds
            </button>

            <button
              type="button"
              onClick={() => onQuickAction?.(pet.id, pet.name, "ACCIDENT")}
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
  );
}