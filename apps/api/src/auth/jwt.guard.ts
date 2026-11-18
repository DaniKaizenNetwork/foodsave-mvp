import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ErrorNegocio } from '../common/errores';
import { EVENTOS, EventLogger } from '../common/logging/event-logger.service';
import { Rol } from '../generated/prisma/client';
import { ES_PUBLICA_KEY } from './public.decorator';
import type { RequestAutenticada } from './usuario-autenticado';

/**
 * Guard global: toda ruta exige un JWT válido salvo las marcadas con @Public().
 * Sin token, o con token inválido o vencido: 401 NO_AUTENTICADO.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly logger: EventLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(ES_PUBLICA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublica) return true;

    const req = context.switchToHttp().getRequest<RequestAutenticada>();
    const token = this.extraerToken(req.headers.authorization);

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string; rol: Rol }>(token);
        req.user = { id: payload.sub, rol: payload.rol };
        return true;
      } catch {
        // Token inválido o vencido: se trata igual que la ausencia de token.
      }
    }

    this.logger.evento(EVENTOS.ACCESO_DENEGADO, { motivo: 'NO_AUTENTICADO' }, 'warn');
    throw new ErrorNegocio('NO_AUTENTICADO');
  }

  private extraerToken(cabecera?: string): string | undefined {
    const [tipo, token] = cabecera?.split(' ') ?? [];
    return tipo === 'Bearer' && token ? token : undefined;
  }
}
