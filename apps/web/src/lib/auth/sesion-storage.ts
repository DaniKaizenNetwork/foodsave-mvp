import type { Sesion } from './tipos';

const CLAVE = 'foodsave.sesion';
const ROLES = ['CONSUMIDOR', 'PERSONAL', 'DUENO', 'ADMIN'];

/** Lee el `exp` (en segundos) del payload del JWT; null si no se puede leer. */
function expiracionDelToken(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

function esSesion(valor: unknown): valor is Sesion {
  const sesion = valor as Sesion | null;
  return (
    !!sesion &&
    typeof sesion.accessToken === 'string' &&
    !!sesion.usuario &&
    typeof sesion.usuario.id === 'string' &&
    typeof sesion.usuario.nombre === 'string' &&
    ROLES.includes(sesion.usuario.rol)
  );
}

/**
 * La sesión vive en localStorage (decisión D10). Todo acceso va en try/catch porque el
 * almacenamiento puede no estar disponible (ventana privada, datos bloqueados).
 */
export function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const sesion: unknown = JSON.parse(crudo);
    if (!esSesion(sesion)) {
      borrarSesion();
      return null;
    }
    const exp = expiracionDelToken(sesion.accessToken);
    if (exp !== null && exp * 1000 <= Date.now()) {
      borrarSesion();
      return null;
    }
    return sesion;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: Sesion): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento la sesión dura lo que dure la pestaña (estado de React).
  }
}

export function borrarSesion(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}

export function obtenerToken(): string | null {
  return leerSesion()?.accessToken ?? null;
}

export const CLAVE_SESION = CLAVE;
