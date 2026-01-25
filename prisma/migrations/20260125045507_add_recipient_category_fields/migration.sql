-- CreateEnum
CREATE TYPE "RecipientCategory" AS ENUM ('PET', 'PLANT', 'PERSON');

-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN "category" "RecipientCategory",
ADD COLUMN "subtype" TEXT,
ADD COLUMN "plantSpecies" TEXT,
ADD COLUMN "sunlight" TEXT,
ADD COLUMN "waterFrequency" TEXT,
ADD COLUMN "relationship" TEXT;
