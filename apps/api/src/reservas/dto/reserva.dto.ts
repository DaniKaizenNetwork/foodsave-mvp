import { ErrorNegocio } from '../../common/errores';

export interface CrearReservaDto {
  ofertaId: string;
  cantidad: number;
}

/**
 * Forma del cuerpo de POST /reservas: `ofertaId` texto y `cantidad` número. Si es 0, negativa
 * o decimal llega a `verificarReserva`, que responde CANTIDAD_INVALIDA.
 */
export function validarCuerpoReserva(cuerpo: unknown): CrearReservaDto {
  const datos = (cuerpo ?? {}) as Record<string, unknown>;

  if (typeof datos.ofertaId !== 'string' || datos.ofertaId.trim().length === 0) {
    throw new ErrorNegocio('CAMPOS_INVALIDOS');
  }
  if (typeof datos.cantidad !== 'number' || Number.isNaN(datos.cantidad)) {
    throw new ErrorNegocio('CAMPOS_INVALIDOS');
  }
  return { ofertaId: datos.ofertaId.trim(), cantidad: datos.cantidad };
}
