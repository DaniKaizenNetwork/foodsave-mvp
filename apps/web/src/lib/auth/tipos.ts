import type { Rol } from '@/types';

export type { Rol };

/** Datos del usuario que entrega `POST /auth/login`. */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  rol: Rol;
}

/** Respuesta de `POST /auth/login`; es lo que se guarda como sesión. */
export interface Sesion {
  accessToken: string;
  usuario: UsuarioSesion;
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  CONSUMIDOR: 'Consumidor',
  PERSONAL: 'Personal',
  DUENO: 'Dueño',
  ADMIN: 'Administrador'
};
