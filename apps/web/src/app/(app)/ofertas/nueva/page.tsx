import { OfertaForm } from '@/components/OfertaForm';
import PageContainer from '@/components/layout/page-container';
import { RutaProtegida } from '@/components/RutaProtegida';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Publicar oferta' };

/** Solo DUENO y PERSONAL (SWR-OFE-001 / SWR-OFE-003 / SWR-AUTH-010). */
export default function NuevaOfertaPage() {
  return (
    <RutaProtegida roles={['DUENO', 'PERSONAL']}>
      <PageContainer
        pageTitle='Publicar oferta'
        pageDescription='Publica un producto próximo a vencer en tu sede.'
      >
        <OfertaForm />
      </PageContainer>
    </RutaProtegida>
  );
}
