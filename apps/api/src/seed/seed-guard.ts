export interface PermisoReinicio {
  permitido: boolean;
  motivo?: string;
}

/**
 * seed y seed:test borran y recargan los datos, así que solo se ejecutan si el
 * .env local lo autoriza de forma explícita con SEED_ALLOW_RESET=true (no se
 * depende del nombre de la base de datos) y hay una contraseña de semilla.
 */
export function verificarPermisoReinicio(env: Record<string, string | undefined>): PermisoReinicio {
  if (env.SEED_ALLOW_RESET !== 'true') {
    return {
      permitido: false,
      motivo: 'Reinicio bloqueado: define SEED_ALLOW_RESET=true en tu .env local para ejecutar la semilla.',
    };
  }
  if (!env.SEED_PASSWORD) {
    return { permitido: false, motivo: 'Falta SEED_PASSWORD en el .env local.' };
  }
  return { permitido: true };
}
