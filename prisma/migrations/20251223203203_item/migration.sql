/*
  Warnings:

  - You are about to drop the column `imgUrl` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `recette` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HdvItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `benefit` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nom` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prixAchat` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HdvItem" DROP CONSTRAINT "HdvItem_itemId_fkey";

-- DropIndex
DROP INDEX "Item_name_key";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "imgUrl",
DROP COLUMN "level",
DROP COLUMN "name",
DROP COLUMN "recette",
DROP COLUMN "timestamp",
ADD COLUMN     "benefit" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "prixAchat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "prixVente" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "size" DOUBLE PRECISION,
ADD COLUMN     "statusVente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "superType" TEXT,
ADD COLUMN     "unit" DOUBLE PRECISION;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "HdvItem";

-- DropTable
DROP TABLE "Resource";
