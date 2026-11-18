/**
 * Semillas de FoodSave. Uso: `npm run seed` (demo) o `npm run seed:test` (sin ofertas).
 * Borra y recarga los datos: solo se ejecuta si el .env local tiene SEED_ALLOW_RESET=true.
 * Las ofertas de la semilla demo («Pan integral», «Tajada de torta») se añaden con el
 * modelo de ofertas en feature/ofertas-api.
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
    // Orden por dependencias; las ramas siguientes añaden aquí reservas, ofertas y horarios.
    await prisma.$transaction([
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
    if (!sedeCentro) throw new Error('No se creó la Sede Centro');

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

    console.log(`Semilla «${modo}» cargada: 1 comercio, 2 sedes y 5 usuarios.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Error al ejecutar la semilla:', error instanceof Error ? error.message : error);
  process.exit(1);
});
