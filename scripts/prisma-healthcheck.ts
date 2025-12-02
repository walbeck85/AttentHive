// scripts/prisma-healthcheck.ts
import { prisma } from '../src/lib/prisma';

async function main() {
  // Simple sanity check to see if Prisma can talk to the DB at all
  const [userCount, recipientCount, circleCount, logCount] = await Promise.all([
    prisma.user.count(),
    prisma.recipient.count(),
    prisma.careCircle.count(),
    prisma.careLog.count(),
  ]);

  console.log({ userCount, recipientCount, circleCount, logCount });
}

main()
  .catch((err) => {
    console.error('Healthcheck failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });