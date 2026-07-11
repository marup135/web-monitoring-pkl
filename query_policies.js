const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const policies = await prisma.$queryRawUnsafe(`SELECT * FROM pg_policies WHERE schemaname = 'storage'`);
    console.log(policies);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
