import type { CodigoError } from '../common/errores';

export interface OfertaReservable {
  estado: 'ACTIVA' | 'CERRADA' | 'AGOTADA';
  disponible: number;
  vencimiento: Date;
}

export type ResultadoVerificacion =
  | 'OK'
  | Extract<
      CodigoError,
      'CANTIDAD_INVALIDA' | 'OFERTA_NO_ACTIVA' | 'PRODUCTO_VENCIDO' | 'STOCK_INSUFICIENTE'
    >;

/**
 * SWR-RES-001 y SWR-RES-002: antes de crear una reserva verifica, en este orden, que
 * (1) la cantidad sea un entero positivo, (2) la oferta esté activa, (3) el producto no
 * esté vencido (vencimiento <= ahora se rechaza) y (4) la cantidad no supere las unidades
 * disponibles (cantidad == disponible se acepta). Devuelve el primer error que encuentra.
 */
export function verificarReserva(
  oferta: OfertaReservable,
  cantidad: number,
  ahora: Date,
): ResultadoVerificacion {
  if (!Number.isInteger(cantidad) || cantidad <= 0) return 'CANTIDAD_INVALIDA';
  if (oferta.estado !== 'ACTIVA') return 'OFERTA_NO_ACTIVA';
  if (oferta.vencimiento <= ahora) return 'PRODUCTO_VENCIDO';
  if (cantidad > oferta.disponible) return 'STOCK_INSUFICIENTE';
  return 'OK';
}
