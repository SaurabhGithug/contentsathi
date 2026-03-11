import 'dotenv/config';
import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const hashedPassword = bcrypt.hashSync('Demo@1234', 10);
  await prisma.user.update({
    where: { email: 'demo@contentsathi.in' },
    data: { passwordHash: hashedPassword }
  });
  console.log('Password updated successfully for demo@contentsathi.in!');
}

main().catch(console.error).finally(() => process.exit(0));
