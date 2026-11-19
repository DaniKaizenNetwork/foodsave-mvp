import { OCULTO, redact } from './redact';

/** Pruebas ampliadas de redact: privacidad de los logs (Shift Right). */
describe('redact · pruebas ampliadas', () => {
  it('AMP-23: oculta los campos sensibles sin importar mayúsculas (PassWord, AccessToken)', () => {
    // Arrange
    const evento = { correo: 'ana@x.co', PassWord: 'secreta', AccessToken: 'eyJ...' };

    // Act
    const limpio = redact(evento);

    // Assert
    expect(limpio).toEqual({ correo: 'ana@x.co', PassWord: OCULTO, AccessToken: OCULTO });
  });

  it('AMP-24: un objeto con referencia circular no rompe el log', () => {
    const a: Record<string, unknown> = { nombre: 'a' };
    a.yoMismo = a;

    expect(redact(a)).toEqual({ nombre: 'a', yoMismo: '[CICLO]' });
  });

  it('AMP-25: conserva las fechas como fechas', () => {
    const fecha = new Date('2026-11-17T15:00:00-05:00');

    expect(redact({ creada: fecha }).creada).toBe(fecha);
  });

  it('AMP-26 (caracterización, hallazgo): campos con otros nombres como «clave» o «refreshToken» NO se ocultan', () => {
    const limpio = redact({ clave: 'secreta', refreshToken: 'abc' });

    // La lista de campos sensibles es cerrada; un nombre nuevo filtraría el secreto al log.
    expect(limpio).toEqual({ clave: 'secreta', refreshToken: 'abc' });
  });
});
