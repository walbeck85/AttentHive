'use client';

import React from 'react';
import PetPhotoUpload from '@/components/pets/PetPhotoUpload';
import BreedSelect from '@/components/pets/BreedSelect';
import Grid from '@mui/material/Grid';
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
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
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
                  borderTop: { xs: "1px solid", md: "none" },
                  borderLeft: { xs: "none", md: "1px solid" },
                  borderColor: "#E5D9C6",
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
                        borderColor: '#D0C1AC',
                        color: '#6A5740',
                        '&:hover': {
                          bgcolor: '#F3E6D3',
                          borderColor: '#D0C1AC',
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
                      borderColor: '#fecaca',
                      bgcolor: '#fee2e2',
                      px: 1.5,
                      py: 1,
                    }}
                    className="text-xs text-red-700"
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
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs uppercase tracking-wide text-[#B09A7C]">
                      <div>
                        <label className="mb-1 block">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => onUpdateEditField('name', e.target.value)}
                          className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                        />
                        {editFieldErrors.name && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {editFieldErrors.name}
                          </p>
                        )}
                      </div>

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
                                onUpdateEditField(
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
                                onUpdateEditField(
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

                      <div>
                        <label className="mb-1 block">Breed</label>
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
                        <label className="mb-1 block">Sex</label>
                        <select
                          value={editForm.gender}
                          onChange={(e) =>
                            onUpdateEditField(
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

                      <div>
                        <label className="mb-1 block">Birth Date</label>
                        <input
                          type="date"
                          value={editForm.birthDate}
                          onChange={(e) => onUpdateEditField('birthDate', e.target.value)}
                          className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                        />
                        {editFieldErrors.birthDate && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {editFieldErrors.birthDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block">Weight (lbs)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.weight}
                          onChange={(e) => onUpdateEditField('weight', e.target.value)}
                          className="w-full rounded border border-[#E1D6C5] bg-white px-2 py-1.5 text-sm text-[#3A2A18] focus:border-[#3E6B3A] focus:outline-none focus:ring-1 focus:ring-[#3E6B3A]"
                        />
                        {editFieldErrors.weight && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {editFieldErrors.weight}
                          </p>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="mb-2 block">Characteristics</label>
                        <div className="space-y-2">
                          {PET_CHARACTERISTICS.map((item) => {
                            const isSelected = editForm.characteristics.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onToggleCharacteristic(item.id)}
                                className={[
                                  'flex w-full items-center justify-between rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
                                  isSelected
                                    ? 'border-[#3E6B3A] bg-[#E0F2E9] text-[#234434]'
                                    : 'border-[#D0C1AC] bg-[#FDF7EE] text-[#6A5740] hover:bg-[#F3E6D3]',
                                ].join(' ')}
                              >
                                <span>{getCharacteristicLabel(item.id)}</span>
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

                    <Divider sx={{ mt: 2, mb: 1.5, borderColor: '#E9DECF' }} />

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
                          color: '#6A5740',
                          '&:hover': { bgcolor: '#F3E6D3' },
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
                  <dl className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs uppercase tracking-wide text-[#B09A7C]">
                    <div>
                      <dt>Age</dt>
                      <dd className="mt-1 font-medium normal-case text-[#382110] dark:text-[#FFF4E3]">
                        {calculateAge(pet.birthDate)} yrs
                      </dd>
                    </div>
                    <div>
                      <dt>Weight</dt>
                      <dd className="mt-1 font-medium normal-case text-[#382110] dark:text-[#FFF4E3]">
                        {pet.weight} lbs
                      </dd>
                    </div>
                    <div>
                      <dt>Sex</dt>
                      <dd className="mt-1 font-medium normal-case text-[#382110] dark:text-[#FFF4E3]">
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
