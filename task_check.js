const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.agentTask.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { logs: true }
  });
  console.log(JSON.stringify(task, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
