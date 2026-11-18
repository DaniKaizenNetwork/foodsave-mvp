import { ErrorNegocio } from '../../common/errores';
import { validarCuerpoOferta } from './oferta.dto';

const valido = {
  producto: ' Pan integral ',
  precioOriginal: 8000,
  precioOferta: 4000,
  cantidad: 5,
  vencimiento: '2030-01-01T12:00:00.000Z',
  sedeId: 'sede-1',
};

function codigoDelError(cuerpo: unknown): string | undefined {
  try {
    validarCuerpoOferta(cuerpo);
  } catch (error) {
    return (error as ErrorNegocio).codigo;
  }
  return undefined;
}

describe('validarCuerpoOferta (forma del cuerpo de POST /ofertas)', () => {
  it('acepta un cuerpo completo, recorta el producto y convierte el vencimiento a fecha', () => {
    const dto = validarCuerpoOferta(valido);

    expect(dto.producto).toBe('Pan integral');
    expect(dto.vencimiento).toEqual(new Date('2030-01-01T12:00:00.000Z'));
  });

  it.each([
    ['producto vacío', { ...valido, producto: '  ' }],
    ['sedeId ausente', { ...valido, sedeId: undefined }],
    ['cantidad como texto', { ...valido, cantidad: '5' }],
    ['precioOferta como texto', { ...valido, precioOferta: '4000' }],
    ['precioOriginal nulo', { ...valido, precioOriginal: null }],
    ['vencimiento ausente', { ...valido, vencimiento: undefined }],
    ['vencimiento no es una fecha', { ...valido, vencimiento: 'mañana' }],
    ['precio decimal (no cabe en la columna entera)', { ...valido, precioOferta: 3999.5 }],
    ['precio fuera del rango de la columna', { ...valido, precioOriginal: 3_000_000_000 }],
    ['cuerpo vacío', undefined],
  ])('rechaza con CAMPOS_INVALIDOS: %s', (_caso, cuerpo) => {
    expect(codigoDelError(cuerpo)).toBe('CAMPOS_INVALIDOS');
  });

  it('deja pasar cantidad cero, negativa o decimal y precios negativos: lo decide validarOferta / limitación conocida', () => {
    expect(codigoDelError({ ...valido, cantidad: 0 })).toBeUndefined();
    expect(codigoDelError({ ...valido, cantidad: -1 })).toBeUndefined();
    expect(codigoDelError({ ...valido, cantidad: 1.5 })).toBeUndefined();
    expect(codigoDelError({ ...valido, precioOferta: -100 })).toBeUndefined();
  });

  it('acepta un vencimiento pasado (Decisión #6: no se valida que sea futuro)', () => {
    expect(codigoDelError({ ...valido, vencimiento: '2000-01-01T00:00:00.000Z' })).toBeUndefined();
  });
});
