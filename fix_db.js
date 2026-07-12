const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const admin = await prisma.user.findFirst({
    where: { role: 'INSTITUTION_ADMIN' },
    orderBy: { createdAt: 'desc' }
  });

  if (admin && admin.institutionId) {
    const updated = await prisma.user.updateMany({
      where: {
        role: { in: ['INTERNAL_MENTOR', 'EXTERNAL_MENTOR', 'PARTICIPANT'] },
        institutionId: 'default-smkn1bojong',
        status: 'PENDING'
      },
      data: {
        institutionId: admin.institutionId
      }
    });
    console.log(`Updated ${updated.count} pending users to admin's institution ${admin.institutionId}`);
  }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
