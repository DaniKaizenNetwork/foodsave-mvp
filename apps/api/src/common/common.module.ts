import { Global, Module } from '@nestjs/common';
import { EventLogger } from './logging/event-logger.service';

/** Servicios transversales (logs) disponibles en todos los módulos. */
@Global()
@Module({
  providers: [EventLogger],
  exports: [EventLogger],
})
export class CommonModule {}
