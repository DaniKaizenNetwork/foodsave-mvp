/**
 * Semillas de FoodSave. Uso: `npm run seed` (demo) o `npm run seed:test` (sin ofertas).
 * Borra y recarga los datos: solo se ejecuta si el .env local tiene SEED_ALLOW_RESET=true.
 * `demo` además publica dos ofertas («Pan integral» y «Tajada de torta»); `test` deja el
 * sistema sin ofertas para que las pruebas creen las suyas.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { hashPassword } from '../auth/password';
import { PrismaClient } from '../generated/prisma/client';
import { verificarPermisoReinicio } from './seed-guard';

config({ path: ['.env', '../../.env'], quiet: true });

async function main(): Promise<void> {
  const modo = process.argv[2];
  if (modo !== 'demo' && modo !== 'test') {
    console.error('Uso: seed.ts <demo|test>');
    process.exit(1);
  }

  const permiso = verificarPermisoReinicio(process.env);
  if (!permiso.permitido) {
    console.error(permiso.motivo);
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    // Orden por dependencias: primero lo que referencia a lo demás.
    await prisma.$transaction([
      prisma.reserva.deleteMany(),
      prisma.oferta.deleteMany(),
      prisma.horarioSede.deleteMany(),
      prisma.usuario.deleteMany(),
      prisma.sede.deleteMany(),
      prisma.comercio.deleteMany(),
    ]);

    const comercio = await prisma.comercio.create({
      data: {
        nombre: 'Comercio Demo FoodSave',
        sedes: {
          create: [
            { nombre: 'Sede Centro', direccion: 'Centro, Neiva', abierta24h: true },
            { nombre: 'Sede Norte', direccion: 'Norte, Neiva', abierta24h: false },
          ],
        },
      },
      include: { sedes: true },
    });
    const sedeCentro = comercio.sedes.find((sede) => sede.nombre === 'Sede Centro');
    const sedeNorte = comercio.sedes.find((sede) => sede.nombre === 'Sede Norte');
    if (!sedeCentro || !sedeNorte) throw new Error('No se crearon las sedes');

    // Sede Norte no es 24 h: horario los 7 días (0 = domingo ... 6 = sábado), cierre 20:00.
    await prisma.horarioSede.createMany({
      data: Array.from({ length: 7 }, (_, diaSemana) => ({
        sedeId: sedeNorte.id,
        diaSemana,
        apertura: '08:00',
        cierre: '20:00',
      })),
    });

    const passwordHash = await hashPassword(process.env.SEED_PASSWORD as string);
    await prisma.usuario.createMany({
      data: [
        { nombre: 'Dueño Demo', correo: 'dueno@foodsave.test', rol: 'DUENO', comercioId: comercio.id, passwordHash },
        { nombre: 'Personal Demo', correo: 'personal@foodsave.test', rol: 'PERSONAL', sedeId: sedeCentro.id, passwordHash },
        { nombre: 'Consumidor Uno', correo: 'consumidor1@foodsave.test', rol: 'CONSUMIDOR', passwordHash },
        { nombre: 'Consumidor Dos', correo: 'consumidor2@foodsave.test', rol: 'CONSUMIDOR', passwordHash },
        { nombre: 'Administrador Demo', correo: 'admin@foodsave.test', rol: 'ADMIN', passwordHash },
      ],
    });

    let ofertas = 0;
    if (modo === 'demo') {
      const dueno = await prisma.usuario.findUniqueOrThrow({ where: { correo: 'dueno@foodsave.test' } });
      const vencimiento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // dentro de 3 días
      await prisma.oferta.createMany({
        data: [
          { producto: 'Pan integral', precioOriginal: 8000, precioOferta: 4000, cantidad: 5 },
          { producto: 'Tajada de torta', precioOriginal: 6000, precioOferta: 3000, cantidad: 3 },
        ].map((oferta) => ({
          ...oferta,
          disponible: oferta.cantidad,
          vencimiento,
          sedeId: sedeCentro.id,
          creadoPorId: dueno.id,
        })),
      });
      ofertas = 2;
    }

    console.log(
      `Semilla «${modo}» cargada: 1 comercio, 2 sedes (7 horarios en Sede Norte), 5 usuarios y ${ofertas} ofertas.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Error al ejecutar la semilla:', error instanceof Error ? error.message : error);
  process.exit(1);
});
