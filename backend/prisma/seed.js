require('dotenv').config(); 
const prisma = require('./prisma'); // Imports from prisma/prisma.js
const bcrypt = require('bcryptjs');

async function main() {
  const adminEmail = "admin@ggu.edu.in";
  const hashedPassword = await bcrypt.hash("Admin@GGU2026", 10);

  console.log("🌱 Seeding database...");

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "GGU Super Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`✅ Super Admin created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });