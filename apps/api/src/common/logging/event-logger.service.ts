import { Injectable } from '@nestjs/common';
import { redact } from './redact';

export type NivelLog = 'info' | 'warn' | 'error';

/** Eventos de negocio y de operación que se registran además de cada petición. */
export const EVENTOS = {
  LOGIN_OK: 'LOGIN_OK',
  LOGIN_FALLIDO: 'LOGIN_FALLIDO',
  ACCESO_DENEGADO: 'ACCESO_DENEGADO',
  OFERTA_PUBLICADA: 'OFERTA_PUBLICADA',
  RESERVA_RECHAZADA: 'RESERVA_RECHAZADA',
  RESERVA_CREADA: 'RESERVA_CREADA',
  RESERVA_CANCELADA: 'RESERVA_CANCELADA',
  RESERVA_ENTREGADA: 'RESERVA_ENTREGADA',
  ERROR_INTERNO: 'ERROR_INTERNO',
  SERVIDOR_INICIADO: 'SERVIDOR_INICIADO',
} as const;

export type NombreEvento = (typeof EVENTOS)[keyof typeof EVENTOS];

/**
 * Escribe una línea JSON por registro en la salida estándar. Todo lo que se
 * escribe pasa por `redact`, así que nunca salen contraseñas, hashes ni tokens.
 */
@Injectable()
export class EventLogger {
  /** Destino de las líneas; las pruebas lo sustituyen. */
  salida: (linea: string) => void = (linea) => {
    process.stdout.write(linea);
  };

  registrar(linea: Record<string, unknown>): void {
    this.salida(`${JSON.stringify(redact(linea))}\n`);
  }

  evento(evento: NombreEvento, datos: Record<string, unknown> = {}, nivel: NivelLog = 'info'): void {
    this.registrar({
      ts: new Date().toISOString(),
      nivel,
      tipo: 'evento',
      evento,
      ...datos,
    });
  }
}
