import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggerMiddleware } from './common/logging/request-logger.middleware';
import { OfertasModule } from './ofertas/ofertas.module';
import { ReservasModule } from './reservas/reservas.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // .env de apps/api o, si no existe, el de la raíz del monorepo.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    CommonModule,
    PrismaModule,
    AuthModule,
    OfertasModule,
    ReservasModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
