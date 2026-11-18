'use client';

import { ReservaForm } from '@/components/ReservaForm';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import type { Oferta } from '@/lib/api/ofertas';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Acción de reservar de cada tarjeta del listado:
 * - CONSUMIDOR: abre el formulario de reserva en un diálogo.
 * - Visitante: invita a iniciar sesión.
 * - DUENO / PERSONAL / ADMIN: no se muestra (la API solo deja reservar a CONSUMIDOR).
 */
export function BotonReservar({ oferta }: { oferta: Oferta }) {
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [reservadas, setReservadas] = useState(0);

  if (cargando) return null;

  if (!usuario) {
    return (
      <Link href='/login' className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
        Inicia sesión para reservar
      </Link>
    );
  }
  if (usuario.rol !== 'CONSUMIDOR') return null;

  function alCambiar(abrir: boolean) {
    setAbierto(abrir);
    // El listado se actualiza al cerrar: si se hiciera antes, una oferta que se quedó sin
    // unidades desaparecería del listado y se llevaría el diálogo con la confirmación.
    if (!abrir && reservadas > 0) {
      setReservadas(0);
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogTrigger render={<Button className='w-full' />}>Reservar</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reservar «{oferta.producto}»</DialogTitle>
          <DialogDescription>
            La reserva es inmediata. Pagas y recoges en la sede antes del plazo de retiro.
          </DialogDescription>
        </DialogHeader>
        <ReservaForm
          oferta={oferta}
          disponible={oferta.disponible - reservadas}
          onReservada={(reserva) => setReservadas((n) => n + reserva.cantidad)}
        />
      </DialogContent>
    </Dialog>
  );
}
