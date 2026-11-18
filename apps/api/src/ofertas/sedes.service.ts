import { Injectable } from '@nestjs/common';
import { ErrorNegocio } from '../common/errores';
import { PrismaService } from '../prisma/prisma.service';

export interface SedeResumen {
  id: string;
  nombre: string;
}

/** Sedes sobre las que un usuario puede operar (SWR-AUTH-010: rol + sede asignada). */
@Injectable()
export class SedesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * PERSONAL: su sede asignada. DUENO: las sedes de su comercio.
   * Si el usuario ya no existe (p. ej. se reinició la semilla) el token deja de ser válido: 401.
   */
  async delUsuario(usuarioId: string): Promise<SedeResumen[]> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: true, sedeId: true, comercioId: true },
    });
    if (!usuario) throw new ErrorNegocio('NO_AUTENTICADO');

    const where =
      usuario.rol === 'PERSONAL'
        ? { id: usuario.sedeId ?? undefined }
        : usuario.rol === 'DUENO'
          ? { comercioId: usuario.comercioId ?? undefined }
          : null;
    // Sin sede ni comercio asignados, o con otro rol, no hay sedes permitidas.
    if (!where || Object.values(where)[0] === undefined) return [];

    return this.prisma.sede.findMany({
      where,
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }
}
