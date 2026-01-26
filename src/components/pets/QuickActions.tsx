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
  Scissors,
  Stethoscope,
  Sparkles,
  Waves,
  TestTube,
  Home,
  Dumbbell,
  Thermometer,
  Droplets,
  Leaf,
  Sun,
  Calendar,
  Activity,
  StickyNote,
} from 'lucide-react';
import {
  getActivitiesForSubtype,
  type ActivityConfig,
} from '@/config/activityTypes';

// Icon mapping from config string to component
const ICON_MAP: Record<string, ReactNode> = {
  // Pet icons - existing
  Utensils: <Utensils size={16} />,
  Footprints: <Footprints size={16} />,
  Pill: <Pill size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
  Bath: <Bath size={16} />,
  Box: <BoxIcon size={16} />,
  Heart: <Heart size={16} />,
  // Pet icons - new
  Scissors: <Scissors size={16} />,
  Stethoscope: <Stethoscope size={16} />,
  Sparkles: <Sparkles size={16} />,
  Waves: <Waves size={16} />,
  TestTube: <TestTube size={16} />,
  Home: <Home size={16} />,
  Dumbbell: <Dumbbell size={16} />,
  Thermometer: <Thermometer size={16} />,
  // Plant icons
  Droplets: <Droplets size={16} />,
  Leaf: <Leaf size={16} />,
  FlowerPot: <Home size={16} />, // Using Home as fallback for FlowerPot
  Sun: <Sun size={16} />,
  // People icons
  Calendar: <Calendar size={16} />,
  Activity: <Activity size={16} />,
  // Shared
  StickyNote: <StickyNote size={16} />,
};

type Props = {
  /** Recipient subtype (DOG, CAT, INDOOR, ELDER, etc.) */
  subtype: string;
  onAction: (config: ActivityConfig) => void;
};

export default function QuickActions({ subtype, onAction }: Props) {
  const activities = getActivitiesForSubtype(subtype);

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
          danger={config.isDanger}
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
