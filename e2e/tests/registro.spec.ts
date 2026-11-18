import { expect, test } from '@playwright/test';

/** E2E-03 · Registro y primer inicio de sesión (SWR-AUTH-001, SWR-AUTH-005, SWR-SEC-002). */
test('E2E-03: una persona se registra e inicia sesión por primera vez', async ({ page }) => {
  const marca = Date.now();
  const nombre = `Usuario E2E ${marca}`;
  const correo = `e2e-${marca}@foodsave.test`;
  // Contraseña propia de esta prueba (cuenta nueva y desechable; no es la de las semillas).
  const contrasena = `clave-e2e-${marca}`;

  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill(nombre);
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(contrasena);
  await page.getByRole('button', { name: 'Registrarse' }).click();
  await expect(page.getByText('Cuenta creada correctamente')).toBeVisible();

  await page.getByRole('link', { name: 'Ir a iniciar sesión' }).click();
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(contrasena);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL('/ofertas');
  await expect(page.getByText(nombre).first()).toBeVisible(); // el nombre aparece en la barra lateral
});
