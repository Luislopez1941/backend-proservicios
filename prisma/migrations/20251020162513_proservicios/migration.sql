/*
  Warnings:

  - You are about to drop the `jobproposals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."jobproposals" DROP CONSTRAINT "jobproposals_message_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobproposals" DROP CONSTRAINT "jobproposals_user_id_fkey";

-- DropTable
DROP TABLE "public"."jobproposals";

-- CreateTable
CREATE TABLE "public"."JobProposal" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "images" JSONB,
    "status" "public"."ProposalStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating_status" BOOLEAN NOT NULL DEFAULT false,
    "review_status" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "JobProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobProposal_message_id_key" ON "public"."JobProposal"("message_id");

-- AddForeignKey
ALTER TABLE "public"."JobProposal" ADD CONSTRAINT "JobProposal_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobProposal" ADD CONSTRAINT "JobProposal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
