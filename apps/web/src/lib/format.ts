export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('es-CO', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch {
    return '';
  }
}

/** Precio en pesos colombianos sin decimales, p. ej. «$ 4.000». */
export function formatPrecio(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor);
}

/** Fecha y hora en la zona de las sedes (America/Bogota), p. ej. «19 nov 2026, 6:00 p. m.». */
export function formatFechaHora(fecha: Date | string | number): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Bogota'
    }).format(new Date(fecha));
  } catch {
    return '';
  }
}
