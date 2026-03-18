import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const url = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "dangalesaurabh1996@gmail.com";
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    const all = await prisma.user.findMany({ select: { email: true, name: true } });
    console.log("All users:", JSON.stringify(all, null, 2));
    return;
  }
  await prisma.user.update({
    where: { email },
    data: { isAdmin: true, adminRole: "super_admin" },
  });
  console.log(`✅ Super Admin granted to: ${user.name} <${email}>`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
