import { expect, test } from '@playwright/test';
import { buscarOferta, CUENTAS, iniciarSesion, nombreUnico, vencimientoLocal } from './utilidades';

/** E2E-05 · Publicar con precio inválido y corregirlo (SWR-OFE-003, SWR-OFE-001). */
test('E2E-05: el precio de oferta igual al original se rechaza y, corregido, se publica', async ({ page }) => {
  const producto = nombreUnico('E2E precio');

  await iniciarSesion(page, CUENTAS.dueno);
  await page.goto('/ofertas/nueva');
  await page.getByLabel('Producto').fill(producto);
  await page.getByLabel('Precio original').fill('8000');
  await page.getByLabel('Precio de oferta').fill('8000'); // igual al original: viola la regla
  await page.getByLabel('Cantidad').fill('5');
  await page.getByLabel('Vencimiento').fill(vencimientoLocal(2));
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Sede Centro' }).click();
  await page.getByRole('button', { name: 'Publicar' }).click();

  // Paso 1 · Error de precio y sin publicar.
  await expect(page.getByText('El precio de oferta debe ser menor al precio original')).toBeVisible();
  await expect(page.getByText('Oferta publicada')).toHaveCount(0);

  // Pasos 2-3 · Se corrige el precio y se publica.
  await page.getByLabel('Precio de oferta').fill('4000');
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Oferta publicada')).toBeVisible();

  // La oferta ya aparece en el listado público.
  await page.goto('/ofertas');
  await expect(await buscarOferta(page, producto)).toContainText(producto);
});
