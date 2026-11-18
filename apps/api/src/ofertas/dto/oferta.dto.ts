import { ErrorNegocio } from '../../common/errores';

/** Máximo que admite una columna INTEGER de PostgreSQL. */
const MAX_INT = 2_147_483_647;

export interface PublicarOfertaDto {
  producto: string;
  precioOriginal: number;
  precioOferta: number;
  cantidad: number;
  vencimiento: Date;
  sedeId: string;
}

function texto(valor: unknown): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new ErrorNegocio('CAMPOS_INVALIDOS');
  }
  return valor.trim();
}

/** Cantidad y precios deben ser números (no se juzga aquí si son válidos: lo hace validarOferta). */
function numero(valor: unknown): number {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    throw new ErrorNegocio('CAMPOS_INVALIDOS');
  }
  return valor;
}

/** Los precios se guardan como enteros (pesos): un decimal o un valor fuera de rango no cabe en la columna. */
function precioAlmacenable(valor: number): number {
  if (!Number.isInteger(valor) || Math.abs(valor) > MAX_INT) {
    throw new ErrorNegocio('CAMPOS_INVALIDOS');
  }
  return valor;
}

/**
 * Valida la forma del cuerpo de POST /ofertas (campos obligatorios y tipos). Las reglas de
 * negocio (cantidad entera positiva, precio de oferta menor al original) las aplica
 * `validarOferta`; por eso 1.5, 0 o -1 en cantidad llegan hasta ahí.
 */
export function validarCuerpoOferta(cuerpo: unknown): PublicarOfertaDto {
  const datos = (cuerpo ?? {}) as Record<string, unknown>;

  const producto = texto(datos.producto);
  const sedeId = texto(datos.sedeId);
  const cantidad = numero(datos.cantidad);
  const precioOriginal = precioAlmacenable(numero(datos.precioOriginal));
  const precioOferta = precioAlmacenable(numero(datos.precioOferta));
  if (Math.abs(cantidad) > MAX_INT) throw new ErrorNegocio('CAMPOS_INVALIDOS');

  // El vencimiento llega como texto ISO 8601. No se exige que sea futuro (Decisión #6).
  if (typeof datos.vencimiento !== 'string') throw new ErrorNegocio('CAMPOS_INVALIDOS');
  const vencimiento = new Date(datos.vencimiento);
  if (Number.isNaN(vencimiento.getTime())) throw new ErrorNegocio('CAMPOS_INVALIDOS');

  return { producto, precioOriginal, precioOferta, cantidad, vencimiento, sedeId };
}
