import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Carga .env de apps/api o, si no existe, el de la raíz del monorepo (nunca se imprime).
config({ path: ['.env', '../../.env'], quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Las migraciones usan la conexión directa (DIRECT_URL); la API usa DATABASE_URL en ejecución.
  datasource: { url: process.env.DIRECT_URL ?? '' },
});
