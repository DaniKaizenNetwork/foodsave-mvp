import type { CodigoError } from '../common/errores';

export interface DatosOferta {
  cantidad: number;
  precioOriginal: number;
  precioOferta: number;
}

export type ResultadoValidacionOferta =
  | { valido: true }
  | { valido: false; codigo: Extract<CodigoError, 'CANTIDAD_INVALIDA' | 'PRECIO_INVALIDO'> };

/**
 * SWR-OFE-003: antes de publicar se verifica que (a) la cantidad sea un entero positivo y
 * (b) el precio de oferta sea estrictamente menor al original. Se evalúa en ese orden.
 *
 * Limitación conocida (Bloque C de caja blanca): no valida precios negativos, cero o no
 * numéricos; el controlador solo comprueba que sean números.
 */
export function validarOferta({
  cantidad,
  precioOriginal,
  precioOferta,
}: DatosOferta): ResultadoValidacionOferta {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { valido: false, codigo: 'CANTIDAD_INVALIDA' };
  }
  if (precioOferta >= precioOriginal) {
    return { valido: false, codigo: 'PRECIO_INVALIDO' };
  }
  return { valido: true };
}
