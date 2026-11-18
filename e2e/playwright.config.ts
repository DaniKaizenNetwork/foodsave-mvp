import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

// Las variables (SEED_PASSWORD, PORT, CORS_ORIGIN, NEXT_PUBLIC_API_URL…) viven en el .env de la
// raíz, que no se versiona. Se cargan en el proceso sin imprimirlas; los servidores que levanta
// `webServer` heredan este entorno.
try {
  process.loadEnvFile(resolve(__dirname, '../.env'));
} catch {
  // Sin .env (p. ej. variables ya definidas en el entorno): se usan las del entorno.
}

const urlWeb = 'http://localhost:3000';
const urlApi = process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
// Carpeta de evidencia versionada (el reporte se sanea antes de subirlo: ver README).
const carpetaReporte = resolve(__dirname, '../docs/calidad/10_Playwright/reporte-html');

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  // Los casos comparten la base y el reloj; en serie son más fáciles de depurar y explicar.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: carpetaReporte, open: 'never' }]],
  use: {
    baseURL: urlWeb,
    // Se usa el Chrome instalado en el equipo: no hace falta descargar navegadores de Playwright.
    channel: 'chrome',
    locale: 'es-CO',
    // `datetime-local` toma la hora del navegador: se fija la zona de Colombia.
    timezoneId: 'America/Bogota',
    trace: 'on',
    screenshot: 'only-on-failure'
  },
  webServer: [
    {
      // API NestJS compilada. Si ya hay una API en el puerto, se reutiliza.
      command: 'npm run build -w apps/api && npm run start:prod -w apps/api',
      cwd: resolve(__dirname, '..'),
      url: `${urlApi}/ofertas`,
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      // Web en modo desarrollo con webpack (evita descargar las fuentes de Google al compilar).
      // -p 3000 explícito: PORT del .env es el de la API y Next lo leería también.
      command: 'npm run dev -w apps/web -- --webpack -p 3000',
      cwd: resolve(__dirname, '..'),
      url: `${urlWeb}/login`,
      reuseExistingServer: true,
      timeout: 180_000
    }
  ]
});
