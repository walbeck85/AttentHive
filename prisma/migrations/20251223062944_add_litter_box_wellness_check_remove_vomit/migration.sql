-- AlterEnum
-- Add new values LITTER_BOX and WELLNESS_CHECK, remove VOMIT
-- Note: Any existing VOMIT records should be migrated to ACCIDENT before running this migration

BEGIN;

-- First, convert any VOMIT records to ACCIDENT (safe migration)
UPDATE "CareLog" SET "activityType" = 'ACCIDENT' WHERE "activityType" = 'VOMIT';

-- Create new enum type with updated values
CREATE TYPE "ActivityType_new" AS ENUM ('FEED', 'WALK', 'MEDICATE', 'BATHROOM', 'ACCIDENT', 'LITTER_BOX', 'WELLNESS_CHECK');

-- Alter the column to use the new enum
ALTER TABLE "CareLog" ALTER COLUMN "activityType" TYPE "ActivityType_new" USING ("activityType"::text::"ActivityType_new");

-- Drop old enum and rename new one
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "ActivityType_old";

COMMIT;
