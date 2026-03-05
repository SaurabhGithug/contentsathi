import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for Prisma 7 PostgreSQL setup.");
  }

  const pool = new pg.Pool({ 
    connectionString: url,
    max: process.env.DATABASE_MAX_CONN ? parseInt(process.env.DATABASE_MAX_CONN, 10) : 20, // Limit connections per serverless instance
    idleTimeoutMillis: 15000,     // Close idle connections aggressively after 15s to save DB resources
    connectionTimeoutMillis: 5000 // Error quickly (5s) if we cannot connect vs waiting infinitely
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
