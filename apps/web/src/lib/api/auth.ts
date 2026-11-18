import { apiClient } from '@/lib/api-client';
import type { Sesion } from '@/lib/auth/tipos';

export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
}

/** SWR-AUTH-005: POST /auth/login → { accessToken, usuario }. */
export function login(correo: string, contrasena: string): Promise<Sesion> {
  return apiClient<Sesion>('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo, contrasena },
    autenticado: false
  });
}

/** SWR-AUTH-001: POST /auth/register → 201 { id, nombre, correo, rol }. */
export function registrar(datos: DatosRegistro): Promise<{ id: string; nombre: string; correo: string; rol: string }> {
  return apiClient('/auth/register', { metodo: 'POST', cuerpo: datos, autenticado: false });
}
