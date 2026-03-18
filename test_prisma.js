require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const url = process.env.DATABASE_URL;
  const pool = new pg.Pool({ 
    connectionString: url,
    ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ['query', 'info', 'warn', 'error'] });

  try {
    const email = 'contact@saurabhgogate.com';
    console.log(`Searching for user: ${email}`);
    
    // Test basic query
    const userOnly = await prisma.user.findUnique({
      where: { email }
    });
    console.log("User only query SUCCESS:", userOnly ? userOnly.id : "null");
    
    // Test include query
    const userWithBrain = await prisma.user.findUnique({
      where: { email },
      include: { contentBrain: true }
    });
    console.log("User with brain query SUCCESS:", userWithBrain ? userWithBrain.id : "null");
    
  } catch (err) {
    console.error("PRISMA ERROR DETECTED:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
