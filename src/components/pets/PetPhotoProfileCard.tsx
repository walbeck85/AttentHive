'use client';

import React from 'react';
import PetPhotoUpload from '@/components/pets/PetPhotoUpload';
import BreedSelect from '@/components/pets/BreedSelect';
import Grid from '@mui/material/Grid';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Typography, Button, Divider } from '@mui/material';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import type {
  EditFieldErrors,
  EditFormState,
  PetData,
} from '@/components/pets/PetDetailPage';

type PetPhotoProfileCardProps = {
  pet: PetData;
  isEditingProfile: boolean;
  isSavingProfile: boolean;
  editForm: EditFormState | null;
  editFieldErrors: EditFieldErrors;
  editError: string | null;
  onStartEditProfile: () => void;
  onCancelEditProfile: () => void;
  onProfileSave: (event: React.FormEvent) => void;
  onUpdateEditField: <K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K],
  ) => void;
  onToggleCharacteristic: (id: PetCharacteristicId) => void;
  onPhotoUploaded: (imageUrl: string | null) => void;
};

function calculateAge(birthDate: string): number {
  // Normalize age calculation to UTC so UI does not vary by timezone
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

function getCharacteristicLabel(id: PetCharacteristicId): string {
  // Prefer configured label when available, otherwise derive a readable fallback
  const meta = PET_CHARACTERISTICS.find((item) => item.id === id);
  return meta ? meta.label : id.toLowerCase().replace(/_/g, ' ');
}

export default function PetPhotoProfileCard({
  pet,
  isEditingProfile,
  isSavingProfile,
  editForm,
  editFieldErrors,
  editError,
  onStartEditProfile,
  onCancelEditProfile,
  onProfileSave,
  onUpdateEditField,
  onToggleCharacteristic,
  onPhotoUploaded,
}: PetPhotoProfileCardProps) {
  // Theme tokens used to keep spacing, borders, and focus states consistent with MUI
  const theme = useTheme();

  // Palette-driven colors prevent hard-coded hex values and auto-adjust for light and dark modes
  const borderSubtle = theme.palette.divider;
  const textMuted = theme.palette.text.secondary;
  const focusColor = theme.palette.success.main;
  const hoverSurface = alpha(theme.palette.primary.main, 0.12);
  const quietSurface = alpha(theme.palette.primary.main, 0.06);
  const selectedSurface = alpha(theme.palette.success.main, 0.18);
  const selectedText = theme.palette.success.dark || theme.palette.success.main;

  // Input styling leans on palette tokens so focus and hover states remain legible across themes
  const inputSx = {
    width: '100%',
    borderRadius: 1,
    border: '1px solid',
    borderColor: borderSubtle,
    bgcolor: 'background.paper',
    px: 2,
    py: 1.5,
    fontSize: '0.875rem',
    color: 'text.primary',
    '&:focus': {
      borderColor: focusColor,
      outline: 'none',
      boxShadow: `0 0 0 1px ${focusColor}`,
    },
  } as const;

  // Shared overline styling so labels and metadata stay visually cohesive
  const labelColorSx = { color: textMuted, letterSpacing: '0.12em' };

  return (
    <Box component="section">
      {/* Card shell uses MUI for spacing and borders to avoid Tailwind duplication */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ px: { xs: 2.5, md: 3 }, py: { xs: 2.5, md: 3 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 5 }}>
              {/* Photo upload column stays narrow on desktop and full width on mobile */}
              <Typography
                component="h2"
                variant="h6"
                sx={{ mb: 1.5, fontWeight: 700 }}
              >
                Photo
              </Typography>
              <PetPhotoUpload
                recipientId={pet.id}
                name={pet.name}
                initialImageUrl={pet.imageUrl ?? null}
                onUploaded={(imageUrl) => {
                  onPhotoUploaded(imageUrl);
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  borderTop: { xs: '1px solid', md: 'none' },
                  borderLeft: { xs: 'none', md: '1px solid' },
                  borderColor: borderSubtle,
                  pt: { xs: 2, md: 0 },
                  pl: { xs: 0, md: 3 },
                }}
              >
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                  }}
                >
                  {/* Heading and edit affordance keep visual hierarchy via MUI */}
                  <Typography
                    component="h2"
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    Profile
                  </Typography>
                  {!isEditingProfile && (
                    <Button
                      type="button"
                      onClick={onStartEditProfile}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        fontWeight: 600,
                        borderColor: borderSubtle,
                        color: textMuted,
                        '&:hover': {
                          bgcolor: hoverSurface,
                          borderColor: borderSubtle,
                        },
                      }}
                    >
                      Edit profile
                    </Button>
                  )}
                </Box>

                {editError && (
                  <Box
                    sx={{
                      mb: 2,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: theme.palette.error.light,
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      color: theme.palette.error.main,
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    {/* Inline alert styled via palette to avoid extra components */}
                    <Typography variant="caption" component="p" sx={{ m: 0 }}>
                      {editError}
                    </Typography>
                  </Box>
                )}

                {isEditingProfile && editForm ? (
                  <Box
                  component="form"
                  onSubmit={onProfileSave}
                  sx={{
                    mt: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {/* Two column grid on desktop keeps inputs compact while remaining fluid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      columnGap: 2,
                        rowGap: 1.5,
                      }}
                    >
                      <div>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Name
                        </Typography>
                        <Box
                          component="input"
                          type="text"
                          value={editForm.name}
                          onChange={(e) => onUpdateEditField('name', e.target.value)}
                          sx={inputSx}
                        />
                        {editFieldErrors.name && (
                          <Typography
                            variant="caption"
                            color="error"
                            component="p"
                            sx={{ mt: 0.5 }}
                          >
                            {editFieldErrors.name}
                          </Typography>
                        )}
                      </div>

                      <div>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Type
                        </Typography>
                        {/* Native radios with accentColor keep semantics and MUI focus styling */}
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Box
                            component="label"
                            sx={{
                              display: 'inline-flex',
                              cursor: 'pointer',
                              alignItems: 'center',
                              gap: 0.75,
                            }}
                          >
                            <Box
                              component="input"
                              type="radio"
                              name="edit-type"
                              value="DOG"
                              checked={editForm.type === 'DOG'}
                              onChange={(e) =>
                                onUpdateEditField(
                                  'type',
                                  e.target.value as EditFormState['type'],
                                )
                              }
                              sx={{
                                accentColor: focusColor,
                                '&:focus-visible': { outline: 'none' },
                              }}
                            />
                            <Typography variant="body2" component="span">
                              Dog
                            </Typography>
                          </Box>
                          <Box
                            component="label"
                            sx={{
                              display: 'inline-flex',
                              cursor: 'pointer',
                              alignItems: 'center',
                              gap: 0.75,
                            }}
                          >
                            <Box
                              component="input"
                              type="radio"
                              name="edit-type"
                              value="CAT"
                              checked={editForm.type === 'CAT'}
                              onChange={(e) =>
                                onUpdateEditField(
                                  'type',
                                  e.target.value as EditFormState['type'],
                                )
                              }
                              sx={{
                                accentColor: focusColor,
                                '&:focus-visible': { outline: 'none' },
                              }}
                            />
                            <Typography variant="body2" component="span">
                              Cat
                            </Typography>
                          </Box>
                        </Box>
                      </div>

                      <div>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Breed
                        </Typography>
                        <BreedSelect
                          petType={editForm.type}
                          value={editForm.breed}
                          onChange={(next) => onUpdateEditField('breed', next)}
                          required
                        />
                        {editFieldErrors.breed && (
                          <Typography
                            variant="caption"
                            color="error"
                            component="p"
                            sx={{ mt: 0.5 }}
                          >
                            {editFieldErrors.breed}
                          </Typography>
                        )}
                      </div>

                      <div>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Sex
                        </Typography>
                        <Box
                          component="select"
                          value={editForm.gender}
                          onChange={(e) =>
                            onUpdateEditField(
                              'gender',
                              e.target.value as EditFormState['gender'],
                            )
                          }
                          sx={inputSx}
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </Box>
                      </div>

                      <div>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Birth Date
                        </Typography>
                        <Box
                          component="input"
                          type="date"
                          value={editForm.birthDate}
                          onChange={(e) => onUpdateEditField('birthDate', e.target.value)}
                          sx={inputSx}
                        />
                        {editFieldErrors.birthDate && (
                          <Typography
                            variant="caption"
                            color="error"
                            component="p"
                            sx={{ mt: 0.5 }}
                          >
                            {editFieldErrors.birthDate}
                          </Typography>
                        )}
                      </div>

                      <div>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Weight (lbs)
                        </Typography>
                        <Box
                          component="input"
                          type="number"
                          step="0.1"
                          value={editForm.weight}
                          onChange={(e) => onUpdateEditField('weight', e.target.value)}
                          sx={inputSx}
                        />
                        {editFieldErrors.weight && (
                          <Typography
                            variant="caption"
                            color="error"
                            component="p"
                            sx={{ mt: 0.5 }}
                          >
                            {editFieldErrors.weight}
                          </Typography>
                        )}
                      </div>

                      {/* Description */}
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Description (Optional)
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.75 }}
                        >
                          Tell us about your pet&apos;s personality, history, or background.
                        </Typography>
                        <Box
                          component="textarea"
                          value={editForm.description}
                          onChange={(e) => onUpdateEditField('description', e.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="e.g. Rescued in 2020, loves tennis balls, scared of thunder..."
                          sx={{
                            ...inputSx,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
                        >
                          {editForm.description.length}/500 characters
                        </Typography>
                        {editFieldErrors.description && (
                          <Typography
                            variant="caption"
                            color="error"
                            component="p"
                            sx={{ mt: 0.5 }}
                          >
                            {editFieldErrors.description}
                          </Typography>
                        )}
                      </Box>

                      {/* Special Notes */}
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.5, ...labelColorSx }}
                        >
                          Special Notes (Optional)
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.75 }}
                        >
                          Important instructions for caregivers (medication schedules, routines, etc.).
                        </Typography>
                        <Box
                          component="textarea"
                          value={editForm.specialNotes}
                          onChange={(e) => onUpdateEditField('specialNotes', e.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="e.g. Give insulin at 8am/6pm, use harness not collar..."
                          sx={{
                            ...inputSx,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
                        >
                          {editForm.specialNotes.length}/500 characters
                        </Typography>
                        {editFieldErrors.specialNotes && (
                          <Typography
                            variant="caption"
                            color="error"
                            component="p"
                            sx={{ mt: 0.5 }}
                          >
                            {editFieldErrors.specialNotes}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography
                          component="label"
                          variant="overline"
                          sx={{ display: 'block', mb: 0.75, ...labelColorSx }}
                        >
                          Characteristics
                        </Typography>
                        {/* Characteristic chips stay MUI-styled for consistent focus, hover, and selection */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {PET_CHARACTERISTICS.map((item) => {
                            const isSelected = editForm.characteristics.includes(item.id);
                            return (
                              <Box
                                key={item.id}
                                type="button"
                                onClick={() => onToggleCharacteristic(item.id)}
                                component="button"
                                sx={{
                                  display: 'flex',
                                  width: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderRadius: '999px',
                                  px: 1.5,
                                  py: 0.75,
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  border: '1px solid',
                                  borderColor: isSelected ? focusColor : borderSubtle,
                                  bgcolor: isSelected ? selectedSurface : quietSurface,
                                  color: isSelected ? selectedText : textMuted,
                                  cursor: 'pointer',
                                  transition:
                                    'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                                }}
                              >
                                <span>{getCharacteristicLabel(item.id)}</span>
                                <Box
                                  component="span"
                                  sx={{
                                    position: 'relative',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    height: 20,
                                    width: 36,
                                    borderRadius: '999px',
                                    transition: 'background-color 150ms ease',
                                    backgroundColor: isSelected ? focusColor : borderSubtle,
                                  }}
                                >
                                  <Box
                                    component="span"
                                    sx={{
                                      display: 'inline-block',
                                      height: 16,
                                      width: 16,
                                      borderRadius: '50%',
                                      boxShadow: theme.shadows[1],
                                      transition: 'transform 150ms ease',
                                      transform: `translateX(${isSelected ? 16 : 2}px)`,
                                      backgroundColor: theme.palette.background.paper,
                                    }}
                                  />
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ mt: 2, mb: 1.5, borderColor: borderSubtle }} />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1.5,
                      }}
                    >
                      {/* Action row aligns with form spacing and preserves MUI button sizing */}
                      <Button
                        type="button"
                        onClick={onCancelEditProfile}
                        size="small"
                        sx={{
                          textTransform: 'none',
                          color: textMuted,
                          '&:hover': { bgcolor: hoverSurface },
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSavingProfile}
                        variant="contained"
                        size="small"
                        sx={{
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          fontWeight: 600,
                        }}
                      >
                        {isSavingProfile ? 'Saving…' : 'Save changes'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  /* Read-only summary mirrors form spacing using MUI grid primitives */
                  <Box>
                    <Box
                      component="dl"
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(2, minmax(0, 1fr))',
                          md: 'repeat(3, minmax(0, 1fr))',
                        },
                        columnGap: 3,
                        rowGap: 1.5,
                        fontSize: '0.75rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: textMuted,
                      }}
                    >
                      <Box component="div">
                        <Typography component="dt" variant="subtitle2" sx={{ fontSize: 'inherit' }}>
                          Age
                        </Typography>
                        <Typography
                          component="dd"
                          variant="body2"
                          sx={{ mt: 0.5, fontWeight: 600, textTransform: 'none', color: 'text.primary' }}
                        >
                          {calculateAge(pet.birthDate)} yrs
                        </Typography>
                      </Box>
                      <Box component="div">
                        <Typography component="dt" variant="subtitle2" sx={{ fontSize: 'inherit' }}>
                          Weight
                        </Typography>
                        <Typography
                          component="dd"
                          variant="body2"
                          sx={{ mt: 0.5, fontWeight: 600, textTransform: 'none', color: 'text.primary' }}
                        >
                          {pet.weight} lbs
                        </Typography>
                      </Box>
                      <Box component="div">
                        <Typography component="dt" variant="subtitle2" sx={{ fontSize: 'inherit' }}>
                          Sex
                        </Typography>
                        <Typography
                          component="dd"
                          variant="body2"
                          sx={{ mt: 0.5, fontWeight: 600, textTransform: 'none', color: 'text.primary' }}
                        >
                          {pet.gender === 'MALE' ? 'Male' : 'Female'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Description */}
                    {pet.description && (
                      <Box sx={{ mt: 2.5 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            fontSize: '0.75rem',
                            ...labelColorSx,
                          }}
                        >
                          Description
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {pet.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Special Notes */}
                    {pet.specialNotes && (
                      <Box sx={{ mt: 2.5 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            fontSize: '0.75rem',
                            ...labelColorSx,
                          }}
                        >
                          Special Notes
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {pet.specialNotes}
                        </Typography>
                      </Box>
                    )}

                    {/* Characteristics */}
                    {pet.characteristics && pet.characteristics.length > 0 && (
                      <Box sx={{ mt: 2.5 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            fontSize: '0.75rem',
                            ...labelColorSx,
                          }}
                        >
                          Characteristics
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {pet.characteristics.map((id) => (
                            <Box
                              key={id}
                              component="span"
                              sx={{
                                display: 'inline-block',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                border: '1px solid',
                                borderColor: borderSubtle,
                                bgcolor: quietSurface,
                                color: textMuted,
                              }}
                            >
                              {getCharacteristicLabel(id)}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
