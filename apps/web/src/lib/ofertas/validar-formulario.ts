export interface ValoresOferta {
  producto: string;
  precioOriginal: number | undefined;
  precioOferta: number | undefined;
  cantidad: number | undefined;
  /** Valor de un <input type="datetime-local"> («2026-11-19T18:00») o vacío. */
  vencimiento: string;
  sedeId: string;
}

export type ErroresOferta = Partial<Record<keyof ValoresOferta, string>>;

/** Mensajes exactos de «Datos y mensajes» (BB-06, RTL-10) y los de campos obligatorios. */
export const MENSAJE_CANTIDAD = 'La cantidad debe ser un número entero positivo';
export const MENSAJE_PRECIO = 'El precio de oferta debe ser menor al precio original';

/**
 * Espejo en el navegador de las reglas de la API (SWR-OFE-003). Cada campo se evalúa por
 * separado, así que el error de precio sale aunque otros campos estén vacíos (RTL-10).
 *
 * Como la API, no rechaza precios negativos ni cero (limitación conocida, Bloque C).
 */
export function validarFormularioOferta(valores: ValoresOferta): ErroresOferta {
  const errores: ErroresOferta = {};

  if (!valores.producto.trim()) errores.producto = 'El producto es obligatorio';
  if (!valores.sedeId) errores.sedeId = 'La sede es obligatoria';

  const { precioOriginal, precioOferta, cantidad } = valores;
  if (precioOriginal === undefined) {
    errores.precioOriginal = 'El precio original es obligatorio';
  } else if (!Number.isInteger(precioOriginal)) {
    errores.precioOriginal = 'El precio debe ser un número entero, en pesos';
  }
  if (precioOferta === undefined) {
    errores.precioOferta = 'El precio de oferta es obligatorio';
  } else if (!Number.isInteger(precioOferta)) {
    errores.precioOferta = 'El precio debe ser un número entero, en pesos';
  } else if (precioOriginal !== undefined && precioOferta >= precioOriginal) {
    errores.precioOferta = MENSAJE_PRECIO;
  }

  if (cantidad === undefined || !Number.isInteger(cantidad) || cantidad <= 0) {
    errores.cantidad = MENSAJE_CANTIDAD;
  }

  if (!valores.vencimiento || Number.isNaN(new Date(valores.vencimiento).getTime())) {
    errores.vencimiento = 'El vencimiento es obligatorio';
  }

  return errores;
}
