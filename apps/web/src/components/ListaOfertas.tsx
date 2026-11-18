'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BotonReservar } from '@/components/BotonReservar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { listarOfertas, type Oferta } from '@/lib/api/ofertas';
import { formatFechaHora, formatPrecio } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

/** Mensajes exactos de «Datos y mensajes». */
export const MENSAJE_CARGANDO = 'Cargando ofertas…';
export const MENSAJE_SIN_OFERTAS = 'No hay ofertas disponibles';
export const MENSAJE_SIN_RESULTADOS = 'No se encontraron ofertas para tu búsqueda';

/**
 * SWR-BUS-001 / SWR-BUS-005. Listado público de ofertas activas con búsqueda por nombre.
 * `qInicial` viene de la URL (`/ofertas?q=`); al buscar se actualiza la URL.
 */
export function ListaOfertas({ qInicial = '' }: { qInicial?: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState(qInicial);
  const [q, setQ] = useState(qInicial);

  // Si la URL cambia (atrás/adelante), el listado la sigue.
  useEffect(() => {
    setTexto(qInicial);
    setQ(qInicial);
  }, [qInicial]);

  const consulta = useQuery({
    queryKey: ['ofertas', q],
    queryFn: () => listarOfertas(q || undefined),
    // El inventario cambia con cada reserva: al volver al listado se muestra el dato fresco.
    staleTime: 5_000
  });

  function aplicarBusqueda(valor: string) {
    const nuevo = valor.trim();
    setQ(nuevo);
    router.replace(nuevo ? `/ofertas?q=${encodeURIComponent(nuevo)}` : '/ofertas', {
      scroll: false
    });
  }

  function alBuscar(evento: FormEvent) {
    evento.preventDefault();
    aplicarBusqueda(texto);
  }

  return (
    <div className='flex flex-col gap-6'>
      <form role='search' onSubmit={alBuscar} className='flex w-full max-w-xl gap-2'>
        <div className='relative flex-1'>
          <Icons.search
            aria-hidden
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2'
          />
          <Input
            type='search'
            aria-label='Buscar ofertas'
            placeholder='Buscar ofertas por nombre del producto'
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            className='pl-8'
          />
        </div>
        {(texto || q) && (
          <Button
            type='button'
            variant='ghost'
            aria-label='Borrar búsqueda'
            onClick={() => {
              setTexto('');
              aplicarBusqueda('');
            }}
          >
            <Icons.close aria-hidden />
          </Button>
        )}
        <Button type='submit'>Buscar</Button>
      </form>

      {consulta.isPending && (
        <>
          <p role='status' className='text-muted-foreground text-sm'>
            {MENSAJE_CARGANDO}
          </p>
          <div aria-hidden className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className='h-56 rounded-xl' />
            ))}
          </div>
        </>
      )}

      {consulta.isError && (
        <Alert variant='destructive' role='alert'>
          <AlertDescription className='flex flex-wrap items-center gap-3'>
            {consulta.error.message}
            <Button type='button' variant='outline' size='sm' onClick={() => consulta.refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {consulta.isSuccess && consulta.data.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.offer aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{q ? MENSAJE_SIN_RESULTADOS : MENSAJE_SIN_OFERTAS}</EmptyTitle>
            <EmptyDescription>
              {q
                ? 'Prueba con otra palabra o borra la búsqueda para ver todas las ofertas.'
                : 'Vuelve más tarde: las sedes publican nuevas ofertas cada día.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {consulta.isSuccess && consulta.data.length > 0 && (
        <ul className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {consulta.data.map((oferta) => (
            <li key={oferta.id}>
              <TarjetaOferta oferta={oferta} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaOferta({ oferta }: { oferta: Oferta }) {
  const descuento = Math.round((1 - oferta.precioOferta / oferta.precioOriginal) * 100);

  return (
    <Card className='h-full'>
      <CardHeader>
        <div className='flex items-start justify-between gap-2'>
          <CardTitle className='text-lg'>{oferta.producto}</CardTitle>
          <Badge className='bg-primary/10 text-primary shrink-0'>Activa</Badge>
        </div>
        <CardDescription className='flex items-center gap-1'>
          <Icons.store aria-hidden className='size-4' />
          {oferta.sede.nombre}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-3'>
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
          <span className='font-heading text-primary text-3xl font-bold'>
            {formatPrecio(oferta.precioOferta)}
          </span>
          <del className='text-muted-foreground text-sm'>{formatPrecio(oferta.precioOriginal)}</del>
          {descuento > 0 && (
            <Badge className='bg-brand-accent text-brand-brown font-bold'>-{descuento}%</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className='text-muted-foreground flex flex-col items-stretch gap-3 text-sm'>
        <div className='flex flex-wrap justify-between gap-2'>
          <span className='text-foreground font-semibold'>
            {oferta.disponible} {oferta.disponible === 1 ? 'disponible' : 'disponibles'}
          </span>
          <span className='flex items-center gap-1'>
            <Icons.clock aria-hidden className='size-4' />
            Vence: {formatFechaHora(oferta.vencimiento)}
          </span>
        </div>
        <BotonReservar oferta={oferta} />
      </CardFooter>
    </Card>
  );
}
