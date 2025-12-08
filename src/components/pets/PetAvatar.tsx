// src/components/pets/PetAvatar.tsx
'use client';

import React from 'react';
import { Avatar, Box, useTheme } from '@mui/material';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: Size;
  className?: string;
};

const DIMENSIONS: Record<Size, number> = {
  sm: 32, // 2rem
  md: 40, // 2.5rem
  lg: 56, // 3.5rem
};

// Shared avatar for pets: photo when available, initials otherwise.
export default function PetAvatar({
  name,
  imageUrl,
  size = 'md',
  className = '',
}: Props) {
  const theme = useTheme();
  const initials = React.useMemo(() => {
    const trimmed = name?.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (
      (parts[0][0] ?? '').toUpperCase() +
      (parts[1][0] ?? '').toUpperCase()
    );
  }, [name]);

  const dimension = DIMENSIONS[size];

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Avatar
        src={imageUrl || undefined}
        alt={name ? `${name} photo` : 'Pet photo'}
        sx={{
          width: dimension,
          height: dimension,
          fontSize: Math.round(dimension * 0.4),
          fontWeight: 600,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.primary.main}`,
        }}
      >
        {initials}
      </Avatar>
    </Box>
  );
}
