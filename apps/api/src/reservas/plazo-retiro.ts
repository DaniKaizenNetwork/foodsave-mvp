const DOCE_HORAS_MS = 12 * 60 * 60 * 1000;

/**
 * SWR-RES-005 (RN-02): el plazo de retiro es el menor entre 12 horas desde la reserva, la
 * hora de cierre de la sede del día de la reserva y la fecha y hora de vencimiento del
 * producto. `cierreSede` es null en las sedes 24 h: no limita.
 *
 * El reloj llega como parámetro (`ahora`); la función no lee la hora del sistema.
 * Limitación conocida (Bloque A): si la sede ya cerró o el producto ya venció, devuelve
 * un plazo anterior a `ahora`; ese caso lo evita la verificación de la reserva.
 */
export function calcularPlazoRetiro(
  ahora: Date,
  cierreSede: Date | null,
  vencimiento: Date,
): Date {
  let plazo = new Date(ahora.getTime() + DOCE_HORAS_MS);
  if (cierreSede !== null && cierreSede < plazo) plazo = cierreSede;
  if (vencimiento < plazo) plazo = vencimiento;
  return new Date(plazo.getTime());
}
