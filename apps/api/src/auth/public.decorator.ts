import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICA_KEY = 'esPublica';

/** Marca una ruta como pública: no exige sesión. Todo lo demás exige token. */
export const Public = () => SetMetadata(ES_PUBLICA_KEY, true);
