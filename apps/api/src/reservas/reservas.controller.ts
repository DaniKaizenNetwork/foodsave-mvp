import { Body, Controller, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import type { RequestAutenticada } from '../auth/usuario-autenticado';
import { validarCuerpoReserva } from './dto/reserva.dto';
import { ReservasService } from './reservas.service';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  /** SWR-RES-001/002/003/005: solo CONSUMIDOR. */
  @Roles('CONSUMIDOR')
  @Post()
  crear(@Req() req: RequestAutenticada, @Body() cuerpo: unknown) {
    return this.reservas.crear((req.user as { id: string }).id, validarCuerpoReserva(cuerpo));
  }
}
