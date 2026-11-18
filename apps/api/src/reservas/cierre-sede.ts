export interface SedeConHorario {
  abierta24h: boolean;
}

export interface HorarioDia {
  /** 0 = domingo ... 6 = sábado (igual que Date.getDay()). */
  diaSemana: number;
  /** Hora de cierre local, «HH:mm». */
  cierre: string;
}

/** Colombia (America/Bogota) está en UTC-5 todo el año: no tiene horario de verano. */
const DESFASE_BOGOTA_HORAS = -5;

/**
 * SWR-RES-005: hora de cierre de la sede el día de `ahora`, en hora de Bogotá.
 * - Sede 24 h: null (no hay cierre).
 * - Si no: el cierre del horario de ese día de la semana.
 * Una sede no 24 h sin fila de horario para ese día es un error de configuración.
 */
export function calcularCierreSede(
  sede: SedeConHorario,
  horarios: HorarioDia[],
  ahora: Date,
): Date | null {
  if (sede.abierta24h) return null;

  // Hora de pared de Bogotá: se corre el instante y se leen los campos en UTC.
  const local = new Date(ahora.getTime() + DESFASE_BOGOTA_HORAS * 60 * 60 * 1000);
  const diaSemana = local.getUTCDay();

  const horario = horarios.find((h) => h.diaSemana === diaSemana);
  if (!horario) {
    throw new Error(`La sede no tiene horario de atención para el día de la semana ${diaSemana}`);
  }

  const [horas, minutos] = horario.cierre.split(':').map(Number);
  return new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
      horas - DESFASE_BOGOTA_HORAS,
      minutos,
    ),
  );
}
