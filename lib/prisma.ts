import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import mockClient from '@/lib/mock/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createRealClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

if (!process.env.DATABASE_URL) {
  console.warn('[dev] DATABASE_URL not set — using mock database');
  prisma = mockClient as unknown as PrismaClient;
} else {
  prisma = globalForPrisma.prisma ?? createRealClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
}

export default prisma;
