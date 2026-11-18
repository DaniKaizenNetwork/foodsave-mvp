import { OCULTO, redact } from './redact';

describe('redact (UNIT-16 · SWR-SEC-002)', () => {
  it('oculta contraseñas, hash, tokens y Authorization y conserva el resto', () => {
    // Arrange
    const entrada = {
      contrasena: 'Prueba123!',
      password: 'Prueba123!',
      passwordHash: '$2a$10$hashdeejemplo',
      accessToken: 'eyJ.token.firma',
      authorization: 'Bearer eyJ.token.firma',
      ruta: '/auth/login',
    };

    // Act
    const salida = redact(entrada);

    // Assert
    expect(salida).toEqual({
      contrasena: OCULTO,
      password: OCULTO,
      passwordHash: OCULTO,
      accessToken: OCULTO,
      authorization: OCULTO,
      ruta: '/auth/login',
    });
    expect(JSON.stringify(salida)).not.toContain('Prueba123!');
    expect(JSON.stringify(salida)).not.toContain('eyJ.token.firma');
  });

  it('oculta también los campos sensibles anidados y en arreglos, sin importar mayúsculas', () => {
    const entrada = { cuerpo: { Contrasena: 'secreta', lista: [{ Authorization: 'Bearer x' }] } };

    const salida = redact(entrada);

    expect(salida).toEqual({ cuerpo: { Contrasena: OCULTO, lista: [{ Authorization: OCULTO }] } });
  });

  it('no modifica el objeto original', () => {
    const entrada = { contrasena: 'secreta', ruta: '/x' };

    redact(entrada);

    expect(entrada.contrasena).toBe('secreta');
  });
});
