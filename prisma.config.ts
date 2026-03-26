import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env.local first (Next.js convention), fall back to .env
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun ./prisma/seed.ts',
  },
  datasource: {
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL']!,
  },
});
