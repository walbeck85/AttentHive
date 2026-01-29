'use client';
// Imports ------------------------------------------------------
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import BreedSelect from './BreedSelect';
import { alpha, useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import { RecipientCategory } from '@prisma/client';

// Types --------------------------------------------------------
type AddRecipientFormProps = {
  onRecipientAdded?: () => void;
};

// Pet subtype definition for UI rendering
type PetSubtype = 'DOG' | 'CAT' | 'BIRD' | 'FISH' | 'SMALL_MAMMAL' | 'REPTILE' | 'EXOTIC';

const PET_SUBTYPES: { id: PetSubtype; label: string; icon: string }[] = [
  { id: 'DOG', label: 'Dog', icon: '🐕' },
  { id: 'CAT', label: 'Cat', icon: '🐱' },
  { id: 'BIRD', label: 'Bird', icon: '🐦' },
  { id: 'FISH', label: 'Fish', icon: '🐠' },
  { id: 'SMALL_MAMMAL', label: 'Small Mammal', icon: '🐹' },
  { id: 'REPTILE', label: 'Reptile', icon: '🦎' },
  { id: 'EXOTIC', label: 'Exotic', icon: '🦜' },
];

// Plant subtype definition for UI rendering
type PlantSubtype = 'INDOOR' | 'OUTDOOR' | 'SUCCULENT';

const PLANT_SUBTYPES: { id: PlantSubtype; label: string; icon: string }[] = [
  { id: 'INDOOR', label: 'Indoor Plant', icon: '🪴' },
  { id: 'OUTDOOR', label: 'Outdoor Plant', icon: '🌳' },
  { id: 'SUCCULENT', label: 'Succulent/Cactus', icon: '🌵' },
];

// Person subtype definition for UI rendering
type PersonSubtype = 'ELDER' | 'CHILD' | 'OTHER';

const PERSON_SUBTYPES: { id: PersonSubtype; label: string; icon: string }[] = [
  { id: 'ELDER', label: 'Elder/Senior', icon: '👴' },
  { id: 'CHILD', label: 'Child', icon: '👶' },
  { id: 'OTHER', label: 'Other', icon: '👤' },
];

// Sunlight options for plants
const SUNLIGHT_OPTIONS = [
  { value: 'LOW', label: 'Low Light' },
  { value: 'MEDIUM', label: 'Medium Light' },
  { value: 'HIGH', label: 'Bright Indirect' },
  { value: 'DIRECT', label: 'Direct Sunlight' },
];

// Water frequency options for plants
const WATER_FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 Weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
];

// Subtypes that require breed/species input
const SUBTYPES_WITH_BREED: PetSubtype[] = ['DOG', 'CAT', 'BIRD', 'SMALL_MAMMAL', 'REPTILE', 'EXOTIC'];
// Subtypes that require weight input
const SUBTYPES_WITH_WEIGHT: PetSubtype[] = ['DOG', 'CAT', 'SMALL_MAMMAL', 'REPTILE', 'EXOTIC'];
// Subtypes that require birthDate input
const SUBTYPES_WITH_BIRTHDATE: PetSubtype[] = ['DOG', 'CAT', 'BIRD', 'SMALL_MAMMAL', 'REPTILE', 'EXOTIC'];
// Subtypes that require gender input
const SUBTYPES_WITH_GENDER: PetSubtype[] = ['DOG', 'CAT', 'BIRD', 'SMALL_MAMMAL', 'REPTILE', 'EXOTIC'];

