// src/app/pets/[id]/page.tsx
'use client';

// Imports ------------------------------------------------------
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CareCirclePanel from '@/components/pets/CareCirclePanel';
import PetAvatar from '@/components/pets/PetAvatar';
import PetPhotoUpload from '@/components/pets/PetPhotoUpload';
import BreedSelect from '@/components/pets/BreedSelect';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';

// Types --------------------------------------------------------

type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  notes?: string | null;
  user: { name: string | null };
};

type CareCircleMember = {
  id: string;
  userName: string | null;
  userEmail: string;
  role: 'OWNER' | 'CAREGIVER' | 'VIEWER';
};

type CareCircleMembersApiResponse = {
  members?: {
    id: string;
    role: CareCircleMember['role'];
    user?: {
      name: string | null;
      email: string;
    } | null;
  }[];
  isOwner?: boolean;
};

type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  careLogs: CareLog[];
  ownerId?: string;
  imageUrl?: string | null; // Let the detail view show an image when we have one, without forcing it for legacy rows.
  characteristics?: PetCharacteristicId[]; // Optional so legacy rows or older API responses don’t break this page.
};

// Edit form state is intentionally string-based so the inputs
// stay in sync with what the user is typing.
type EditFormState = {
  name: string;
  type: 'DOG' | 'CAT';
  breed: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  weight: string;
  characteristics: PetCharacteristicId[];
};

type EditFieldErrors = Partial<Record<keyof EditFormState, string>>;

// helpers ------------------------------------------------------
// Calculates age in years from birth date
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Formats a date string into a human-readable format
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

// Returns label for activity type
function getActivityLabel(type: ActionType): string {
  switch (type) {
    case 'FEED':
      return 'Feed';
    case 'WALK':
      return 'Walk';
    case 'MEDICATE':
      return 'Medicate';
    case 'ACCIDENT':
      return 'Accident';
    default:
      return 'Log';
  }
}

// Characteristics helpers: reuse the shared metadata so dashboard cards and detail
// views stay visually and semantically in sync when we tweak the list or copy.
function getCharacteristicLabel(id: PetCharacteristicId): string {
  const meta = PET_CHARACTERISTICS.find((item) => item.id === id);
  return meta ? meta.label : id.toLowerCase().replace(/_/g, ' ');
}

function getCharacteristicClasses(id: PetCharacteristicId): string {
  switch (id) {
    case 'AGGRESSIVE':
      return 'border-[#F97373] bg-[#FEF2F2] text-[#B91C1C]';
    case 'REACTIVE':
      return 'border-[#FB923C] bg-[#FFF7ED] text-[#C05621]';
    case 'SHY':
      return 'border-[#A78BFA] bg-[#F5F3FF] text-[#5B21B6]';
    case 'MOBILITY_ISSUES':
      return 'border-[#2DD4BF] bg-[#ECFEFF] text-[#0F766E]';
    case 'BLIND':
      return 'border-[#9CA3AF] bg-[#F3F4F6] text-[#374151]';
    case 'DEAF':
      return 'border-[#38BDF8] bg-[#EFF6FF] text-[#1D4ED8]';
    default:
      return 'border-[#D0C1AC] bg-[#FDF7EE] text-[#6A5740]';
  }
}

// Local validator so we fail fast on obviously bad edits
function validateEditForm(data: EditFormState): EditFieldErrors {
  const errors: EditFieldErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required.';
  }
  if (!data.breed.trim()) {
    errors.breed = 'Breed is required.';
  }
  if (!data.birthDate) {
    errors.birthDate = 'Birth date is required.';
  }
  if (!data.weight.trim()) {
    errors.weight = 'Weight is required.';
  } else {
    const val = parseFloat(data.weight);
    if (Number.isNaN(val) || val <= 0) {
      errors.weight = 'Enter a valid weight greater than 0.';
    }
  }

  return errors;
}

