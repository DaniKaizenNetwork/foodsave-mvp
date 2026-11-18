'use client';

import { useAuth } from '@/lib/auth/auth-context';
import type { Rol } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

/** Mensajes exactos de «Datos y mensajes». */
export const MENSAJE_SIN_PERMISO = 'No tienes permiso para realizar esta acción';
export const AVISO_SIN_SESION = 'sesion';

/**
 * SWR-AUTH-010 (lado cliente; la autorización real la hace la API).
 * - Sin sesión: redirige a /login, que muestra «Debes iniciar sesión».
 * - Con sesión pero sin el rol exigido: muestra «No tienes permiso para realizar esta acción»
 *   y no renderiza el contenido.
 */
export function RutaProtegida({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) router.replace(`/login?aviso=${AVISO_SIN_SESION}`);
  }, [cargando, usuario, router]);

  if (cargando || !usuario) {
    return <div role='status' aria-label='Cargando' className='flex-1 animate-pulse p-6' />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div role='alert' className='flex flex-1 items-center justify-center p-6 text-center'>
        <p className='text-muted-foreground text-lg'>{MENSAJE_SIN_PERMISO}</p>
      </div>
    );
  }

  return <>{children}</>;
}
