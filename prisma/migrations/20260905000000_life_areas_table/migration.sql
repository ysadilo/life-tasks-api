-- Replace the fixed LifeArea enum with a per-board, user-manageable table.
-- Free up the "LifeArea" name (a table implicitly claims a row type with the
-- same name) by renaming the enum, then converting the existing column to
-- plain text so the old values survive to backfill the new relation.
ALTER TYPE "LifeArea" RENAME TO "LifeArea_old_enum";
ALTER TABLE "Task" ALTER COLUMN "area" TYPE TEXT USING "area"::text;
DROP TYPE "LifeArea_old_enum";

-- CreateTable
CREATE TABLE "LifeArea" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifeArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LifeArea_boardId_name_key" ON "LifeArea"("boardId", "name");

-- CreateIndex
CREATE INDEX "LifeArea_boardId_order_idx" ON "LifeArea"("boardId", "order");

-- Seed each existing board with the 5 areas it used to have as enum values.
INSERT INTO "LifeArea" ("id", "boardId", "name", "order")
SELECT gen_random_uuid()::text, b."id", v.name, v.ord
FROM "Board" b
CROSS JOIN (VALUES ('Home', 0), ('Health', 1), ('Money', 2), ('Social', 3), ('Admin', 4)) AS v(name, ord);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "areaId" TEXT;

-- Backfill from the old text values onto the matching seeded row for that board.
UPDATE "Task" t
SET "areaId" = la."id"
FROM "LifeArea" la
WHERE la."boardId" = t."boardId" AND lower(la."name") = t."area" AND t."area" IS NOT NULL;

ALTER TABLE "Task" DROP COLUMN "area";

-- CreateIndex
CREATE INDEX "Task_areaId_idx" ON "Task"("areaId");

-- AddForeignKey
ALTER TABLE "LifeArea" ADD CONSTRAINT "LifeArea_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LifeArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
