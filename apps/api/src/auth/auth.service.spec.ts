import { JwtService } from '@nestjs/jwt';
import { ErrorNegocio } from '../common/errores';
import { EventLogger } from '../common/logging/event-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashPassword } from './password';

describe('AuthService.login (UNIT-14 · SWR-AUTH-006)', () => {
  const buscarUsuario = jest.fn();
  const prisma = { usuario: { findUnique: buscarUsuario } } as unknown as PrismaService;
  const jwt = { signAsync: jest.fn() } as unknown as JwtService;
  const logger = new EventLogger();
  logger.salida = () => undefined;
  const servicio = new AuthService(prisma, jwt, logger);

  async function capturarRechazo(correo: string, contrasena: string): Promise<ErrorNegocio> {
    try {
      await servicio.login({ correo, contrasena });
    } catch (error) {
      return error as ErrorNegocio;
    }
    throw new Error('El login no fue rechazado');
  }

  it('responde igual con correo inexistente que con contraseña errada', async () => {
    // Arrange
    const passwordHash = await hashPassword('Prueba123!');
    buscarUsuario.mockResolvedValueOnce(null); // caso A: el correo no existe
    buscarUsuario.mockResolvedValueOnce({ id: 'u1', nombre: 'Uno', rol: 'CONSUMIDOR', passwordHash }); // caso B

    // Act
    const casoA = await capturarRechazo('nadie@foodsave.test', 'Prueba123!');
    const casoB = await capturarRechazo('consumidor1@foodsave.test', 'ClaveErrada!');

    // Assert
    expect(casoA).toBeInstanceOf(ErrorNegocio);
    expect(casoB).toBeInstanceOf(ErrorNegocio);
    expect(casoA.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(casoB.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(casoA.getStatus()).toBe(401);
    expect(casoA.getResponse()).toEqual(casoB.getResponse()); // mismo código y mismo mensaje
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
