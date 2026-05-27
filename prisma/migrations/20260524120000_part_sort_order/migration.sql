-- Parts master: custom display order

ALTER TABLE "parts" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC, "createdAt" ASC) - 1 AS rn
  FROM "parts"
)
UPDATE "parts" SET "sortOrder" = ranked.rn FROM ranked WHERE "parts".id = ranked.id;

CREATE INDEX "parts_sortOrder_idx" ON "parts"("sortOrder");
