'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import type { Oferta } from '@/lib/api/ofertas';
import { crearReserva, type Reserva } from '@/lib/api/reservas';
import { ErrorApi } from '@/lib/api-client';
import { formatFechaHora, formatPrecio } from '@/lib/format';
import { useAppForm } from '@/lib/form';
import { MENSAJE_CANTIDAD } from '@/lib/ofertas/validar-formulario';
import { useState } from 'react';

/**
 * SWR-RES-001 / SWR-RES-002 / SWR-RES-003 / SWR-RES-005. Reserva una cantidad de una oferta
 * (solo CONSUMIDOR; el botón que lo abre ya lo comprueba). La reserva queda «Reservada» sin
 * confirmación del comercio; el pago y la recogida son en la sede antes del plazo de retiro.
 *
 * La cantidad no se compara con el stock en el navegador: eso lo decide la API (409
 * «No hay unidades suficientes»), que es quien ve el inventario real.
 */
export function ReservaForm({
  oferta,
  disponible = oferta.disponible,
  onReservada
}: {
  oferta: Oferta;
  /** Unidades que quedan (puede ser menor que `oferta.disponible` si ya se reservó en esta sesión). */
  disponible?: number;
  onReservada?: (reserva: Reserva) => void;
}) {
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { cantidad: undefined as number | undefined },
    canSubmitWhenInvalid: true,
    onSubmit: async ({ value }) => {
      setError(null);
      setReserva(null);
      try {
        const creada = await crearReserva({ ofertaId: oferta.id, cantidad: value.cantidad as number });
        setReserva(creada);
        onReservada?.(creada);
      } catch (causa) {
        setError(causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado');
      }
    }
  });

  return (
    <form
      noValidate
      className='flex flex-col gap-4'
      onSubmit={(evento) => {
        evento.preventDefault();
        form.handleSubmit();
      }}
    >
      <dl className='bg-muted/50 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg p-3 text-sm'>
        <dt className='text-muted-foreground'>Sede</dt>
        <dd className='font-semibold'>{oferta.sede.nombre}</dd>
        <dt className='text-muted-foreground'>Precio por unidad</dt>
        <dd className='font-semibold'>{formatPrecio(oferta.precioOferta)}</dd>
        <dt className='text-muted-foreground'>Disponibles</dt>
        <dd className='font-semibold'>{disponible}</dd>
      </dl>

      {reserva && (
        <Alert role='status'>
          <AlertTitle>Reserva confirmada</AlertTitle>
          <AlertDescription>
            {reserva.cantidad} × {reserva.oferta.producto} en {reserva.oferta.sede.nombre}.{' '}
            <strong>Plazo de retiro: {formatFechaHora(reserva.plazoRetiro)}</strong>. Paga y recoge
            en la sede antes de ese plazo.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant='destructive' role='alert'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <form.AppField
          name='cantidad'
          validators={{
            onSubmit: ({ value }) =>
              value === undefined || !Number.isInteger(value) || value <= 0
                ? { message: MENSAJE_CANTIDAD }
                : undefined
          }}
          children={(field) => (
            <field.TextField
              label='Cantidad'
              type='number'
              inputMode='numeric'
              placeholder='1'
              description='Unidades que quieres reservar'
            />
          )}
        />
      </FieldGroup>

      <form.Subscribe selector={(estado) => estado.values.cantidad}>
        {(cantidad) =>
          typeof cantidad === 'number' && Number.isInteger(cantidad) && cantidad > 0 ? (
            <p className='text-muted-foreground text-sm'>
              Total a pagar en la sede:{' '}
              <span className='text-foreground font-semibold'>
                {formatPrecio(cantidad * oferta.precioOferta)}
              </span>
            </p>
          ) : null
        }
      </form.Subscribe>

      <form.AppForm>
        <form.SubmitButton className='w-full' loadingLabel='Reservando…'>
          Reservar
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
