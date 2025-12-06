'use client';

import React from 'react';
import PetPhotoUpload from '@/components/pets/PetPhotoUpload';
import BreedSelect from '@/components/pets/BreedSelect';
import Grid from '@mui/material/GridLegacy';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
  return (
    <Box component="section" className="mm-section">
      <Paper
        elevation={0}
        className="mm-card"
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
          <Grid item xs={12} md={5}>
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

          <Grid item xs={12} md={7}>
            <Box
              sx={{
                borderTop: { xs: '1px solid', md: 'none' },
                borderLeft: { xs: 'none', md: '1px solid' },
                borderColor: 'divider',
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
                <Alert severity="error" sx={{ mb: 2 }}>
                  {editError}
                </Alert>
              )}

              {isEditingProfile && editForm ? (
                <Box component="form" onSubmit={onProfileSave} sx={{ mt: 1.5 }}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Name"
                        value={editForm.name}
                        onChange={(e) => onUpdateEditField('name', e.target.value)}
                        fullWidth
                        size="small"
                        error={Boolean(editFieldErrors.name)}
                        helperText={editFieldErrors.name}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend" sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Type
                        </FormLabel>
                        <RadioGroup
                          row
                          value={editForm.type}
                          onChange={(e) =>
                            onUpdateEditField(
                              'type',
                              e.target.value as EditFormState['type'],
                            )
                          }
                        >
                          <FormControlLabel value="DOG" control={<Radio size="small" />} label="Dog" />
                          <FormControlLabel value="CAT" control={<Radio size="small" />} label="Cat" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <FormLabel sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                          Breed
                        </FormLabel>
                        <BreedSelect
                          petType={editForm.type}
                          value={editForm.breed}
                          onChange={(next) => onUpdateEditField('breed', next)}
                          required
                        />
                        {editFieldErrors.breed && (
                          <Typography variant="caption" color="error">
                            {editFieldErrors.breed}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Sex"
                        value={editForm.gender}
                        onChange={(e) =>
                          onUpdateEditField(
                            'gender',
                            e.target.value as EditFormState['gender'],
                          )
                        }
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="MALE">Male</MenuItem>
                        <MenuItem value="FEMALE">Female</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="date"
                        label="Birth date"
                        value={editForm.birthDate}
                        onChange={(e) => onUpdateEditField('birthDate', e.target.value)}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        error={Boolean(editFieldErrors.birthDate)}
                        helperText={editFieldErrors.birthDate}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        inputProps={{ step: 0.1 }}
                        label="Weight (lbs)"
                        value={editForm.weight}
                        onChange={(e) => onUpdateEditField('weight', e.target.value)}
                        fullWidth
                        size="small"
                        error={Boolean(editFieldErrors.weight)}
                        helperText={editFieldErrors.weight}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormLabel sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                        Characteristics
                      </FormLabel>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {PET_CHARACTERISTICS.map((item) => {
                          const isSelected = editForm.characteristics.includes(item.id);
                          return (
                            <Chip
                              key={item.id}
                              label={getCharacteristicLabel(item.id)}
                              variant={isSelected ? 'filled' : 'outlined'}
                              color={isSelected ? 'primary' : 'default'}
                              onClick={() => onToggleCharacteristic(item.id)}
                              sx={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontWeight: 700,
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Grid>
                  </Grid>

                  <Divider sx={{ mt: 3, mb: 2 }} />

                  <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                    <Button
                      type="button"
                      onClick={onCancelEditProfile}
                      size="small"
                      variant="text"
                      sx={{ textTransform: 'none' }}
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
                  </Stack>
                </Box>
              ) : (
                <Grid container spacing={2} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption">Age</Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, textTransform: 'none', color: 'text.primary' }}>
                      {calculateAge(pet.birthDate)} yrs
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption">Weight</Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, textTransform: 'none', color: 'text.primary' }}>
                      {pet.weight} lbs
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption">Sex</Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, textTransform: 'none', color: 'text.primary' }}>
                      {pet.gender === 'MALE' ? 'Male' : 'Female'}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
