import { hashPassword, verifyPassword } from './password';

describe('hashPassword / verifyPassword (UNIT-08 · SWR-SEC-002)', () => {
  it('guarda la contraseña con hash y sal, y verifyPassword distingue la clave correcta', async () => {
    // Arrange
    const contrasena = 'Prueba123!';

    // Act
    const hash1 = await hashPassword(contrasena);
    const hash2 = await hashPassword(contrasena);
    const conClaveCorrecta = await verifyPassword(contrasena, hash1);
    const conOtraClave = await verifyPassword('OtraClave456!', hash1);

    // Assert
    expect(hash1).not.toBe(contrasena); // no es texto plano
    expect(hash1).not.toContain(contrasena);
    expect(hash1).not.toBe(hash2); // la sal hace distintos dos hashes de la misma clave
    expect(conClaveCorrecta).toBe(true);
    expect(conOtraClave).toBe(false);
  });
});
