import { ReservaCancelable, verificarCancelacion } from './verificar-cancelacion';

/** Hora de Bogotá (UTC-5) del 17 de noviembre de 2026. */
const bogota = (hhmm: string) => new Date(`2026-11-17T${hhmm}:00-05:00`);
const reserva = (cambios: Partial<ReservaCancelable> = {}): ReservaCancelable => ({
  estado: 'RESERVADA',
  plazoRetiro: bogota('20:00'),
  ...cambios,
});

describe('verificarCancelacion (SWR-RES-011)', () => {
  it('UNIT-09: permite cancelar una reserva RESERVADA con el plazo vigente (ahora 18:00, plazo 20:00)', () => {
    // Arrange
    const r = reserva();

    // Act
    const resultado = verificarCancelacion(r, bogota('18:00'));

    // Assert
    expect(resultado).toBe('OK');
  });

  it('UNIT-10: rechaza con el plazo vencido, incluida la frontera (ahora = plazo y ahora > plazo)', () => {
    expect(verificarCancelacion(reserva(), bogota('20:00'))).toBe('RESERVA_NO_CANCELABLE');
    expect(verificarCancelacion(reserva(), bogota('21:00'))).toBe('RESERVA_NO_CANCELABLE');
  });

  it('UNIT-11: rechaza si la reserva no está RESERVADA (ENTREGADA o CANCELADA) aunque el plazo esté vigente', () => {
    expect(verificarCancelacion(reserva({ estado: 'ENTREGADA' }), bogota('18:00'))).toBe(
      'RESERVA_NO_CANCELABLE',
    );
    expect(verificarCancelacion(reserva({ estado: 'CANCELADA' }), bogota('18:00'))).toBe(
      'RESERVA_NO_CANCELABLE',
    );
  });

  it('una reserva EXPIRADA tampoco se puede cancelar', () => {
    expect(verificarCancelacion(reserva({ estado: 'EXPIRADA' }), bogota('18:00'))).toBe(
      'RESERVA_NO_CANCELABLE',
    );
  });

  it('frontera inferior: un milisegundo antes del plazo todavía se puede cancelar', () => {
    const casiVencida = new Date(bogota('20:00').getTime() - 1);

    expect(verificarCancelacion(reserva(), casiVencida)).toBe('OK');
  });
});
