// src/components/pets/RecipientInfoSection.tsx
//
// Renders category-specific info for the detail page.  Pets show breed,
// age, and weight; plants show species and sunlight; people show
// relationship and age.  All categories show "care stats" derived from
// the most recent care log of each relevant activity type.

'use client';

import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { ActivityType } from '@prisma/client';
import type { PetData, CareLog } from './petDetailTypes';

type Props = {
  recipient: PetData;
};

// -- Helpers ---------------------------------------------------------------

function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function lastLogOfType(
  logs: CareLog[],
  type: ActivityType,
): CareLog | undefined {
  return logs.find((l) => l.activityType === type);
}

function calculateAge(birthDate: string): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
  if (years < 1) {
    const months =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());
    return months <= 0 ? '< 1 month' : `${months} mo`;
  }
  return `${years} ${years === 1 ? 'yr' : 'yrs'}`;
}

type StatItem = { label: string; value: string };

// -- Category stat builders ------------------------------------------------

function petStats(r: PetData): StatItem[] {
  const stats: StatItem[] = [];
  if (r.breed) stats.push({ label: 'Breed', value: r.breed });
  if (r.birthDate) stats.push({ label: 'Age', value: calculateAge(r.birthDate) });
  if (r.weight) stats.push({ label: 'Weight', value: `${r.weight} lbs` });
  if (r.gender) {
    stats.push({ label: 'Sex', value: r.gender === 'MALE' ? 'Male' : 'Female' });
  }

  const subtype = r.subtype ?? r.type ?? '';
  if (subtype === 'DOG') {
    const lastWalk = lastLogOfType(r.careLogs, ActivityType.WALK);
    if (lastWalk)
      stats.push({ label: 'Last walked', value: formatTimeAgo(lastWalk.createdAt) });
    const lastFeed = lastLogOfType(r.careLogs, ActivityType.FEED);
    if (lastFeed)
      stats.push({ label: 'Last fed', value: formatTimeAgo(lastFeed.createdAt) });
  } else if (subtype === 'CAT') {
    const lastFeed = lastLogOfType(r.careLogs, ActivityType.FEED);
    if (lastFeed)
      stats.push({ label: 'Last fed', value: formatTimeAgo(lastFeed.createdAt) });
    const lastLitter = lastLogOfType(r.careLogs, ActivityType.LITTER_BOX);
    if (lastLitter)
      stats.push({ label: 'Last litter box', value: formatTimeAgo(lastLitter.createdAt) });
  } else {
    const lastFeed = lastLogOfType(r.careLogs, ActivityType.FEED);
    if (lastFeed)
      stats.push({ label: 'Last fed', value: formatTimeAgo(lastFeed.createdAt) });
  }

  return stats;
}

function plantStats(r: PetData): StatItem[] {
  const stats: StatItem[] = [];
  if (r.plantSpecies) stats.push({ label: 'Species', value: r.plantSpecies });
  if (r.sunlight) stats.push({ label: 'Sunlight', value: r.sunlight });
  if (r.waterFrequency)
    stats.push({ label: 'Water frequency', value: r.waterFrequency });

  const lastWater = lastLogOfType(r.careLogs, ActivityType.WATER);
  if (lastWater)
    stats.push({ label: 'Last watered', value: formatTimeAgo(lastWater.createdAt) });
  const lastFertilize = lastLogOfType(r.careLogs, ActivityType.FERTILIZE);
  if (lastFertilize)
    stats.push({
      label: 'Last fertilized',
      value: formatTimeAgo(lastFertilize.createdAt),
    });

  return stats;
}

function personStats(r: PetData): StatItem[] {
  const stats: StatItem[] = [];
  if (r.relationship) stats.push({ label: 'Relationship', value: r.relationship });
  if (r.birthDate) stats.push({ label: 'Age', value: calculateAge(r.birthDate) });

  const lastMeal = lastLogOfType(r.careLogs, ActivityType.MEAL);
  if (lastMeal)
    stats.push({ label: 'Last meal', value: formatTimeAgo(lastMeal.createdAt) });
  const lastWellness = lastLogOfType(r.careLogs, ActivityType.WELLNESS_CHECK);
  if (lastWellness)
    stats.push({
      label: 'Last wellness check',
      value: formatTimeAgo(lastWellness.createdAt),
    });

  return stats;
}

// -- Component -------------------------------------------------------------

export default function RecipientInfoSection({ recipient }: Props) {
  const category = recipient.category ?? 'PET';
  let stats: StatItem[];

  switch (category) {
    case 'PLANT':
      stats = plantStats(recipient);
      break;
    case 'PERSON':
      stats = personStats(recipient);
      break;
    default:
      stats = petStats(recipient);
      break;
  }

  if (stats.length === 0) return null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            mb: 1.5,
            letterSpacing: '0.12em',
            color: 'text.secondary',
          }}
        >
          {category === 'PLANT' ? 'Plant info' : category === 'PERSON' ? 'Person info' : 'Pet info'}
        </Typography>

        <Box
          component="dl"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2,
            m: 0,
          }}
        >
          {stats.map((stat) => (
            <Stack key={stat.label} spacing={0.25}>
              <Typography
                component="dt"
                variant="caption"
                sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                {stat.label}
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{ fontWeight: 600, m: 0 }}
              >
                {stat.value}
              </Typography>
            </Stack>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
