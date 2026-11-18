import { ErrorNegocio } from '../../common/errores';
import { validarCuerpoReserva } from './reserva.dto';

function codigoDelError(cuerpo: unknown): string | undefined {
  try {
    validarCuerpoReserva(cuerpo);
  } catch (error) {
    return (error as ErrorNegocio).codigo;
  }
  return undefined;
}

describe('validarCuerpoReserva (forma del cuerpo de POST /reservas)', () => {
  it('acepta ofertaId y cantidad numérica', () => {
    expect(validarCuerpoReserva({ ofertaId: ' abc ', cantidad: 2 })).toEqual({ ofertaId: 'abc', cantidad: 2 });
  });

  it.each([
    ['sin cuerpo', undefined],
    ['ofertaId ausente', { cantidad: 2 }],
    ['ofertaId vacío', { ofertaId: '  ', cantidad: 2 }],
    ['ofertaId numérico', { ofertaId: 5, cantidad: 2 }],
    ['cantidad como texto', { ofertaId: 'abc', cantidad: '2' }],
    ['cantidad ausente', { ofertaId: 'abc' }],
    ['cantidad nula', { ofertaId: 'abc', cantidad: null }],
  ])('rechaza con CAMPOS_INVALIDOS: %s', (_caso, cuerpo) => {
    expect(codigoDelError(cuerpo)).toBe('CAMPOS_INVALIDOS');
  });

  it('deja pasar 0, negativa y decimal: los rechaza verificarReserva con CANTIDAD_INVALIDA', () => {
    for (const cantidad of [0, -1, 1.5]) {
      expect(codigoDelError({ ofertaId: 'abc', cantidad })).toBeUndefined();
    }
  });
});
