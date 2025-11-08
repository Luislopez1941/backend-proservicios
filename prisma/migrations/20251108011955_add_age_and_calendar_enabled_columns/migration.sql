-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "age" INTEGER;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "calendar_enabled" BOOLEAN NOT NULL DEFAULT false;