'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Quien ya tiene sesión no necesita ver /login ni /registro: se le lleva a /ofertas. */
export function RedirigirSiAutenticado() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && usuario) router.replace('/ofertas');
  }, [cargando, usuario, router]);

  return null;
}
