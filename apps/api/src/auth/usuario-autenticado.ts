import type { Request } from 'express';
import { Rol } from '../generated/prisma/client';

/** Datos del usuario que el guard de JWT deja en `request.user`. */
export interface UsuarioAutenticado {
  id: string;
  rol: Rol;
}

export type RequestAutenticada = Request & { user?: UsuarioAutenticado };
