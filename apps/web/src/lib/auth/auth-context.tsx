'use client';

import { login } from '@/lib/api/auth';
import { EVENTO_SESION_EXPIRADA } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { borrarSesion, CLAVE_SESION, guardarSesion, leerSesion } from './sesion-storage';
import type { Sesion, UsuarioSesion } from './tipos';

interface AuthContexto {
  usuario: UsuarioSesion | null;
  /** Verdadero hasta que se lee la sesión guardada (evita parpadeos y redirecciones falsas). */
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<UsuarioSesion>;
  /** Solo borra la sesión del cliente (Decisión #8: sin invalidación en el servidor). */
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setSesion(leerSesion());
    setCargando(false);

    const alExpirar = () => {
      borrarSesion();
      setSesion(null);
      queryClient.clear();
    };
    // Cambios de sesión hechos en otra pestaña.
    const alCambiarAlmacenamiento = (evento: StorageEvent) => {
      if (evento.key === CLAVE_SESION || evento.key === null) setSesion(leerSesion());
    };

    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    window.addEventListener('storage', alCambiarAlmacenamiento);
    return () => {
      window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
      window.removeEventListener('storage', alCambiarAlmacenamiento);
    };
  }, [queryClient]);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const nueva = await login(correo, contrasena);
    guardarSesion(nueva);
    setSesion(nueva);
    return nueva.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setSesion(null);
    queryClient.clear();
  }, [queryClient]);

  const valor = useMemo<AuthContexto>(
    () => ({ usuario: sesion?.usuario ?? null, cargando, iniciarSesion, cerrarSesion }),
    [sesion, cargando, iniciarSesion, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContexto {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
