import type { CodigoError } from '../common/errores';

export interface ReservaCancelable {
  estado: 'RESERVADA' | 'ENTREGADA' | 'CANCELADA' | 'EXPIRADA';
  plazoRetiro: Date;
}

export type ResultadoCancelacion = 'OK' | Extract<CodigoError, 'RESERVA_NO_CANCELABLE'>;

/**
 * SWR-RES-011 (RN-09): el consumidor solo puede cancelar una reserva en estado RESERVADA
 * mientras su plazo de retiro esté vigente. Vigente = `ahora < plazoRetiro`: en el instante
 * exacto del plazo ya no se puede cancelar (igual que un producto con vencimiento = ahora ya
 * está vencido).
 */
export function verificarCancelacion(
  reserva: ReservaCancelable,
  ahora: Date,
): ResultadoCancelacion {
  if (reserva.estado !== 'RESERVADA') return 'RESERVA_NO_CANCELABLE';
  if (!(ahora < reserva.plazoRetiro)) return 'RESERVA_NO_CANCELABLE';
  return 'OK';
}
