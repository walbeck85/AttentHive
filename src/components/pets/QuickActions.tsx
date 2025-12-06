'use client';
// Imports ------------------------------------------------------
import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import { Utensils, Footprints, Pill, AlertTriangle } from 'lucide-react';
// Types --------------------------------------------------------
type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
// Component Props ----------------------------------------------
type Props = {
  onAction: (action: ActionType) => void;
};
// Component -----------------------------------------------------

export default function QuickActions({ onAction }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))', // 2x2 on mobile
          sm: 'repeat(4, auto)',           // compact row on wider screens
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
      <ActionBtn
        icon={<Utensils size={16} />}
        onClick={() => onAction('FEED')}
        title="Feed"
      />
      <ActionBtn
        icon={<Footprints size={16} />}
        onClick={() => onAction('WALK')}
        title="Walk"
      />
      <ActionBtn
        icon={<Pill size={16} />}
        onClick={() => onAction('MEDICATE')}
        title="Meds"
      />
      <ActionBtn
        icon={<AlertTriangle size={16} />}
        danger
        onClick={() => onAction('ACCIDENT')}
        title="Report Accident"
      />
    </Box>
  );
}
// Action Button Component --------------------------------------
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