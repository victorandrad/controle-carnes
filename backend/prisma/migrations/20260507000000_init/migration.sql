-- CreateEnum
CREATE TYPE "CampanhaStatus" AS ENUM ('ativa', 'encerrada');

-- CreateEnum
CREATE TYPE "ParcelaStatus" AS ENUM ('pendente', 'paga');

-- CreateEnum
CREATE TYPE "CarneStatus" AS ENUM ('ativo', 'cancelado');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('dinheiro', 'pix');

-- CreateEnum
CREATE TYPE "UsuarioRole" AS ENUM ('admin', 'tesoureiro');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "UsuarioRole" NOT NULL DEFAULT 'tesoureiro',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "premio" TEXT NOT NULL,
    "data_sorteio" DATE NOT NULL,
    "valor_carne" DECIMAL(10,2) NOT NULL,
    "num_parcelas" INTEGER NOT NULL,
    "max_carnes" INTEGER NOT NULL,
    "status" "CampanhaStatus" NOT NULL DEFAULT 'ativa',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carne" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT NOT NULL,
    "participante_id" TEXT NOT NULL,
    "numero_sorte" INTEGER NOT NULL,
    "status" "CarneStatus" NOT NULL DEFAULT 'ativo',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcela" (
    "id" TEXT NOT NULL,
    "carne_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "ParcelaStatus" NOT NULL DEFAULT 'pendente',

    CONSTRAINT "parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" TEXT NOT NULL,
    "parcela_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "valor_pago" DECIMAL(10,2) NOT NULL,
    "data_pagamento" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" "MetodoPagamento" NOT NULL,
    "referencia" TEXT,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "participante_cpf_key" ON "participante"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "carne_campanha_id_numero_sorte_key" ON "carne"("campanha_id", "numero_sorte");

-- CreateIndex
CREATE UNIQUE INDEX "parcela_carne_id_numero_key" ON "parcela"("carne_id", "numero");

-- AddForeignKey
ALTER TABLE "carne" ADD CONSTRAINT "carne_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carne" ADD CONSTRAINT "carne_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcela" ADD CONSTRAINT "parcela_carne_id_fkey" FOREIGN KEY ("carne_id") REFERENCES "carne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_parcela_id_fkey" FOREIGN KEY ("parcela_id") REFERENCES "parcela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
