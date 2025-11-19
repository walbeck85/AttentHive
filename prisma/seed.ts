import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: hashedPassword,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create test pets
  const murphy = await prisma.recipient.create({
    data: {
      name: 'Murphy',
      type: 'DOG',
      breed: 'Black Labrador',
      birthDate: new Date('2016-05-15'),
      weight: 65,
      specialNeeds: 'Needs assistance with stairs',
      ownerId: user.id,
    },
  });

  console.log('✅ Created pet:', murphy.name);

  const mona = await prisma.recipient.create({
    data: {
      name: 'Mona',
      type: 'DOG',
      breed: 'Mixed Breed',
      birthDate: new Date('2021-03-20'),
      weight: 25,
      ownerId: user.id,
    },
  });

  console.log('✅ Created pet:', mona.name);

  // Create test activity logs
  await prisma.careLog.create({
    data: {
      recipientId: murphy.id,
      userId: user.id,
      activityType: 'FEED',
      notes: 'Fed 1 cup of kibble',
    },
  });

  await prisma.careLog.create({
    data: {
      recipientId: murphy.id,
      userId: user.id,
      activityType: 'WALK',
      notes: '20 minute walk around the block',
    },
  });

  await prisma.careLog.create({
    data: {
      recipientId: mona.id,
      userId: user.id,
      activityType: 'FEED',
      notes: 'Fed 1/2 cup of kibble',
    },
  });

  console.log('✅ Created 3 activity logs');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('📧 Email: test@example.com');
  console.log('🔑 Password: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });