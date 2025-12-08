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
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

function getCharacteristicLabel(id: PetCharacteristicId): string {
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
  const theme = useTheme();

  const borderSubtle = theme.palette.divider;
  const textMuted = theme.palette.text.secondary;
  const focusColor = theme.palette.success.main;
  const hoverSurface = alpha(theme.palette.primary.main, 0.12);
  const quietSurface = alpha(theme.palette.primary.main, 0.06);
  const selectedSurface = alpha(theme.palette.success.main, 0.18);
  const selectedText = theme.palette.success.dark || theme.palette.success.main;

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

  const labelColorSx = { color: textMuted };

  return (
    <Box component="section" className="mm-section">
      <Card
        elevation={0}
        className="mm-card"
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
              <Typography
                component="h2"
                variant="subtitle1"
                className="mm-h3"
                sx={{ mb: 1.5 }}
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Typography
                    component="h2"
                    variant="subtitle1"
                    className="mm-h3"
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
                        fontSize: 11,
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
                      bgcolor: alpha(theme.palette.error.light, 0.3),
                      px: 1.5,
                      py: 1,
                    }}
                    className="text-xs"
                  >
                    {editError}
                  </Box>
                )}

                {isEditingProfile && editForm ? (
                  <Box
                    component="form"
                    onSubmit={onProfileSave}
                    sx={{ mt: 1.5 }}
                    className="space-y-4"
                  >
                    <div
                      className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs uppercase tracking-wide"
                      style={{ color: textMuted }}
                    >
                      <div>
                        <label className="mb-1 block" style={labelColorSx}>
                          Name
                        </label>
                        <Box
                          component="input"
                          type="text"
                          value={editForm.name}
                          onChange={(e) => onUpdateEditField('name', e.target.value)}
                          sx={inputSx}
                        />
                        {editFieldErrors.name && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {editFieldErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block" style={labelColorSx}>
                          Type
                        </label>
                        <div className="flex gap-3 text-[13px]">
                          <label className="flex cursor-pointer items-center gap-1.5">
                            <input
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
                              className="focus:ring-0"
                              style={{ accentColor: focusColor }}
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
                                onUpdateEditField(
                                'type',
                                e.target.value as EditFormState['type'],
                              )
                            }
                              className="focus:ring-0"
                              style={{ accentColor: focusColor }}
                            />
                            <span>Cat</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block" style={labelColorSx}>
                          Breed
                        </label>
                        <BreedSelect
                          petType={editForm.type}
                          value={editForm.breed}
                          onChange={(next) => onUpdateEditField('breed', next)}
                          required
                        />
                        {editFieldErrors.breed && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {editFieldErrors.breed}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block" style={labelColorSx}>
                          Sex
                        </label>
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
                        <label className="mb-1 block" style={labelColorSx}>
                          Birth Date
                        </label>
                        <Box
                          component="input"
                          type="date"
                          value={editForm.birthDate}
                          onChange={(e) => onUpdateEditField('birthDate', e.target.value)}
                          sx={inputSx}
                        />
                        {editFieldErrors.birthDate && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {editFieldErrors.birthDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block" style={labelColorSx}>
                          Weight (lbs)
                        </label>
                        <Box
                          component="input"
                          type="number"
                          step="0.1"
                          value={editForm.weight}
                          onChange={(e) => onUpdateEditField('weight', e.target.value)}
                          sx={inputSx}
                        />
                        {editFieldErrors.weight && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {editFieldErrors.weight}
                          </p>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="mb-2 block" style={labelColorSx}>
                          Characteristics
                        </label>
                        <div className="space-y-2">
                          {PET_CHARACTERISTICS.map((item) => {
                            const isSelected = editForm.characteristics.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onToggleCharacteristic(item.id)}
                                className="flex w-full items-center justify-between rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors"
                                style={{
                                  border: '1px solid',
                                  borderColor: isSelected ? focusColor : borderSubtle,
                                  backgroundColor: isSelected ? selectedSurface : quietSurface,
                                  color: isSelected ? selectedText : textMuted,
                                }}
                              >
                                <span>{getCharacteristicLabel(item.id)}</span>
                                <span
                                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                                  style={{
                                    backgroundColor: isSelected ? focusColor : borderSubtle,
                                  }}
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

                    <Divider sx={{ mt: 2, mb: 1.5, borderColor: borderSubtle }} />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1.5,
                      }}
                    >
                      <Button
                        type="button"
                        onClick={onCancelEditProfile}
                        size="small"
                        sx={{
                          textTransform: 'none',
                          fontSize: 12,
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
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {isSavingProfile ? 'Saving…' : 'Save changes'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <dl
                    className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs uppercase tracking-wide"
                    style={{ color: textMuted }}
                  >
                    <div>
                      <dt>Age</dt>
                      <dd className="mt-1 font-medium normal-case">
                        {calculateAge(pet.birthDate)} yrs
                      </dd>
                    </div>
                    <div>
                      <dt>Weight</dt>
                      <dd className="mt-1 font-medium normal-case">
                        {pet.weight} lbs
                      </dd>
                    </div>
                    <div>
                      <dt>Sex</dt>
                      <dd className="mt-1 font-medium normal-case">
                        {pet.gender === 'MALE' ? 'Male' : 'Female'}
                      </dd>
                    </div>
                  </dl>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
