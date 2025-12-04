// src/app/pets/[id]/page.tsx
'use client';

// Imports ------------------------------------------------------
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dog, Cat } from 'lucide-react';
import CareCirclePanel from '@/components/pets/CareCirclePanel';
import PetAvatar from '@/components/pets/PetAvatar';
import PetPhotoUpload from '@/components/pets/PetPhotoUpload';
import BreedSelect from '@/components/pets/BreedSelect';

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
                <p className="flex items-center gap-1 text-sm font-medium uppercase tracking-wide text-[#A08C72]">
                  {pet.type === 'DOG' ? (
                    <Dog className="h-4 w-4 text-[#D17D45]" />
                  ) : (
                    <Cat className="h-4 w-4 text-[#D17D45]" />
                  )}
                  <span>{pet.breed}</span>
                </p>
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