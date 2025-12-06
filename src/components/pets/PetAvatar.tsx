// src/components/pets/PetAvatar.tsx
'use client';

import React from 'react';
import { Avatar, Box } from '@mui/material';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: Size;
  className?: string;
};

const DIMENSIONS: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

// Shared avatar for pets: shows a photo when we have one, otherwise initials.
// Using MUI Avatar keeps sizing predictable and centers content without extra wrappers.
export default function PetAvatar({
  name,
  imageUrl,
  size = 'md',
  className = '',
}: Props) {
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
        width: dimension,
        height: dimension,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Avatar
        src={imageUrl ?? undefined}
        alt={name ? `${name} photo` : 'Pet photo'}
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: '#FAF3E7',
          color: '#382110',
          fontWeight: 700,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {initials}
      </Avatar>
    </Box>
  );
}
