/**
 * Prisma driver-adapter config (early access).
 *
 * Requires TWO env vars:
 *   DATABASE_URL  — pooled connection string used at runtime (e.g. PgBouncer / Supabase pooler)
 *   DIRECT_URL    — direct (non-pooled) connection string used for migrations only
 *
 * Both should be set in your .env and in your production environment.
 * If DIRECT_URL is missing, `prisma migrate` will fail silently.
 */
import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',

  datasource: {
    url: process.env.DIRECT_URL!,
  },

  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { default: pg } = await import('pg')
      const pool = new pg.Pool({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
      })
      return new PrismaPg(pool)
    }
  },

  async adapter() {
    const { PrismaPg } = await import('@prisma/adapter-pg')
    const { default: pg } = await import('pg')
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    return new PrismaPg(pool)
  }
})
