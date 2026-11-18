import { registrar } from '@/lib/api/auth';
import { renderConProveedores } from '@/test/render';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

// Se simula solo la llamada a la API: el formulario es lo que se prueba.
vi.mock('@/lib/api/auth', () => ({ registrar: vi.fn(), login: vi.fn() }));

describe('RegisterForm (SWR-AUTH-001)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('RTL-01: con los campos vacíos muestra los tres mensajes obligatorios y no llama a la API', async () => {
    const usuario = userEvent.setup();
    renderConProveedores(<RegisterForm />);

    await usuario.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('RTL-02: con datos válidos registra a la persona y muestra «Cuenta creada correctamente»', async () => {
    const usuario = userEvent.setup();
    vi.mocked(registrar).mockResolvedValue({ id: 'u1', nombre: 'Ana Pérez', correo: 'ana@foodsave.test', rol: 'CONSUMIDOR' });
    renderConProveedores(<RegisterForm />);

    await usuario.type(screen.getByLabelText('Nombre completo'), '  Ana Pérez ');
    await usuario.type(screen.getByLabelText('Correo electrónico'), 'ana@foodsave.test');
    await usuario.type(screen.getByLabelText('Contraseña'), 'una-clave');
    await usuario.click(screen.getByRole('button', { name: 'Registrarse' }));

    const titulo = await screen.findByText('Cuenta creada correctamente');
    expect(titulo.closest('[role="status"]')).toBeInTheDocument();
    // El nombre se recorta antes de enviarlo.
    expect(registrar).toHaveBeenCalledWith({ nombre: 'Ana Pérez', correo: 'ana@foodsave.test', contrasena: 'una-clave' });
  });
});
