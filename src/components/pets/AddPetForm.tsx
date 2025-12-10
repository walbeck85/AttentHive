'use client';
// Imports ------------------------------------------------------
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import BreedSelect from './BreedSelect';
import { alpha, useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
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
  const borderColor = theme.palette.divider;
  const subtleSurface = isDarkMode
    ? theme.palette.background.default
    : theme.palette.action.hover;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const accent = theme.palette.primary.main;
  const accentContrast = theme.palette.getContrastText(accent);

  const CTA_BG_ALPHA_DARK = 0.32;
  const CTA_BG_ALPHA_LIGHT = 0.12;
  const CTA_BORDER_ALPHA_DARK = 0.9;
  const CTA_BORDER_ALPHA_LIGHT = 0.5;

  const collapsedCtaBackground = alpha(
    accent,
    isDarkMode ? CTA_BG_ALPHA_DARK : CTA_BG_ALPHA_LIGHT
  );
  const collapsedCtaBorder = alpha(
    accent,
    isDarkMode ? CTA_BORDER_ALPHA_DARK : CTA_BORDER_ALPHA_LIGHT
  );

  const inputStyles: CSSProperties = {
    backgroundColor: subtleSurface,
    borderColor,
    color: textPrimary,
  };

  const labelStyles: CSSProperties = {
    color: textSecondary,
    letterSpacing: '0.12em',
  };

  const focusRingStyle: CSSProperties = {
    // Tailwind focus ring uses this CSS variable; set it to the brand accent
    '--tw-ring-color': accent,
  } as CSSProperties;

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
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: { xs: 2.5, md: 3 },
          mb: 3,
        }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group flex w-full items-center justify-between rounded-full px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.12em] transition-colors duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...focusRingStyle,
            backgroundColor: collapsedCtaBackground,
            borderColor: collapsedCtaBorder,
            color: isDarkMode ? theme.palette.common.white : accentContrast,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
          aria-expanded={isExpanded}
        >
          <p className="truncate">
            Open add pet form
          </p>
          <div
            className="ml-4 flex items-center text-xl font-semibold transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 3L11 8L6 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </Paper>
    );
  }

  // -------- Expanded form --------
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: { xs: 2.5, md: 3 },
        mb: 3,
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => {
          resetForm();
          setIsExpanded(false);
        }}
        className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...focusRingStyle,
          color: isDarkMode ? theme.palette.common.white : textSecondary,
          backgroundColor: isDarkMode
            ? alpha(theme.palette.common.white, 0.08)
            : alpha(textSecondary, 0.06),
          borderColor: alpha(
            isDarkMode ? theme.palette.common.white : textSecondary,
            isDarkMode ? 0.4 : 0.3
          ),
          borderWidth: 1,
          borderStyle: 'solid',
        }}
        aria-label="Close add pet form"
      >
        ✕
      </button>

      <h2
        className="mb-4 font-semibold tracking-[0.16em] uppercase"
        style={{ color: textSecondary, letterSpacing: '0.16em' }}
      >
        <Typography
          variant="overline"
          component="span"
          sx={{ color: accent }}
        >
          Add New Pet
        </Typography>
      </h2>

      {error && (
        <div
          className="mb-4 rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: alpha(theme.palette.error.main, 0.35),
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.light,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Name */}
          <div>
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Name
            </Typography>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ...inputStyles, ...focusRingStyle }}
              placeholder="e.g. Truffle"
            />
            {fieldErrors.name && (
              <Typography
                variant="caption"
                color="error"
                className="mt-1 block"
                component="p"
              >
                {fieldErrors.name}
              </Typography>
            )}
          </div>

          {/* Type */}
          <div>
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Type
            </Typography>
            <div className="flex gap-4 text-sm" style={{ color: textPrimary }}>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="DOG"
                  checked={formData.type === 'DOG'}
                  onChange={(e) => updateField('type', e.target.value as FormState['type'])}
                  className="focus:ring-offset-0"
                  style={{ accentColor: accent }}
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
                  className="focus:ring-offset-0"
                  style={{ accentColor: accent }}
                />
                <span>Cat</span>
              </label>
            </div>
          </div>

          {/* Breed */}
          <div>
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Breed
            </Typography>
            {/* Using the shared BreedSelect so dogs and cats get type-specific, searchable lists without changing the backend schema or validation rules. */}
            <BreedSelect
              petType={formData.type}
              value={formData.breed}
              onChange={(next) => updateField('breed', next)}
              required
            />
            {fieldErrors.breed && (
              <Typography
                variant="caption"
                color="error"
                className="mt-1 block"
                component="p"
              >
                {fieldErrors.breed}
              </Typography>
            )}
          </div>

          {/* Gender */}
          <div>
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Gender
            </Typography>
            <select
              value={formData.gender}
              onChange={(e) =>
                updateField('gender', e.target.value as FormState['gender'])
              }
              className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ...inputStyles, ...focusRingStyle }}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          {/* Birth Date */}
          <div>
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Birth Date
            </Typography>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ...inputStyles, ...focusRingStyle }}
            />
            {fieldErrors.birthDate && (
              <Typography
                variant="caption"
                color="error"
                className="mt-1 block"
                component="p"
              >
                {fieldErrors.birthDate}
              </Typography>
            )}
          </div>

          {/* Weight + Unit */}
          <div>
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Weight
            </Typography>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => updateField('weight', e.target.value)}
                className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ ...inputStyles, ...focusRingStyle }}
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
                className="w-24 rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ ...inputStyles, ...focusRingStyle }}
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
            {fieldErrors.weight && (
              <Typography
                variant="caption"
                color="error"
                className="mt-1 block"
                component="p"
              >
                {fieldErrors.weight}
              </Typography>
            )}
          </div>

          {/* Characteristics */}
          <div className="md:col-span-2">
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Characteristics
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              className="mb-2 block"
            >
              Add any safety or accessibility notes that should be visible on the
              pet card.
            </Typography>
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
                      isSelected ? '' : 'hover:opacity-90',
                    ].join(' ')}
                    style={
                      isSelected
                        ? {
                            backgroundColor: alpha(accent, 0.16),
                            borderColor: alpha(accent, 0.4),
                            color: accent,
                          }
                        : {
                            backgroundColor: subtleSurface,
                            borderColor,
                            color: textSecondary,
                          }
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="mt-2 flex justify-end gap-3 border-t pt-3"
          style={{ borderColor }}
        >
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsExpanded(false);
            }}
            className="rounded-md px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{
              color: textSecondary,
              backgroundColor: 'transparent',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md px-5 py-1.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 hover:opacity-90"
            style={{
              backgroundColor: accent,
              color: theme.palette.common.white,
            }}
          >
            {isSubmitting ? 'Adding…' : 'Add Pet'}
          </button>
        </div>
      </form>
    </Paper>
  );
}
