import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import type { RequestAutenticada } from '../auth/usuario-autenticado';
import { validarCuerpoOferta } from './dto/oferta.dto';
import { OfertasService } from './ofertas.service';

@Controller('ofertas')
export class OfertasController {
  constructor(private readonly ofertas: OfertasService) {}

  /** SWR-BUS-001 / SWR-BUS-005: público, sin autenticación. */
  @Public()
  @Get()
  listar(@Query('q') q?: unknown) {
    return this.ofertas.listarActivas(typeof q === 'string' ? q : undefined);
  }

  /** SWR-OFE-001 / SWR-OFE-003 / SWR-AUTH-010: solo DUENO y PERSONAL. */
  @Roles('DUENO', 'PERSONAL')
  @Post()
  publicar(@Req() req: RequestAutenticada, @Body() cuerpo: unknown) {
    const dto = validarCuerpoOferta(cuerpo);
    return this.ofertas.publicar((req.user as { id: string }).id, dto);
  }
}
