import { apiClient } from '@/lib/api-client';

export type EstadoOferta = 'ACTIVA' | 'CERRADA' | 'AGOTADA';

export interface Sede {
  id: string;
  nombre: string;
}

/** Oferta tal como la entrega la API (GET /ofertas y POST /ofertas). */
export interface Oferta {
  id: string;
  sedeId: string;
  sede: Sede;
  producto: string;
  precioOriginal: number;
  precioOferta: number;
  cantidad: number;
  disponible: number;
  /** Fecha ISO 8601. */
  vencimiento: string;
  estado: EstadoOferta;
  createdAt: string;
}

export interface DatosPublicarOferta {
  producto: string;
  precioOriginal: number;
  precioOferta: number;
  cantidad: number;
  /** Fecha ISO 8601. */
  vencimiento: string;
  sedeId: string;
}

/** SWR-BUS-001 / SWR-BUS-005: GET /ofertas?q= (público). */
export function listarOfertas(q?: string): Promise<Oferta[]> {
  const consulta = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiClient<Oferta[]>(`/ofertas${consulta}`, { autenticado: false });
}

/** SWR-OFE-001 / SWR-OFE-003: POST /ofertas (DUENO y PERSONAL). */
export function publicarOferta(datos: DatosPublicarOferta): Promise<Oferta> {
  return apiClient<Oferta>('/ofertas', { metodo: 'POST', cuerpo: datos });
}

/** GET /sedes/mias: las sedes en las que el usuario puede publicar. */
export function listarMisSedes(): Promise<Sede[]> {
  return apiClient<Sede[]>('/sedes/mias');
}
