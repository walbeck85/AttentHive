'use client';
// Imports ------------------------------------------------------
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BreedSelect from './BreedSelect';
import { useTheme } from '@mui/material/styles';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
// Types --------------------------------------------------------
type AddPetFormProps = {
  onPetAdded?: () => void;
};
// Form state representation
type FormState = {
  name: string;
  type: 'DOG' | 'CAT';
  breed: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  weight: string;
  weightUnit: 'lbs' | 'kg';
  // Multi-select flags that surface as badges on the pet card.
  // Kept in sync with the canonical list so the payload stays predictable.
  characteristics: PetCharacteristicId[];
};
// Field-specific error messages
type FieldErrors = Partial<Record<keyof FormState, string>>;
//  Component --------------------------------------------------
export default function AddPetForm({ onPetAdded }: AddPetFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Form State
  const [formData, setFormData] = useState<FormState>({
    name: '',
    type: 'DOG',
    breed: '',
    gender: 'MALE',
    birthDate: '',
    weight: '',
    weightUnit: 'lbs',
    // Start with no flags selected; this mirrors the DB default of [].
    characteristics: [],
  });
// Field Errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
// Resets form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'DOG',
      breed: '',
      gender: 'MALE',
      birthDate: '',
      weight: '',
      weightUnit: 'lbs',
      characteristics: [],
    });
    setFieldErrors({});
    setError(null);
  };
// Validates form data and returns errors
  const validate = (data: FormState): FieldErrors => {
    const errors: FieldErrors = {};
// Name, breed, birthDate, and weight are required
    if (!data.name.trim()) errors.name = 'Name is required.';
    if (!data.breed.trim()) errors.breed = 'Breed is required.';
    if (!data.birthDate) errors.birthDate = 'Birth date is required.';

    if (!data.weight.trim()) {
      errors.weight = 'Weight is required.';
    } else {
      const val = parseFloat(data.weight);
      if (Number.isNaN(val) || val <= 0) {
        errors.weight = 'Enter a valid weight greater than 0.';
      }
    }

    // type, gender, weightUnit have constrained inputs already,
    // so no extra validation needed beyond presence.
    return errors;
  };
// Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Client-side validation first
    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }
// Submit to API
    try {
      const numericWeight = parseFloat(formData.weight);
      const weightInLbs =
        formData.weightUnit === 'kg' ? numericWeight * 2.20462 : numericWeight;

      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          breed: formData.breed.trim(),
          gender: formData.gender,
          birthDate: formData.birthDate,
          weight: weightInLbs,
          // Pass through the selected characteristic IDs so the API
          // can validate and persist them to the Recipient record.
          characteristics: formData.characteristics,
        }),
      });
