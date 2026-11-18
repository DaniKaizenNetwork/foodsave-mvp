import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import type { RequestAutenticada } from '../auth/usuario-autenticado';
import { ErrorNegocio } from '../common/errores';
import { EstadoReserva } from '../generated/prisma/client';
import { validarCuerpoReserva } from './dto/reserva.dto';
import { ReservasService } from './reservas.service';

const ESTADOS: EstadoReserva[] = ['RESERVADA', 'ENTREGADA', 'CANCELADA', 'EXPIRADA'];

const idDe = (req: RequestAutenticada) => (req.user as { id: string }).id;

/** Un parámetro de consulta opcional debe llegar como un solo texto. */
function textoOpcional(valor: unknown): string | undefined {
  if (valor === undefined || valor === '') return undefined;
  if (typeof valor !== 'string') throw new ErrorNegocio('CAMPOS_INVALIDOS');
  return valor;
}

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  /** SWR-RES-001/002/003/005: solo CONSUMIDOR. */
  @Roles('CONSUMIDOR')
  @Post()
  crear(@Req() req: RequestAutenticada, @Body() cuerpo: unknown) {
    return this.reservas.crear(idDe(req), validarCuerpoReserva(cuerpo));
  }

  /** «Mis reservas» (dependencia implícita d de SWR-RES-011). */
  @Roles('CONSUMIDOR')
  @Get('mias')
  mias(@Req() req: RequestAutenticada) {
    return this.reservas.listarMias(idDe(req));
  }

  /** Reservas de la sede (dependencia implícita d de SWR-RES-015): PERSONAL y DUENO. */
  @Roles('DUENO', 'PERSONAL')
  @Get()
  deLaSede(
    @Req() req: RequestAutenticada,
    @Query('sedeId') sedeId?: unknown,
    @Query('estado') estado?: unknown,
  ) {
    const estadoTexto = textoOpcional(estado);
    if (estadoTexto && !ESTADOS.includes(estadoTexto as EstadoReserva)) {
      throw new ErrorNegocio('CAMPOS_INVALIDOS');
    }
    return this.reservas.listarDeSede(idDe(req), {
      sedeId: textoOpcional(sedeId),
      estado: estadoTexto as EstadoReserva | undefined,
    });
  }

  /** SWR-RES-011: el consumidor cancela su propia reserva. */
  @Roles('CONSUMIDOR')
  @HttpCode(200)
  @Post(':id/cancelar')
  cancelar(@Req() req: RequestAutenticada, @Param('id') id: string) {
    return this.reservas.cancelar(idDe(req), id);
  }

  /** SWR-RES-015: el personal o el dueño de la sede marca la reserva como entregada. */
  @Roles('DUENO', 'PERSONAL')
  @Patch(':id/entregar')
  entregar(@Req() req: RequestAutenticada, @Param('id') id: string) {
    return this.reservas.entregar(idDe(req), id);
  }
}
