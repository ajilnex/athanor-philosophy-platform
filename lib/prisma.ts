import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

console.log('🔧 Initializing Prisma Client...')
console.log('📍 Environment:', process.env.NODE_ENV)
console.log('🔗 Database URL exists:', !!process.env.DATABASE_URL)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

console.log('✅ Prisma Client initialized successfully')