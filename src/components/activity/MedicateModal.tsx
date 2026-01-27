'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ActivityPhotoPicker from '../pets/ActivityPhotoPicker';

export type MedicateMetadata = {
  medication: string;
  dosage: string;
  administeredAt: string;
  notes?: string;
};

interface MedicateModalProps {
  open: boolean;
  recipientId: string;
  recipientName: string;
  onSuccess: () => void;
  onClose: () => void;
}

// Format datetime-local value for input
function getDefaultDateTime(): string {
  const now = new Date();
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function MedicateModal({
  open,
  recipientId,
  recipientName,
  onSuccess,
  onClose,
}: MedicateModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [administeredAt, setAdministeredAt] = useState(getDefaultDateTime());
  const [notes, setNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isValid = medication.trim() !== '' && dosage.trim() !== '';

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const metadata: MedicateMetadata = {
        medication: medication.trim(),
        dosage: dosage.trim(),
        administeredAt: administeredAt || new Date().toISOString(),
      };

      if (notes.trim()) {
        metadata.notes = notes.trim();
      }

      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: recipientId,
          activityType: 'MEDICATE',
          metadata,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to log medication');
      }

      // Upload photo if provided
      if (selectedPhoto && data.log?.id) {
        const formData = new FormData();
        formData.append('file', selectedPhoto);

        await fetch(`/api/care-logs/${data.log.id}/photo`, {
          method: 'POST',
          body: formData,
        });
      }

      // Reset form
      setMedication('');
      setDosage('');
      setAdministeredAt(getDefaultDateTime());
      setNotes('');
      setSelectedPhoto(null);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error logging medication:', err);
      setError(err instanceof Error ? err.message : 'Failed to log medication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMedication('');
    setDosage('');
    setAdministeredAt(getDefaultDateTime());
    setNotes('');
    setSelectedPhoto(null);
    setError(null);
    onClose();
  };

  const overlayColor = alpha(theme.palette.common.black, isDark ? 0.65 : 0.4);
  const cardBg = theme.palette.background.paper;
  const cardBorder = theme.palette.divider;
  const cardShadow = isDark
    ? `0 28px 70px ${alpha(theme.palette.common.black, 0.7)}`
    : `0 20px 50px ${alpha(theme.palette.common.black, 0.35)}`;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicate-modal-title"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: theme.zIndex.modal,
        backgroundColor: overlayColor,
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 3,
        overflow: 'auto',
      }}
      onClick={handleClose}
    >
      <Paper
        onClick={(e) => e.stopPropagation()}
        elevation={0}
        sx={{
          maxWidth: 480,
          width: 'min(480px, 100%)',
          borderRadius: 3,
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          px: { xs: 2.5, sm: 3 },
          py: { xs: 2.25, sm: 2.75 },
          color: theme.palette.text.primary,
          my: 2,
        }}
      >
        <Stack spacing={2}>
          <Typography
            id="medicate-modal-title"
            variant="h6"
            sx={{ fontWeight: 700, textAlign: 'center' }}
          >
            Log medication for {recipientName}
          </Typography>

          <TextField
            label="Medication name"
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
            required
            fullWidth
            size="small"
            disabled={isLoading}
            placeholder="e.g., Amoxicillin, Vitamin D"
          />

          <TextField
            label="Dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            required
            fullWidth
            size="small"
            disabled={isLoading}
            placeholder="e.g., 2 pills, 5ml, 10mg"
          />

          <TextField
            label="Time administered"
            type="datetime-local"
            value={administeredAt}
            onChange={(e) => setAdministeredAt(e.target.value)}
            fullWidth
            size="small"
            disabled={isLoading}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            disabled={isLoading}
            placeholder="Any additional notes..."
          />

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ActivityPhotoPicker
              onPhotoChange={setSelectedPhoto}
              disabled={isLoading}
            />
          </Box>

          {error && (
            <Typography variant="body2" color="error" textAlign="center">
              {error}
            </Typography>
          )}

          <Stack direction="row" spacing={1.5} justifyContent="center" pt={1}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleClose}
              disabled={isLoading}
              sx={{
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.25)
                  : theme.palette.divider,
                color: theme.palette.text.primary,
                px: 2.5,
                minWidth: 100,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isLoading || !isValid}
              sx={{
                px: 2.75,
                minWidth: 140,
                fontWeight: 700,
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Log Medication'
              )}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
