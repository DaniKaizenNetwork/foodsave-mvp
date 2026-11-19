import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { EventLogger, NivelLog } from './event-logger.service';

type RequestConUsuario = Request & { user?: { id?: string } };

/** Ruta comodín con la que se monta este mismo middleware; no describe el recurso pedido. */
const RUTA_COMODIN = '/{*splat}';

/**
 * Una línea JSON por petición: {ts, nivel, metodo, ruta, estado, duracionMs,
 * usuarioId?, codigoError?}.
 *
 * Es un middleware (y no un interceptor) porque los interceptores no se
 * ejecutan cuando un guard rechaza la petición (401/403) ni en rutas
 * inexistentes (404), y esas respuestas deben quedar registradas. Se escribe al
 * terminar la respuesta, cuando el estado final ya se conoce.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: EventLogger) {}

  use(req: RequestConUsuario, res: Response, next: NextFunction): void {
    const inicio = process.hrtime.bigint();

    res.on('finish', () => {
      const estado = res.statusCode;
      const nivel: NivelLog = estado >= 500 ? 'error' : estado >= 400 ? 'warn' : 'info';
      const usuarioId = req.user?.id;
      const codigoError = res.locals?.codigoError as string | undefined;
      // Ruta como plantilla (/reservas/:id/cancelar) y sin query string.
      // Si ninguna ruta del controlador coincidió (404), se usa la ruta pedida.
      const rutaCoincidente = req.route?.path;
      const ruta =
        rutaCoincidente && rutaCoincidente !== RUTA_COMODIN
          ? `${req.baseUrl ?? ''}${rutaCoincidente}`
          : req.path;

      this.logger.registrar({
        ts: new Date().toISOString(),
        nivel,
        metodo: req.method,
        ruta,
        estado,
        duracionMs: Math.round(Number(process.hrtime.bigint() - inicio) / 1e6),
        ...(usuarioId ? { usuarioId } : {}),
        ...(codigoError ? { codigoError } : {}),
      });
    });

    next();
  }
}
