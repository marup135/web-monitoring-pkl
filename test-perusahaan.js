const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { perusahaan: true }
  });
  console.log('Users:');
  users.forEach(u => {
    console.log(u.username, u.companyId, u.perusahaan?.latitude, u.perusahaan?.longitude);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
