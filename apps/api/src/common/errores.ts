import { HttpException } from '@nestjs/common';

/**
 * Códigos de error y mensajes exactos.
 * Fuente: hojas «Contrato provisional» y «Datos y mensajes» de 04_Matriz_Pruebas.xlsx (v2).
 * RUTA_NO_ENCONTRADA y ERROR_INTERNO son solo de infraestructura (ruta inexistente y
 * fallos inesperados); no forman parte del contrato de negocio.
 */
export const ERRORES = {
  CREDENCIALES_INVALIDAS: { estado: 401, mensaje: 'Credenciales inválidas' },
  NO_AUTENTICADO: { estado: 401, mensaje: 'Debes iniciar sesión' },
  PROHIBIDO: { estado: 403, mensaje: 'No tienes permiso para realizar esta acción' },
  CAMPOS_INVALIDOS: { estado: 400, mensaje: 'Los datos enviados no son válidos' },
  CANTIDAD_INVALIDA: { estado: 400, mensaje: 'La cantidad debe ser un número entero positivo' },
  PRECIO_INVALIDO: {
    estado: 400,
    mensaje: 'El precio de oferta debe ser menor al precio original',
  },
  CORREO_DUPLICADO: { estado: 409, mensaje: 'Ya existe una cuenta con ese correo' },
  OFERTA_NO_ENCONTRADA: { estado: 404, mensaje: 'La oferta no existe' },
  RESERVA_NO_ENCONTRADA: { estado: 404, mensaje: 'La reserva no existe' },
  STOCK_INSUFICIENTE: { estado: 409, mensaje: 'No hay unidades suficientes' },
  OFERTA_NO_ACTIVA: { estado: 409, mensaje: 'La oferta no está activa' },
  PRODUCTO_VENCIDO: { estado: 409, mensaje: 'El producto está vencido' },
  RESERVA_NO_CANCELABLE: { estado: 409, mensaje: 'La reserva no se puede cancelar' },
  RESERVA_NO_ENTREGABLE: {
    estado: 409,
    mensaje: 'La reserva no se puede marcar como entregada',
  },
  RUTA_NO_ENCONTRADA: { estado: 404, mensaje: 'La ruta no existe' },
  ERROR_INTERNO: { estado: 500, mensaje: 'Error interno del servidor' },
} as const satisfies Record<string, { estado: number; mensaje: string }>;

export type CodigoError = keyof typeof ERRORES;

/** Error de negocio: se responde como `{ codigo, mensaje }` con el estado HTTP del código. */
export class ErrorNegocio extends HttpException {
  constructor(public readonly codigo: CodigoError) {
    super({ codigo, mensaje: ERRORES[codigo].mensaje }, ERRORES[codigo].estado);
  }
}
