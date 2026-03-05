import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncMemory() {
  const soulPath = path.join(process.cwd(), 'memory', 'soul.md');
  const fileMemory = fs.readFileSync(soulPath, 'utf8');

  await prisma.contentBrain.updateMany({
    data: {
      orchestratorMemory: fileMemory
    }
  });
  console.log("Memory synced successfully from file to DB!");
}

syncMemory()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
