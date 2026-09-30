import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function db(): PrismaClient {
  if (!globalDb.prisma) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
    globalDb.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }
  return globalDb.prisma;
}
