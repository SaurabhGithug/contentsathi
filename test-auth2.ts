import 'dotenv/config';
import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

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

main().catch(console.error).finally(() => process.exit(0));
