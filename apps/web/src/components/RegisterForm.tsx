'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { registrar } from '@/lib/api/auth';
import { ErrorApi } from '@/lib/api-client';
import { useAppForm } from '@/lib/form';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import * as z from 'zod';

/** Un mensaje por campo, exactos de «Datos y mensajes» (RTL-01). */
const esquema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  correo: z.string().trim().min(1, 'El correo es obligatorio'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria')
});

/**
 * SWR-AUTH-001. Registra a un consumidor con POST /auth/register. Solo se exige que los
 * tres campos no estén vacíos (no hay política de contraseña en el MVP).
 */
export function RegisterForm() {
  const [creada, setCreada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { nombre: '', correo: '', contrasena: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await registrar({
          nombre: value.nombre.trim(),
          correo: value.correo.trim(),
          contrasena: value.contrasena
        });
        setCreada(true);
      } catch (causa) {
        setError(causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado');
      }
    }
  });

  if (creada) {
    return (
      <div className='w-full space-y-4'>
        <Alert role='status'>
          <AlertTitle>Cuenta creada correctamente</AlertTitle>
          <AlertDescription>Ya puedes iniciar sesión con tu correo y tu contraseña.</AlertDescription>
        </Alert>
        <Link href='/login' className={cn(buttonVariants(), 'w-full')}>
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className='w-full space-y-4'
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
      <FieldGroup>
        <form.AppField
          name='nombre'
          children={(field) => (
            <field.TextField label='Nombre completo' autoComplete='name' placeholder='Tu nombre' />
          )}
        />
        <form.AppField
          name='correo'
          children={(field) => (
            <field.TextField
              label='Correo electrónico'
              type='email'
              autoComplete='email'
              placeholder='tucorreo@ejemplo.com'
            />
          )}
        />
        <form.AppField
          name='contrasena'
          children={(field) => (
            <field.TextField
              label='Contraseña'
              type='password'
              autoComplete='new-password'
              placeholder='Elige una contraseña'
            />
          )}
        />
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton className='w-full' loadingLabel='Creando cuenta…'>
          Registrarse
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
