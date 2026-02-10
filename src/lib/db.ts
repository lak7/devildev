import { PrismaClient } from "@prisma/client";
import { DB_TRANSACTION_MAX_WAIT_MS, DB_TRANSACTION_TIMEOUT_MS } from "@/constants";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Increase transaction timeout from default 5000ms to prevent "Transaction already closed" errors
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    transactionOptions: {
      maxWait: DB_TRANSACTION_MAX_WAIT_MS,
      timeout: DB_TRANSACTION_TIMEOUT_MS,
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
