import PageContainer from '@/components/layout/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ofertas' };

/** Pantalla pública. El listado y la búsqueda (SWR-BUS-001/005) llegan en feature/ofertas-web. */
export default function OfertasPage() {
  return (
    <PageContainer
      pageTitle='Ofertas'
      pageDescription='Productos próximos a vencer con descuento.'
    >
      <p className='text-muted-foreground'>El listado de ofertas se construye en la siguiente etapa.</p>
    </PageContainer>
  );
}
