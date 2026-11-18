import { ListaOfertas } from '@/components/ListaOfertas';
import { AccionPublicar } from '@/components/layout/accion-publicar';
import PageContainer from '@/components/layout/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ofertas' };

/** Pantalla pública: listado y búsqueda de ofertas activas (SWR-BUS-001 / SWR-BUS-005). */
export default async function OfertasPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const qInicial = (Array.isArray(q) ? q[0] : q) ?? '';

  return (
    <PageContainer
      pageTitle='Ofertas'
      pageDescription='Productos próximos a vencer con descuento.'
      pageHeaderAction={<AccionPublicar />}
    >
      <ListaOfertas qInicial={qInicial} />
    </PageContainer>
  );
}
