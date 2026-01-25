/**
 * Demo Data Seed Script
 *
 * Creates realistic demo data for screen recordings.
 * Idempotent - safe to run multiple times.
 *
 * Usage: npm run seed:demo
 */

import { PrismaClient, PetType, Gender, HiveRole, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_USER_ID = 'cmjb4onik0000piwcoc1zuh73';
const DEMO_USER_EMAIL = 'demo@attenthive.app';

// Helper to calculate birthdate from age in years
function birthDateFromAge(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

// Helper to get a date relative to now
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number, hour: number = 12): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Walk metadata generator
function createWalkMetadata(
  durationMinutes: number,
  bathroomEvents: Array<{ type: 'URINATION' | 'DEFECATION'; minutesIntoWalk: number }>
) {
  const walkStart = new Date();
  return {
    durationSeconds: durationMinutes * 60,
    bathroomEvents: bathroomEvents.map((event) => ({
      type: event.type,
      occurredAt: new Date(walkStart.getTime() + event.minutesIntoWalk * 60 * 1000).toISOString(),
      minutesIntoWalk: event.minutesIntoWalk,
    })),
  };
}

async function main() {
  console.log('Starting demo data seed...\n');

  // Verify demo user exists
  const demoUser = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
  });

  if (!demoUser) {
    console.error(`ERROR: Demo user not found (ID: ${DEMO_USER_ID})`);
    console.error(`Please create the demo user first with email: ${DEMO_USER_EMAIL}`);
    process.exit(1);
  }

  console.log(`Found demo user: ${demoUser.name} (${demoUser.email})\n`);

  // Check for existing pets
  const existingPets = await prisma.careRecipient.findMany({
    where: { ownerId: DEMO_USER_ID },
  });

  if (existingPets.length > 0) {
    console.log(`Demo user already has ${existingPets.length} pet(s):`);
    existingPets.forEach((pet) => console.log(`  - ${pet.name} (${pet.type})`));
    console.log('\nTo re-seed, first delete existing data manually.');
    console.log('Skipping pet creation...\n');
  } else {
    // Create pets
    console.log('Creating pets...');

    const murphy = await prisma.careRecipient.create({
      data: {
        name: 'Murphy',
        type: PetType.DOG,
        breed: 'Labrador Retriever',
        birthDate: birthDateFromAge(6),
        weight: 65,
        gender: Gender.MALE,
        ownerId: DEMO_USER_ID,
        description: 'Friendly and energetic lab who loves fetch and swimming.',
        characteristics: ['MEDICATIONS'],
        specialNotes: 'Takes joint supplement with morning meal.',
        category: 'PET',
      },
    });
    console.log(`  Created: ${murphy.name} (${murphy.breed})`);

    const luna = await prisma.careRecipient.create({
      data: {
        name: 'Luna',
        type: PetType.CAT,
        breed: 'Domestic Shorthair',
        birthDate: birthDateFromAge(3),
        weight: 10,
        gender: Gender.FEMALE,
        ownerId: DEMO_USER_ID,
        description: 'Curious and independent. Loves sunny windowsills.',
        characteristics: [],
        category: 'PET',
      },
    });
    console.log(`  Created: ${luna.name} (${luna.breed})`);

    const mona = await prisma.careRecipient.create({
      data: {
        name: 'Mona',
        type: PetType.DOG,
        breed: 'Mixed Breed',
        birthDate: birthDateFromAge(4),
        weight: 28,
        gender: Gender.FEMALE,
        ownerId: DEMO_USER_ID,
        description: 'Sweet rescue pup. A bit shy but warms up quickly.',
        characteristics: ['SHY', 'SEPARATION_ANXIETY'],
        specialNotes: 'Needs slow introductions to new people.',
        category: 'PET',
      },
    });
    console.log(`  Created: ${mona.name} (${mona.breed})`);

    // Create Hive memberships (OWNER role for demo user)
    console.log('\nCreating hive memberships...');

    for (const pet of [murphy, luna, mona]) {
      await prisma.hive.create({
        data: {
          recipientId: pet.id,
          userId: DEMO_USER_ID,
          role: HiveRole.OWNER,
        },
      });
      console.log(`  ${demoUser.name} -> ${pet.name} (OWNER)`);
    }

    // Create care logs
    console.log('\nCreating care activity logs...');

    // Murphy's activities
    // Today
    await prisma.careLog.create({
      data: {
        recipientId: murphy.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.WALK,
        createdAt: hoursAgo(2),
        notes: 'Morning walk around the neighborhood',
        metadata: createWalkMetadata(25, [
          { type: 'URINATION', minutesIntoWalk: 3 },
          { type: 'DEFECATION', minutesIntoWalk: 8 },
        ]),
      },
    });
    console.log('  Murphy: Walk (2 hours ago)');

    await prisma.careLog.create({
      data: {
        recipientId: murphy.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: hoursAgo(4),
        notes: '1 cup kibble + joint supplement',
      },
    });
    console.log('  Murphy: Feed (4 hours ago)');

    // Yesterday
    await prisma.careLog.create({
      data: {
        recipientId: murphy.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.WALK,
        createdAt: daysAgo(1, 8),
        notes: 'Quick morning potty break',
        metadata: createWalkMetadata(15, [
          { type: 'URINATION', minutesIntoWalk: 2 },
          { type: 'DEFECATION', minutesIntoWalk: 5 },
        ]),
      },
    });
    console.log('  Murphy: Walk (yesterday morning)');

    await prisma.careLog.create({
      data: {
        recipientId: murphy.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: daysAgo(1, 7),
        notes: 'Breakfast',
      },
    });
    console.log('  Murphy: Feed (yesterday AM)');

    await prisma.careLog.create({
      data: {
        recipientId: murphy.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: daysAgo(1, 18),
        notes: 'Dinner',
      },
    });
    console.log('  Murphy: Feed (yesterday PM)');

    await prisma.careLog.create({
      data: {
        recipientId: murphy.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.WALK,
        createdAt: daysAgo(1, 19),
        notes: 'Evening walk',
        metadata: createWalkMetadata(30, [{ type: 'URINATION', minutesIntoWalk: 5 }]),
      },
    });
    console.log('  Murphy: Walk (yesterday evening)');

    // Luna's activities
    await prisma.careLog.create({
      data: {
        recipientId: luna.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: hoursAgo(3),
        notes: 'Wet food breakfast',
      },
    });
    console.log('  Luna: Feed (3 hours ago)');

    await prisma.careLog.create({
      data: {
        recipientId: luna.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: daysAgo(1, 8),
        notes: 'Morning meal',
      },
    });
    console.log('  Luna: Feed (yesterday AM)');

    await prisma.careLog.create({
      data: {
        recipientId: luna.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: daysAgo(1, 18),
        notes: 'Evening meal',
      },
    });
    console.log('  Luna: Feed (yesterday PM)');

    // Mona's activities
    await prisma.careLog.create({
      data: {
        recipientId: mona.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.WALK,
        createdAt: daysAgo(1, 14),
        notes: 'Afternoon stroll in the park',
        metadata: createWalkMetadata(20, [
          { type: 'URINATION', minutesIntoWalk: 4 },
          { type: 'URINATION', minutesIntoWalk: 12 },
        ]),
      },
    });
    console.log('  Mona: Walk (yesterday afternoon)');

    await prisma.careLog.create({
      data: {
        recipientId: mona.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: daysAgo(1, 7),
        notes: 'Breakfast',
      },
    });
    console.log('  Mona: Feed (yesterday AM)');

    await prisma.careLog.create({
      data: {
        recipientId: mona.id,
        userId: DEMO_USER_ID,
        activityType: ActivityType.FEED,
        createdAt: daysAgo(1, 18),
        notes: 'Dinner',
      },
    });
    console.log('  Mona: Feed (yesterday PM)');

    console.log('\nDemo data seed completed!');
  }

  // Summary
  const pets = await prisma.careRecipient.findMany({
    where: { ownerId: DEMO_USER_ID },
    include: { careLogs: true, hives: true },
  });

  console.log('\n=== SUMMARY ===');
  console.log(`Pets: ${pets.length}`);
  pets.forEach((pet) => {
    console.log(`  ${pet.name}: ${pet.careLogs.length} activities, ${pet.hives.length} hive member(s)`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