// Form state representation - includes pet, plant, and person fields
type FormState = {
  name: string;
  // Pet-specific fields
  subtype: PetSubtype;
  breed: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  weight: string;
  weightUnit: 'lbs' | 'kg';
  // Plant-specific fields
  plantSubtype: PlantSubtype;
  plantSpecies: string;
  sunlight: string;
  waterFrequency: string;
  // Person-specific fields
  personSubtype: PersonSubtype;
  relationship: string;
  // Shared fields
  description: string;
  specialNotes: string;
  // Multi-select flags that surface as badges on the pet card.
  // Kept in sync with the canonical list so the payload stays predictable.
  characteristics: PetCharacteristicId[];
};
// Field-specific error messages
type FieldErrors = Partial<Record<keyof FormState, string>>;
//  Component --------------------------------------------------
export default function AddRecipientForm({ onRecipientAdded }: AddRecipientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [category, setCategory] = useState<RecipientCategory | null>(null);
  const [petSubtype, setPetSubtype] = useState<PetSubtype | null>(null);
  const [plantSubtype, setPlantSubtype] = useState<PlantSubtype | null>(null);
  const [personSubtype, setPersonSubtype] = useState<PersonSubtype | null>(null);
  // Steps: 0 = category, 1 = subtype selection (pet, plant, or person), 2 = details form
  const [step, setStep] = useState(0);
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
    // Pet fields
    subtype: 'DOG',
    breed: '',
    gender: 'MALE',
    birthDate: '',
    weight: '',
    weightUnit: 'lbs',
    // Plant fields
    plantSubtype: 'INDOOR',
    plantSpecies: '',
    sunlight: '',
    waterFrequency: '',
    // Person fields
    personSubtype: 'ELDER',
    relationship: '',
    // Shared fields
    description: '',
    specialNotes: '',
    // Start with no flags selected; this mirrors the DB default of [].
    characteristics: [],
  });
// Field Errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
// Resets form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      // Pet fields
      subtype: 'DOG',
      breed: '',
      gender: 'MALE',
      birthDate: '',
      weight: '',
      weightUnit: 'lbs',
      // Plant fields
      plantSubtype: 'INDOOR',
      plantSpecies: '',
      sunlight: '',
      waterFrequency: '',
      // Person fields
      personSubtype: 'ELDER',
      relationship: '',
      // Shared fields
      description: '',
      specialNotes: '',
      characteristics: [],
    });
    setFieldErrors({});
    setError(null);
    setCategory(null);
    setPetSubtype(null);
    setPlantSubtype(null);
    setPersonSubtype(null);
    setStep(0);
  };
