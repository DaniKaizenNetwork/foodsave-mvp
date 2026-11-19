import { Injectable } from '@nestjs/common';
import { ErrorNegocio } from '../common/errores';
import { EVENTOS, EventLogger } from '../common/logging/event-logger.service';
import { EstadoReserva } from '../generated/prisma/client';
import { SedesService } from '../ofertas/sedes.service';
import { PrismaService } from '../prisma/prisma.service';
import { calcularCierreSede } from './cierre-sede';
import { CrearReservaDto } from './dto/reserva.dto';
import { calcularPlazoRetiro } from './plazo-retiro';
import { verificarCancelacion } from './verificar-cancelacion';
import { verificarReserva } from './verificar-reserva';

/** Forma pública de una reserva (incluye lo que la confirmación necesita mostrar). */
const SELECCION_RESERVA = {
  id: true,
  ofertaId: true,
  oferta: {
    select: {
      id: true,
      producto: true,
      precioOferta: true,
      sede: { select: { id: true, nombre: true } },
    },
  },
  cantidad: true,
  estado: true,
  plazoRetiro: true,
  createdAt: true,
} as const;

/** Lo mismo más el consumidor: el personal necesita saber a quién le entrega. */
const SELECCION_RESERVA_SEDE = {
  ...SELECCION_RESERVA,
  consumidor: { select: { id: true, nombre: true } },
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
    private readonly sedes: SedesService,
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

  /** Dependencia implícita (d) de SWR-RES-011: «Mis reservas» del consumidor, las más recientes primero. */
  listarMias(consumidorId: string) {
    return this.prisma.reserva.findMany({
      where: { consumidorId },
      select: SELECCION_RESERVA,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Dependencia implícita (d) de SWR-RES-015: reservas de las sedes del usuario (PERSONAL: la
   * suya; DUENO: las de su comercio). Con `sedeId` solo esa sede, y debe ser del usuario
   * (si no, 403). `estado` filtra por estado de la reserva.
   */
  async listarDeSede(usuarioId: string, filtros: { sedeId?: string; estado?: EstadoReserva }) {
    const propias = (await this.sedes.delUsuario(usuarioId)).map((sede) => sede.id);
    if (filtros.sedeId && !propias.includes(filtros.sedeId)) {
      this.registrarAccesoDenegado(usuarioId, filtros.sedeId);
      throw new ErrorNegocio('PROHIBIDO');
    }
    const sedeIds = filtros.sedeId ? [filtros.sedeId] : propias;
    if (sedeIds.length === 0) return [];

    return this.prisma.reserva.findMany({
      where: {
        oferta: { sedeId: { in: sedeIds } },
        ...(filtros.estado ? { estado: filtros.estado } : {}),
      },
      select: SELECCION_RESERVA_SEDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * SWR-RES-011 (RN-09). El consumidor cancela su reserva RESERVADA mientras el plazo esté
   * vigente y las unidades vuelven al inventario, todo en una transacción. El cambio de
   * estado es un UPDATE condicional (`WHERE estado = 'RESERVADA'`): si dos cancelaciones (o
   * una cancelación y una entrega) coinciden, solo una cambia la fila, así que las unidades
   * se devuelven una sola vez. Una reserva ajena responde igual que una inexistente (404).
   */
  async cancelar(consumidorId: string, reservaId: string, ahora: Date = new Date()) {
    try {
      const cancelada = await this.prisma.$transaction(async (tx) => {
        const reserva = await tx.reserva.findFirst({
          where: { id: reservaId, consumidorId },
          select: { id: true, ofertaId: true, cantidad: true, estado: true, plazoRetiro: true },
        });
        if (!reserva) throw new ErrorNegocio('RESERVA_NO_ENCONTRADA');

        const veredicto = verificarCancelacion(reserva, ahora);
        if (veredicto !== 'OK') throw new ErrorNegocio(veredicto);

        const cambio = await tx.reserva.updateMany({
          where: { id: reserva.id, estado: 'RESERVADA' },
          data: { estado: 'CANCELADA' },
        });
        if (cambio.count === 0) throw new ErrorNegocio('RESERVA_NO_CANCELABLE');

        await tx.oferta.update({
          where: { id: reserva.ofertaId },
          data: { disponible: { increment: reserva.cantidad } },
        });
        return tx.reserva.findUniqueOrThrow({ where: { id: reserva.id }, select: SELECCION_RESERVA });
      }, OPCIONES_TRANSACCION);

      this.logger.evento(EVENTOS.RESERVA_CANCELADA, {
        reservaId: cancelada.id,
        ofertaId: cancelada.ofertaId,
        usuarioId: consumidorId,
        cantidad: cancelada.cantidad,
      });
      return cancelada;
    } catch (error) {
      this.registrarRechazo('cancelar', error, { reservaId, usuarioId: consumidorId });
      throw error;
    }
  }

  /**
   * SWR-RES-015 (RN-10). El personal o el dueño de la sede marca la reserva como ENTREGADA.
   * Solo desde RESERVADA (también si el plazo ya venció: no hay expiración automática en el
   * MVP). El cambio es un UPDATE condicional, igual que en `cancelar`.
   */
  async entregar(usuarioId: string, reservaId: string) {
    try {
      const reserva = await this.prisma.reserva.findUnique({
        where: { id: reservaId },
        select: { id: true, ofertaId: true, estado: true, oferta: { select: { sedeId: true } } },
      });
      if (!reserva) throw new ErrorNegocio('RESERVA_NO_ENCONTRADA');

      const propias = await this.sedes.delUsuario(usuarioId);
      if (!propias.some((sede) => sede.id === reserva.oferta.sedeId)) {
        this.registrarAccesoDenegado(usuarioId, reserva.oferta.sedeId);
        throw new ErrorNegocio('PROHIBIDO');
      }
      if (reserva.estado !== 'RESERVADA') throw new ErrorNegocio('RESERVA_NO_ENTREGABLE');

      const cambio = await this.prisma.reserva.updateMany({
        where: { id: reserva.id, estado: 'RESERVADA' },
        data: { estado: 'ENTREGADA' },
      });
      if (cambio.count === 0) throw new ErrorNegocio('RESERVA_NO_ENTREGABLE');

      const entregada = await this.prisma.reserva.findUniqueOrThrow({
        where: { id: reserva.id },
        select: SELECCION_RESERVA_SEDE,
      });
      this.logger.evento(EVENTOS.RESERVA_ENTREGADA, {
        reservaId: entregada.id,
        ofertaId: entregada.ofertaId,
        usuarioId,
        consumidorId: entregada.consumidor.id,
      });
      return entregada;
    } catch (error) {
      this.registrarRechazo('entregar', error, { reservaId, usuarioId });
      throw error;
    }
  }

  private registrarAccesoDenegado(usuarioId: string, sedeId: string): void {
    this.logger.evento(EVENTOS.ACCESO_DENEGADO, { motivo: 'PROHIBIDO', usuarioId, sedeId }, 'warn');
  }

  /** Los rechazos de negocio de cancelar y entregar quedan en el log con su motivo. */
  private registrarRechazo(accion: string, error: unknown, datos: Record<string, unknown>): void {
    if (!(error instanceof ErrorNegocio)) return;
    if (error.codigo === 'NO_AUTENTICADO' || error.codigo === 'PROHIBIDO') return;
    this.logger.evento(EVENTOS.RESERVA_RECHAZADA, { accion, motivo: error.codigo, ...datos }, 'warn');
  }
}