// page --------------------------------------------------------
// Pet details page component
export default function PetDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const petId = params?.id;

  const [pet, setPet] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careCircleMembers, setCareCircleMembers] = useState<CareCircleMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  // Edit profile state: we keep this separate from the main pet state so
  // half-typed edits never corrupt the canonical data from the server.
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<EditFieldErrors>({});
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch pet details on mount
  useEffect(() => {
    if (!petId) return;

    const fetchPet = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/pets/${petId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load pet details');
        }

        setPet(data.pet);

        // Once the pet is loaded, force the scroll position to the top so the
        // user always lands on the header instead of halfway down the page.
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // After loading the pet, fetch care circle membership + ownership info.
        try {
          const membersRes = await fetch(
            `/api/care-circles/members?recipientId=${encodeURIComponent(
              petId,
            )}`,
          );

          if (membersRes.ok) {
            const membersData =
              (await membersRes.json()) as CareCircleMembersApiResponse;

            const mappedMembers: CareCircleMember[] = (membersData.members ?? []).map(
              (membership) => ({
                id: membership.id,
                role: membership.role,
                userName: membership.user?.name ?? null,
                userEmail: membership.user?.email ?? '',
              }),
            );

            setCareCircleMembers(mappedMembers);
            if (typeof membersData.isOwner === 'boolean') {
              setIsOwner(membersData.isOwner);
            }
          } else if (membersRes.status === 401) {
            // Not logged in – nothing to show, but we also don't want to block the page.
            setCareCircleMembers([]);
          } else if (membersRes.status === 404) {
            // API may signal "no care circle yet" as 404. Treat as empty state.
            setCareCircleMembers([]);
            setIsOwner(false);
          } else {
            // Soft-fail for any other server issue; log as a warning with status/body for debugging.
            let errorBody: string | null = null;
            try {
              errorBody = await membersRes.text();
            } catch {
              // ignore parse errors
            }
            console.warn(
              'Care circle members request failed',
              membersRes.status,
              errorBody,
            );
          }
        } catch (careCircleError) {
          console.error('Error fetching care circle data:', careCircleError);
        }
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : 'Failed to load pet details',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [petId]);

  // When the user clicks "Edit profile", seed the form state from the current pet
  const handleStartEditProfile = () => {
    if (!pet) return;

    const birthDate = pet.birthDate ? pet.birthDate.slice(0, 10) : '';

    setEditForm({
      name: pet.name,
      type: (pet.type as 'DOG' | 'CAT') ?? 'DOG',
      breed: pet.breed,
      gender: (pet.gender as 'MALE' | 'FEMALE') ?? 'MALE',
      birthDate,
      weight: pet.weight.toString(),
      // Seed the edit form with any existing flags so the toggles reflect
      // the current DB state instead of always starting blank.
      characteristics: Array.isArray(pet.characteristics)
        ? pet.characteristics
        : [],
    });
    setEditFieldErrors({});
    setEditError(null);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    // Drop any unsaved edits and go back to the read-only summary view.
    setIsEditingProfile(false);
    setEditForm(null);
    setEditFieldErrors({});
    setEditError(null);
  };

  const updateEditField = <K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K],
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setEditFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleToggleCharacteristic = (id: PetCharacteristicId) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const isSelected = prev.characteristics.includes(id);
      return {
        ...prev,
        characteristics: isSelected
          ? prev.characteristics.filter((existing) => existing !== id)
          : [...prev.characteristics, id],
      };
    });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !editForm) return;

    setIsSavingProfile(true);
    setEditError(null);

    // Client-side validation to catch obvious issues before we hit the API.
    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      setIsSavingProfile(false);
      return;
    }

    const numericWeight = parseFloat(editForm.weight);

    try {
      const res = await fetch(`/api/pets/${pet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          type: editForm.type,
          breed: editForm.breed.trim(),
          gender: editForm.gender,
          birthDate: editForm.birthDate,
          // We send weight as a number here to match the Zod schema and
          // keep server/client in lockstep.
          weight: numericWeight,
          // Persist any selected behavioral / accessibility flags so the card
          // badges and detail view stay in sync after a save.
          characteristics: editForm.characteristics,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If the server sent back structured validationErrors, map them
        // into our field-level error bag so the UI points directly at
        // the problematic inputs (especially weight).
        const fieldErrors: EditFieldErrors = {};
        if (Array.isArray(data.validationErrors)) {
          for (const issue of data.validationErrors) {
            if (issue && issue.field && issue.message) {
              const field = issue.field as keyof EditFormState;
              if (field in editForm) {
                fieldErrors[field] = issue.message as string;
              }
            }
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setEditFieldErrors(fieldErrors);
        }

        throw new Error(data.error || 'Failed to update pet');
      }

      // Keep local pet state in sync with the server response so the header,
      // profile summary, and activity panels all reflect the latest values.
      setPet((prev) => {
        if (!prev) return data.pet;
        return { ...prev, ...data.pet };
      });

      setIsEditingProfile(false);
      setEditForm(null);
      setEditFieldErrors({});
      setEditError(null);
    } catch (err) {
      console.error('Error updating pet profile', err);
      setEditError(
        err instanceof Error ? err.message : 'Failed to update pet',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex items-center justify-center">
        <p className="mm-muted">Loading pet details…</p>
      </div>
    );
  }

  // Error state
  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex flex-col items-center justify-center gap-4">
        <p className="text-[#382110] text-lg font-semibold">
          Failed to load pet details
        </p>
        {error && <p className="mm-muted text-sm">{error}</p>}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mm-chip mm-chip--solid-primary"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  // Main pet details UI
  return (
    <div className="mm-page">
      <main className="mm-shell space-y-6">
        {/* Back + header */}
        <section className="mm-section">
          <button
            type="button"
            onClick={() => router.back()}
            className="mm-chip"
          >
            ← Back
          </button>

          <div className="mt-4 mm-card px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3">
              {/* Characteristics row: lives above the core identity so high-signal flags are visible immediately to anyone viewing the profile. */}
              {Array.isArray(pet.characteristics) &&
                pet.characteristics.length > 0 && (
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
                {/* Bounding the avatar in a fixed-size wrapper keeps large photos from taking over the layout while still reusing shared avatar styles. */}
                <div className="h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full overflow-hidden border border-[#E5D9C6]/80 bg-[#FDF7EE]">
                  <PetAvatar
                    name={pet.name}
                    imageUrl={pet.imageUrl ?? null}
                    size="lg"
                  />
                </div>

                <div>
                  <h1 className="mm-h2">{pet.name}</h1>
                  <p className="text-sm font-medium uppercase tracking-wide text-[#A08C72]">
                    {pet.breed}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-[#A08C72] md:text-right">
              <div>
                {calculateAge(pet.birthDate)} yrs • {pet.weight} lbs
              </div>
              <div>{pet.gender === 'MALE' ? 'Male' : 'Female'}</div>
            </div>
          </div>
        </section>

        {/* Photo + profile card */}
        <section className="mm-section">
          <div className="mm-card px-5 py-4 grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start">
            {/* Left: photo + uploader. The actual image is hard-bounded and cropped via PetPhotoUpload so we never end up with a full-width hero photo here. */}
            <div>
              <h2 className="mm-h3 mb-3">Photo</h2>
              <PetPhotoUpload
                recipientId={pet.id}
                name={pet.name}
                initialImageUrl={pet.imageUrl ?? null}
                onUploaded={(imageUrl) => {
                  // Keeping local state in sync with the upload response so the page updates immediately
                  // instead of waiting for a full refetch.
                  setPet((prev) => (prev ? { ...prev, imageUrl } : prev));
                }}
              />
            </div>

            {/* Right: key profile attributes + inline edit form */}
            <div className="border-t border-[#E5D9C6]/80 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="mm-h3">Profile</h2>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={handleStartEditProfile}
                    className="rounded-md border border-[#D0C1AC] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6A5740] hover:bg-[#F3E6D3] transition-colors"
                  >
                    Edit profile
                  </button>
                )}
              </div>

              {editError && (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {editError}
                </div>
              )}

              {isEditingProfile && editForm ? (
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs uppercase tracking-wide text-[#B09A7C]">
                    {/* Name */}
                    <div>
                      <label className="mb-1 block">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => updateEditField('name', e.target.value)}
                        className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                      />
                      {editFieldErrors.name && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {editFieldErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Type */}
                    <div>
                      <label className="mb-1 block">Type</label>
                      <div className="flex gap-3 text-[13px] text-[#3A2A18]">
                        <label className="flex cursor-pointer items-center gap-1.5">
                          <input
                            type="radio"
                            name="edit-type"
                            value="DOG"
                            checked={editForm.type === 'DOG'}
                            onChange={(e) =>
                              updateEditField(
                                'type',
                                e.target.value as EditFormState['type'],
                              )
                            }
                            className="text-[#3E6B3A] focus:ring-[#3E6B3A]"
                          />
                          <span>Dog</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5">
                          <input
                            type="radio"
                            name="edit-type"
                            value="CAT"
                            checked={editForm.type === 'CAT'}
                            onChange={(e) =>
                              updateEditField(
                                'type',
                                e.target.value as EditFormState['type'],
                              )
                            }
                            className="text-[#3E6B3A] focus:ring-[#3E6B3A]"
                          />
                          <span>Cat</span>
                        </label>
                      </div>
                    </div>

                    {/* Breed */}
                    <div>
                      <label className="mb-1 block">Breed</label>
                      {/* Reuse the shared BreedSelect so edit mode gets the same type-specific, searchable list as the create form without changing backend constraints. */}
                      <BreedSelect
                        petType={editForm.type}
                        value={editForm.breed}
                        onChange={(next) => updateEditField('breed', next)}
                        required
                      />
                      {editFieldErrors.breed && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {editFieldErrors.breed}
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="mb-1 block">Sex</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) =>
                          updateEditField(
                            'gender',
                            e.target.value as EditFormState['gender'],
                          )
                        }
                        className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>

                    {/* Birth date */}
                    <div>
                      <label className="mb-1 block">Birth Date</label>
                      <input
                        type="date"
                        value={editForm.birthDate}
                        onChange={(e) =>
                          updateEditField('birthDate', e.target.value)
                        }
                        className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                      />
                      {editFieldErrors.birthDate && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {editFieldErrors.birthDate}
                        </p>
                      )}
                    </div>

                    {/* Weight (lbs) */}
                    <div>
                      <label className="mb-1 block">Weight (lbs)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.weight}
                        onChange={(e) =>
                          updateEditField('weight', e.target.value)
                        }
                        className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                      />
                      {editFieldErrors.weight && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {editFieldErrors.weight}
                        </p>
                      )}
                    </div>

                    {/* Characteristics */}
                    <div className="col-span-2">
                      <label className="mb-2 block">Characteristics</label>
                      <div className="space-y-2">
                        {PET_CHARACTERISTICS.map((item) => {
                          const isSelected =
                            editForm.characteristics.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleToggleCharacteristic(item.id)}
                              className={[
                                'flex w-full items-center justify-between rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
                                isSelected
                                  ? 'border-[#3E6B3A] bg-[#E0F2E9] text-[#234434]'
                                  : 'border-[#D0C1AC] bg-[#FDF7EE] text-[#6A5740] hover:bg-[#F3E6D3]',
                              ].join(' ')}
                            >
                              <span>{getCharacteristicLabel(item.id)}</span>
                              {/* iOS-style toggle switch */}
                              <span
                                className={[
                                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                  isSelected ? 'bg-[#3E6B3A]' : 'bg-[#D1C5B5]',
                                ].join(' ')}
                              >
                                <span
                                  className={[
                                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                                    isSelected ? 'translate-x-4' : 'translate-x-0.5',
                                  ].join(' ')}
                                />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end gap-3 border-t border-[#E9DECF] pt-3">
                    <button
                      type="button"
                      onClick={handleCancelEditProfile}
                      className="rounded-md px-4 py-1.5 text-xs font-medium text-[#6A5740] hover:bg-[#F3E6D3] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="rounded-md bg-[#3E6B3A] px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-[#355B32] disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs uppercase tracking-wide text-[#B09A7C]">
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
              )}
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section className="mm-section">
          <div className="mm-card px-5 py-4">
            <h2 className="mm-h3 mb-3">Recent activity</h2>

            {pet.careLogs.length === 0 && (
              <p className="mm-muted-sm">No activity logged yet.</p>
            )}

            {pet.careLogs.length > 0 && (
              <ul className="space-y-3 text-sm">
                {pet.careLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start justify-between border-b border-[#E5D9C6]/60 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-[#382110]">
                        {getActivityLabel(log.activityType)}
                      </p>
                      <p className="mm-muted-sm">
                        by{' '}
                        <span className="text-[#D17D45] font-medium">
                          {log.user?.name || 'Someone'}
                        </span>
                      </p>
                      {log.notes && (
                        <p className="mt-1 text-xs text-[#7A6A56]">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <p className="mm-meta">{formatDateTime(log.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Shared access / CareCircle */}
        <section id="care-circle" className="mm-section">
          <CareCirclePanel
            recipientId={pet.id}
            isOwner={isOwner}
            initialMembers={careCircleMembers}
          />
        </section>
      </main>
    </div>
  );
}