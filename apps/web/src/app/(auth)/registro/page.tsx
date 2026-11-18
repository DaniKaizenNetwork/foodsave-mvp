import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/RegisterForm';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function RegistroPage() {
  return (
    <AuthShell
      titulo='Crea tu cuenta'
      descripcion='Regístrate como consumidor para reservar ofertas.'
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link href='/login' className='hover:text-primary font-semibold underline underline-offset-4'>
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
