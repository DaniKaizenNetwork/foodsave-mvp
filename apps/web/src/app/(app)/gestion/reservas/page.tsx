import PageContainer from '@/components/layout/page-container';
import { RutaProtegida } from '@/components/RutaProtegida';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reservas de la sede' };

/** Solo PERSONAL y DUENO. La tabla con «Marcar entregada» (SWR-RES-015) llega en feature/reservas-cierre-web. */
export default function ReservasSedePage() {
  return (
    <RutaProtegida roles={['PERSONAL', 'DUENO']}>
      <PageContainer
        pageTitle='Reservas de la sede'
        pageDescription='Reservas de tu sede para entregar al cliente.'
      >
        <p className='text-muted-foreground'>Las reservas de la sede se muestran aquí en la siguiente etapa.</p>
      </PageContainer>
    </RutaProtegida>
  );
}
