import { expect, test } from '@playwright/test';
import { buscarOferta, CUENTAS, iniciarSesion, nombreUnico, publicarOfertaPorApi } from './utilidades';

/**
 * E2E-02 · Flujo alterno: el consumidor reserva y cancela (SWR-RES-001, SWR-RES-011).
 * La oferta se prepara por API (no es lo que se prueba) y todo lo demás va por la interfaz.
 */
test.describe('E2E-02: reservar y cancelar', () => {
  const producto = nombreUnico('E2E cancelar');

  // Preparación: el dueño publica por API una oferta de 5 unidades y comprobamos que quedó con 5.
  test.beforeAll(async ({ request }) => {
    const oferta = await publicarOfertaPorApi(request, { producto, cantidad: 5 });
    expect(oferta.disponible).toBe(5);
  });

  test('el consumidor reserva 2, cancela y el inventario vuelve a 5', async ({ page }) => {
    // ── Pasos 1-2 · Login del consumidor y reserva de 2 unidades ──────────────────────────
    await iniciarSesion(page, CUENTAS.consumidor1);
    const tarjeta = await buscarOferta(page, producto);
    await tarjeta.getByRole('button', { name: 'Reservar' }).click();
    const dialogo = page.getByRole('dialog');
    await dialogo.getByLabel('Cantidad').fill('2');
    await dialogo.getByRole('button', { name: 'Reservar' }).click();
    await expect(dialogo.getByText('Reserva confirmada')).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cerrar' }).first().click();

    // ── Paso 3 · «Mis reservas»: cancelar la reserva ─────────────────────────────────────
    await page.goto('/reservas');
    const fila = page.getByRole('row').filter({ hasText: producto }); // la fila de esta reserva
    await fila.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('Reserva cancelada')).toBeVisible(); // mensaje dentro de la página
    await expect(fila.getByText('Cancelada')).toBeVisible(); // el estado de la fila cambió
    await expect(fila.getByRole('button', { name: 'Cancelar' })).toHaveCount(0); // ya no se puede volver a cancelar

    // ── Paso 4 · De vuelta en /ofertas el inventario se restituyó ────────────────────────
    await page.goto('/ofertas');
    const tarjetaDeNuevo = await buscarOferta(page, producto);
    await expect(tarjetaDeNuevo).toContainText('5 disponibles'); // 3 + 2 devueltas
  });
});
