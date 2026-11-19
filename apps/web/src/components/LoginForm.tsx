'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { ErrorApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppForm } from '@/lib/form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import * as z from 'zod';
import { AVISO_SIN_SESION } from './RutaProtegida';

/** Mensajes exactos de «Datos y mensajes». */
const esquema = z.object({
  correo: z.string().min(1, 'El correo es obligatorio'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria')
});

/**
 * SWR-AUTH-005 / SWR-AUTH-006. Inicia sesión contra POST /auth/login y navega a /ofertas.
 * `aviso` llega de la URL (`/login?aviso=sesion`) cuando una ruta protegida redirigió aquí.
 */
export function LoginForm({ aviso }: { aviso?: string }) {
  const { iniciarSesion } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { correo: '', contrasena: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await iniciarSesion(value.correo.trim(), value.contrasena);
        router.push('/ofertas');
      } catch (causa) {
        setError(causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado');
      }
    }
  });

  return (
    <form
      noValidate
      className='w-full space-y-4'
      onSubmit={(evento) => {
        evento.preventDefault();
        form.handleSubmit();
      }}
    >
      {aviso === AVISO_SIN_SESION && !error && (
        <Alert role='status'>
          <AlertDescription>Debes iniciar sesión</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant='destructive' role='alert'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
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
              autoComplete='current-password'
              placeholder='Tu contraseña'
            />
          )}
        />
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton className='w-full' loadingLabel='Ingresando…'>
          Ingresar
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
