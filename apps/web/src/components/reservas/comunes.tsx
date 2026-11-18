import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { EstadoReserva } from '@/lib/api/reservas';

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  RESERVADA: 'Reservada',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada'
};

export const OPCIONES_ESTADO = (['RESERVADA', 'ENTREGADA', 'CANCELADA'] as const).map((estado) => ({
  value: estado,
  label: ETIQUETA_ESTADO[estado]
}));

/** Estado de la reserva con los colores de marca (amarillo, verde, rojo). */
export function EtiquetaEstado({ estado }: { estado: EstadoReserva }) {
  if (estado === 'ENTREGADA') return <Badge>{ETIQUETA_ESTADO[estado]}</Badge>;
  if (estado === 'CANCELADA') return <Badge variant='destructive'>{ETIQUETA_ESTADO[estado]}</Badge>;
  if (estado === 'RESERVADA') return <Badge variant='secondary'>{ETIQUETA_ESTADO[estado]}</Badge>;
  return <Badge variant='outline'>{ETIQUETA_ESTADO[estado]}</Badge>;
}

export type AvisoReserva =
  | { tipo: 'exito'; titulo: string; detalle: string }
  | { tipo: 'error'; mensaje: string };

/**
 * Resultado de la última acción. El éxito se anuncia con `role="status"` y el error con
 * `role="alert"`, dentro del propio componente (no solo como toast).
 */
export function AvisoDeReserva({ aviso }: { aviso: AvisoReserva | null }) {
  if (!aviso) return null;
  if (aviso.tipo === 'error') {
    return (
      <Alert variant='destructive' role='alert'>
        <AlertDescription>{aviso.mensaje}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert role='status'>
      <AlertTitle>{aviso.titulo}</AlertTitle>
      <AlertDescription>{aviso.detalle}</AlertDescription>
    </Alert>
  );
}
