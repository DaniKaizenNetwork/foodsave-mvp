import { Module } from '@nestjs/common';
import { OfertasController } from './ofertas.controller';
import { OfertasService } from './ofertas.service';
import { SedesController } from './sedes.controller';
import { SedesService } from './sedes.service';

@Module({
  controllers: [OfertasController, SedesController],
  providers: [OfertasService, SedesService],
  exports: [SedesService],
})
export class OfertasModule {}
