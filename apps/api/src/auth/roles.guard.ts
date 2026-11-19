import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorNegocio } from '../common/errores';
import { EVENTOS, EventLogger } from '../common/logging/event-logger.service';
import { Rol } from '../generated/prisma/client';
import { ROLES_KEY } from './roles.decorator';
import type { RequestAutenticada } from './usuario-autenticado';

/**
 * SWR-AUTH-010: autoriza la función solo si el rol del usuario está entre los
 * exigidos por @Roles(). Sin @Roles() basta con estar autenticado.
 * Va después de JwtAuthGuard, que es quien rellena `request.user`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: EventLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const usuario = context.switchToHttp().getRequest<RequestAutenticada>().user;
    if (!usuario) throw new ErrorNegocio('NO_AUTENTICADO');

    if (!roles.includes(usuario.rol)) {
      this.logger.evento(
        EVENTOS.ACCESO_DENEGADO,
        { motivo: 'PROHIBIDO', usuarioId: usuario.id, rol: usuario.rol },
        'warn',
      );
      throw new ErrorNegocio('PROHIBIDO');
    }
    return true;
  }
}
