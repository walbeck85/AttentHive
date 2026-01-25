// scripts/prisma-healthcheck.ts

// Used for app-level healthchecks:
// - Verifies that our src/lib/prisma client works.
// - Confirms core tables exist and are queryable.

import { prisma } from '../src/lib/prisma';

async function main() {
  // Simple sanity check to see if Prisma can talk to the DB at all
  const [userCount, recipientCount, hiveCount, logCount] = await Promise.all([
    prisma.user.count(),
    prisma.careRecipient.count(),
    prisma.hive.count(),
    prisma.careLog.count(),
  ]);

  console.log({ userCount, careRecipientCount: recipientCount, hiveCount, logCount });
}

main()
  .catch((err) => {
    console.error('Healthcheck failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });