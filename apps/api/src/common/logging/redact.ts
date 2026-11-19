/** Texto que sustituye a los valores sensibles en los logs. */
export const OCULTO = '[OCULTO]';

/** Nombres de campo (en minúsculas) cuyo valor nunca se registra. */
const CAMPOS_SENSIBLES = new Set([
  'contrasena',
  'password',
  'passwordhash',
  'accesstoken',
  'token',
  'authorization',
]);

/**
 * Devuelve una copia del valor con los campos sensibles ocultos (a cualquier
 * profundidad, también dentro de arreglos). No modifica el original y conserva
 * el resto de los campos.
 */
export function redact<T>(valor: T): T {
  return limpiar(valor, new WeakSet()) as T;
}

function limpiar(valor: unknown, visitados: WeakSet<object>): unknown {
  if (valor === null || typeof valor !== 'object' || valor instanceof Date) {
    return valor;
  }
  if (visitados.has(valor)) {
    return '[CICLO]';
  }
  visitados.add(valor);

  if (Array.isArray(valor)) {
    return valor.map((elemento) => limpiar(elemento, visitados));
  }

  const copia: Record<string, unknown> = {};
  for (const [clave, contenido] of Object.entries(valor)) {
    copia[clave] = CAMPOS_SENSIBLES.has(clave.toLowerCase())
      ? OCULTO
      : limpiar(contenido, visitados);
  }
  return copia;
}
