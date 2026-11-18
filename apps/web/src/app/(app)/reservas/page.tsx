import PageContainer from '@/components/layout/page-container';
import { RutaProtegida } from '@/components/RutaProtegida';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mis reservas' };

/** Solo CONSUMIDOR. La tabla con «Cancelar» (SWR-RES-011) llega en feature/reservas-cierre-web. */
export default function MisReservasPage() {
  return (
    <RutaProtegida roles={['CONSUMIDOR']}>
      <PageContainer pageTitle='Mis reservas' pageDescription='Tus reservas y su plazo de retiro.'>
        <p className='text-muted-foreground'>Tus reservas se muestran aquí en la siguiente etapa.</p>
      </PageContainer>
    </RutaProtegida>
  );
}
