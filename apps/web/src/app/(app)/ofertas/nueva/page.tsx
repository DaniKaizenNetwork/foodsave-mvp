import PageContainer from '@/components/layout/page-container';
import { RutaProtegida } from '@/components/RutaProtegida';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Publicar oferta' };

/** Solo DUENO y PERSONAL. El formulario (SWR-OFE-001/003) llega en feature/ofertas-web. */
export default function NuevaOfertaPage() {
  return (
    <RutaProtegida roles={['DUENO', 'PERSONAL']}>
      <PageContainer
        pageTitle='Publicar oferta'
        pageDescription='Publica un producto próximo a vencer en tu sede.'
      >
        <p className='text-muted-foreground'>El formulario de publicación se construye en la siguiente etapa.</p>
      </PageContainer>
    </RutaProtegida>
  );
}
