import { expect, test } from '@playwright/test';
import { CUENTAS, nuevoContexto } from './utilidades';

/** E2E-04 · Login inválido y ruta protegida (SWR-AUTH-006, SWR-AUTH-010). */
test('E2E-04: contraseña errada no inicia sesión y la ruta protegida exige sesión', async ({ page, browser }) => {
  // Paso 1 · Correo existente con contraseña equivocada.
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(CUENTAS.consumidor1);
  await page.getByLabel('Contraseña').fill('clave-incorrecta-e2e');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  // Next en modo desarrollo tiene su propio role="alert" (anunciador de rutas): se filtra por texto.
  await expect(page.getByRole('alert').filter({ hasText: 'Credenciales inválidas' })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  // Paso 2 · Contexto limpio (sin sesión) entrando a una ruta protegida.
  const contextoLimpio = await nuevoContexto(browser);
  const anonimo = await contextoLimpio.newPage();
  await anonimo.goto('/gestion/reservas');
  await expect(anonimo).toHaveURL(/\/login\?aviso=sesion/);
  await expect(anonimo.getByText('Debes iniciar sesión')).toBeVisible();
  await contextoLimpio.close();
});
