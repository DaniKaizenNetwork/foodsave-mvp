import { ErrorNegocio } from '../common/errores';
import { EventLogger } from '../common/logging/event-logger.service';
import { SedesService } from '../ofertas/sedes.service';
import { PrismaService } from '../prisma/prisma.service';
import { HorarioDia } from './cierre-sede';
import { ReservasService } from './reservas.service';

const bogota = (hhmm: string) => new Date(`2026-11-17T${hhmm}:00-05:00`);
const horariosNorte: HorarioDia[] = Array.from({ length: 7 }, (_, diaSemana) => ({ diaSemana, cierre: '20:00' }));

interface OfertaFalsa {
  id: string;
  estado: 'ACTIVA' | 'CERRADA' | 'AGOTADA';
  disponible: number;
  vencimiento: Date;
  sede: { abierta24h: boolean; horarios: HorarioDia[] };
}

/** Base en memoria: `updateMany` aplica el UPDATE condicional de forma atómica, como la base real. */
function armar(opciones: { oferta?: Partial<OfertaFalsa> | null; consumidorExiste?: boolean } = {}) {
  const oferta: OfertaFalsa | null =
    opciones.oferta === null
      ? null
      : {
          id: 'o1',
          estado: 'ACTIVA',
          disponible: 5,
          vencimiento: bogota('23:00'),
          sede: { abierta24h: true, horarios: [] },
          ...opciones.oferta,
        };
  const reservasCreadas: Array<Record<string, unknown>> = [];
  const updateMany = jest.fn(async ({ where, data }: any) => {
    if (!oferta || oferta.id !== where.id || oferta.estado !== where.estado || oferta.disponible < where.disponible.gte) {
      return { count: 0 };
    }
    oferta.disponible -= data.disponible.decrement;
    return { count: 1 };
  });
  const crearReserva = jest.fn(async ({ data }: any) => {
    reservasCreadas.push(data);
    return { id: `r${reservasCreadas.length}`, ofertaId: data.ofertaId, cantidad: data.cantidad, estado: data.estado, plazoRetiro: data.plazoRetiro };
  });
  const tx = {
    usuario: { findUnique: jest.fn(async () => (opciones.consumidorExiste === false ? null : { id: 'c1' })) },
    oferta: { findUnique: jest.fn(async () => (oferta ? { ...oferta } : null)), updateMany },
    reserva: { create: crearReserva },
  };
  const prisma = { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const lineas: string[] = [];
  const logger = new EventLogger();
  logger.salida = (l) => lineas.push(l);
  const eventos = () => lineas.map((l) => JSON.parse(l)).filter((l) => l.tipo === 'evento');
  return { servicio: new ReservasService(prisma, {} as SedesService, logger), oferta, updateMany, crearReserva, reservasCreadas, eventos, tx };
}

async function codigoDelRechazo(promesa: Promise<unknown>): Promise<string> {
  try {
    await promesa;
  } catch (error) {
    return (error as ErrorNegocio).codigo ?? `error: ${(error as Error).message}`;
  }
  throw new Error('No fue rechazada');
}

describe('ReservasService.crear (SWR-RES-001, 002, 003, 005)', () => {
  it('crea la reserva RESERVADA, descuenta el inventario con un UPDATE condicional y calcula el plazo', async () => {
    const { servicio, updateMany, crearReserva, oferta, eventos } = armar();

    const reserva = await servicio.crear('c1', { ofertaId: 'o1', cantidad: 2 }, bogota('07:00'));

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'o1', estado: 'ACTIVA', disponible: { gte: 2 } },
      data: { disponible: { decrement: 2 } },
    });
    expect(oferta?.disponible).toBe(3);
    expect(crearReserva.mock.calls[0][0].data).toMatchObject({ ofertaId: 'o1', consumidorId: 'c1', cantidad: 2, estado: 'RESERVADA' });
    expect(reserva.plazoRetiro).toEqual(bogota('19:00')); // 07:00 + 12 h (sede 24 h, vence 23:00)
    expect(eventos().map((e) => e.evento)).toEqual(['RESERVA_CREADA']);
  });

  it('sede con horario: el cierre limita el plazo (17:00, cierre 20:00 → 20:00)', async () => {
    const { servicio } = armar({ oferta: { sede: { abierta24h: false, horarios: horariosNorte } } });

    const reserva = await servicio.crear('c1', { ofertaId: 'o1', cantidad: 1 }, bogota('17:00'));

    expect(reserva.plazoRetiro).toEqual(bogota('20:00'));
  });

  it('el vencimiento limita el plazo (10:00, vence 15:00 → 15:00)', async () => {
    const { servicio } = armar({ oferta: { vencimiento: bogota('15:00') } });

    const reserva = await servicio.crear('c1', { ofertaId: 'o1', cantidad: 1 }, bogota('10:00'));

    expect(reserva.plazoRetiro).toEqual(bogota('15:00'));
  });

  it.each([
    ['cantidad mayor al stock', { disponible: 5 }, 6, 'STOCK_INSUFICIENTE'],
    ['cantidad 0', {}, 0, 'CANTIDAD_INVALIDA'],
    ['cantidad decimal', {}, 1.5, 'CANTIDAD_INVALIDA'],
    ['oferta cerrada', { estado: 'CERRADA' as const }, 1, 'OFERTA_NO_ACTIVA'],
    ['producto vencido', { vencimiento: bogota('09:00') }, 1, 'PRODUCTO_VENCIDO'],
  ])('rechaza (%s) con %s y no toca el inventario ni crea la reserva', async (_caso, oferta, cantidad, codigo) => {
    const { servicio, updateMany, crearReserva, eventos } = armar({ oferta });

    expect(await codigoDelRechazo(servicio.crear('c1', { ofertaId: 'o1', cantidad }, bogota('10:00')))).toBe(codigo);

    expect(updateMany).not.toHaveBeenCalled();
    expect(crearReserva).not.toHaveBeenCalled();
    expect(eventos()).toEqual([expect.objectContaining({ evento: 'RESERVA_RECHAZADA', motivo: codigo, ofertaId: 'o1', usuarioId: 'c1' })]);
  });

  it('oferta inexistente: OFERTA_NO_ENCONTRADA', async () => {
    const { servicio } = armar({ oferta: null });

    expect(await codigoDelRechazo(servicio.crear('c1', { ofertaId: 'nada', cantidad: 1 }, bogota('10:00')))).toBe('OFERTA_NO_ENCONTRADA');
  });

  it('consumidor que ya no existe (token de una semilla anterior): NO_AUTENTICADO, sin evento de rechazo', async () => {
    const { servicio, updateMany, eventos } = armar({ consumidorExiste: false });

    expect(await codigoDelRechazo(servicio.crear('c1', { ofertaId: 'o1', cantidad: 1 }, bogota('10:00')))).toBe('NO_AUTENTICADO');
    expect(updateMany).not.toHaveBeenCalled();
    expect(eventos()).toEqual([]);
  });

  it('el UPDATE no actualiza ninguna fila (otro se llevó las unidades): STOCK_INSUFICIENTE y no crea la reserva', async () => {
    const { servicio, updateMany, crearReserva } = armar();
    // La verificación inicial pasa (disponible 5), pero otra transacción vació el stock antes del UPDATE.
    updateMany.mockResolvedValueOnce({ count: 0 });

    expect(await codigoDelRechazo(servicio.crear('c1', { ofertaId: 'o1', cantidad: 2 }, bogota('10:00')))).toBe('STOCK_INSUFICIENTE');
    expect(crearReserva).not.toHaveBeenCalled();
  });

  it('dos reservas simultáneas sobre la última unidad: una se crea y la otra recibe STOCK_INSUFICIENTE', async () => {
    const { servicio, oferta, reservasCreadas } = armar({ oferta: { disponible: 1 } });

    const resultados = await Promise.allSettled([
      servicio.crear('c1', { ofertaId: 'o1', cantidad: 1 }, bogota('10:00')),
      servicio.crear('c2', { ofertaId: 'o1', cantidad: 1 }, bogota('10:00')),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazada = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect((rechazada.reason as ErrorNegocio).codigo).toBe('STOCK_INSUFICIENTE');
    expect(reservasCreadas).toHaveLength(1);
    expect(oferta?.disponible).toBe(0);
  });

  it('muchas reservas simultáneas nunca superan el inventario (5 unidades, 12 intentos de 1)', async () => {
    const { servicio, oferta, reservasCreadas } = armar({ oferta: { disponible: 5 } });

    const resultados = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) => servicio.crear(`c${i}`, { ofertaId: 'o1', cantidad: 1 }, bogota('10:00'))),
    );

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(5);
    expect(reservasCreadas).toHaveLength(5);
    expect(oferta?.disponible).toBe(0);
  });

  it('una sede no 24 h sin horario para el día es un error de configuración y no descuenta stock', async () => {
    const { servicio, updateMany } = armar({ oferta: { sede: { abierta24h: false, horarios: [] } } });

    expect(await codigoDelRechazo(servicio.crear('c1', { ofertaId: 'o1', cantidad: 1 }, bogota('10:00')))).toMatch(/no tiene horario/);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
