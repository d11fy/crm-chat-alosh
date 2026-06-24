import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn("⚠️ Warning: DATABASE_URL environment variable is missing. Please set your Supabase connection string.");
}

// إعداد اتصال PostgreSQL باستخدام Driver Adapter المتوافق مع Prisma 7
const pool = new Pool({ connectionString: dbUrl || "" });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
