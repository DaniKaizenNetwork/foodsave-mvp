import { OfertaReservable, verificarReserva } from './verificar-reserva';

/**
 * Pruebas ampliadas de verificarReserva (SWR-RES-001, SWR-RES-002).
 * Completan la cobertura MC/DC de la primera condición
 * `!Number.isInteger(cantidad) || cantidad <= 0` y la frontera del vencimiento por el otro lado.
 */
const ahora = new Date('2026-11-17T15:00:00-05:00');
const ofertaActiva: OfertaReservable = {
  estado: 'ACTIVA',
  disponible: 5,
  vencimiento: new Date('2026-11-17T23:00:00-05:00'),
};

describe('verificarReserva · pruebas ampliadas', () => {
  it('AMP-01 (MC/DC): una cantidad decimal positiva (1.5) falla solo por isInteger', () => {
    // Arrange: 1.5 > 0, así que solo la sub-condición !isInteger es verdadera
    const cantidad = 1.5;

    // Act
    const resultado = verificarReserva(ofertaActiva, cantidad, ahora);

    // Assert
    expect(resultado).toBe('CANTIDAD_INVALIDA');
  });

  it('AMP-02 (MC/DC): una cantidad entera negativa (-1) falla solo por cantidad <= 0', () => {
    expect(verificarReserva(ofertaActiva, -1, ahora)).toBe('CANTIDAD_INVALIDA');
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('AMP-03 (adivinación de errores): %s se rechaza con CANTIDAD_INVALIDA', (_nombre, cantidad) => {
    expect(verificarReserva(ofertaActiva, cantidad, ahora)).toBe('CANTIDAD_INVALIDA');
  });

  it('AMP-04 (valor límite): vencimiento 1 ms después de ahora todavía se puede reservar', () => {
    const oferta = { ...ofertaActiva, vencimiento: new Date(ahora.getTime() + 1) };

    expect(verificarReserva(oferta, 1, ahora)).toBe('OK');
  });

  it('AMP-05 (valor límite): con 1 unidad disponible, reservar 1 es OK y reservar 2 no', () => {
    const oferta = { ...ofertaActiva, disponible: 1 };

    expect(verificarReserva(oferta, 1, ahora)).toBe('OK');
    expect(verificarReserva(oferta, 2, ahora)).toBe('STOCK_INSUFICIENTE');
  });

  it('AMP-06 (tabla de decisión): una oferta vencida y sin stock informa primero el vencimiento', () => {
    const oferta: OfertaReservable = { estado: 'ACTIVA', disponible: 0, vencimiento: ahora };

    expect(verificarReserva(oferta, 1, ahora)).toBe('PRODUCTO_VENCIDO');
  });
});
