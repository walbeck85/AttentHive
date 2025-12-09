import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Running AttentHive seed...");

  // Test users
  const users = [
    {
      email: "test@attenthive.com",
      name: "Test User",
      password: "password123",
    },
    {
      email: "demo@attenthive.com",
      name: "Demo Account",
      password: "password123",
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`➡️  User already exists: ${user.email}`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 10);

    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        passwordHash: hashed,
      },
    });

    console.log(`✅ Created user: ${user.email} / ${user.password}`);
  }

  console.log("🌱 Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });