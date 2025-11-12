import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error'], // log query & lỗi khi dev
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
