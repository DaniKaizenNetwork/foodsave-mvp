import { verificarPermisoReinicio } from './seed-guard';

describe('verificarPermisoReinicio (seed protegida)', () => {
  it('permite el reinicio solo con SEED_ALLOW_RESET=true y SEED_PASSWORD', () => {
    expect(verificarPermisoReinicio({ SEED_ALLOW_RESET: 'true', SEED_PASSWORD: 'x' })).toEqual({ permitido: true });
  });

  it.each([undefined, '', 'false', 'TRUE', '1'])('bloquea el reinicio si SEED_ALLOW_RESET es %p', (valor) => {
    const permiso = verificarPermisoReinicio({ SEED_ALLOW_RESET: valor, SEED_PASSWORD: 'x' });

    expect(permiso.permitido).toBe(false);
    expect(permiso.motivo).toContain('SEED_ALLOW_RESET=true');
  });

  it('bloquea el reinicio si falta SEED_PASSWORD', () => {
    expect(verificarPermisoReinicio({ SEED_ALLOW_RESET: 'true' }).permitido).toBe(false);
  });
});
