import { Injectable } from '@nestjs/common';
import { ErrorNegocio } from '../common/errores';
import { EVENTOS, EventLogger } from '../common/logging/event-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublicarOfertaDto } from './dto/oferta.dto';
import { SedesService } from './sedes.service';
import { validarOferta } from './validar-oferta';

/** Forma pública de una oferta (incluye el nombre de la sede para el listado). */
const SELECCION_OFERTA = {
  id: true,
  sedeId: true,
  sede: { select: { id: true, nombre: true } },
  producto: true,
  precioOriginal: true,
  precioOferta: true,
  cantidad: true,
  disponible: true,
  vencimiento: true,
  estado: true,
  createdAt: true,
} as const;

@Injectable()
export class OfertasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sedes: SedesService,
    private readonly logger: EventLogger,
  ) {}

  /**
   * SWR-OFE-001 y SWR-OFE-003. Orden: la sede debe ser del usuario (403) y luego se aplican
   * las reglas de negocio (400). La oferta nace ACTIVA con `disponible = cantidad`.
   */
  async publicar(usuarioId: string, dto: PublicarOfertaDto) {
    const sedesPermitidas = await this.sedes.delUsuario(usuarioId);
    if (!sedesPermitidas.some((sede) => sede.id === dto.sedeId)) {
      this.logger.evento(
        EVENTOS.ACCESO_DENEGADO,
        { motivo: 'PROHIBIDO', usuarioId, sedeId: dto.sedeId },
        'warn',
      );
      throw new ErrorNegocio('PROHIBIDO');
    }

    const resultado = validarOferta(dto);
    if (!resultado.valido) throw new ErrorNegocio(resultado.codigo);

    const oferta = await this.prisma.oferta.create({
      data: {
        sedeId: dto.sedeId,
        producto: dto.producto,
        precioOriginal: dto.precioOriginal,
        precioOferta: dto.precioOferta,
        cantidad: dto.cantidad,
        disponible: dto.cantidad,
        vencimiento: dto.vencimiento,
        estado: 'ACTIVA',
        creadoPorId: usuarioId,
      },
      select: SELECCION_OFERTA,
    });
    this.logger.evento(EVENTOS.OFERTA_PUBLICADA, {
      ofertaId: oferta.id,
      sedeId: oferta.sedeId,
      usuarioId,
    });
    return oferta;
  }

  /**
   * SWR-BUS-001 y SWR-BUS-005 (público): ofertas ACTIVA, con unidades disponibles y con
   * vencimiento posterior a la hora actual. `q` filtra por coincidencia total o parcial
   * con el nombre del producto, sin distinguir mayúsculas.
   */
  listarActivas(q?: string) {
    const texto = q?.trim();
    return this.prisma.oferta.findMany({
      where: {
        estado: 'ACTIVA',
        disponible: { gt: 0 },
        vencimiento: { gt: new Date() },
        ...(texto ? { producto: { contains: texto, mode: 'insensitive' } } : {}),
      },
      select: SELECCION_OFERTA,
      orderBy: { createdAt: 'desc' },
    });
  }
}
