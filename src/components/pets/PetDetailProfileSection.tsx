// src/components/pets/PetDetailProfileSection.tsx
import React, { useState, type Dispatch, type SetStateAction } from 'react';
import PetPhotoProfileCard from '@/components/pets/PetPhotoProfileCard';
import { type PetCharacteristicId } from '@/lib/petCharacteristics';
import type { PetData } from './petDetailTypes';
import type { EditFormState, EditFieldErrors } from './PetDetailPage';

// Local validator uses the shared EditFormState/EditFieldErrors types from the page
// so we keep form shape consistent across the profile card and this container.
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

  // Validate optional text fields for length
  if (data.description.length > 500) {
    errors.description = 'Description is too long (max 500 characters).';
  }
  if (data.specialNotes.length > 500) {
    errors.specialNotes = 'Special notes are too long (max 500 characters).';
  }

  return errors;
}

type PetDetailProfileSectionProps = {
  pet: PetData;
  setPet: Dispatch<SetStateAction<PetData | null>>;
};

// This section owns all of the profile editing concerns so the main detail page
// can focus on orchestrating data and composing sections instead of juggling form state.
export default function PetDetailProfileSection({
  pet,
  setPet,
}: PetDetailProfileSectionProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<EditFieldErrors>({});
  const [editError, setEditError] = useState<string | null>(null);

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
      description: pet.description ?? '',
      specialNotes: pet.specialNotes ?? '',
      characteristics: Array.isArray(pet.characteristics)
        ? pet.characteristics
        : [],
    });
    setEditFieldErrors({});
    setEditError(null);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
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

    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      setIsSavingProfile(false);
      return;
    }

    const numericWeight = parseFloat(editForm.weight);

    // Build the payload, only including optional fields if they have values
    const payload: Record<string, unknown> = {
      name: editForm.name.trim(),
      type: editForm.type,
      breed: editForm.breed.trim(),
      gender: editForm.gender,
      birthDate: editForm.birthDate,
      weight: numericWeight,
      characteristics: editForm.characteristics,
    };

    const trimmedDescription = editForm.description.trim();
    if (trimmedDescription) {
      payload.description = trimmedDescription;
    }

    const trimmedSpecialNotes = editForm.specialNotes.trim();
    if (trimmedSpecialNotes) {
      payload.specialNotes = trimmedSpecialNotes;
    }

    try {
      const res = await fetch(`/api/care-recipients/${pet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
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

  return (
    <PetPhotoProfileCard
      pet={pet}
      isEditingProfile={isEditingProfile}
      isSavingProfile={isSavingProfile}
      editForm={editForm}
      editFieldErrors={editFieldErrors}
      editError={editError}
      onStartEditProfile={handleStartEditProfile}
      onCancelEditProfile={handleCancelEditProfile}
      onProfileSave={handleProfileSave}
      onUpdateEditField={updateEditField}
      onToggleCharacteristic={handleToggleCharacteristic}
      onPhotoUploaded={(imageUrl) =>
        setPet((prev) => (prev ? { ...prev, imageUrl } : prev))
      }
    />
  );
}