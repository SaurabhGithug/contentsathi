import { prisma } from './src/lib/prisma';

async function main() {
  const result = await prisma.user.updateMany({
    data: { isAdmin: true }
  });
  console.log('Users updated:', result.count);
}
main();
