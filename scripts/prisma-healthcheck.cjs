// scripts/prisma-healthcheck.cjs
// Simple Prisma connectivity healthcheck using CommonJS.
// This bypasses all the ts-node / ESM headaches.

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    // Cheap query just to prove we can talk to the DB.
    const result = await prisma.$queryRaw`SELECT NOW() as now;`;

    console.log('✅ Prisma healthcheck succeeded.');
    console.log('   Current DB time:', result[0]?.now || result[0]);

    process.exit(0);
  } catch (error) {
    console.error('❌ Prisma healthcheck FAILED.');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();