import { listarMisSedes, publicarOferta } from '@/lib/api/ofertas';
import { renderConProveedores } from '@/test/render';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OfertaForm } from './OfertaForm';

// Se simula la API de ofertas: `listarMisSedes` llena el selector y `publicarOferta` es el
// espía que nos dirá si el formulario intentó enviar algo al servidor.
vi.mock('@/lib/api/ofertas', () => ({ listarMisSedes: vi.fn(), publicarOferta: vi.fn(), listarOfertas: vi.fn() }));

describe('OfertaForm (SWR-OFE-001, SWR-OFE-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarMisSedes).mockResolvedValue([
      { id: 'sede-centro', nombre: 'Sede Centro' },
      { id: 'sede-norte', nombre: 'Sede Norte' }
    ]);
  });

  /**
   * RTL-10 (candidata a explicar) · SWR-OFE-003
   * Regla de negocio: el precio de oferta debe ser MENOR al precio original. Si es igual (o
   * mayor), el navegador lo detecta antes de enviar, muestra el mensaje y no llama a la API.
   */
  it('RTL-10: con precio de oferta igual al original muestra el error de precio y no envía', async () => {
    // ARRANGE (preparar) ------------------------------------------------------------------
    // Crea el «usuario virtual» que teclea y hace clic.
    const usuario = userEvent.setup();
    // Dibuja el formulario de publicación dentro de los proveedores que necesita.
    renderConProveedores(<OfertaForm />);

    // ACT (actuar) ------------------------------------------------------------------------
    // Escribe 8000 en «Precio original».
    await usuario.type(screen.getByLabelText('Precio original'), '8000');
    // Escribe también 8000 en «Precio de oferta»: es IGUAL, así que viola la regla (debe ser menor).
    await usuario.type(screen.getByLabelText('Precio de oferta'), '8000');
    // Escribe una cantidad válida (5) para que el único problema de precio sea el que se prueba.
    await usuario.type(screen.getByLabelText('Cantidad'), '5');
    // Pulsa «Publicar»: dispara la validación de todos los campos al enviar.
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));

    // ASSERT (comprobar) ------------------------------------------------------------------
    // El mensaje aparece tras el envío (validación asíncrona), por eso `findByText` y no `getByText`.
    // Debe ser exactamente el texto del contrato / BB-06.
    expect(await screen.findByText('El precio de oferta debe ser menor al precio original')).toBeInTheDocument();
    // Como el formulario es inválido, NUNCA debió llamar a la API de publicación.
    // (El producto, el vencimiento y la sede están vacíos y también muestran su error: da igual,
    // cada campo se valida por separado en cada envío.)
    expect(publicarOferta).not.toHaveBeenCalled();
  });
});
