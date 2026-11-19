import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EVENTOS, EventLogger } from './common/logging/event-logger.service';

async function bootstrap(): Promise<void> {
  // El logger de Nest se limita a errores; los logs de la API los escribe EventLogger (JSON).
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  // CORS_ORIGIN admite varios orígenes separados por coma; por defecto, la web local.
  const origenes = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenes });

  const puerto = Number(process.env.PORT) || 3001;
  await app.listen(puerto);
  app.get(EventLogger).evento(EVENTOS.SERVIDOR_INICIADO, { puerto });
}

void bootstrap();
