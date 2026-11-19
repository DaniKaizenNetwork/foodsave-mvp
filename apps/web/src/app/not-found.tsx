import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className='flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/brand/foodsave-logo-horizontal.svg' alt='FoodSave' className='h-12 w-auto dark:hidden' />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/brand/foodsave-logo-horizontal-claro.svg' alt='FoodSave' className='hidden h-12 w-auto dark:block' />
      <h1 className='text-3xl font-bold'>Página no encontrada</h1>
      <p className='text-muted-foreground max-w-sm'>
        La página que buscas no existe o fue movida.
      </p>
      <Button render={<Link href='/ofertas' />}>Ver ofertas</Button>
    </main>
  );
}
