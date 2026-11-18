import { Injectable } from '@nestjs/common';
import { ErrorNegocio } from '../common/errores';
import { EVENTOS, EventLogger } from '../common/logging/event-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { calcularCierreSede } from './cierre-sede';
import { CrearReservaDto } from './dto/reserva.dto';
import { calcularPlazoRetiro } from './plazo-retiro';
import { verificarReserva } from './verificar-reserva';

/** Forma pública de una reserva (incluye lo que la confirmación necesita mostrar). */
const SELECCION_RESERVA = {
  id: true,
  ofertaId: true,
  oferta: { select: { id: true, producto: true, sede: { select: { id: true, nombre: true } } } },
  cantidad: true,
  estado: true,
  plazoRetiro: true,
  createdAt: true,
} as const;

/**
 * Con muchas reservas simultáneas sobre la misma oferta las transacciones esperan su turno
 * (el UPDATE bloquea la fila): se amplía lo que Prisma tolera esperando una conexión y
 * ejecutando, que por defecto son 2 s y 5 s.
 */
const OPCIONES_TRANSACCION = { maxWait: 10_000, timeout: 15_000 } as const;

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: EventLogger,
  ) {}

  /**
   * SWR-RES-001, 002, 003 y 005. Todo ocurre en una sola transacción:
   *  1. se lee la oferta con su sede y horarios y se verifica la reserva;
   *  2. el inventario se descuenta con UN solo `UPDATE ... SET disponible = disponible - n
   *     WHERE id = ? AND disponible >= n`: si dos reservas compiten por la última unidad, la
   *     base serializa los UPDATE y el segundo no encuentra fila que actualizar (0 filas →
   *     STOCK_INSUFICIENTE), así que nunca se sobrevende; la CHECK `disponible >= 0` de la
   *     migración es la última red de seguridad;
   *  3. se crea la reserva RESERVADA con su plazo de retiro, sin confirmación del comercio.
   */
  async crear(consumidorId: string, dto: CrearReservaDto, ahora: Date = new Date()) {
    try {
      const reserva = await this.prisma.$transaction(async (tx) => {
        // Un token puede sobrevivir a un reinicio de las semillas: ese usuario ya no existe.
        const consumidor = await tx.usuario.findUnique({
          where: { id: consumidorId },
          select: { id: true },
        });
        if (!consumidor) throw new ErrorNegocio('NO_AUTENTICADO');

        const oferta = await tx.oferta.findUnique({
          where: { id: dto.ofertaId },
          include: { sede: { include: { horarios: true } } },
        });
        if (!oferta) throw new ErrorNegocio('OFERTA_NO_ENCONTRADA');

        const veredicto = verificarReserva(oferta, dto.cantidad, ahora);
        if (veredicto !== 'OK') throw new ErrorNegocio(veredicto);

        const cierreSede = calcularCierreSede(oferta.sede, oferta.sede.horarios, ahora);
        const plazoRetiro = calcularPlazoRetiro(ahora, cierreSede, oferta.vencimiento);

        const descontadas = await tx.oferta.updateMany({
          where: { id: oferta.id, estado: 'ACTIVA', disponible: { gte: dto.cantidad } },
          data: { disponible: { decrement: dto.cantidad } },
        });
        if (descontadas.count === 0) throw new ErrorNegocio('STOCK_INSUFICIENTE');

        return tx.reserva.create({
          data: {
            ofertaId: oferta.id,
            consumidorId,
            cantidad: dto.cantidad,
            estado: 'RESERVADA',
            plazoRetiro,
          },
          select: SELECCION_RESERVA,
        });
      }, OPCIONES_TRANSACCION);

      this.logger.evento(EVENTOS.RESERVA_CREADA, {
        reservaId: reserva.id,
        ofertaId: reserva.ofertaId,
        usuarioId: consumidorId,
        cantidad: reserva.cantidad,
      });
      return reserva;
    } catch (error) {
      if (error instanceof ErrorNegocio && error.codigo !== 'NO_AUTENTICADO') {
        this.logger.evento(
          EVENTOS.RESERVA_RECHAZADA,
          { motivo: error.codigo, ofertaId: dto.ofertaId, usuarioId: consumidorId },
          'warn',
        );
      }
      throw error;
    }
  }
}
