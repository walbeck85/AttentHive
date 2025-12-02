/*
  Warnings:

  - You are about to drop the column `timestamp` on the `CareLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CareLog_timestamp_idx";

-- AlterTable
ALTER TABLE "CareLog" DROP COLUMN "timestamp";

-- CreateIndex
CREATE INDEX "CareLog_createdAt_idx" ON "CareLog"("createdAt");
