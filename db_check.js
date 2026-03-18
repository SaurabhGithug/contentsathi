const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("SUCCESS: Database connection established.");
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
  } catch (e) {
    console.error("FAILURE: Could not connect to database.");
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
