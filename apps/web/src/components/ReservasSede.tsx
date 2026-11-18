'use client';

import { Icons } from '@/components/icons';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { AvisoDeReserva, EtiquetaEstado, OPCIONES_ESTADO, type AvisoReserva } from '@/components/reservas/comunes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { listarMisSedes } from '@/lib/api/ofertas';
import { entregarReserva, listarReservasDeSede, type ReservaDeSede } from '@/lib/api/reservas';
import { ErrorApi } from '@/lib/api-client';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { formatFechaHora, formatPrecio } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

export const MENSAJE_CARGANDO_RESERVAS_SEDE = 'Cargando reservas…';
/** Mensaje exacto de «Datos y mensajes». */
export const MENSAJE_RESERVA_ENTREGADA = 'Reserva marcada como entregada';

/**
 * SWR-RES-015. Reservas de las sedes del usuario (PERSONAL: la suya; DUENO: las de su
 * comercio) con el botón «Marcar entregada». Se pide la lista completa y se filtra en la
 * tabla por estado y, si hay varias sedes, por sede.
 */
export function ReservasSede() {
  const queryClient = useQueryClient();
  const [aviso, setAviso] = useState<AvisoReserva | null>(null);

  const reservas = useQuery({
    queryKey: ['reservas', 'sede'],
    queryFn: () => listarReservasDeSede(),
    staleTime: 5_000
  });

  const entregar = useMutation({
    mutationFn: (reserva: ReservaDeSede) => entregarReserva(reserva.id),
    onSuccess: (entregada) => {
      setAviso({
        tipo: 'exito',
        titulo: MENSAJE_RESERVA_ENTREGADA,
        detalle: `${entregada.cantidad} × ${entregada.oferta.producto} para ${entregada.consumidor.nombre}.`
      });
    },
    onError: (causa) => {
      setAviso({
        tipo: 'error',
        mensaje: causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado'
      });
    },
    // Éxito o error: otra persona pudo cambiar la reserva (p. ej. cancelarla) mientras tanto.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['reservas'] });
    }
  });

  // La columna «Sede» solo tiene sentido si el usuario opera en varias sedes (el dueño con dos
  // sedes); al personal, con una sola, no le aporta nada y ocupa un ancho que hace falta.
  const sedes = useQuery({ queryKey: ['sedes', 'mias'], queryFn: listarMisSedes, staleTime: 60_000 });
  const nombresDeSede = useMemo(
    () => [
      ...new Set([
        ...(sedes.data ?? []).map((sede) => sede.nombre),
        ...(reservas.data ?? []).map((reserva) => reserva.oferta.sede.nombre)
      ])
    ],
    [sedes.data, reservas.data]
  );
  const variasSedes = nombresDeSede.length > 1;
  const opcionesSede = useMemo(
    () => nombresDeSede.map((nombre) => ({ value: nombre, label: nombre })),
    [nombresDeSede]
  );
  const columnas = useMemo(
    () =>
      crearColumnas({
        entregando: entregar.isPending,
        onEntregar: (r) => entregar.mutate(r),
        variasSedes,
        opcionesSede
      }),
    [entregar, variasSedes, opcionesSede]
  );

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <AvisoDeReserva aviso={aviso} />

      {reservas.isPending && (
        <>
          <p role='status' className='text-muted-foreground text-sm'>
            {MENSAJE_CARGANDO_RESERVAS_SEDE}
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
              <Icons.store aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No hay reservas en tu sede</EmptyTitle>
            <EmptyDescription>Cuando un consumidor reserve una oferta, aparecerá aquí para entregarla.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {reservas.isSuccess && reservas.data.length > 0 && (
        <TablaReservasSede datos={reservas.data} columnas={columnas} />
      )}
    </div>
  );
}

function TablaReservasSede({
  datos,
  columnas
}: {
  datos: ReservaDeSede[];
  columnas: ColumnDef<DataTableFeatures, ReservaDeSede>[];
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
  entregando,
  onEntregar,
  variasSedes,
  opcionesSede
}: {
  entregando: boolean;
  onEntregar: (reserva: ReservaDeSede) => void;
  variasSedes: boolean;
  opcionesSede: { value: string; label: string }[];
}): ColumnDef<DataTableFeatures, ReservaDeSede>[] {
  return [
    {
      id: 'producto',
      size: 150,
      accessorFn: (reserva) => reserva.oferta.producto,
      header: ({ column }) => <DataTableColumnHeader column={column} label='Producto' />,
      // `truncate` + `max-w`: un nombre largo no ensancha la columna (la tabla no usa ancho fijo).
      cell: ({ row }) => (
        <span className='block max-w-[8.25rem] truncate font-medium' title={row.original.oferta.producto}>
          {row.original.oferta.producto}
        </span>
      ),
      meta: { label: 'Producto', placeholder: 'Buscar por producto…', variant: 'text' as const, icon: Icons.text },
      enableColumnFilter: true
    },
    {
      id: 'consumidor',
      size: 140,
      accessorFn: (reserva) => reserva.consumidor.nombre,
      header: ({ column }) => <DataTableColumnHeader column={column} label='Consumidor' />,
      cell: ({ row }) => (
        <span className='block max-w-[7.5rem] truncate' title={row.original.consumidor.nombre}>
          {row.original.consumidor.nombre}
        </span>
      )
    },
    ...(variasSedes ? [{
      id: 'sede',
      accessorFn: (reserva) => reserva.oferta.sede.nombre,
      header: ({ column }) => <DataTableColumnHeader column={column} label='Sede' />,
      size: 110,
      enableColumnFilter: true,
      meta: { label: 'Sede', variant: 'multiSelect' as const, options: opcionesSede }
    } satisfies ColumnDef<DataTableFeatures, ReservaDeSede>] : []),
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
      header: ({ column }) => <DataTableColumnHeader column={column} label='Total a cobrar' />,
      cell: ({ row }) => formatPrecio(row.original.cantidad * row.original.oferta.precioOferta)
    },
    {
      id: 'estado',
      size: 100,
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
      id: 'acciones',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.estado !== 'RESERVADA') return null;
        return (
          <Button type='button' size='sm' disabled={entregando} onClick={() => onEntregar(row.original)}>
            Marcar entregada
          </Button>
        );
      }
    }
  ];
}
