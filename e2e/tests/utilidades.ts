import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

/** Contraseña de las cuentas sembradas: viene del entorno, nunca del código. */
export function claveSemilla(): string {
  const clave = process.env.SEED_PASSWORD;
  if (!clave) throw new Error('Falta la variable de entorno SEED_PASSWORD (ver e2e/README.md)');
  return clave;
}

export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;

export const CUENTAS = {
  dueno: 'dueno@foodsave.test',
  personal: 'personal@foodsave.test',
  consumidor1: 'consumidor1@foodsave.test'
} as const;

/** Nombre de producto único por ejecución: los casos no dependen de otros datos. */
export function nombreUnico(prefijo = 'E2E'): string {
  return `${prefijo} ${Date.now()}`;
}

/** Fecha-hora local de Bogotá `dias` días adelante, en el formato de `<input type="datetime-local">`. */
export function vencimientoLocal(dias: number): string {
  const fecha = new Date(Date.now() + dias * 24 * 3600 * 1000);
  return fecha.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16);
}

/** Contexto de navegador nuevo (= sesión nueva) con la misma zona horaria que la configuración. */
export function nuevoContexto(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ locale: 'es-CO', timezoneId: 'America/Bogota' });
}

/** Inicia sesión por la interfaz y espera a llegar a /ofertas. */
export async function iniciarSesion(page: Page, correo: string, contrasena = claveSemilla()): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(contrasena);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL('/ofertas');
}

/** Busca una oferta por nombre en /ofertas y devuelve su tarjeta. */
export async function buscarOferta(page: Page, nombre: string) {
  await page.getByRole('searchbox', { name: 'Buscar ofertas' }).fill(nombre);
  await page.getByRole('button', { name: 'Buscar' }).click();
  return page.getByRole('listitem').filter({ hasText: nombre });
}

/** Preparación por API (sin pasar por la interfaz): publica una oferta como dueño en «Sede Centro». */
export async function publicarOfertaPorApi(
  request: APIRequestContext,
  datos: { producto: string; cantidad: number }
): Promise<{ id: string; disponible: number }> {
  const login = await request.post(`${URL_API}/auth/login`, {
    data: { correo: CUENTAS.dueno, contrasena: claveSemilla() }
  });
  expect(login.status()).toBe(200);
  const { accessToken } = await login.json();
  const cabeceras = { Authorization: `Bearer ${accessToken}` };

  const sedes = await (await request.get(`${URL_API}/sedes/mias`, { headers: cabeceras })).json();
  const centro = sedes.find((s: { nombre: string }) => s.nombre === 'Sede Centro');
  expect(centro, 'el dueño debe tener «Sede Centro»').toBeTruthy();

  const respuesta = await request.post(`${URL_API}/ofertas`, {
    headers: cabeceras,
    data: {
      sedeId: centro.id,
      producto: datos.producto,
      precioOriginal: 8000,
      precioOferta: 4000,
      cantidad: datos.cantidad,
      vencimiento: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
    }
  });
  expect(respuesta.status()).toBe(201);
  return respuesta.json();
}
