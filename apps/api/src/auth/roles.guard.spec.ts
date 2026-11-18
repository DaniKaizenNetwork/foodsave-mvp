import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorNegocio } from '../common/errores';
import { EventLogger } from '../common/logging/event-logger.service';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class ControladorDePrueba {
  @Roles('DUENO', 'PERSONAL')
  soloDuenoYPersonal(): void {}

  sinRoles(): void {}
}

function contexto(handler: () => void, user?: { id: string; rol: string }): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => ControladorDePrueba,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (UNIT-15 · SWR-AUTH-010)', () => {
  const logger = new EventLogger();
  logger.salida = () => undefined;
  const guard = new RolesGuard(new Reflector(), logger);
  const handler = ControladorDePrueba.prototype.soloDuenoYPersonal;

  it('permite al DUENO', () => {
    expect(guard.canActivate(contexto(handler, { id: 'd1', rol: 'DUENO' }))).toBe(true);
  });

  it('deniega al CONSUMIDOR con PROHIBIDO', () => {
    const intento = () => guard.canActivate(contexto(handler, { id: 'c1', rol: 'CONSUMIDOR' }));

    expect(intento).toThrow(ErrorNegocio);
    expect(intento).toThrow(expect.objectContaining({ codigo: 'PROHIBIDO' }));
  });

  it('exige sesión cuando la ruta pide un rol y no hay usuario', () => {
    expect(() => guard.canActivate(contexto(handler))).toThrow(expect.objectContaining({ codigo: 'NO_AUTENTICADO' }));
  });

  it('sin @Roles() basta con estar autenticado', () => {
    const sinRoles = ControladorDePrueba.prototype.sinRoles;

    expect(guard.canActivate(contexto(sinRoles, { id: 'c1', rol: 'CONSUMIDOR' }))).toBe(true);
  });
});
