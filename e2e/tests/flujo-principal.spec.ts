import { expect, test } from '@playwright/test';
import { buscarOferta, CUENTAS, iniciarSesion, nombreUnico, nuevoContexto, vencimientoLocal } from './utilidades';

/**
 * E2E-01 · Flujo principal (SWR-AUTH-005, OFE-001, BUS-001, RES-001/003/005, RES-015).
 * Tres personas distintas, cada una en su propio contexto de navegador (= su propia sesión):
 * el dueño publica, el consumidor reserva y el personal marca «Entregada».
 */
test('E2E-01: el dueño publica, el consumidor reserva y el personal entrega', async ({ browser }) => {
  // Nombre único: así el caso no se mezcla con datos de otras ejecuciones.
  const producto = nombreUnico('E2E');

  // ── Paso 1 · El DUEÑO publica una oferta de 5 unidades en «Sede Centro» ─────────────────
  const contextoDueno = await nuevoContexto(browser); // sesión independiente 1
  const dueno = await contextoDueno.newPage();
  await iniciarSesion(dueno, CUENTAS.dueno); // login por la interfaz; espera llegar a /ofertas
  await dueno.goto('/ofertas/nueva'); // pantalla de publicación (solo DUENO y PERSONAL)
  await dueno.getByLabel('Producto').fill(producto);
  await dueno.getByLabel('Precio original').fill('8000');
  await dueno.getByLabel('Precio de oferta').fill('4000'); // menor al original: cumple la regla
  await dueno.getByLabel('Cantidad').fill('5');
  await dueno.getByLabel('Vencimiento').fill(vencimientoLocal(2)); // dentro de 2 días, hora de Bogotá
  await dueno.getByRole('combobox').click(); // el dueño tiene 2 sedes: debe elegir una
  await dueno.getByRole('option', { name: 'Sede Centro' }).click(); // sede 24 h: el plazo no depende de la hora
  await dueno.getByRole('button', { name: 'Publicar' }).click();
  await expect(dueno.getByText('Oferta publicada')).toBeVisible(); // confirmación dentro de la página

  // ── Paso 2 · El CONSUMIDOR busca la oferta y reserva 2 unidades ─────────────────────────
  const contextoConsumidor = await nuevoContexto(browser); // sesión independiente 2
  const consumidor = await contextoConsumidor.newPage();
  await iniciarSesion(consumidor, CUENTAS.consumidor1);
  const tarjeta = await buscarOferta(consumidor, producto); // escribe el nombre y pulsa «Buscar»
  await expect(tarjeta).toContainText('5 disponibles'); // aún no se ha reservado nada
  await tarjeta.getByRole('button', { name: 'Reservar' }).click(); // abre el diálogo de reserva
  const dialogo = consumidor.getByRole('dialog'); // se acota al diálogo: la tarjeta también tiene «Reservar»
  await dialogo.getByLabel('Cantidad').fill('2');
  await dialogo.getByRole('button', { name: 'Reservar' }).click();

  // ── Paso 3 · El consumidor ve la confirmación con el plazo de retiro ────────────────────
  await expect(dialogo.getByText('Reserva confirmada')).toBeVisible();
  await expect(dialogo.getByText(/Plazo de retiro:/)).toBeVisible();
  await dialogo.getByRole('button', { name: 'Cerrar' }).first().click(); // el listado se refresca al cerrar
  await expect(tarjeta).toContainText('3 disponibles'); // 5 − 2: el inventario se descontó

  // ── Paso 4 · El PERSONAL de la sede marca la reserva como entregada ─────────────────────
  const contextoPersonal = await nuevoContexto(browser); // sesión independiente 3
  const personal = await contextoPersonal.newPage();
  await iniciarSesion(personal, CUENTAS.personal);
  await personal.goto('/gestion/reservas');
  const fila = personal.getByRole('row').filter({ hasText: producto }); // la fila de esta reserva
  await expect(fila).toContainText('Consumidor Uno'); // el personal ve a quién le entrega
  await fila.getByRole('button', { name: 'Marcar entregada' }).click();
  await expect(personal.getByText('Reserva marcada como entregada')).toBeVisible();
  await expect(fila.getByText('Entregada')).toBeVisible(); // el estado de la fila cambió

  await Promise.all([contextoDueno.close(), contextoConsumidor.close(), contextoPersonal.close()]);
});
