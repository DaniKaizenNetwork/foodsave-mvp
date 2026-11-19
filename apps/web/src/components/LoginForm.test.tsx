import { login } from '@/lib/api/auth';
import { ErrorApi } from '@/lib/api-client';
import { CLAVE_SESION } from '@/lib/auth/sesion-storage';
import { renderConProveedores } from '@/test/render';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

// `vi.hoisted` crea el espía ANTES de que Vitest sustituya el módulo; así el mismo `push`
// que usa el componente es el que revisamos en las comprobaciones.
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
// Se simula el enrutador de Next: en jsdom no hay navegación real, solo queremos saber a dónde iría.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
// Se simula la API: así controlamos qué responde el servidor sin red ni base de datos.
vi.mock('@/lib/api/auth', () => ({ login: vi.fn(), registrar: vi.fn() }));

describe('LoginForm (SWR-AUTH-005, SWR-AUTH-006)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('RTL-03: con credenciales válidas guarda la sesión y navega a /ofertas', async () => {
    const usuario = userEvent.setup();
    const sesion = { accessToken: 'token-falso', usuario: { id: 'u1', nombre: 'Consumidor Uno', rol: 'CONSUMIDOR' as const } };
    vi.mocked(login).mockResolvedValue(sesion);
    renderConProveedores(<LoginForm />);

    await usuario.type(screen.getByLabelText('Correo electrónico'), 'consumidor1@foodsave.test');
    await usuario.type(screen.getByLabelText('Contraseña'), 'cualquier-clave');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/ofertas'));
    expect(JSON.parse(localStorage.getItem(CLAVE_SESION) as string)).toEqual(sesion);
  });

  /**
   * RTL-04 (candidata a explicar) · SWR-AUTH-006
   * Regla: si la API rechaza las credenciales, el formulario muestra «Credenciales inválidas»
   * dentro del propio componente (role="alert"), NO navega y NO deja ninguna sesión guardada.
   */
  it('RTL-04: con credenciales inválidas muestra «Credenciales inválidas» y no navega', async () => {
    // ARRANGE (preparar) ------------------------------------------------------------------
    // Crea un «usuario virtual» que escribe y hace clic como una persona real.
    const usuario = userEvent.setup();
    // Hace que la función `login` (la llamada a POST /auth/login) falle igual que la API real:
    // con un ErrorApi de código CREDENCIALES_INVALIDAS, mensaje exacto y estado HTTP 401.
    vi.mocked(login).mockRejectedValue(new ErrorApi('CREDENCIALES_INVALIDAS', 'Credenciales inválidas', 401));
    // Dibuja el formulario dentro de los proveedores (AuthProvider + QueryClientProvider).
    renderConProveedores(<LoginForm />);

    // ACT (actuar) ------------------------------------------------------------------------
    // Escribe un correo en el campo que tiene la etiqueta «Correo electrónico».
    await usuario.type(screen.getByLabelText('Correo electrónico'), 'consumidor1@foodsave.test');
    // Escribe una clave equivocada en el campo «Contraseña» (el mock la rechazará igual).
    await usuario.type(screen.getByLabelText('Contraseña'), 'clave-equivocada');
    // Pulsa el botón «Ingresar»: esto dispara el envío del formulario y, con él, `login(...)`.
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));

    // ASSERT (comprobar) ------------------------------------------------------------------
    // `findByRole` espera (de forma asíncrona) a que aparezca un elemento con role="alert":
    // el envío es asíncrono, así que el mensaje no existe en el primer instante.
    const alerta = await screen.findByRole('alert');
    // El texto del alert debe ser exactamente el mensaje del contrato, no uno inventado.
    expect(alerta).toHaveTextContent('Credenciales inválidas');
    // No se debe haber navegado a ninguna parte: el usuario sigue en el login.
    expect(push).not.toHaveBeenCalled();
    // Y no debe haber quedado sesión guardada: `getItem` devuelve null si la clave no existe.
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });
});
