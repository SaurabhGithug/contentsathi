import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'demo@contentsathi.in' } });
  console.log('User demo@contentsathi.in found:', !!user);
  if (user) {
    console.log('Password hash length:', user.passwordHash.length);
    const isValid1 = await bcrypt.compare('Demo@1234', user.passwordHash);
    console.log('Password valid (Demo@1234):', isValid1);
    const isValid2 = await bcrypt.compare('demo', user.passwordHash);
    console.log('Password valid (demo):', isValid2);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
