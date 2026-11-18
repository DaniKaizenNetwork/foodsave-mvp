import { obtenerToken } from '@/lib/auth/sesion-storage';

/** URL base de la API NestJS (NEXT_PUBLIC_API_URL, sin barra final). */
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** Se emite cuando la API rechaza el token de una sesión guardada (401 NO_AUTENTICADO). */
export const EVENTO_SESION_EXPIRADA = 'foodsave:sesion-expirada';

/** Error de la API: lleva el `codigo` y el `mensaje` del contrato `{ codigo, mensaje }`. */
export class ErrorApi extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly estado: number
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

interface OpcionesApi {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
  /** Envía `Authorization: Bearer` si hay sesión. Falso en login y registro. */
  autenticado?: boolean;
}

export async function apiClient<T>(
  ruta: string,
  { metodo = 'GET', cuerpo, autenticado = true }: OpcionesApi = {}
): Promise<T> {
  const token = autenticado ? obtenerToken() : null;
  const headers: Record<string, string> = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
  } catch {
    throw new ErrorApi('ERROR_RED', 'No se pudo conectar con el servidor', 0);
  }

  if (!respuesta.ok) {
    const datos = (await respuesta.json().catch(() => null)) as {
      codigo?: string;
      mensaje?: string;
    } | null;
    const codigo = datos?.codigo ?? 'ERROR_DESCONOCIDO';
    if (respuesta.status === 401 && codigo === 'NO_AUTENTICADO' && token) {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    throw new ErrorApi(codigo, datos?.mensaje ?? 'Ocurrió un error inesperado', respuesta.status);
  }

  return (await respuesta.json()) as T;
}
