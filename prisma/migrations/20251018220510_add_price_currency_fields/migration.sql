-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "accepts_payment_methods" JSONB,
ADD COLUMN     "currency" VARCHAR(3) DEFAULT 'MXN',
ADD COLUMN     "daily_rate" INTEGER,
ADD COLUMN     "hourly_rate" INTEGER,
ADD COLUMN     "project_rate" INTEGER,
ALTER COLUMN "rating" SET DEFAULT 0.0;
