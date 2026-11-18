-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('RESERVADA', 'ENTREGADA', 'CANCELADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "consumidorId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'RESERVADA',
    "plazoRetiro" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reserva_consumidorId_idx" ON "Reserva"("consumidorId");

-- CreateIndex
CREATE INDEX "Reserva_ofertaId_estado_idx" ON "Reserva"("ofertaId", "estado");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "Oferta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_consumidorId_fkey" FOREIGN KEY ("consumidorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Una reserva siempre reserva al menos una unidad: con cantidad <= 0 el «descuento» de
-- inventario sumaría unidades en lugar de restarlas.
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_cantidad_check" CHECK ("cantidad" > 0);

-- Regla de CLAUDE.md: toda tabla nueva activa RLS (sin políticas) en la misma migración
-- que la crea, para que la API REST de Supabase (anon/authenticated) no pueda leerla ni escribirla.
ALTER TABLE "Reserva" ENABLE ROW LEVEL SECURITY;
