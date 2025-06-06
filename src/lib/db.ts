import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Increase transaction timeout from default 5000ms to 15000ms (15 seconds)
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Configure longer transaction timeout to prevent "Transaction already closed" errors
    transactionOptions: {
      maxWait: 15000, // maximum time in ms to wait to acquire a transaction
      timeout: 15000, // maximum time in ms for the transaction to finish
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
