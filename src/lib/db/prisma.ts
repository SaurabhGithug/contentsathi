import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }

  const pool = new pg.Pool({ 
    connectionString: url,
    max: 20,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000,
    ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter, log: ["warn", "error"] });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
