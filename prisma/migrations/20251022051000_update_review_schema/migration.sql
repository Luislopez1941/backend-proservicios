-- AlterTable
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_reviewer_id_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_reviewed_id_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "unique_review_per_job";

-- DropIndex
DROP INDEX IF EXISTS "unique_review_per_job";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "reviewer_id";
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "reviewed_id";
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "rating";

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "unique_review_per_user_job" ON "reviews"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
