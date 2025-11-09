-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "from_user_id" INTEGER;

-- CreateIndex
CREATE INDEX "notifications_from_user_id_idx" ON "public"."notifications"("from_user_id");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
