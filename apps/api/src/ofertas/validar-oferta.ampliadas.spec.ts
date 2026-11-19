import { validarOferta } from './validar-oferta';

/**
 * Pruebas ampliadas de validarOferta (SWR-OFE-003).
 * Las marcadas como «caracterización» documentan el comportamiento ACTUAL de una limitación
 * conocida (ver comentario de validar-oferta.ts). Si algún día se corrige el código, la
 * prueba fallará y habrá que actualizarla con la nueva regla: así el cambio queda visible.
 */
describe('validarOferta · pruebas ampliadas', () => {
  it('AMP-07: un precio de oferta MAYOR al original se rechaza con PRECIO_INVALIDO', () => {
    // Arrange
    const oferta = { cantidad: 3, precioOriginal: 8000, precioOferta: 9000 };

    // Act
    const resultado = validarOferta(oferta);

    // Assert
    expect(resultado).toEqual({ valido: false, codigo: 'PRECIO_INVALIDO' });
  });

  it('AMP-08: una cantidad NaN se rechaza con CANTIDAD_INVALIDA', () => {
    const resultado = validarOferta({ cantidad: Number.NaN, precioOriginal: 8000, precioOferta: 4000 });

    expect(resultado).toEqual({ valido: false, codigo: 'CANTIDAD_INVALIDA' });
  });

  it('AMP-09 (caracterización, hallazgo): hoy ACEPTA un precio de oferta negativo', () => {
    const resultado = validarOferta({ cantidad: 1, precioOriginal: 8000, precioOferta: -100 });

    // Defecto conocido: un precio negativo no tiene sentido de negocio, pero pasa la validación.
    expect(resultado).toEqual({ valido: true });
  });

  it('AMP-10 (caracterización, hallazgo): hoy ACEPTA un precio de oferta de 0 (regalo)', () => {
    const resultado = validarOferta({ cantidad: 1, precioOriginal: 8000, precioOferta: 0 });

    // El SRS no dice si regalar un producto es válido: queda como pregunta para el SRS.
    expect(resultado).toEqual({ valido: true });
  });

  it('AMP-11 (valor límite): un descuento de 1 peso (7999 sobre 8000) es válido', () => {
    expect(validarOferta({ cantidad: 1, precioOriginal: 8000, precioOferta: 7999 })).toEqual({
      valido: true,
    });
  });
});
