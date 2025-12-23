'use client';

import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import {
  Utensils,
  Footprints,
  Pill,
  AlertTriangle,
  Bath,
  Box as BoxIcon,
  Heart,
} from 'lucide-react';
import { PetType } from '@prisma/client';
import {
  getActivitiesForPetType,
  type ActivityConfig,
} from '@/config/activityTypes';

// Icon mapping from config string to component
const ICON_MAP: Record<string, ReactNode> = {
  Utensils: <Utensils size={16} />,
  Footprints: <Footprints size={16} />,
  Pill: <Pill size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
  Bath: <Bath size={16} />,
  Box: <BoxIcon size={16} />,
  Heart: <Heart size={16} />,
};

type Props = {
  petType: PetType;
  onAction: (config: ActivityConfig) => void;
};

export default function QuickActions({ petType, onAction }: Props) {
  const activities = getActivitiesForPetType(petType);

  // Calculate grid columns based on number of activities
  const columnCount = Math.min(activities.length, 4);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: `repeat(${columnCount}, auto)`,
        },
        gap: 1,
        width: '100%',
        justifyContent: {
          xs: 'stretch',
          sm: 'flex-start',
        },
        justifyItems: {
          xs: 'stretch',
          sm: 'center',
        },
      }}
    >
      {activities.map((config) => (
        <ActionBtn
          key={config.type}
          icon={ICON_MAP[config.icon] ?? <Heart size={16} />}
          onClick={() => onAction(config)}
          title={config.label}
          danger={config.type === 'ACCIDENT'}
        />
      ))}
    </Box>
  );
}

function ActionBtn({
  icon,
  onClick,
  danger,
  title,
}: {
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  title: string;
}) {
  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      variant="outlined"
      size="small"
      sx={(theme) => ({
        minHeight: 40,
        width: { xs: '100%', sm: 'auto' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: 'none',
        borderColor: danger
          ? theme.palette.error.light
          : theme.palette.divider,
        color: danger
          ? theme.palette.error.main
          : theme.palette.text.secondary,
      })}
      color={danger ? 'error' : 'inherit'}
    >
      {icon}
    </Button>
  );
}
