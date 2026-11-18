import { ErrorNegocio } from '../common/errores';
import { EventLogger } from '../common/logging/event-logger.service';
import { SedesService } from '../ofertas/sedes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReservasService } from './reservas.service';

const bogota = (hhmm: string) => new Date(`2026-11-17T${hhmm}:00-05:00`);

interface ReservaFalsa {
  id: string;
  ofertaId: string;
  consumidorId: string;
  cantidad: number;
  estado: 'RESERVADA' | 'ENTREGADA' | 'CANCELADA' | 'EXPIRADA';
  plazoRetiro: Date;
}

/**
 * Base en memoria. Cada método falso es síncrono por dentro (sin `await` entre comprobar y
 * cambiar), como un UPDATE condicional de la base real: las dos transacciones que compiten se
 * intercalan entre sus lecturas y sus escrituras, pero el cambio condicional es atómico.
 */
function armar(opciones: { reservas?: Partial<ReservaFalsa>[]; sedesDelUsuario?: string[]; sedeDeLaOferta?: string } = {}) {
  const sedeOferta = opciones.sedeDeLaOferta ?? 'centro';
  const ofertas = new Map([['o1', { id: 'o1', disponible: 2, sedeId: sedeOferta }]]);
  const reservas = new Map<string, ReservaFalsa>(
    (opciones.reservas ?? [{}]).map((r, i) => [
      r.id ?? `r${i + 1}`,
      { id: `r${i + 1}`, ofertaId: 'o1', consumidorId: 'c1', cantidad: 3, estado: 'RESERVADA', plazoRetiro: bogota('20:00'), ...r },
    ]),
  );
  const consultas: Array<Record<string, any>> = [];
  const completa = (r: ReservaFalsa) => ({
    ...r,
    oferta: { id: 'o1', producto: 'Pan', precioOferta: 4000, sedeId: sedeOferta, sede: { id: sedeOferta, nombre: 'Sede' } },
    consumidor: { id: r.consumidorId, nombre: 'Ana' },
  });
  const reserva = {
    findFirst: async ({ where }: any) => {
      const r = reservas.get(where.id);
      return r && r.consumidorId === where.consumidorId ? { ...r } : null;
    },
    findUnique: async ({ where }: any) => {
      const r = reservas.get(where.id);
      return r ? completa(r) : null;
    },
    findUniqueOrThrow: async ({ where }: any) => completa(reservas.get(where.id)!),
    updateMany: async ({ where, data }: any) => {
      const r = reservas.get(where.id);
      if (!r || r.estado !== where.estado) return { count: 0 };
      r.estado = data.estado;
      return { count: 1 };
    },
    findMany: async (args: any) => {
      consultas.push(args);
      return [];
    },
  };
  const oferta = {
    update: async ({ where, data }: any) => {
      ofertas.get(where.id)!.disponible += data.disponible.increment;
      return ofertas.get(where.id);
    },
  };
  const tx = { reserva, oferta };
  const prisma = { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx), reserva } as unknown as PrismaService;
  const propias = opciones.sedesDelUsuario ?? ['centro'];
  const sedes = { delUsuario: jest.fn(async () => propias.map((id) => ({ id, nombre: id }))) } as unknown as SedesService;
  const lineas: string[] = [];
  const logger = new EventLogger();
  logger.salida = (l) => lineas.push(l);
  const eventos = () => lineas.map((l) => JSON.parse(l)).filter((l) => l.tipo === 'evento');
  return { servicio: new ReservasService(prisma, sedes, logger), reservas, ofertas, consultas, eventos, sedes };
}

async function codigoDelRechazo(promesa: Promise<unknown>): Promise<string> {
  try {
    await promesa;
  } catch (error) {
    return (error as ErrorNegocio).codigo ?? `error: ${(error as Error).message}`;
  }
  throw new Error('No fue rechazada');
}

