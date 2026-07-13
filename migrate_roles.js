const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateRoles() {
  try {
    const updated = await prisma.user.updateMany({
      where: { role: 'PARTICIPANT' },
      data: { role: 'siswa' }
    });
    console.log(`Successfully updated ${updated.count} users from PARTICIPANT to siswa.`);
  } catch (error) {
    console.error("Error updating roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRoles();
