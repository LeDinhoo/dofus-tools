-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "kamasApres" DOUBLE PRECISION,
ADD COLUMN     "kamasAvant" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "equipment_set" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Équipement',
    "includeInObjective" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "setId" INTEGER NOT NULL,
    "slot" TEXT NOT NULL,
    "itemData" JSONB NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "bought" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_setId_slot_key" ON "equipment"("setId", "slot");

-- AddForeignKey
ALTER TABLE "equipment_set" ADD CONSTRAINT "equipment_set_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_setId_fkey" FOREIGN KEY ("setId") REFERENCES "equipment_set"("id") ON DELETE CASCADE ON UPDATE CASCADE;
