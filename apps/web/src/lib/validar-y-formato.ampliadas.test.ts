import { describe, expect, it } from 'vitest';
import { formatPrecio } from './format';
import {
  MENSAJE_CANTIDAD,
  MENSAJE_PRECIO,
  validarFormularioOferta,
  type ValoresOferta
} from './ofertas/validar-formulario';

/**
 * Pruebas ampliadas del frontend (Vitest): validación del formulario de ofertas (SWR-OFE-003),
 * que debe coincidir con la regla de la API, y formato de precios en pesos (SWR-BUS-001).
 */
const valido: ValoresOferta = {
  producto: 'Pan integral',
  precioOriginal: 8000,
  precioOferta: 4000,
  cantidad: 5,
  vencimiento: '2026-11-20T18:00',
  sedeId: 'sede-1'
};

describe('validarFormularioOferta · pruebas ampliadas', () => {
  it('AMP-27: un formulario completo y correcto no tiene errores', () => {
    // Act
    const errores = validarFormularioOferta(valido);

    // Assert
    expect(errores).toEqual({});
  });

  it('AMP-28: misma regla que la API: precio de oferta igual al original se rechaza', () => {
    const errores = validarFormularioOferta({ ...valido, precioOferta: 8000 });

    expect(errores.precioOferta).toBe(MENSAJE_PRECIO);
  });

  it('AMP-29: un precio con decimales (en pesos) se rechaza', () => {
    const errores = validarFormularioOferta({ ...valido, precioOferta: 3999.5 });

    expect(errores.precioOferta).toBe('El precio debe ser un número entero, en pesos');
  });

  it.each([0, -1, 2.5, undefined])('AMP-30: la cantidad %s se rechaza', (cantidad) => {
    const errores = validarFormularioOferta({ ...valido, cantidad });

    expect(errores.cantidad).toBe(MENSAJE_CANTIDAD);
  });

  it('AMP-31: un producto solo con espacios cuenta como vacío', () => {
    const errores = validarFormularioOferta({ ...valido, producto: '   ' });

    expect(errores.producto).toBe('El producto es obligatorio');
  });

  it('AMP-32: un vencimiento con texto inválido se marca como obligatorio', () => {
    const errores = validarFormularioOferta({ ...valido, vencimiento: 'mañana' });

    expect(errores.vencimiento).toBe('El vencimiento es obligatorio');
  });

  it('AMP-33 (caracterización, hallazgo): igual que la API, acepta un precio de oferta negativo', () => {
    const errores = validarFormularioOferta({ ...valido, precioOferta: -100 });

    expect(errores.precioOferta).toBeUndefined();
  });
});

describe('formatPrecio · pruebas ampliadas', () => {
  it('AMP-34: muestra pesos colombianos sin decimales y con punto de miles', () => {
    const texto = formatPrecio(4000).replace(/\s/g, ' ');

    expect(texto).toMatch(/^\$ ?4\.000$/);
  });

  it('AMP-35: redondea los decimales (no se muestran centavos)', () => {
    const texto = formatPrecio(3999.6).replace(/\s/g, ' ');

    expect(texto).toMatch(/^\$ ?4\.000$/);
  });
});
