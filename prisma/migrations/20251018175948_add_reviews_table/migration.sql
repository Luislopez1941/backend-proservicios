-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "finished_works" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "income_month" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_month_last" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_month_last_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_total" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_total_last" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_total_last_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_year_last" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "income_year_last_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "paid_jobs" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" SERIAL NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewed_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "job_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reviewer_id_reviewed_id_job_id_key" ON "public"."reviews"("reviewer_id", "reviewed_id", "job_id");

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewed_id_fkey" FOREIGN KEY ("reviewed_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
