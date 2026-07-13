const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'marup' } });
  console.log("ROLE:", JSON.stringify(user.role));
  console.log("LENGTH:", user.role.length);
  await prisma.$disconnect();
}
main();