// Validates form data and returns errors based on subtype
  const validate = (data: FormState): FieldErrors => {
    const errors: FieldErrors = {};
    const subtype = data.subtype;

    // Name is always required
    if (!data.name.trim()) errors.name = 'Name is required.';

    // Breed is required for most subtypes (not FISH)
    if (SUBTYPES_WITH_BREED.includes(subtype) && !data.breed.trim()) {
      errors.breed = subtype === 'BIRD' ? 'Species is required.' : 'Breed is required.';
    }

    // Birth date is required for most subtypes (not FISH)
    if (SUBTYPES_WITH_BIRTHDATE.includes(subtype) && !data.birthDate) {
      errors.birthDate = 'Birth date is required.';
    }

    // Weight is required for most subtypes (not BIRD or FISH)
    if (SUBTYPES_WITH_WEIGHT.includes(subtype)) {
      if (!data.weight.trim()) {
        errors.weight = 'Weight is required.';
      } else {
        const val = parseFloat(data.weight);
        if (Number.isNaN(val) || val <= 0) {
          errors.weight = 'Enter a valid weight greater than 0.';
        }
      }
    }

    // subtype, gender, weightUnit have constrained inputs already,
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
      const subtype = formData.subtype;

      // Build the payload with category and subtype
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        category: 'PET',
        subtype: subtype,
        // Pass through the selected characteristic IDs so the API
        // can validate and persist them to the Recipient record.
        characteristics: formData.characteristics,
      };

      // Conditionally include fields based on subtype requirements
      if (SUBTYPES_WITH_BREED.includes(subtype)) {
        payload.breed = formData.breed.trim();
      }

      if (SUBTYPES_WITH_GENDER.includes(subtype)) {
        payload.gender = formData.gender;
      }

      if (SUBTYPES_WITH_BIRTHDATE.includes(subtype)) {
        payload.birthDate = formData.birthDate;
      }

      if (SUBTYPES_WITH_WEIGHT.includes(subtype)) {
        const numericWeight = parseFloat(formData.weight);
        const weightInLbs =
          formData.weightUnit === 'kg' ? numericWeight * 2.20462 : numericWeight;
        payload.weight = weightInLbs;
      }

      // Only include description if it has content
      const trimmedDescription = formData.description.trim();
      if (trimmedDescription) {
        payload.description = trimmedDescription;
      }

      // Only include specialNotes if it has content
      const trimmedSpecialNotes = formData.specialNotes.trim();
      if (trimmedSpecialNotes) {
        payload.specialNotes = trimmedSpecialNotes;
      }

      const res = await fetch('/api/care-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
// Parse response
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add pet');
      }

      // At this point the server accepted the payload, so I reset UI state first and then ask Next to re-run the dashboard query
      resetForm();
      setIsExpanded(false);
      // Using router.refresh to keep the server-rendered dashboard in sync, while onRecipientAdded stays as a hook for any future client-only reactions
      router.refresh();
      if (onRecipientAdded) onRecipientAdded();
    } catch (err) {
      // Logging the raw error here so future-me has something concrete to inspect when the UI only shows a generic failure message
      console.error("Error while adding pet", err);
      setError(err instanceof Error ? err.message : 'Failed to add pet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validates plant form data
  const validatePlant = (data: FormState): FieldErrors => {
    const errors: FieldErrors = {};
    // Name is required
    if (!data.name.trim()) errors.name = 'Name is required.';
    return errors;
  };

  // Handles plant form submission
  const handlePlantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Client-side validation first
    const errors = validatePlant(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Build the payload for plant
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        category: 'PLANT',
        subtype: formData.plantSubtype,
      };

      // Include optional plant-specific fields if they have values
      if (formData.plantSpecies.trim()) {
        payload.plantSpecies = formData.plantSpecies.trim();
      }
      if (formData.sunlight) {
        payload.sunlight = formData.sunlight;
      }
      if (formData.waterFrequency) {
        payload.waterFrequency = formData.waterFrequency;
      }

      // Include shared optional fields if they have content
      const trimmedDescription = formData.description.trim();
      if (trimmedDescription) {
        payload.description = trimmedDescription;
      }
      const trimmedSpecialNotes = formData.specialNotes.trim();
      if (trimmedSpecialNotes) {
        payload.specialNotes = trimmedSpecialNotes;
      }

      const res = await fetch('/api/care-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add plant');
      }

      // Success - reset and refresh
      resetForm();
      setIsExpanded(false);
      router.refresh();
      if (onRecipientAdded) onRecipientAdded();
    } catch (err) {
      console.error("Error while adding plant", err);
      setError(err instanceof Error ? err.message : 'Failed to add plant');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validates person form data
  const validatePerson = (data: FormState): FieldErrors => {
    const errors: FieldErrors = {};
    // Name is required
    if (!data.name.trim()) errors.name = 'Name is required.';
    // Relationship is required
    if (!data.relationship.trim()) errors.relationship = 'Relationship is required.';
    return errors;
  };

  // Handles person form submission
  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Client-side validation first
    const errors = validatePerson(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Build the payload for person
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        category: 'PERSON',
        subtype: formData.personSubtype,
        relationship: formData.relationship.trim(),
      };

      // Include shared optional fields if they have content
      const trimmedDescription = formData.description.trim();
      if (trimmedDescription) {
        payload.description = trimmedDescription;
      }
      const trimmedSpecialNotes = formData.specialNotes.trim();
      if (trimmedSpecialNotes) {
        payload.specialNotes = trimmedSpecialNotes;
      }

      const res = await fetch('/api/care-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add person');
      }

      // Success - reset and refresh
      resetForm();
      setIsExpanded(false);
      router.refresh();
      if (onRecipientAdded) onRecipientAdded();
    } catch (err) {
      console.error("Error while adding person", err);
      setError(err instanceof Error ? err.message : 'Failed to add person');
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
            Add care recipient
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

  // Category selection card component
  const CategoryCard = ({
    categoryType,
    icon,
    title,
    description,
  }: {
    categoryType: RecipientCategory;
    icon: string;
    title: string;
    description: string;
  }) => {
    const isSelected = category === categoryType;
    return (
      <button
        type="button"
        onClick={() => {
          setCategory(categoryType);
          // All categories now have subtype selection
          setStep(1);
        }}
        className="flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:shadow-md"
        style={{
          borderColor: isSelected ? accent : borderColor,
          backgroundColor: isSelected ? alpha(accent, 0.08) : subtleSurface,
        }}
      >
        <span className="text-3xl mb-2">{icon}</span>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: textPrimary }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: textSecondary, textAlign: 'center' }}>
          {description}
        </Typography>
      </button>
    );
  };

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
        aria-label="Close form"
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
          {step === 0
            ? 'Choose Category'
            : step === 1
              ? category === 'PLANT'
                ? 'Choose Plant Type'
                : category === 'PERSON'
                  ? 'Choose Person Type'
                  : 'Choose Pet Type'
              : category === 'PLANT'
                ? 'Add New Plant'
                : category === 'PERSON'
                  ? 'Add New Person'
                  : 'Add New Pet'}
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

      {/* Step 0: Category Selection */}
      {step === 0 && (
        <Box>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
            What type of care recipient would you like to add?
          </Typography>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CategoryCard
              categoryType="PET"
              icon="🐾"
              title="Pet"
              description="Dogs, cats, and other animals"
            />
            <CategoryCard
              categoryType="PLANT"
              icon="🌱"
              title="Plant"
              description="Indoor and outdoor plants"
            />
            <CategoryCard
              categoryType="PERSON"
              icon="👤"
              title="Person"
              description="Family members needing care"
            />
          </div>
        </Box>
      )}

      {/* Step 1: Pet Subtype Selection */}
      {step === 1 && category === 'PET' && (
        <Box>
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setCategory(null);
              setPetSubtype(null);
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm hover:opacity-80"
            style={{ color: textPrimary }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to categories
          </button>

          <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
            What type of pet would you like to add?
          </Typography>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PET_SUBTYPES.map((subtype) => {
              const isSelected = petSubtype === subtype.id;
              return (
                <button
                  key={subtype.id}
                  type="button"
                  onClick={() => {
                    setPetSubtype(subtype.id);
                    setFormData((prev) => ({ ...prev, subtype: subtype.id, breed: '' }));
                    setStep(2);
                  }}
                  className="flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: isSelected ? accent : borderColor,
                    backgroundColor: isSelected ? alpha(accent, 0.08) : subtleSurface,
                  }}
                >
                  <span className="text-2xl mb-1">{subtype.icon}</span>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                    {subtype.label}
                  </Typography>
                </button>
              );
            })}
          </div>
        </Box>
      )}

      {/* Step 1: Plant Subtype Selection */}
      {step === 1 && category === 'PLANT' && (
        <Box>
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setCategory(null);
              setPlantSubtype(null);
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm hover:opacity-80"
            style={{ color: textPrimary }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to categories
          </button>

          <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
            What type of plant would you like to add?
          </Typography>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PLANT_SUBTYPES.map((subtype) => {
              const isSelected = plantSubtype === subtype.id;
              return (
                <button
                  key={subtype.id}
                  type="button"
                  onClick={() => {
                    setPlantSubtype(subtype.id);
                    setFormData((prev) => ({ ...prev, plantSubtype: subtype.id }));
                    setStep(2);
                  }}
                  className="flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: isSelected ? accent : borderColor,
                    backgroundColor: isSelected ? alpha(accent, 0.08) : subtleSurface,
                  }}
                >
                  <span className="text-3xl mb-2">{subtype.icon}</span>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                    {subtype.label}
                  </Typography>
                </button>
              );
            })}
          </div>
        </Box>
      )}

      {/* Step 1: Person Subtype Selection */}
      {step === 1 && category === 'PERSON' && (
        <Box>
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setCategory(null);
              setPersonSubtype(null);
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm hover:opacity-80"
            style={{ color: textPrimary }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to categories
          </button>

          <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
            What type of person would you like to add?
          </Typography>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PERSON_SUBTYPES.map((subtype) => {
              const isSelected = personSubtype === subtype.id;
              return (
                <button
                  key={subtype.id}
                  type="button"
                  onClick={() => {
                    setPersonSubtype(subtype.id);
                    setFormData((prev) => ({ ...prev, personSubtype: subtype.id }));
                    setStep(2);
                  }}
                  className="flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: isSelected ? accent : borderColor,
                    backgroundColor: isSelected ? alpha(accent, 0.08) : subtleSurface,
                  }}
                >
                  <span className="text-3xl mb-2">{subtype.icon}</span>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                    {subtype.label}
                  </Typography>
                </button>
              );
            })}
          </div>
        </Box>
      )}

      {/* Step 2: Pet Form (only for PET category with subtype selected) */}
      {step === 2 && category === 'PET' && petSubtype && (
        <>
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setStep(1);
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm hover:opacity-80"
            style={{ color: textSecondary }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to pet types
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pet type indicator */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
          style={{
            backgroundColor: alpha(accent, 0.12),
            color: accent,
          }}
        >
          <span>{PET_SUBTYPES.find((s) => s.id === petSubtype)?.icon}</span>
          <span className="font-medium">{PET_SUBTYPES.find((s) => s.id === petSubtype)?.label}</span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Name - always shown */}
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
              placeholder={petSubtype === 'FISH' ? 'e.g. Goldie' : 'e.g. Truffle'}
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

          {/* Breed/Species - shown for most subtypes except FISH */}
          {SUBTYPES_WITH_BREED.includes(formData.subtype) && (
            <div>
              <Typography
                component="label"
                variant="overline"
                className="mb-1 block font-semibold"
                style={labelStyles}
              >
                {formData.subtype === 'BIRD' ? 'Species' : 'Breed'}
              </Typography>
              {/* Use BreedSelect for DOG/CAT, text input for others */}
              {(formData.subtype === 'DOG' || formData.subtype === 'CAT') ? (
                <BreedSelect
                  petType={formData.subtype}
                  value={formData.breed}
                  onChange={(next) => updateField('breed', next)}
                  required
                />
              ) : (
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => updateField('breed', e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                  placeholder={
                    formData.subtype === 'BIRD' ? 'e.g. Parakeet, Cockatiel' :
                    formData.subtype === 'SMALL_MAMMAL' ? 'e.g. Hamster, Guinea Pig' :
                    formData.subtype === 'REPTILE' ? 'e.g. Bearded Dragon, Gecko' :
                    'e.g. Sugar Glider, Hedgehog'
                  }
                />
              )}
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
          )}

          {/* Gender - shown for most subtypes except FISH */}
          {SUBTYPES_WITH_GENDER.includes(formData.subtype) && (
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
          )}

          {/* Birth Date - shown for most subtypes except FISH */}
          {SUBTYPES_WITH_BIRTHDATE.includes(formData.subtype) && (
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
          )}

          {/* Weight + Unit - shown for most subtypes except BIRD and FISH */}
          {SUBTYPES_WITH_WEIGHT.includes(formData.subtype) && (
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
          )}

          {/* Description */}
          <div className="md:col-span-2">
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Description (Optional)
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              className="mb-2 block"
            >
              Tell us about your pet&apos;s personality, history, or background.
            </Typography>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ...inputStyles, ...focusRingStyle }}
              placeholder="e.g. Rescued in 2020, loves tennis balls, scared of thunder..."
            />
            <Typography
              variant="caption"
              color="text.secondary"
              className="mt-1 block text-right"
            >
              {formData.description.length}/500 characters
            </Typography>
          </div>

          {/* Special Notes */}
          <div className="md:col-span-2">
            <Typography
              component="label"
              variant="overline"
              className="mb-1 block font-semibold"
              style={labelStyles}
            >
              Special Notes (Optional)
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              className="mb-2 block"
            >
              Important instructions for caregivers (medication schedules, routines, etc.).
            </Typography>
            <textarea
              value={formData.specialNotes}
              onChange={(e) => updateField('specialNotes', e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ...inputStyles, ...focusRingStyle }}
              placeholder="e.g. Give insulin at 8am/6pm, use harness not collar..."
            />
            <Typography
              variant="caption"
              color="text.secondary"
              className="mt-1 block text-right"
            >
              {formData.specialNotes.length}/500 characters
            </Typography>
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
        </>
      )}

      {/* Step 2: Plant Form (only for PLANT category with subtype selected) */}
      {step === 2 && category === 'PLANT' && plantSubtype && (
        <>
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setStep(1);
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm hover:opacity-80"
            style={{ color: textSecondary }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to plant types
          </button>

          <form onSubmit={handlePlantSubmit} className="space-y-5">
            {/* Plant type indicator */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
              style={{
                backgroundColor: alpha(accent, 0.12),
                color: accent,
              }}
            >
              <span>{PLANT_SUBTYPES.find((s) => s.id === plantSubtype)?.icon}</span>
              <span className="font-medium">{PLANT_SUBTYPES.find((s) => s.id === plantSubtype)?.label}</span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Name - required */}
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
                  placeholder="e.g. Living Room Fern"
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

              {/* Plant Species - optional */}
              <div>
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Species (Optional)
                </Typography>
                <input
                  type="text"
                  value={formData.plantSpecies}
                  onChange={(e) => updateField('plantSpecies', e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                  placeholder="e.g. Monstera Deliciosa"
                />
              </div>

              {/* Sunlight */}
              <div>
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Light Requirements
                </Typography>
                <select
                  value={formData.sunlight}
                  onChange={(e) => updateField('sunlight', e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                >
                  <option value="">Select light level...</option>
                  {SUNLIGHT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Water Frequency */}
              <div>
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Watering Frequency
                </Typography>
                <select
                  value={formData.waterFrequency}
                  onChange={(e) => updateField('waterFrequency', e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                >
                  <option value="">Select frequency...</option>
                  {WATER_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Description (Optional)
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mb-2 block"
                >
                  Where is this plant located? Any special characteristics?
                </Typography>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                  placeholder="e.g. On the bookshelf in the living room, needs humidity..."
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mt-1 block text-right"
                >
                  {formData.description.length}/500 characters
                </Typography>
              </div>

              {/* Special Notes */}
              <div className="md:col-span-2">
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Care Notes (Optional)
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mb-2 block"
                >
                  Special care instructions, fertilizing schedule, etc.
                </Typography>
                <textarea
                  value={formData.specialNotes}
                  onChange={(e) => updateField('specialNotes', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                  placeholder="e.g. Fertilize monthly in spring/summer, mist leaves weekly..."
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mt-1 block text-right"
                >
                  {formData.specialNotes.length}/500 characters
                </Typography>
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
                {isSubmitting ? 'Adding…' : 'Add Plant'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Step 2: Person Form (only for PERSON category with subtype selected) */}
      {step === 2 && category === 'PERSON' && personSubtype && (
        <>
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setStep(1);
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm hover:opacity-80"
            style={{ color: textSecondary }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to person types
          </button>

          <form onSubmit={handlePersonSubmit} className="space-y-5">
            {/* Person type indicator */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
              style={{
                backgroundColor: alpha(accent, 0.12),
                color: accent,
              }}
            >
              <span>{PERSON_SUBTYPES.find((s) => s.id === personSubtype)?.icon}</span>
              <span className="font-medium">{PERSON_SUBTYPES.find((s) => s.id === personSubtype)?.label}</span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Name - required */}
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
                  placeholder="e.g. Grandma Rose"
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

              {/* Relationship - required */}
              <div>
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Relationship
                </Typography>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => updateField('relationship', e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                  placeholder="e.g. Grandmother, Nephew, Neighbor"
                />
                {fieldErrors.relationship && (
                  <Typography
                    variant="caption"
                    color="error"
                    className="mt-1 block"
                    component="p"
                  >
                    {fieldErrors.relationship}
                  </Typography>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Description (Optional)
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mb-2 block"
                >
                  General information about this person and their care needs.
                </Typography>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                  placeholder="e.g. Lives alone, enjoys gardening, has limited mobility..."
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mt-1 block text-right"
                >
                  {formData.description.length}/500 characters
                </Typography>
              </div>

              {/* Special Notes */}
              <div className="md:col-span-2">
                <Typography
                  component="label"
                  variant="overline"
                  className="mb-1 block font-semibold"
                  style={labelStyles}
                >
                  Care Notes (Optional)
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mb-2 block"
                >
                  Important care instructions, medical notes, schedules, etc.
                </Typography>
                <textarea
                  value={formData.specialNotes}
                  onChange={(e) => updateField('specialNotes', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ...inputStyles, ...focusRingStyle }}
                  placeholder="e.g. Takes medication at 8am and 6pm, prefers visits in the afternoon..."
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mt-1 block text-right"
                >
                  {formData.specialNotes.length}/500 characters
                </Typography>
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
                {isSubmitting ? 'Adding…' : 'Add Person'}
              </button>
            </div>
          </form>
        </>
      )}
    </Paper>
  );
}
