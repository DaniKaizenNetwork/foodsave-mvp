'use client';

import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/** Atajo «Publicar oferta» en la cabecera del listado; solo lo ven DUENO y PERSONAL. */
export function AccionPublicar() {
  const { usuario } = useAuth();
  if (usuario?.rol !== 'DUENO' && usuario?.rol !== 'PERSONAL') return null;

  return (
    <Link href='/ofertas/nueva' className={cn(buttonVariants())}>
      <Icons.add aria-hidden />
      Publicar oferta
    </Link>
  );
}
