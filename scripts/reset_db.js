const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('=== STARTING DATABASE RESET ===');

  console.log('1. Deleting dependent records (Comments, HistoryItems, Cards)...');
  await prisma.comment.deleteMany({});
  await prisma.historyItem.deleteMany({});
  await prisma.card.deleteMany({});

  console.log('2. Deleting user activities and notes (Attendances, Notifications, Notes, Announcements)...');
  await prisma.attendance.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.secretNote.deleteMany({});
  await prisma.advisorNote.deleteMany({});
  await prisma.studentNote.deleteMany({});
  await prisma.announcement.deleteMany({});

  console.log('3. Deleting Users...');
  await prisma.user.deleteMany({});

  console.log('4. Deleting Classes and Companies...');
  await prisma.kelas.deleteMany({});
  await prisma.perusahaan.deleteMany({});

  console.log('5. Deleting Institutions...');
  await prisma.institution.deleteMany({});

  console.log('=== DATABASE RESET COMPLETED SUCCESSFULLY ===');

  // Check if SUPER_ADMIN creation is requested
  const createAdmin = process.argv.includes('--with-admin');
  if (createAdmin) {
    console.log('Creating clean Super Admin account...');
    const defaultPassword = hashPassword('Admin123!');
    const superAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@nebotrack.local',
        password: defaultPassword,
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('Created Super Admin account:', superAdmin.username);
  }
}

main()
  .catch((e) => {
    console.error('Error during database reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
