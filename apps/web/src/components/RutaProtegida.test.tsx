import { renderConProveedores, CONSUMIDOR } from '@/test/render';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RutaProtegida } from './RutaProtegida';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

describe('RutaProtegida (SWR-AUTH-010, lado cliente)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('RTL-05: un CONSUMIDOR en una ruta de DUENO/PERSONAL ve «No tienes permiso…» y no ve el contenido', async () => {
    renderConProveedores(
      <RutaProtegida roles={['DUENO', 'PERSONAL']}>
        <p>Contenido solo para el comercio</p>
      </RutaProtegida>,
      { usuario: CONSUMIDOR }
    );

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('No tienes permiso para realizar esta acción');
    expect(screen.queryByText('Contenido solo para el comercio')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
