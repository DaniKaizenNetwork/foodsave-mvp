import { listarOfertas } from '@/lib/api/ofertas';
import { ofertaDePrueba, renderConProveedores } from '@/test/render';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListaOfertas } from './ListaOfertas';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock('@/lib/api/ofertas', () => ({ listarOfertas: vi.fn() }));

describe('ListaOfertas (SWR-BUS-001, SWR-BUS-005)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('RTL-06: mientras la API responde muestra «Cargando ofertas…»', () => {
    // Una promesa que nunca se resuelve deja el componente en estado de carga.
    vi.mocked(listarOfertas).mockReturnValue(new Promise(() => {}));
    renderConProveedores(<ListaOfertas />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando ofertas…');
  });

  it('RTL-07: sin ofertas muestra «No hay ofertas disponibles»', async () => {
    vi.mocked(listarOfertas).mockResolvedValue([]);
    renderConProveedores(<ListaOfertas />);

    expect(await screen.findByText('No hay ofertas disponibles')).toBeInTheDocument();
  });

  it('RTL-08: con dos ofertas muestra producto, precio y unidades disponibles de cada una', async () => {
    vi.mocked(listarOfertas).mockResolvedValue([
      ofertaDePrueba({ id: 'o1', producto: 'Pan integral', precioOferta: 4000, precioOriginal: 8000, disponible: 5 }),
      ofertaDePrueba({ id: 'o2', producto: 'Tajada de torta', precioOferta: 6500, precioOriginal: 9000, disponible: 3 })
    ]);
    renderConProveedores(<ListaOfertas />);

    expect(await screen.findByText('Pan integral')).toBeInTheDocument();
    expect(screen.getByText('Tajada de torta')).toBeInTheDocument();
    // El precio lleva espacio duro entre «$» y la cifra: la expresión regular lo tolera.
    expect(screen.getByText(/\$\s?4\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?6\.500/)).toBeInTheDocument();
    expect(screen.getByText('5 disponibles')).toBeInTheDocument();
    expect(screen.getByText('3 disponibles')).toBeInTheDocument();
  });

  it('RTL-09: al buscar «pan» consulta la API con q=pan y actualiza la URL', async () => {
    const usuario = userEvent.setup();
    vi.mocked(listarOfertas).mockResolvedValue([]);
    renderConProveedores(<ListaOfertas />);

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar ofertas' }), 'pan');
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(listarOfertas).toHaveBeenCalledWith('pan'));
    expect(replace).toHaveBeenCalledWith('/ofertas?q=pan', { scroll: false });
  });
});
