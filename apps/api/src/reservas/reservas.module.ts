import { Module } from '@nestjs/common';
import { OfertasModule } from '../ofertas/ofertas.module';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  imports: [OfertasModule], // SedesService: sedes sobre las que opera el usuario
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
