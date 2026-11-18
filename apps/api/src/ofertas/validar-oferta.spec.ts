import { validarOferta } from './validar-oferta';

describe('validarOferta (SWR-OFE-003)', () => {
  it('UNIT-04: rechaza cantidad cero con CANTIDAD_INVALIDA', () => {
    // Arrange
    const oferta = { cantidad: 0, precioOriginal: 8000, precioOferta: 4000 };

    // Act
    const resultado = validarOferta(oferta);

    // Assert
    expect(resultado).toEqual({ valido: false, codigo: 'CANTIDAD_INVALIDA' });
  });

  it('UNIT-05: rechaza un precio de oferta igual al original con PRECIO_INVALIDO', () => {
    const resultado = validarOferta({ cantidad: 5, precioOriginal: 8000, precioOferta: 8000 });

    expect(resultado).toEqual({ valido: false, codigo: 'PRECIO_INVALIDO' });
  });

  it('UNIT-06: acepta el mínimo permitido (cantidad 1, precio de oferta 7999 < 8000)', () => {
    const resultado = validarOferta({ cantidad: 1, precioOriginal: 8000, precioOferta: 7999 });

    expect(resultado).toEqual({ valido: true });
    expect(resultado).not.toHaveProperty('codigo');
  });

  it('WB-06: rechaza una cantidad decimal (1.5) con CANTIDAD_INVALIDA', () => {
    const resultado = validarOferta({ cantidad: 1.5, precioOriginal: 8000, precioOferta: 4000 });

    expect(resultado).toEqual({ valido: false, codigo: 'CANTIDAD_INVALIDA' });
  });

  it('evalúa la cantidad antes que el precio cuando ambos fallan', () => {
    const resultado = validarOferta({ cantidad: 0, precioOriginal: 8000, precioOferta: 9000 });

    expect(resultado).toEqual({ valido: false, codigo: 'CANTIDAD_INVALIDA' });
  });

  it('rechaza una cantidad negativa (-1) con CANTIDAD_INVALIDA', () => {
    const resultado = validarOferta({ cantidad: -1, precioOriginal: 8000, precioOferta: 4000 });

    expect(resultado).toEqual({ valido: false, codigo: 'CANTIDAD_INVALIDA' });
  });
});
