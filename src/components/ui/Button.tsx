'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import {
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

type ButtonStyleObject = SystemStyleObject<Theme>;

function getVariantStyles(theme: Theme, variant: ButtonVariant): ButtonStyleObject {
  const primaryMain = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;
  const hoverTint = alpha(primaryMain, 0.08);

  switch (variant) {
    case 'secondary':
      // Secondary: light surface with accent border/text for quieter actions.
      return {
        bgcolor: 'background.paper',
        color: primaryMain,
        border: `1px solid ${primaryMain}`,
        '&:hover': {
          bgcolor: hoverTint,
        },
      };
    case 'ghost':
      // Ghost: transparent background that relies on the surrounding surface.
      return {
        bgcolor: 'transparent',
        color: primaryMain,
        border: '1px solid transparent',
        '&:hover': {
          bgcolor: hoverTint,
        },
      };
    case 'primary':
    default:
      // Primary: solid brand call-to-action color.
      return {
        bgcolor: primaryMain,
        color: theme.palette.primary.contrastText,
        border: '1px solid transparent',
        '&:hover': {
          bgcolor: primaryDark,
        },
      };
  }
}

function getSizeStyles(size: ButtonSize): ButtonStyleObject {
  switch (size) {
    case 'sm':
      return { px: 1.5, py: 0.75, fontSize: '0.875rem' };
    case 'lg':
      return { px: 2.5, py: 1.5, fontSize: '1rem' };
    case 'md':
    default:
      return { px: 2, py: 1, fontSize: '0.875rem' };
  }
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const sx: SxProps<Theme> = [
    {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9999,
      fontWeight: 600,
      lineHeight: 1.5,
      border: '1px solid transparent',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: theme.transitions.create(
        ['background-color', 'color', 'box-shadow', 'border-color'],
        { duration: theme.transitions.duration.short }
      ),
      '&:focus-visible': {
        outline: 'none',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}`,
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
        boxShadow: 'none',
      },
    },
    getVariantStyles(theme, variant),
    getSizeStyles(size),
    ...(fullWidth ? [{ width: '100%' }] : []),
  ];

  return (
    <Box
      component="button"
      className={className}
      sx={sx}
      {...props}
    >
      {children}
    </Box>
  );
}
