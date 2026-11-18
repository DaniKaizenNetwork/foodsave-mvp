import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorNegocio } from '../common/errores';
import { EVENTOS, EventLogger } from '../common/logging/event-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegistroDto } from './dto/auth.dto';
import { hashPassword, verifyPassword } from './password';

/**
 * Hash bcrypt (coste 10) de un texto cualquiera, sin relación con ninguna cuenta.
 * Se compara contra él cuando el correo no existe, para que el login tarde lo
 * mismo con correo inexistente que con contraseña errada.
 */
const HASH_FICTICIO = '$2b$10$vPDeGBDDgvnSmTdNWoTheujNAMVEBMnbJ82dqK3BlmJRNj5rVHSc6';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly logger: EventLogger,
  ) {}

  /** SWR-AUTH-001 (+ correo único, SWR-AUTH-004 como dependencia) y SWR-SEC-002. */
  async register(dto: RegistroDto) {
    const passwordHash = await hashPassword(dto.contrasena);
    try {
      return await this.prisma.usuario.create({
        data: { nombre: dto.nombre, correo: dto.correo, passwordHash, rol: 'CONSUMIDOR' },
        select: { id: true, nombre: true, correo: true, rol: true },
      });
    } catch (error) {
      // P2002: violación de la restricción UNIQUE del correo.
      if ((error as { code?: string }).code === 'P2002') {
        throw new ErrorNegocio('CORREO_DUPLICADO');
      }
      throw error;
    }
  }

  /** SWR-AUTH-005 y SWR-AUTH-006: el rechazo es idéntico para correo inexistente y clave errada. */
  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    const claveCorrecta = await verifyPassword(dto.contrasena, usuario?.passwordHash ?? HASH_FICTICIO);

    if (!usuario || !claveCorrecta) {
      // No se registra el correo ni se indica qué dato falló.
      this.logger.evento(EVENTOS.LOGIN_FALLIDO, { motivo: 'CREDENCIALES_INVALIDAS' }, 'warn');
      throw new ErrorNegocio('CREDENCIALES_INVALIDAS');
    }

    const accessToken = await this.jwt.signAsync({ sub: usuario.id, rol: usuario.rol });
    this.logger.evento(EVENTOS.LOGIN_OK, { usuarioId: usuario.id, rol: usuario.rol });
    return { accessToken, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } };
  }
}
