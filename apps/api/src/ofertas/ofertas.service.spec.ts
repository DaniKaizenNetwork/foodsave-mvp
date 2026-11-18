import { ErrorNegocio } from '../common/errores';
import { EventLogger } from '../common/logging/event-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { OfertasService } from './ofertas.service';
import { SedesService } from './sedes.service';

const dto = {
  producto: 'Pan integral',
  precioOriginal: 8000,
  precioOferta: 4000,
  cantidad: 5,
  vencimiento: new Date('2030-01-01T12:00:00.000Z'),
  sedeId: 'centro',
};

function armar(sedesPermitidas: { id: string; nombre: string }[]) {
  const crear = jest.fn().mockResolvedValue({ id: 'o1', sedeId: 'centro' });
  const prisma = { oferta: { create: crear } } as unknown as PrismaService;
  const sedes = { delUsuario: jest.fn().mockResolvedValue(sedesPermitidas) } as unknown as SedesService;
  const logger = new EventLogger();
  logger.salida = () => undefined;
  return { servicio: new OfertasService(prisma, sedes, logger), crear };
}

async function codigoDelRechazo(promesa: Promise<unknown>): Promise<string> {
  try {
    await promesa;
  } catch (error) {
    return (error as ErrorNegocio).codigo;
  }
  throw new Error('No fue rechazada');
}

describe('OfertasService.publicar (SWR-OFE-001, SWR-OFE-003, SWR-AUTH-010)', () => {
  it('crea la oferta ACTIVA con disponible igual a la cantidad en una sede del usuario', async () => {
    const { servicio, crear } = armar([{ id: 'centro', nombre: 'Sede Centro' }]);

    await servicio.publicar('u1', dto);

    expect(crear).toHaveBeenCalledTimes(1);
    expect(crear.mock.calls[0][0].data).toMatchObject({
      sedeId: 'centro',
      cantidad: 5,
      disponible: 5,
      estado: 'ACTIVA',
      creadoPorId: 'u1',
    });
  });

  it('rechaza con PROHIBIDO una sede que no es del usuario y no crea nada', async () => {
    const { servicio, crear } = armar([{ id: 'norte', nombre: 'Sede Norte' }]);

    expect(await codigoDelRechazo(servicio.publicar('u1', dto))).toBe('PROHIBIDO');
    expect(crear).not.toHaveBeenCalled();
  });

  it('rechaza con el código de validarOferta y no crea nada', async () => {
    const { servicio, crear } = armar([{ id: 'centro', nombre: 'Sede Centro' }]);

    expect(await codigoDelRechazo(servicio.publicar('u1', { ...dto, precioOferta: 8000 }))).toBe('PRECIO_INVALIDO');
    expect(await codigoDelRechazo(servicio.publicar('u1', { ...dto, cantidad: 0 }))).toBe('CANTIDAD_INVALIDA');
    expect(crear).not.toHaveBeenCalled();
  });

  it('comprueba la sede antes que las reglas de negocio (403 antes que 400)', async () => {
    const { servicio } = armar([]);

    expect(await codigoDelRechazo(servicio.publicar('u1', { ...dto, cantidad: 0 }))).toBe('PROHIBIDO');
  });
});
