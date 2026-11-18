import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import type { RequestAutenticada } from '../auth/usuario-autenticado';
import { SedesService } from './sedes.service';

@Controller('sedes')
export class SedesController {
  constructor(private readonly sedes: SedesService) {}

  /** Dependencia implícita (e): las sedes del usuario, para elegir sede al publicar y filtrar reservas. */
  @Roles('DUENO', 'PERSONAL')
  @Get('mias')
  mias(@Req() req: RequestAutenticada) {
    return this.sedes.delUsuario((req.user as { id: string }).id);
  }
}
