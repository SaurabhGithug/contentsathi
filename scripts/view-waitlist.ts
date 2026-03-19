import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const waitlist = await prisma.waitlist.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log('=== WAITLIST DETAILS ===');
  if (waitlist.length === 0) {
    console.log('No signups yet.');
  } else {
    waitlist.forEach((entry, i) => {
      console.log(`${i + 1}. ${entry.email} (Joined: ${entry.createdAt.toISOString()})`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
