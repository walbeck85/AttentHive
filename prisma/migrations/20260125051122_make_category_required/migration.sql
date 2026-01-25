-- Make category column required (NOT NULL)
-- This is safe because Phase 2 backfilled all existing records
ALTER TABLE "Recipient" ALTER COLUMN "category" SET NOT NULL;
