'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ActivityPhotoPicker from '../pets/ActivityPhotoPicker';

export type GroomingMetadata = {
  serviceType: string;
  groomer?: string;
  cost?: number;
  groomedAt: string;
  notes?: string;
};

interface GroomingModalProps {
  open: boolean;
  recipientId: string;
  recipientName: string;
  onSuccess: () => void;
  onClose: () => void;
}

const SERVICE_TYPES = [
  { value: 'bath', label: 'Bath' },
  { value: 'haircut', label: 'Haircut' },
  { value: 'nail_trim', label: 'Nail Trim' },
  { value: 'brushing', label: 'Brushing' },
  { value: 'full_groom', label: 'Full Groom' },
  { value: 'other', label: 'Other' },
];

function getDefaultDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function GroomingModal({
  open,
  recipientId,
  recipientName,
  onSuccess,
  onClose,
}: GroomingModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [serviceType, setServiceType] = useState('');
  const [groomer, setGroomer] = useState('');
  const [cost, setCost] = useState('');
  const [groomedAt, setGroomedAt] = useState(getDefaultDateTime);
  const [notes, setNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isValid = serviceType !== '' && groomedAt.trim() !== '';

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const metadata: GroomingMetadata = {
        serviceType,
        groomedAt,
      };

      if (groomer.trim()) {
        metadata.groomer = groomer.trim();
      }
      if (cost && !isNaN(parseFloat(cost))) {
        metadata.cost = parseFloat(cost);
      }
      if (notes.trim()) {
        metadata.notes = notes.trim();
      }

      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: recipientId,
          activityType: 'GROOMING',
          metadata,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to log grooming');
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
      setServiceType('');
      setGroomer('');
      setCost('');
      setGroomedAt(getDefaultDateTime());
      setNotes('');
      setSelectedPhoto(null);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error logging grooming:', err);
      setError(err instanceof Error ? err.message : 'Failed to log grooming');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setServiceType('');
    setGroomer('');
    setCost('');
    setGroomedAt(getDefaultDateTime());
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
      aria-labelledby="grooming-modal-title"
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
            id="grooming-modal-title"
            variant="h6"
            sx={{ fontWeight: 700, textAlign: 'center' }}
          >
            Log grooming for {recipientName}
          </Typography>

          <FormControl fullWidth size="small" required>
            <InputLabel id="service-type-label">Service Type</InputLabel>
            <Select
              labelId="service-type-label"
              value={serviceType}
              label="Service Type"
              onChange={(e) => setServiceType(e.target.value)}
              disabled={isLoading}
            >
              {SERVICE_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Groomer / Location"
            value={groomer}
            onChange={(e) => setGroomer(e.target.value)}
            fullWidth
            size="small"
            disabled={isLoading}
            placeholder="e.g., PetSmart, Mobile Groomer Jane"
          />

          <TextField
            label="Cost"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            fullWidth
            size="small"
            disabled={isLoading}
            InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }}
            placeholder="0.00"
          />

          <TextField
            label="Groomed At"
            type="datetime-local"
            value={groomedAt}
            onChange={(e) => setGroomedAt(e.target.value)}
            required
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
            placeholder="Additional notes about grooming..."
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
                'Log Grooming'
              )}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
