-- Make pet-specific fields optional to support different pet subtypes
-- FISH only needs name, BIRD doesn't need weight, etc.

-- AlterTable: Make type optional (subtype is now the preferred identifier)
ALTER TABLE "Recipient" ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable: Make breed optional (not needed for FISH)
ALTER TABLE "Recipient" ALTER COLUMN "breed" DROP NOT NULL;

-- AlterTable: Make birthDate optional (not needed for FISH)
ALTER TABLE "Recipient" ALTER COLUMN "birthDate" DROP NOT NULL;

-- AlterTable: Make weight optional (not needed for BIRD or FISH)
ALTER TABLE "Recipient" ALTER COLUMN "weight" DROP NOT NULL;

-- AlterTable: Make gender optional (not needed for FISH)
ALTER TABLE "Recipient" ALTER COLUMN "gender" DROP NOT NULL;
