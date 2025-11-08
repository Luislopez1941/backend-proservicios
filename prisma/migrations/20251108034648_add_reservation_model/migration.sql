-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'rejected');

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" SERIAL NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" VARCHAR(10) NOT NULL,
    "end_time" VARCHAR(10) NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
