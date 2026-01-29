'use client';

import { Box, Typography, Stack } from '@mui/material';
import { RecipientCategory } from '@prisma/client';
import RecipientCard, { type RecipientData } from './RecipientCard';

type Props = {
  recipients: RecipientData[];
  groupByCategory?: boolean;
};

// Category display order and labels
const CATEGORY_CONFIG: {
  category: RecipientCategory;
  label: string;
  emptyLabel: string;
}[] = [
  { category: 'PET', label: 'Pets', emptyLabel: 'No pets added yet.' },
  { category: 'PLANT', label: 'Plants', emptyLabel: 'No plants added yet.' },
  { category: 'PERSON', label: 'People', emptyLabel: 'No people added yet.' },
];

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="body2" color="text.secondary" align="center">
        {message}
      </Typography>
    </Box>
  );
}

function RecipientGrid({ recipients }: { recipients: RecipientData[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 2, sm: 2.5 },
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {recipients.map((recipient) => (
        <Box key={recipient.id}>
          <RecipientCard recipient={recipient} />
        </Box>
      ))}
    </Box>
  );
}

export default function RecipientList({
  recipients,
  groupByCategory = true,
}: Props) {
  if (!recipients || recipients.length === 0) {
    return <EmptyState message="No recipients found." />;
  }

  if (!groupByCategory) {
    return (
      <Box sx={{ mt: 2, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        <RecipientGrid recipients={recipients} />
      </Box>
    );
  }

  // Group recipients by category
  const grouped = CATEGORY_CONFIG.map((config) => ({
    ...config,
    recipients: recipients.filter((r) => r.category === config.category),
  }));

  return (
    <Stack spacing={3} sx={{ mt: 2, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
      {grouped.map((group) => (
        <Box key={group.category}>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              mb: 1.5,
              fontWeight: 600,
              color: 'text.primary',
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.75,
            }}
          >
            {group.label}
            <Typography
              component="span"
              variant="caption"
              sx={{ fontWeight: 500, color: 'text.secondary' }}
            >
              ({group.recipients.length})
            </Typography>
          </Typography>

          {group.recipients.length > 0 ? (
            <RecipientGrid recipients={group.recipients} />
          ) : (
            <EmptyState message={group.emptyLabel} />
          )}
        </Box>
      ))}
    </Stack>
  );
}
