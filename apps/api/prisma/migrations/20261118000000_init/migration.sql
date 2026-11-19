-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CONSUMIDOR', 'PERSONAL', 'DUENO', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoComercio" AS ENUM ('APROBADO');

-- CreateTable
CREATE TABLE "Comercio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EstadoComercio" NOT NULL DEFAULT 'APROBADO',

    CONSTRAINT "Comercio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "abierta24h" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "sedeId" TEXT,
    "comercioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- AddForeignKey
ALTER TABLE "Sede" ADD CONSTRAINT "Sede_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

