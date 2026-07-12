const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  // Find recent INTERNAL_MENTOR users
  const recentMentors = await prisma.user.findMany({
    where: {
      role: 'INTERNAL_MENTOR'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    select: {
      id: true,
      role: true,
      status: true,
      institutionId: true,
      email: true,
      createdAt: true
    }
  });

  console.log("=== Recent INTERNAL_MENTOR ===");
  console.table(recentMentors);

  // Check an admin user as well to verify institutionId
  const admins = await prisma.user.findMany({
    where: {
      role: 'INSTITUTION_ADMIN'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 2,
    select: {
      id: true,
      role: true,
      email: true,
      institutionId: true,
      status: true
    }
  });

  console.log("=== Recent INSTITUTION_ADMIN ===");
  console.table(admins);

  await prisma.$disconnect();
}

debug().catch(console.error);
