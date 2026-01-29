import { prisma } from '../src/lib/prisma';
import { RecipientCategory, HiveRole } from '@prisma/client';

async function main() {
  console.log('🌱 Seeding test recipients (Plants & People)...');

  // Find the first user in the database
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    console.error('❌ No users found in database. Please run `npm run seed` first.');
    process.exit(1);
  }

  console.log(`📧 Using user: ${user.email}`);

  // Plant data
  const plants = [
    {
      name: 'Monstera',
      category: RecipientCategory.PLANT,
      subtype: 'INDOOR',
      plantSpecies: 'Monstera Deliciosa',
    },
    {
      name: 'Tomato Plant',
      category: RecipientCategory.PLANT,
      subtype: 'OUTDOOR',
      plantSpecies: 'Roma Tomato',
    },
    {
      name: 'Jade',
      category: RecipientCategory.PLANT,
      subtype: 'SUCCULENT',
      plantSpecies: 'Crassula Ovata',
    },
  ];

  // Person data
  const people = [
    {
      name: 'Grandma Rose',
      category: RecipientCategory.PERSON,
      subtype: 'ELDER',
      relationship: 'Grandmother',
    },
    {
      name: 'Baby Emma',
      category: RecipientCategory.PERSON,
      subtype: 'CHILD',
      relationship: 'Daughter',
    },
    {
      name: 'Alex',
      category: RecipientCategory.PERSON,
      subtype: 'ROOMMATE',
      relationship: 'Roommate',
    },
  ];

  // Create Plants
  console.log('\n🌿 Creating Plants...');
  for (const plant of plants) {
    const existing = await prisma.careRecipient.findFirst({
      where: {
        name: plant.name,
        ownerId: user.id,
        category: RecipientCategory.PLANT,
      },
    });

    if (existing) {
      console.log(`  ➡️  Plant already exists: ${plant.name}`);
      continue;
    }

    const recipient = await prisma.careRecipient.create({
      data: {
        name: plant.name,
        category: plant.category,
        subtype: plant.subtype,
        plantSpecies: plant.plantSpecies,
        ownerId: user.id,
      },
    });

    // Create Hive entry for OWNER access
    await prisma.hive.create({
      data: {
        recipientId: recipient.id,
        userId: user.id,
        role: HiveRole.OWNER,
      },
    });

    console.log(`  ✅ Created plant: ${plant.name} (${plant.subtype}) - ${plant.plantSpecies}`);
  }

  // Create People
  console.log('\n👥 Creating People...');
  for (const person of people) {
    const existing = await prisma.careRecipient.findFirst({
      where: {
        name: person.name,
        ownerId: user.id,
        category: RecipientCategory.PERSON,
      },
    });

    if (existing) {
      console.log(`  ➡️  Person already exists: ${person.name}`);
      continue;
    }

    const recipient = await prisma.careRecipient.create({
      data: {
        name: person.name,
        category: person.category,
        subtype: person.subtype,
        relationship: person.relationship,
        ownerId: user.id,
      },
    });

    // Create Hive entry for OWNER access
    await prisma.hive.create({
      data: {
        recipientId: recipient.id,
        userId: user.id,
        role: HiveRole.OWNER,
      },
    });

    console.log(`  ✅ Created person: ${person.name} (${person.subtype}) - ${person.relationship}`);
  }

  console.log('\n🌱 Test recipients seed complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
