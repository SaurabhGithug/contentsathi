const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const waitlist = await prisma.waitlist.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log('\x1b[36m%s\x1b[0m', '\n=== CONTENT-SATHI WAITLIST DETAILS ===');
  if (waitlist.length === 0) {
    console.log('No signups recorded yet.');
  } else {
    console.table(waitlist.map(entry => ({
      'Email': entry.email,
      'Date Joined': entry.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    })));
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
