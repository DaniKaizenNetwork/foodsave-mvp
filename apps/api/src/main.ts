import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EVENTOS, EventLogger } from './common/logging/event-logger.service';

async function bootstrap(): Promise<void> {
  // El logger de Nest se limita a errores; los logs de la API los escribe EventLogger (JSON).
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  const origenes = process.env.CORS_ORIGIN?.split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
  if (origenes?.length) {
    app.enableCors({ origin: origenes });
  }

  const puerto = Number(process.env.PORT) || 3001;
  await app.listen(puerto);
  app.get(EventLogger).evento(EVENTOS.SERVIDOR_INICIADO, { puerto });
}

void bootstrap();
