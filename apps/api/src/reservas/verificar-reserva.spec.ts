import { OfertaReservable, verificarReserva } from './verificar-reserva';

const ahora = new Date('2026-11-17T10:00:00-05:00');
const mañana = new Date('2026-11-18T10:00:00-05:00');

const oferta = (cambios: Partial<OfertaReservable> = {}): OfertaReservable => ({
  estado: 'ACTIVA',
  disponible: 5,
  vencimiento: mañana,
  ...cambios,
});

describe('verificarReserva (SWR-RES-001, SWR-RES-002)', () => {
  it('UNIT-07: una cantidad mayor al stock se rechaza con STOCK_INSUFICIENTE', () => {
    // Arrange
    const o = oferta({ disponible: 5 });

    // Act
    const resultado = verificarReserva(o, 6, ahora);

    // Assert
    expect(resultado).toBe('STOCK_INSUFICIENTE');
  });

  it('WB-02: cantidad 0 se rechaza con CANTIDAD_INVALIDA', () => {
    expect(verificarReserva(oferta(), 0, ahora)).toBe('CANTIDAD_INVALIDA');
  });

  it('WB-03: una oferta CERRADA se rechaza con OFERTA_NO_ACTIVA', () => {
    expect(verificarReserva(oferta({ estado: 'CERRADA' }), 1, ahora)).toBe('OFERTA_NO_ACTIVA');
  });

  it('WB-04: frontera, vencimiento igual a ahora se rechaza con PRODUCTO_VENCIDO', () => {
    expect(verificarReserva(oferta({ vencimiento: ahora }), 1, ahora)).toBe('PRODUCTO_VENCIDO');
  });

  it('WB-05: frontera, cantidad igual al disponible se acepta', () => {
    expect(verificarReserva(oferta({ disponible: 5 }), 5, ahora)).toBe('OK');
  });

  it.each([-1, 1.5, NaN, Infinity])('rechaza la cantidad %p con CANTIDAD_INVALIDA', (cantidad) => {
    expect(verificarReserva(oferta(), cantidad, ahora)).toBe('CANTIDAD_INVALIDA');
  });

  it('una oferta AGOTADA se rechaza con OFERTA_NO_ACTIVA', () => {
    expect(verificarReserva(oferta({ estado: 'AGOTADA', disponible: 0 }), 1, ahora)).toBe(
      'OFERTA_NO_ACTIVA',
    );
  });

  it('una oferta ACTIVA con 0 unidades se rechaza con STOCK_INSUFICIENTE', () => {
    expect(verificarReserva(oferta({ disponible: 0 }), 1, ahora)).toBe('STOCK_INSUFICIENTE');
  });

  it('prioridad entre errores: cantidad, luego oferta no activa, luego vencido, luego stock', () => {
    const todoMal = oferta({ estado: 'CERRADA', vencimiento: ahora, disponible: 0 });

    expect(verificarReserva(todoMal, 0, ahora)).toBe('CANTIDAD_INVALIDA');
    expect(verificarReserva(todoMal, 1, ahora)).toBe('OFERTA_NO_ACTIVA');
    expect(verificarReserva({ ...todoMal, estado: 'ACTIVA' }, 1, ahora)).toBe('PRODUCTO_VENCIDO');
    expect(verificarReserva({ ...todoMal, estado: 'ACTIVA', vencimiento: mañana }, 1, ahora)).toBe(
      'STOCK_INSUFICIENTE',
    );
  });
});
