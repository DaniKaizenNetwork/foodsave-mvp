import { apiClient } from '@/lib/api-client';
import type { Sede } from '@/lib/api/ofertas';

export type EstadoReserva = 'RESERVADA' | 'ENTREGADA' | 'CANCELADA' | 'EXPIRADA';

/** Reserva tal como la entrega POST /reservas. */
export interface Reserva {
  id: string;
  ofertaId: string;
  oferta: { id: string; producto: string; sede: Sede };
  cantidad: number;
  estado: EstadoReserva;
  /** Fecha ISO 8601: el menor entre 12 h desde la reserva, el cierre de la sede y el vencimiento. */
  plazoRetiro: string;
  createdAt: string;
}

/** SWR-RES-001/002/003/005: POST /reservas (solo CONSUMIDOR). */
export function crearReserva(datos: { ofertaId: string; cantidad: number }): Promise<Reserva> {
  return apiClient<Reserva>('/reservas', { metodo: 'POST', cuerpo: datos });
}
