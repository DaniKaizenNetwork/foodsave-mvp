import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { CodigoError, ERRORES, ErrorNegocio } from '../errores';
import { EVENTOS, EventLogger } from '../logging/event-logger.service';

/** Convierte cualquier excepción en la respuesta `{ codigo, mensaje }` del contrato. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: EventLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const codigo = this.resolverCodigo(exception);

    if (codigo === 'ERROR_INTERNO') {
      // Solo el nombre y el mensaje del error: nunca el cuerpo de la petición.
      this.logger.evento(
        EVENTOS.ERROR_INTERNO,
        {
          error: exception instanceof Error ? exception.name : 'desconocido',
          detalle: exception instanceof Error ? exception.message : String(exception),
        },
        'error',
      );
    }

    // El middleware de logs lee este valor al terminar la respuesta.
    res.locals.codigoError = codigo;
    res.status(ERRORES[codigo].estado).json({ codigo, mensaje: ERRORES[codigo].mensaje });
  }

  private resolverCodigo(exception: unknown): CodigoError {
    if (exception instanceof ErrorNegocio) return exception.codigo;
    if (exception instanceof HttpException) {
      const estado = exception.getStatus();
      if (estado === 401) return 'NO_AUTENTICADO';
      if (estado === 403) return 'PROHIBIDO';
      if (estado === 404) return 'RUTA_NO_ENCONTRADA';
      if (estado < 500) return 'CAMPOS_INVALIDOS';
    }
    return 'ERROR_INTERNO';
  }
}