// Parse response
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add pet');
      }

      // At this point the server accepted the payload, so I reset UI state first and then ask Next to re-run the dashboard query
      resetForm();
      setIsExpanded(false);
      // Using router.refresh to keep the server-rendered dashboard in sync, while onPetAdded stays as a hook for any future client-only reactions
      router.refresh();
      if (onPetAdded) onPetAdded();
    } catch (err) {
      // Logging the raw error here so future-me has something concrete to inspect when the UI only shows a generic failure message
      console.error("Error while adding pet", err);
      setError(err instanceof Error ? err.message : 'Failed to add pet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to update a single field and clear its error
  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Helper: toggle a single characteristic flag on or off while keeping
  // the rest of the form state untouched.
  const toggleCharacteristic = (id: PetCharacteristicId) => {
    setFormData((prev) => {
      const current = prev.characteristics;
      const next = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id];
  
      return {
        ...prev,
        characteristics: next,
      };
    });
  
    // If we ever add validation for characteristics, this keeps things
    // consistent with the rest of the field-level error handling.
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete (next as Record<string, string | undefined>).characteristics;
      return next;
    });
  };

  // -------- Collapsed CTA --------
  if (!isExpanded) {
    return (
      <div
        className="mm-card mb-6 border"
        style={{
          borderColor: isDarkMode ? theme.palette.divider : '#E1D6C5',
          backgroundColor: isDarkMode ? theme.palette.background.paper : '#FBF4E8',
          color: theme.palette.text.primary,
        }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A68A5B] uppercase">
              Add new pet
            </p>
            <p className="mt-1 text-sm text-[#5C4A34]">
              Create a profile for another member of your household.
            </p>
          </div>
          <div className="ml-4 text-xl font-semibold text-[#3E6B3A]">›</div>
        </button>
      </div>
    );
  }

  // -------- Expanded form --------
  return (
    <div
      className="mm-card mb-6 border p-4 md:p-6 relative"
      style={{
        borderColor: isDarkMode ? theme.palette.divider : '#E1D6C5',
        backgroundColor: isDarkMode ? theme.palette.background.paper : '#FFFDF8',
        color: theme.palette.text.primary,
      }}
    >
      <button
        type="button"
        onClick={() => {
          resetForm();
          setIsExpanded(false);
        }}
        className="absolute top-3 right-3 text-sm text-[#B39A80] hover:text-[#5C4A34] transition-colors"
      >
        ✕
      </button>

      <h2 className="mb-4 text-lg font-semibold tracking-[0.16em] text-[#A68A5B] uppercase">
        Add New Pet
      </h2>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[#A08C72] uppercase">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
              placeholder="e.g. Truffle"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-[11px] text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[#A08C72] uppercase">
              Type
            </label>
            <div className="flex gap-4 text-sm text-[#3A2A18]">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="DOG"
                  checked={formData.type === 'DOG'}
                  onChange={(e) => updateField('type', e.target.value as FormState['type'])}
                  className="text-[#3E6B3A] focus:ring-[#3E6B3A]"
                />
                <span>Dog</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="CAT"
                  checked={formData.type === 'CAT'}
                  onChange={(e) => updateField('type', e.target.value as FormState['type'])}
                  className="text-[#3E6B3A] focus:ring-[#3E6B3A]"
                />
                <span>Cat</span>
              </label>
            </div>
          </div>

          {/* Breed */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[#A08C72] uppercase">
              Breed
            </label>
            {/* Using the shared BreedSelect so dogs and cats get type-specific, searchable lists without changing the backend schema or validation rules. */}
            <BreedSelect
              petType={formData.type}
              value={formData.breed}
              onChange={(next) => updateField('breed', next)}
              required
            />
            {fieldErrors.breed && (
              <p className="mt-1 text-[11px] text-red-600">{fieldErrors.breed}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[#A08C72] uppercase">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                updateField('gender', e.target.value as FormState['gender'])
              }
              className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          {/* Birth Date */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[#A08C72] uppercase">
              Birth Date
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
              className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
            />
            {fieldErrors.birthDate && (
              <p className="mt-1 text-[11px] text-red-600">
                {fieldErrors.birthDate}
              </p>
            )}
          </div>

          {/* Weight + Unit */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[#A08C72] uppercase">
              Weight
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => updateField('weight', e.target.value)}
                className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                placeholder="e.g. 25"
              />
              <select
                value={formData.weightUnit}
                onChange={(e) =>
                  updateField(
                    'weightUnit',
                    e.target.value as FormState['weightUnit']
                  )
                }
                className="w-24 rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
            {fieldErrors.weight && (
              <p className="mt-1 text-[11px] text-red-600">
                {fieldErrors.weight}
              </p>
            )}
          </div>

          {/* Characteristics */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[#A08C72] uppercase">
              Characteristics
            </label>
            <p className="mb-2 text-[12px] text-[#7A6A56]">
              Add any safety or accessibility notes that should be visible on the pet card.
            </p>
            <div className="flex flex-wrap gap-2">
              {PET_CHARACTERISTICS.map((option) => {
                const isSelected = formData.characteristics.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleCharacteristic(option.id)}
                    className={[
                      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      isSelected
                        ? 'bg-[#FCEBE8] border-[#F5C6BE] text-[#8A3B32]'
                        : 'bg-white border-[#E1D6C5] text-[#7A6A56] hover:bg-[#F7EFE3]',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex justify-end gap-3 border-t border-[#E9DECF] pt-3">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsExpanded(false);
            }}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-[#6A5740] hover:bg-[#F3E6D3] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#3E6B3A] px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355B32] disabled:opacity-50"
          >
            {isSubmitting ? 'Adding…' : 'Add Pet'}
          </button>
        </div>
      </form>
    </div>
  );
}