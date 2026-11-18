import { SetMetadata } from '@nestjs/common';
import { Rol } from '../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe una ruta a los roles indicados (SWR-AUTH-010). */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
