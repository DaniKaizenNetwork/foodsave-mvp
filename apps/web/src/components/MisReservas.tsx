'use client';

import { Icons } from '@/components/icons';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { AvisoDeReserva, EtiquetaEstado, OPCIONES_ESTADO, type AvisoReserva } from '@/components/reservas/comunes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { cancelarReserva, listarMisReservas, type Reserva } from '@/lib/api/reservas';
import { ErrorApi } from '@/lib/api-client';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { formatFechaHora, formatPrecio } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export const MENSAJE_CARGANDO_RESERVAS = 'Cargando reservas…';
/** Mensaje exacto de «Datos y mensajes». */
export const MENSAJE_RESERVA_CANCELADA = 'Reserva cancelada';

/**
 * SWR-RES-011. «Mis reservas» del consumidor con el botón «Cancelar». Solo se ofrece
 * cancelar una reserva RESERVADA con el plazo de retiro vigente; la API vuelve a comprobarlo.
 */
export function MisReservas() {
  const queryClient = useQueryClient();
  const [aviso, setAviso] = useState<AvisoReserva | null>(null);

  const reservas = useQuery({
    queryKey: ['reservas', 'mias'],
    queryFn: listarMisReservas,
    staleTime: 5_000
  });

  const cancelar = useMutation({
    mutationFn: (reserva: Reserva) => cancelarReserva(reserva.id),
    onSuccess: (cancelada) => {
      setAviso({
        tipo: 'exito',
        titulo: MENSAJE_RESERVA_CANCELADA,
        detalle: `${cancelada.cantidad} × ${cancelada.oferta.producto}: las unidades volvieron al inventario.`
      });
    },
    onError: (causa) => {
      setAviso({
        tipo: 'error',
        mensaje: causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado'
      });
    },
    // Éxito o error: el estado de la reserva y el inventario pudieron cambiar.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['reservas'] });
      void queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    }
  });

  const columnas = useMemo(
    () => crearColumnas({ cancelando: cancelar.isPending, onCancelar: (r) => cancelar.mutate(r) }),
    [cancelar]
  );

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <AvisoDeReserva aviso={aviso} />

      {reservas.isPending && (
        <>
          <p role='status' className='text-muted-foreground text-sm'>
            {MENSAJE_CARGANDO_RESERVAS}
          </p>
          <Skeleton aria-hidden className='h-64 rounded-xl' />
        </>
      )}

      {reservas.isError && (
        <Alert variant='destructive' role='alert'>
          <AlertDescription className='flex flex-wrap items-center gap-3'>
            {reservas.error.message}
            <Button type='button' variant='outline' size='sm' onClick={() => reservas.refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {reservas.isSuccess && reservas.data.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.reservation aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Aún no tienes reservas</EmptyTitle>
            <EmptyDescription>Reserva una oferta y aparecerá aquí con su plazo de retiro.</EmptyDescription>
          </EmptyHeader>
          <Link href='/ofertas' className={cn(buttonVariants())}>
            Ver ofertas
          </Link>
        </Empty>
      )}

      {reservas.isSuccess && reservas.data.length > 0 && (
        <TablaMisReservas datos={reservas.data} columnas={columnas} />
      )}
    </div>
  );
}

function TablaMisReservas({
  datos,
  columnas
}: {
  datos: Reserva[];
  columnas: ColumnDef<DataTableFeatures, Reserva>[];
}) {
  const { table } = useDataTable({
    data: datos,
    columns: columnas,
    mode: 'client'
  });

  return (
    // `min-h`: en pantallas bajas la página hace scroll en lugar de aplastar la tabla.
    <DataTable table={table} className='min-h-[22rem]'>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

function crearColumnas({
  cancelando,
  onCancelar
}: {
  cancelando: boolean;
  onCancelar: (reserva: Reserva) => void;
}): ColumnDef<DataTableFeatures, Reserva>[] {
  return [
    {
      id: 'producto',
      size: 170,
      accessorFn: (reserva) => reserva.oferta.producto,
      header: ({ column }) => <DataTableColumnHeader column={column} label='Producto' />,
      // `truncate` + `max-w`: un nombre largo no ensancha la columna (la tabla no usa ancho fijo).
      cell: ({ row }) => (
        <div className='flex max-w-[9.5rem] flex-col'>
          <span className='truncate font-medium' title={row.original.oferta.producto}>
            {row.original.oferta.producto}
          </span>
          <span className='text-muted-foreground truncate text-xs' title={row.original.oferta.sede.nombre}>
            {row.original.oferta.sede.nombre}
          </span>
        </div>
      ),
      meta: { label: 'Producto', placeholder: 'Buscar por producto…', variant: 'text' as const, icon: Icons.text },
      enableColumnFilter: true
    },
    {
      id: 'cantidad',
      size: 90,
      accessorKey: 'cantidad',
      header: ({ column }) => <DataTableColumnHeader column={column} label='Cantidad' />
    },
    {
      id: 'total',
      size: 120,
      accessorFn: (reserva) => reserva.cantidad * reserva.oferta.precioOferta,
      header: ({ column }) => <DataTableColumnHeader column={column} label='Total en sede' />,
      cell: ({ row }) => formatPrecio(row.original.cantidad * row.original.oferta.precioOferta)
    },
    {
      id: 'estado',
      size: 110,
      accessorKey: 'estado',
      header: ({ column }) => <DataTableColumnHeader column={column} label='Estado' />,
      cell: ({ row }) => <EtiquetaEstado estado={row.original.estado} />,
      enableColumnFilter: true,
      meta: { label: 'Estado', variant: 'multiSelect' as const, options: OPCIONES_ESTADO }
    },
    {
      id: 'plazoRetiro',
      size: 190,
      accessorKey: 'plazoRetiro',
      header: ({ column }) => <DataTableColumnHeader column={column} label='Plazo de retiro' />,
      cell: ({ row }) => {
        const vencido = row.original.estado === 'RESERVADA' && new Date(row.original.plazoRetiro) <= new Date();
        return (
          <div className='flex flex-col'>
            <span>{formatFechaHora(row.original.plazoRetiro)}</span>
            {vencido && <span className='text-destructive text-xs font-medium'>Plazo vencido</span>}
          </div>
        );
      }
    },
    {
      id: 'creada',
      size: 190,
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} label='Reservada el' />,
      cell: ({ row }) => formatFechaHora(row.original.createdAt)
    },
    {
      id: 'acciones',
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const reserva = row.original;
        const cancelable = reserva.estado === 'RESERVADA' && new Date(reserva.plazoRetiro) > new Date();
        if (!cancelable) return null;
        return (
          <Button type='button' variant='outline' size='sm' disabled={cancelando} onClick={() => onCancelar(reserva)}>
            Cancelar
          </Button>
        );
      }
    }
  ];
}
