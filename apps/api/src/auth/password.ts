import { compare, hash } from 'bcryptjs';

/** Coste del hash adaptativo (bcrypt). Cada hash lleva su propia sal. */
export const COSTO_BCRYPT = 10;

/** SWR-SEC-002: hash adaptativo con sal; la contraseña nunca se guarda en texto plano. */
export function hashPassword(contrasena: string): Promise<string> {
  return hash(contrasena, COSTO_BCRYPT);
}

/** Devuelve true solo si la contraseña corresponde al hash. */
export function verifyPassword(contrasena: string, passwordHash: string): Promise<boolean> {
  return compare(contrasena, passwordHash);
}
