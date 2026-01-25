-- Backfill category as PET for all existing recipients
UPDATE "Recipient" SET "category" = 'PET' WHERE "category" IS NULL;

-- Backfill subtype from existing type field (DOG, CAT)
UPDATE "Recipient" SET "subtype" = "type"::text WHERE "subtype" IS NULL;
