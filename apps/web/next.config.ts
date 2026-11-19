import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'node:path';

// Las variables viven en el .env de la raíz del monorepo (NEXT_PUBLIC_API_URL, etc.).
// `forceReload`: Next ya cargó antes el .env de apps/web y guarda ese resultado en caché.
loadEnvConfig(
  path.resolve(process.cwd(), '../..'),
  process.env.NODE_ENV !== 'production',
  { info: () => {}, error: console.error },
  true
);

const nextConfig: NextConfig = {
  // La URL de la API se incrusta de forma explícita en el código del navegador.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
