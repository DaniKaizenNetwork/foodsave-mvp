import { EventEmitter } from 'events';
import { EventLogger } from './event-logger.service';
import { RequestLoggerMiddleware } from './request-logger.middleware';

function ejecutar(req: Record<string, unknown>, estado: number, locals: Record<string, unknown> = {}) {
  const logger = new EventLogger();
  const lineas: string[] = [];
  logger.salida = (linea) => lineas.push(linea);
  const res = Object.assign(new EventEmitter(), { statusCode: estado, locals });
  const next = jest.fn();

  new RequestLoggerMiddleware(logger).use(req as never, res as never, next);
  res.emit('finish');

  return { next, lineas };
}

describe('RequestLoggerMiddleware', () => {
  it('escribe una línea JSON con método, ruta plantilla, estado y duración, y sin datos sensibles', () => {
    const { next, lineas } = ejecutar(
      { method: 'POST', baseUrl: '', route: { path: '/reservas/:id/cancelar' }, path: '/reservas/abc/cancelar', user: { id: 'u1' } },
      200,
    );

    expect(next).toHaveBeenCalled();
    expect(lineas).toHaveLength(1);
    const registro = JSON.parse(lineas[0]);
    expect(registro).toMatchObject({
      nivel: 'info',
      metodo: 'POST',
      ruta: '/reservas/:id/cancelar',
      estado: 200,
      usuarioId: 'u1',
    });
    expect(typeof registro.ts).toBe('string');
    expect(typeof registro.duracionMs).toBe('number');
    expect(registro).not.toHaveProperty('codigoError');
  });

  it('registra rechazos 4xx con nivel warn y el código de error', () => {
    const { lineas } = ejecutar({ method: 'GET', path: '/reservas/mias' }, 401, { codigoError: 'NO_AUTENTICADO' });

    expect(JSON.parse(lineas[0])).toMatchObject({
      nivel: 'warn',
      estado: 401,
      ruta: '/reservas/mias',
      codigoError: 'NO_AUTENTICADO',
    });
  });

  it('usa la ruta pedida cuando solo coincidió el comodín del middleware (404)', () => {
    const { lineas } = ejecutar({ method: 'GET', route: { path: '/{*splat}' }, path: '/no-existe' }, 404, {
      codigoError: 'RUTA_NO_ENCONTRADA',
    });

    expect(JSON.parse(lineas[0])).toMatchObject({ ruta: '/no-existe', estado: 404 });
  });
});
