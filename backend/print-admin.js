const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // Make sure you still have bcrypt installed!
const prisma = new PrismaClient();

async function resetAdminPassword() {
  // 👇 CHANGE THIS TO YOUR NEW DESIRED PASSWORD
  const NEW_PASSWORD = "Admin@GGU"; 
  
  console.log("🔍 Finding Admin user...");

  try {
    // 1. Find the admin user
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!admin) {
      console.log("❌ No user with role 'ADMIN' found in the database.");
      return;
    }

    console.log(`👤 Admin found: ${admin.email}`);
    console.log("🔄 Hashing new password...");

    // 2. Hash the new password with a salt round of 10
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // 3. Update the database with the new hash
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });

    console.log("-----------------------------------------");
    console.log("✅ SUCCESS: Admin password has been reset!");
    console.log(`🔑 You can now log in using: ${NEW_PASSWORD}`);
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("❌ Error updating database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();