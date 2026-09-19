import { PrismaClient } from '@prisma/client'

/**
 * In development, Next.js hot-reloads modules but `globalThis` is preserved
 * across reloads — so the PrismaClient instance gets reused. That's good for
 * avoiding connection exhaustion, but bad when the Prisma schema changes:
 * the cached instance keeps the OLD runtime dataModel baked in, even after
 * `prisma generate` regenerates the client on disk.
 *
 * To fix this, we tag the cached client with the schema version it was
 * created from. When the version mismatches (i.e. Prisma was regenerated),
 * we discard the cached instance and create a fresh one.
 */
const SCHEMA_VERSION = '2026-railway-prod-v1' // bump this after every `prisma generate`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaSchemaVersion?: string
}

if (
  globalForPrisma.prisma &&
  globalForPrisma.__prismaSchemaVersion !== SCHEMA_VERSION
) {
  // Cached instance was built from an outdated schema — throw it away.
  try {
    void globalForPrisma.prisma.$disconnect()
  } catch {
    // ignore
  }
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

// Always cache the client to avoid creating new PrismaClient instances on
// every hot reload / serverless invocation.
globalForPrisma.prisma = db
globalForPrisma.__prismaSchemaVersion = SCHEMA_VERSION
