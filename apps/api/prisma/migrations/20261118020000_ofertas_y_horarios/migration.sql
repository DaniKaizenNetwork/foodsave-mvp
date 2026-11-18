-- CreateEnum
CREATE TYPE "EstadoOferta" AS ENUM ('ACTIVA', 'CERRADA', 'AGOTADA');

-- CreateTable
CREATE TABLE "HorarioSede" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "apertura" TEXT NOT NULL,
    "cierre" TEXT NOT NULL,

    CONSTRAINT "HorarioSede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oferta" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "precioOriginal" INTEGER NOT NULL,
    "precioOferta" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "disponible" INTEGER NOT NULL,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoOferta" NOT NULL DEFAULT 'ACTIVA',
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Oferta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HorarioSede_sedeId_diaSemana_key" ON "HorarioSede"("sedeId", "diaSemana");

-- CreateIndex
CREATE INDEX "Oferta_sedeId_estado_idx" ON "Oferta"("sedeId", "estado");

-- AddForeignKey
ALTER TABLE "HorarioSede" ADD CONSTRAINT "HorarioSede_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Restricciones de inventario que Prisma no expresa en el esquema:
-- el inventario nunca es negativo ni supera la cantidad publicada.
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_disponible_check" CHECK ("disponible" >= 0 AND "disponible" <= "cantidad");

-- Regla de CLAUDE.md: toda tabla nueva activa RLS (sin políticas) en la misma migración
-- que la crea, para que la API REST de Supabase (anon/authenticated) no pueda leerla ni escribirla.
ALTER TABLE "HorarioSede" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Oferta" ENABLE ROW LEVEL SECURITY;
