import PageContainer from '@/components/layout/page-container';
import { ReservasSede } from '@/components/ReservasSede';
import { RutaProtegida } from '@/components/RutaProtegida';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reservas de la sede' };

/** Solo PERSONAL y DUENO (SWR-RES-015): reservas de su sede con «Marcar entregada». */
export default function ReservasSedePage() {
  return (
    <RutaProtegida roles={['PERSONAL', 'DUENO']}>
      <PageContainer
        pageTitle='Reservas de la sede'
        pageDescription='Reservas de tu sede para entregar al cliente.'
      >
        <ReservasSede />
      </PageContainer>
    </RutaProtegida>
  );
}
