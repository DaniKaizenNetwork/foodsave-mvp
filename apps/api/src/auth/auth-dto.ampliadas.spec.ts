import { ErrorNegocio } from '../common/errores';
import { normalizarCorreo, validarLogin, validarRegistro } from './dto/auth.dto';

/**
 * Pruebas ampliadas de la validación de entrada de autenticación (SWR-AUTH-001, SWR-AUTH-005).
 */
describe('auth.dto · pruebas ampliadas', () => {
  it('AMP-17: normaliza el correo quitando espacios y pasando a minúsculas', () => {
    // Arrange
    const correo = '  Ana.Perez@FoodSave.TEST  ';

    // Act
    const normalizado = normalizarCorreo(correo);

    // Assert
    expect(normalizado).toBe('ana.perez@foodsave.test');
  });

  it('AMP-18: el login también normaliza el correo, así «ANA@x.co» y «ana@x.co» son la misma cuenta', () => {
    const datos = validarLogin({ correo: 'ANA@x.co', contrasena: 'Clave123!' });

    expect(datos.correo).toBe('ana@x.co');
  });

  it('AMP-19: la contraseña NO se recorta (los espacios son parte de la clave)', () => {
    const datos = validarRegistro({ nombre: 'Ana', correo: 'ana@x.co', contrasena: ' clave ' });

    expect(datos.contrasena).toBe(' clave ');
  });

  it.each([
    ['nombre solo con espacios', { nombre: '   ', correo: 'ana@x.co', contrasena: 'x' }],
    ['correo vacío', { nombre: 'Ana', correo: '', contrasena: 'x' }],
    ['contraseña numérica en vez de texto', { nombre: 'Ana', correo: 'ana@x.co', contrasena: 123 }],
    ['cuerpo vacío', undefined],
  ])('AMP-20: rechaza %s con CAMPOS_INVALIDOS', (_caso, cuerpo) => {
    expect(() => validarRegistro(cuerpo)).toThrow(ErrorNegocio);
  });

  it('AMP-21 (caracterización, hallazgo): hoy acepta una contraseña de 1 carácter', () => {
    // No hay política de contraseña: solo se exige que no esté vacía.
    const datos = validarRegistro({ nombre: 'Ana', correo: 'ana@x.co', contrasena: 'a' });

    expect(datos.contrasena).toBe('a');
  });

  it('AMP-22 (caracterización, hallazgo): hoy acepta un correo sin «@»', () => {
    const datos = validarRegistro({ nombre: 'Ana', correo: 'no-es-un-correo', contrasena: 'x' });

    expect(datos.correo).toBe('no-es-un-correo');
  });
});
