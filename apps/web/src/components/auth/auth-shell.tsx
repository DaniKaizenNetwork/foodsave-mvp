import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { InteractiveGridPattern } from './interactive-grid';

/**
 * Pantalla dividida de las páginas de acceso (estructura de sign-in-view de la plantilla):
 * panel de marca a la izquierda (sidebar verde bosque) y el formulario a la derecha.
 */
export function AuthShell({
  titulo,
  descripcion,
  children,
  pie
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
  pie: ReactNode;
}) {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='bg-sidebar absolute inset-0' />
        <Link href='/ofertas' className='relative z-20 flex items-center' aria-label='FoodSave, ir a las ofertas'>
          <img src='/brand/foodsave-logo-horizontal-claro.svg' alt='FoodSave' className='h-12 w-auto' />
        </Link>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <p className='font-heading text-3xl leading-tight font-semibold text-balance'>
            Productos próximos a vencer, con descuento.
          </p>
          <p className='text-sidebar-foreground/80 mt-3 max-w-md text-lg text-pretty'>
            Publica y reserva ofertas. Paga y recoge en la sede.
          </p>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <Link href='/ofertas' className='lg:hidden' aria-label='FoodSave, ir a las ofertas'>
            <img src='/brand/foodsave-logo-horizontal.svg' alt='FoodSave' className='h-12 w-auto dark:hidden' />
            <img src='/brand/foodsave-logo-horizontal-claro.svg' alt='FoodSave' className='hidden h-12 w-auto dark:block' />
          </Link>
          <div className='w-full space-y-1 text-center'>
            <h1 className='font-heading text-2xl font-semibold tracking-tight'>{titulo}</h1>
            <p className='text-muted-foreground text-sm'>{descripcion}</p>
          </div>
          {children}
          <p className='text-muted-foreground text-center text-sm'>{pie}</p>
        </div>
      </div>
    </div>
  );
}
