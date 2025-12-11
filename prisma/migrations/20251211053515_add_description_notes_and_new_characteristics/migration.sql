-- CreateEnum
CREATE TYPE "PetCharacteristic" AS ENUM ('AGGRESSIVE', 'ALLERGIES', 'BLIND', 'DEAF', 'MEDICATIONS', 'MOBILITY_ISSUES', 'REACTIVE', 'SEPARATION_ANXIETY', 'SHY');

-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN     "description" TEXT,
ADD COLUMN     "specialNotes" TEXT;
