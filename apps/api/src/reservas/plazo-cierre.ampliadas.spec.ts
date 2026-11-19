import { calcularCierreSede, HorarioDia } from './cierre-sede';
import { calcularPlazoRetiro } from './plazo-retiro';

/**
 * Pruebas ampliadas de calcularPlazoRetiro y calcularCierreSede (SWR-RES-005, RN-02).
 * Fechas en hora de Bogotá (UTC-5).
 */
const bogota = (fecha: string, hhmm: string) => new Date(`${fecha}T${hhmm}:00-05:00`);
const horariosCon = (cierre: string): HorarioDia[] =>
  Array.from({ length: 7 }, (_, diaSemana) => ({ diaSemana, cierre }));

describe('calcularPlazoRetiro · pruebas ampliadas', () => {
  it('AMP-12 (valor límite): empate entre cierre y vencimiento devuelve ese mismo instante', () => {
    // Arrange
    const ahora = bogota('2026-11-17', '10:00');
    const cierre = bogota('2026-11-17', '18:00');
    const vencimiento = bogota('2026-11-17', '18:00');

    // Act
    const plazo = calcularPlazoRetiro(ahora, cierre, vencimiento);

    // Assert
    expect(plazo).toEqual(bogota('2026-11-17', '18:00'));
  });

  it('AMP-13: una reserva a las 23:59 en sede 24 h tiene plazo a las 11:59 del día siguiente', () => {
    const plazo = calcularPlazoRetiro(
      bogota('2026-11-17', '23:59'),
      null,
      bogota('2026-11-19', '12:00'),
    );

    expect(plazo).toEqual(bogota('2026-11-18', '11:59'));
  });

  it('AMP-14 (caracterización): si la sede ya cerró, el plazo queda ANTES de ahora', () => {
    // Limitación documentada en plazo-retiro.ts: este caso lo evita la verificación previa.
    const ahora = bogota('2026-11-17', '21:00');
    const plazo = calcularPlazoRetiro(ahora, bogota('2026-11-17', '20:00'), bogota('2026-11-18', '10:00'));

    expect(plazo.getTime()).toBeLessThan(ahora.getTime());
  });
});

describe('calcularCierreSede · pruebas ampliadas', () => {
  it.each([
    ['domingo (0)', '2026-11-22'],
    ['sábado (6)', '2026-11-21'],
  ])('AMP-15 (bordes de la semana): el %s usa el horario de ese día', (_dia, fecha) => {
    const cierre = calcularCierreSede({ abierta24h: false }, horariosCon('19:30'), bogota(fecha, '09:00'));

    expect(cierre).toEqual(bogota(fecha, '19:30'));
  });

  it('AMP-16 (caracterización, hallazgo): un cierre «01:00» se toma como la 1 a. m. del MISMO día', () => {
    // Una sede que cierra a la 1 de la madrugada debería cerrar el día siguiente; hoy no.
    const ahora = bogota('2026-11-17', '15:00');

    const cierre = calcularCierreSede({ abierta24h: false }, horariosCon('01:00'), ahora);

    expect(cierre).toEqual(bogota('2026-11-17', '01:00'));
    expect(cierre!.getTime()).toBeLessThan(ahora.getTime());
  });
});
