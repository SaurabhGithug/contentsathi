import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'demo@contentsathi.com';
  const password = 'demo';
  
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email,
        passwordHash,
        isAdmin: true
      }
    });
    console.log('Demo user created:', user.email);
  } else {
    console.log('Demo user already exists:', user.email);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
