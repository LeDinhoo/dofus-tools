-- Migration pour ajouter les EquipmentSets
-- Garder les items de l'hôtel de vente, réinitialiser les équipements

-- 1. Supprimer l'ancienne table equipment (les données seront perdues)
DROP TABLE IF EXISTS "equipment";

-- 2. Créer la table equipment_set
CREATE TABLE IF NOT EXISTS "equipment_set" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Équipement',
    "includeInObjective" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_set_pkey" PRIMARY KEY ("id")
);

-- 3. Créer la nouvelle table equipment avec référence à equipment_set
CREATE TABLE IF NOT EXISTS "equipment" (
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

-- 4. Ajouter les contraintes
ALTER TABLE "equipment_set" ADD CONSTRAINT "equipment_set_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "equipment" ADD CONSTRAINT "equipment_setId_fkey"
    FOREIGN KEY ("setId") REFERENCES "equipment_set"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Ajouter l'index unique
CREATE UNIQUE INDEX "equipment_setId_slot_key" ON "equipment"("setId", "slot");
