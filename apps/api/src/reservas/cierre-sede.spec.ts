import { calcularCierreSede, HorarioDia } from './cierre-sede';

/** Sede Norte: cierra a las 20:00 los 7 días de la semana. */
const horariosNorte: HorarioDia[] = Array.from({ length: 7 }, (_, diaSemana) => ({
  diaSemana,
  cierre: '20:00',
}));

describe('calcularCierreSede (SWR-RES-005)', () => {
  it('UNIT-12: el cierre de una sede 24 h es null', () => {
    // Arrange
    const sede = { abierta24h: true };

    // Act
    const cierre = calcularCierreSede(sede, [], new Date('2026-11-17T15:00:00-05:00'));

    // Assert
    expect(cierre).toBeNull();
  });

  it('UNIT-13: el cierre de una sede con horario es el del día de la reserva en hora de Bogotá', () => {
    const ahora = new Date('2026-11-17T15:00:00-05:00'); // 15:00 en Bogotá

    const cierre = calcularCierreSede({ abierta24h: false }, horariosNorte, ahora);

    expect(cierre).toEqual(new Date('2026-11-17T20:00:00-05:00'));
    expect(cierre?.toISOString()).toBe('2026-11-18T01:00:00.000Z'); // 01:00 UTC del día siguiente
  });

  it('usa el día de la semana de Bogotá aunque en UTC ya sea el día siguiente', () => {
    // 21:30 del martes 17 en Bogotá = 02:30 UTC del miércoles 18.
    const ahora = new Date('2026-11-18T02:30:00Z');
    const horarios: HorarioDia[] = [
      { diaSemana: 2, cierre: '22:00' }, // martes
      { diaSemana: 3, cierre: '18:00' }, // miércoles
    ];

    const cierre = calcularCierreSede({ abierta24h: false }, horarios, ahora);

    expect(cierre).toEqual(new Date('2026-11-17T22:00:00-05:00'));
  });

  it('respeta los minutos del cierre', () => {
    const horarios: HorarioDia[] = [{ diaSemana: 2, cierre: '19:45' }];

    const cierre = calcularCierreSede(
      { abierta24h: false },
      horarios,
      new Date('2026-11-17T10:00:00-05:00'),
    );

    expect(cierre).toEqual(new Date('2026-11-17T19:45:00-05:00'));
  });

  it('una sede no 24 h sin horario para ese día es un error de configuración', () => {
    const soloLunes: HorarioDia[] = [{ diaSemana: 1, cierre: '20:00' }];

    expect(() =>
      calcularCierreSede({ abierta24h: false }, soloLunes, new Date('2026-11-17T10:00:00-05:00')),
    ).toThrow(/no tiene horario/);
  });
});
