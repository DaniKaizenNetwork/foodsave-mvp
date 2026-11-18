import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/LoginForm';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;

  return (
    <AuthShell
      titulo='Iniciar sesión'
      descripcion='Ingresa con tu correo y tu contraseña.'
      pie={
        <>
          ¿No tienes cuenta?{' '}
          <Link href='/registro' className='hover:text-primary font-semibold underline underline-offset-4'>
            Regístrate
          </Link>
        </>
      }
    >
      <LoginForm aviso={aviso} />
    </AuthShell>
  );
}
