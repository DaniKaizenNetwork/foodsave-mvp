import PageContainer from '@/components/layout/page-container';
import { MisReservas } from '@/components/MisReservas';
import { RutaProtegida } from '@/components/RutaProtegida';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mis reservas' };

/** Solo CONSUMIDOR (SWR-RES-011): sus reservas con «Cancelar». */
export default function MisReservasPage() {
  return (
    <RutaProtegida roles={['CONSUMIDOR']}>
      <PageContainer pageTitle='Mis reservas' pageDescription='Tus reservas y su plazo de retiro.'>
        <MisReservas />
      </PageContainer>
    </RutaProtegida>
  );
}