describe('ReservasService.cancelar (SWR-RES-011)', () => {
  it('cancela, devuelve las unidades al inventario y registra el evento', async () => {
    const { servicio, reservas, ofertas, eventos } = armar();

    const resultado = await servicio.cancelar('c1', 'r1', bogota('18:00'));

    expect(resultado.estado).toBe('CANCELADA');
    expect(reservas.get('r1')?.estado).toBe('CANCELADA');
    expect(ofertas.get('o1')?.disponible).toBe(5); // 2 + 3 devueltas
    expect(eventos().map((e) => e.evento)).toEqual(['RESERVA_CANCELADA']);
  });

  it('una reserva ajena responde igual que una inexistente (404) y no toca nada', async () => {
    const { servicio, ofertas, reservas } = armar();

    expect(await codigoDelRechazo(servicio.cancelar('otro', 'r1', bogota('18:00')))).toBe('RESERVA_NO_ENCONTRADA');
    expect(await codigoDelRechazo(servicio.cancelar('c1', 'no-existe', bogota('18:00')))).toBe('RESERVA_NO_ENCONTRADA');
    expect(ofertas.get('o1')?.disponible).toBe(2);
    expect(reservas.get('r1')?.estado).toBe('RESERVADA');
  });

  it.each(['ENTREGADA', 'CANCELADA'] as const)('rechaza con RESERVA_NO_CANCELABLE si ya está %s y no devuelve unidades', async (estado) => {
    const { servicio, ofertas, eventos } = armar({ reservas: [{ estado }] });

    expect(await codigoDelRechazo(servicio.cancelar('c1', 'r1', bogota('18:00')))).toBe('RESERVA_NO_CANCELABLE');
    expect(ofertas.get('o1')?.disponible).toBe(2);
    expect(eventos()).toEqual([expect.objectContaining({ evento: 'RESERVA_RECHAZADA', accion: 'cancelar', motivo: 'RESERVA_NO_CANCELABLE' })]);
  });

  it('rechaza con el plazo vencido, incluida la frontera, y no devuelve unidades', async () => {
    const { servicio, ofertas } = armar();

    expect(await codigoDelRechazo(servicio.cancelar('c1', 'r1', bogota('20:00')))).toBe('RESERVA_NO_CANCELABLE');
    expect(await codigoDelRechazo(servicio.cancelar('c1', 'r1', bogota('21:00')))).toBe('RESERVA_NO_CANCELABLE');
    expect(ofertas.get('o1')?.disponible).toBe(2);
  });

  it('dos cancelaciones simultáneas de la misma reserva: una se aplica y las unidades vuelven una sola vez', async () => {
    const { servicio, ofertas } = armar();

    const resultados = await Promise.allSettled([
      servicio.cancelar('c1', 'r1', bogota('18:00')),
      servicio.cancelar('c1', 'r1', bogota('18:00')),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazada = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect((rechazada.reason as ErrorNegocio).codigo).toBe('RESERVA_NO_CANCELABLE');
    expect(ofertas.get('o1')?.disponible).toBe(5); // 2 + 3, no 2 + 6
  });

  it('cancelar y entregar a la vez: gana uno solo y el inventario es coherente con el resultado', async () => {
    const { servicio, reservas, ofertas } = armar();

    const [cancelacion, entrega] = await Promise.allSettled([
      servicio.cancelar('c1', 'r1', bogota('18:00')),
      servicio.entregar('personal', 'r1'),
    ]);

    expect([cancelacion.status, entrega.status].filter((s) => s === 'fulfilled')).toHaveLength(1);
    if (cancelacion.status === 'fulfilled') {
      expect(reservas.get('r1')?.estado).toBe('CANCELADA');
      expect(ofertas.get('o1')?.disponible).toBe(5);
    } else {
      expect(reservas.get('r1')?.estado).toBe('ENTREGADA');
      expect(ofertas.get('o1')?.disponible).toBe(2);
    }
  });
});

describe('ReservasService.entregar (SWR-RES-015)', () => {
  it('marca la reserva ENTREGADA en una sede del usuario y registra el evento con el consumidor', async () => {
    const { servicio, reservas, eventos } = armar();

    const resultado = await servicio.entregar('personal', 'r1');

    expect(resultado.estado).toBe('ENTREGADA');
    expect(reservas.get('r1')?.estado).toBe('ENTREGADA');
    expect(eventos()).toEqual([expect.objectContaining({ evento: 'RESERVA_ENTREGADA', consumidorId: 'c1', usuarioId: 'personal' })]);
  });

  it('una reserva de otra sede se rechaza con PROHIBIDO y no cambia de estado', async () => {
    const { servicio, reservas, eventos } = armar({ sedesDelUsuario: ['norte'], sedeDeLaOferta: 'centro' });

    expect(await codigoDelRechazo(servicio.entregar('personal', 'r1'))).toBe('PROHIBIDO');
    expect(reservas.get('r1')?.estado).toBe('RESERVADA');
    expect(eventos().map((e) => e.evento)).toEqual(['ACCESO_DENEGADO']);
  });

  it('una reserva inexistente responde RESERVA_NO_ENCONTRADA', async () => {
    const { servicio } = armar();

    expect(await codigoDelRechazo(servicio.entregar('personal', 'no-existe'))).toBe('RESERVA_NO_ENCONTRADA');
  });

  it.each(['ENTREGADA', 'CANCELADA'] as const)('una reserva %s no se puede entregar (RESERVA_NO_ENTREGABLE)', async (estado) => {
    const { servicio, reservas } = armar({ reservas: [{ estado }] });

    expect(await codigoDelRechazo(servicio.entregar('personal', 'r1'))).toBe('RESERVA_NO_ENTREGABLE');
    expect(reservas.get('r1')?.estado).toBe(estado);
  });

  it('se puede entregar aunque el plazo ya haya vencido (no hay expiración automática en el MVP)', async () => {
    const { servicio } = armar({ reservas: [{ plazoRetiro: new Date('2000-01-01T00:00:00Z') }] });

    expect((await servicio.entregar('personal', 'r1')).estado).toBe('ENTREGADA');
  });

  it('dos entregas simultáneas: una se aplica y la otra recibe RESERVA_NO_ENTREGABLE', async () => {
    const { servicio } = armar();

    const resultados = await Promise.allSettled([servicio.entregar('personal', 'r1'), servicio.entregar('dueno', 'r1')]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(((resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason as ErrorNegocio).codigo).toBe('RESERVA_NO_ENTREGABLE');
  });
});

describe('listados de reservas (dependencia implícita d)', () => {
  it('listarMias filtra por el consumidor', async () => {
    const { servicio, consultas } = armar();

    await servicio.listarMias('c1');

    expect(consultas[0].where).toEqual({ consumidorId: 'c1' });
  });

  it('listarDeSede sin sedeId usa todas las sedes del usuario', async () => {
    const { servicio, consultas } = armar({ sedesDelUsuario: ['centro', 'norte'] });

    await servicio.listarDeSede('dueno', {});

    expect(consultas[0].where).toEqual({ oferta: { sedeId: { in: ['centro', 'norte'] } } });
  });

  it('listarDeSede con sedeId propio y estado filtra por ambos', async () => {
    const { servicio, consultas } = armar({ sedesDelUsuario: ['centro', 'norte'] });

    await servicio.listarDeSede('dueno', { sedeId: 'norte', estado: 'RESERVADA' });

    expect(consultas[0].where).toEqual({ oferta: { sedeId: { in: ['norte'] } }, estado: 'RESERVADA' });
  });

  it('listarDeSede con una sede ajena responde PROHIBIDO y no consulta reservas', async () => {
    const { servicio, consultas } = armar({ sedesDelUsuario: ['centro'] });

    expect(await codigoDelRechazo(servicio.listarDeSede('personal', { sedeId: 'norte' }))).toBe('PROHIBIDO');
    expect(consultas).toHaveLength(0);
  });

  it('listarDeSede de un usuario sin sedes devuelve una lista vacía sin consultar', async () => {
    const { servicio, consultas } = armar({ sedesDelUsuario: [] });

    expect(await servicio.listarDeSede('personal', {})).toEqual([]);
    expect(consultas).toHaveLength(0);
  });
});
