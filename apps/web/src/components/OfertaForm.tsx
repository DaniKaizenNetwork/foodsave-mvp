'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { listarMisSedes, publicarOferta, type Oferta } from '@/lib/api/ofertas';
import { ErrorApi } from '@/lib/api-client';
import { useAppForm } from '@/lib/form';
import { validarFormularioOferta, type ValoresOferta } from '@/lib/ofertas/validar-formulario';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Validador de un campo para cada envío. Se valida por campo (y no con un validador del
 * formulario) porque así el error de una regla entre campos —el precio de oferta contra el
 * original— se recalcula en cada envío aunque el usuario haya corregido el otro campo.
 */
function validarCampo(campo: keyof ValoresOferta) {
  return ({ fieldApi }: { fieldApi: { form: { state: { values: ValoresOferta } } } }) => {
    const mensaje = validarFormularioOferta(fieldApi.form.state.values)[campo];
    return mensaje ? { message: mensaje } : undefined;
  };
}

const VALORES_INICIALES: ValoresOferta = {
  producto: '',
  precioOriginal: undefined,
  precioOferta: undefined,
  cantidad: undefined,
  vencimiento: '',
  sedeId: ''
};

/**
 * SWR-OFE-001 / SWR-OFE-003. Formulario de publicación (solo DUENO y PERSONAL; la ruta va
 * dentro de RutaProtegida). Valida en el navegador las mismas reglas que la API y muestra
 * «Oferta publicada» dentro del componente.
 */
export function OfertaForm() {
  const [publicada, setPublicada] = useState<Oferta | null>(null);

  if (publicada) {
    return (
      <div className='flex max-w-2xl flex-col gap-4'>
        <Alert role='status'>
          <AlertTitle>Oferta publicada</AlertTitle>
          <AlertDescription>
            «{publicada.producto}» ya aparece en el listado de ofertas de {publicada.sede.nombre}.
          </AlertDescription>
        </Alert>
        <div className='flex flex-wrap gap-2'>
          <Link href='/ofertas' className={cn(buttonVariants())}>
            Ver ofertas
          </Link>
          <Button type='button' variant='outline' onClick={() => setPublicada(null)}>
            Publicar otra oferta
          </Button>
        </div>
      </div>
    );
  }

  return <FormularioPublicar onPublicada={setPublicada} />;
}

function FormularioPublicar({ onPublicada }: { onPublicada: (oferta: Oferta) => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const sedes = useQuery({ queryKey: ['sedes', 'mias'], queryFn: listarMisSedes });

  const form = useAppForm({
    defaultValues: VALORES_INICIALES,
    // Cada pulsación de «Publicar» vuelve a validar todos los campos (ver `validarCampo`).
    canSubmitWhenInvalid: true,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const oferta = await publicarOferta({
          producto: value.producto.trim(),
          precioOriginal: value.precioOriginal as number,
          precioOferta: value.precioOferta as number,
          cantidad: value.cantidad as number,
          // El campo es hora local (Colombia); se envía como instante ISO 8601.
          vencimiento: new Date(value.vencimiento).toISOString(),
          sedeId: value.sedeId
        });
        await queryClient.invalidateQueries({ queryKey: ['ofertas'] });
        onPublicada(oferta);
      } catch (causa) {
        setError(causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado');
      }
    }
  });

  // Si el usuario solo tiene una sede, queda elegida.
  const unicaSede = sedes.data?.length === 1 ? sedes.data[0].id : null;
  useEffect(() => {
    if (unicaSede && !form.getFieldValue('sedeId')) form.setFieldValue('sedeId', unicaSede);
  }, [unicaSede, form]);

  const opcionesSede = (sedes.data ?? []).map((sede) => ({ value: sede.id, label: sede.nombre }));

  return (
    <Card className='max-w-2xl'>
      <CardContent>
        <form
          noValidate
          className='flex flex-col gap-5'
          onSubmit={(evento) => {
            evento.preventDefault();
            form.handleSubmit();
          }}
        >
          {error && (
            <Alert variant='destructive' role='alert'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {sedes.isError && (
            <Alert variant='destructive' role='alert'>
              <AlertDescription>{sedes.error.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <form.AppField
              name='producto'
              validators={{ onSubmit: validarCampo('producto') }}
              children={(field) => (
                <field.TextField label='Producto' placeholder='Ej.: Pan integral' />
              )}
            />
            <div className='grid gap-5 sm:grid-cols-2'>
              <form.AppField
                name='precioOriginal'
              validators={{ onSubmit: validarCampo('precioOriginal') }}
                children={(field) => (
                  <field.TextField
                    label='Precio original'
                    type='number'
                    inputMode='numeric'
                    placeholder='8000'
                    description='En pesos colombianos'
                  />
                )}
              />
              <form.AppField
                name='precioOferta'
              validators={{ onSubmit: validarCampo('precioOferta') }}
                children={(field) => (
                  <field.TextField
                    label='Precio de oferta'
                    type='number'
                    inputMode='numeric'
                    placeholder='4000'
                    description='Debe ser menor al precio original'
                  />
                )}
              />
            </div>
            <div className='grid gap-5 sm:grid-cols-2'>
              <form.AppField
                name='cantidad'
              validators={{ onSubmit: validarCampo('cantidad') }}
                children={(field) => (
                  <field.TextField
                    label='Cantidad'
                    type='number'
                    inputMode='numeric'
                    placeholder='5'
                    description='Unidades disponibles'
                  />
                )}
              />
              <form.AppField
                name='vencimiento'
              validators={{ onSubmit: validarCampo('vencimiento') }}
                children={(field) => (
                  <field.TextField
                    label='Vencimiento'
                    type='datetime-local'
                    description='Fecha y hora en que vence el producto'
                  />
                )}
              />
            </div>
            <form.AppField
              name='sedeId'
              validators={{ onSubmit: validarCampo('sedeId') }}
              children={(field) => (
                <field.SelectField
                  label='Sede'
                  placeholder={sedes.isPending ? 'Cargando sedes…' : 'Elige la sede'}
                  options={opcionesSede}
                />
              )}
            />
          </FieldGroup>
          <form.AppForm>
            <form.SubmitButton className='self-start' loadingLabel='Publicando…'>
              Publicar
            </form.SubmitButton>
          </form.AppForm>
        </form>
      </CardContent>
    </Card>
  );
}
