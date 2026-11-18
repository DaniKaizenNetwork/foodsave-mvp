import { crearReserva, type Reserva } from '@/lib/api/reservas';
import { ErrorApi } from '@/lib/api-client';
import { ofertaDePrueba, renderConProveedores } from '@/test/render';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservaForm } from './ReservaForm';

// Se simula la API de reservas: `crearReserva` es POST /reservas.
vi.mock('@/lib/api/reservas', () => ({ crearReserva: vi.fn() }));

describe('ReservaForm (SWR-RES-001, SWR-RES-002, SWR-RES-003, SWR-RES-005)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('RTL-11: si no hay unidades suficientes (409) muestra «No hay unidades suficientes» y no confirma', async () => {
    const usuario = userEvent.setup();
    vi.mocked(crearReserva).mockRejectedValue(new ErrorApi('STOCK_INSUFICIENTE', 'No hay unidades suficientes', 409));
    renderConProveedores(<ReservaForm oferta={ofertaDePrueba()} />);

    await usuario.type(screen.getByLabelText('Cantidad'), '999');
    await usuario.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay unidades suficientes');
    expect(screen.queryByText('Reserva confirmada')).not.toBeInTheDocument();
  });

  /**
   * RTL-12 (candidata a explicar) · SWR-RES-001 / SWR-RES-005
   * Regla: mientras la reserva se envía el botón queda DESHABILITADO (evita reservar dos veces
   * con un doble clic); al terminar se muestra «Reserva confirmada» con el plazo de retiro y el
   * botón vuelve a estar habilitado.
   */
  it('RTL-12: deshabilita el botón mientras envía y luego muestra «Reserva confirmada» con el plazo', async () => {
    // ARRANGE (preparar) ------------------------------------------------------------------
    const usuario = userEvent.setup();
    // Variable que guardará la función que «resuelve» la promesa; la llamaremos a mano más abajo.
    let resolverReserva!: (reserva: Reserva) => void;
    // `crearReserva` devuelve una promesa que NO se resuelve sola: nosotros decidimos cuándo
    // «responde el servidor». Así podemos observar el estado intermedio de «enviando».
    vi.mocked(crearReserva).mockReturnValue(new Promise<Reserva>((resolver) => (resolverReserva = resolver)));
    // Dibuja el formulario con una oferta de prueba (Pan integral, Sede Centro, 5 disponibles).
    renderConProveedores(<ReservaForm oferta={ofertaDePrueba()} />);

    // ACT 1 (actuar: enviar) --------------------------------------------------------------
    // Escribe la cantidad 2 en el campo «Cantidad».
    await usuario.type(screen.getByLabelText('Cantidad'), '2');
    // Pulsa «Reservar»: se llama a `crearReserva`, pero la promesa sigue pendiente.
    await usuario.click(screen.getByRole('button', { name: 'Reservar' }));

    // ASSERT 1 (comprobar el estado «enviando») ------------------------------------------
    // Con la respuesta pendiente, el botón debe estar deshabilitado.
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled();
    // Y todavía no debe existir el mensaje de confirmación.
    expect(screen.queryByText('Reserva confirmada')).not.toBeInTheDocument();

    // ACT 2 (actuar: el servidor responde) -------------------------------------------------
    // `act` avisa a React de que se va a actualizar el estado fuera de una interacción de usuario.
    await act(async () => {
      // «El servidor» responde 201 con la reserva creada y su plazo de retiro (ISO 8601).
      resolverReserva({
        id: 'reserva-1',
        ofertaId: 'oferta-1',
        oferta: { id: 'oferta-1', producto: 'Pan integral', precioOferta: 4000, sede: { id: 'sede-centro', nombre: 'Sede Centro' } },
        cantidad: 2,
        estado: 'RESERVADA',
        plazoRetiro: '2026-11-18T23:00:00.000Z',
        createdAt: '2026-11-18T11:00:00.000Z'
      });
    });

    // ASSERT 2 (comprobar el resultado final) ---------------------------------------------
    // Busca el título de la confirmación y sube hasta el contenedor con role="status".
    // OJO: hay DOS role="status" en el formulario (este y el texto oculto del botón de carga),
    // por eso se localiza por su texto y no con `getByRole('status')` a secas.
    const confirmacion = (await screen.findByText('Reserva confirmada')).closest('[role="status"]');
    expect(confirmacion).toBeInTheDocument();
    // La confirmación debe informar el plazo de retiro.
    expect(confirmacion).toHaveTextContent('Plazo de retiro:');
    // Terminó el envío: el botón vuelve a estar habilitado.
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeEnabled();
  });
});
