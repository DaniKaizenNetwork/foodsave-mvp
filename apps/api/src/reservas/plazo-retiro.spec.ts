import { calcularPlazoRetiro } from './plazo-retiro';

/** Hora de Bogotá (UTC-5) del 17 de noviembre de 2026. */
const bogota = (hhmm: string) => new Date(`2026-11-17T${hhmm}:00-05:00`);

describe('calcularPlazoRetiro (SWR-RES-005)', () => {
  it('UNIT-01 / TC-RES-002: limita las 12 horas (07:00, cierre 20:00, vence 23:00 → 19:00)', () => {
    // Arrange
    const ahora = bogota('07:00');

    // Act
    const plazo = calcularPlazoRetiro(ahora, bogota('20:00'), bogota('23:00'));

    // Assert
    expect(plazo).toEqual(bogota('19:00'));
  });

  it('UNIT-02 / TC-RES-001: limita el cierre de la sede (17:00, cierre 20:00, vence 23:00 → 20:00)', () => {
    expect(calcularPlazoRetiro(bogota('17:00'), bogota('20:00'), bogota('23:00'))).toEqual(
      bogota('20:00'),
    );
  });

  it('UNIT-03 / TC-RES-003: limita el vencimiento tras el cierre (10:00, cierre 21:00, vence 15:00 → 15:00)', () => {
    expect(calcularPlazoRetiro(bogota('10:00'), bogota('21:00'), bogota('15:00'))).toEqual(
      bogota('15:00'),
    );
  });

  it('WB-01: limita el vencimiento sin que limite el cierre (08:00, cierre 22:00, vence 15:00 → 15:00)', () => {
    expect(calcularPlazoRetiro(bogota('08:00'), bogota('22:00'), bogota('15:00'))).toEqual(
      bogota('15:00'),
    );
  });

  it('WB-07: sede 24 h (cierre null) no limita (07:00, vence 23:00 → 19:00)', () => {
    expect(calcularPlazoRetiro(bogota('07:00'), null, bogota('23:00'))).toEqual(bogota('19:00'));
  });

  it('sede 24 h con vencimiento cercano: limita el vencimiento', () => {
    expect(calcularPlazoRetiro(bogota('07:00'), null, bogota('09:30'))).toEqual(bogota('09:30'));
  });

  it('frontera: cierre igual al límite de 12 h (19:00 = 19:00) devuelve ese mismo instante', () => {
    expect(calcularPlazoRetiro(bogota('07:00'), bogota('19:00'), bogota('23:00'))).toEqual(
      bogota('19:00'),
    );
  });

  it('no modifica las fechas recibidas y devuelve una fecha nueva', () => {
    const ahora = bogota('07:00');
    const cierre = bogota('20:00');
    const copiaAhora = ahora.getTime();

    const plazo = calcularPlazoRetiro(ahora, cierre, bogota('23:00'));

    expect(ahora.getTime()).toBe(copiaAhora);
    expect(plazo).not.toBe(cierre);
  });
});
