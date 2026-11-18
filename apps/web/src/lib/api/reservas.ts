import { apiClient } from '@/lib/api-client';
import type { Sede } from '@/lib/api/ofertas';

export type EstadoReserva = 'RESERVADA' | 'ENTREGADA' | 'CANCELADA' | 'EXPIRADA';

/** Reserva tal como la entrega POST /reservas. */
export interface Reserva {
  id: string;
  ofertaId: string;
  oferta: { id: string; producto: string; precioOferta: number; sede: Sede };
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

/** Reserva del listado de la sede: incluye a quién se le entrega. */
export interface ReservaDeSede extends Reserva {
  consumidor: { id: string; nombre: string };
}

/** GET /reservas/mias (CONSUMIDOR): «Mis reservas», las más recientes primero. */
export function listarMisReservas(): Promise<Reserva[]> {
  return apiClient<Reserva[]>('/reservas/mias');
}

/** GET /reservas (DUENO y PERSONAL): reservas de las sedes del usuario. */
export function listarReservasDeSede(
  filtros: { sedeId?: string; estado?: EstadoReserva } = {}
): Promise<ReservaDeSede[]> {
  const parametros = new URLSearchParams();
  if (filtros.sedeId) parametros.set('sedeId', filtros.sedeId);
  if (filtros.estado) parametros.set('estado', filtros.estado);
  const consulta = parametros.size > 0 ? `?${parametros.toString()}` : '';
  return apiClient<ReservaDeSede[]>(`/reservas${consulta}`);
}

/** SWR-RES-011: POST /reservas/:id/cancelar (CONSUMIDOR, dueño de la reserva). */
export function cancelarReserva(id: string): Promise<Reserva> {
  return apiClient<Reserva>(`/reservas/${encodeURIComponent(id)}/cancelar`, { metodo: 'POST' });
}

/** SWR-RES-015: PATCH /reservas/:id/entregar (DUENO y PERSONAL de la sede). */
export function entregarReserva(id: string): Promise<ReservaDeSede> {
  return apiClient<ReservaDeSede>(`/reservas/${encodeURIComponent(id)}/entregar`, {
    metodo: 'PATCH'
  });
}
