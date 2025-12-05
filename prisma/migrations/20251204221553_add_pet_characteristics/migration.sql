-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN     "characteristics" TEXT[] DEFAULT ARRAY[]::TEXT[];
