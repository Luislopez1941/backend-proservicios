-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('client', 'worker');

-- CreateEnum
CREATE TYPE "public"."JobUrgency" AS ENUM ('normal', 'urgent');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."ChatType" AS ENUM ('private', 'group');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('normal', 'proposal');

-- CreateEnum
CREATE TYPE "public"."ProposalStatus" AS ENUM ('active', 'canceled', 'accepted', 'finished_work', 'completed_work', 'payment_completed', 'confirmed_payment', 'payment_pending', 'payment_failed', 'payment_refunded', 'payment_expired', 'payment_cancelled');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "second_name" VARCHAR(255),
    "first_surname" VARCHAR(255) NOT NULL,
    "second_last_name" VARCHAR(255),
    "country" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "profilePhoto" TEXT,
    "background" TEXT,
    "workPhotos" JSONB,
    "phone" VARCHAR(255) NOT NULL,
    "description" TEXT DEFAULT '',
    "gender" VARCHAR(50),
    "professions" JSONB,
    "starts" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "birthdate" TIMESTAMP(3),
    "completed_works" INTEGER NOT NULL DEFAULT 0,
    "paid_jobs" INTEGER NOT NULL DEFAULT 0,
    "finished_works" INTEGER NOT NULL DEFAULT 0,
    "income_month" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_total" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_month_last" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_year_last" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_total_last" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_month_last_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_year_last_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "income_total_last_year" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dni" VARCHAR(50),
    "type_user" "public"."UserType",
    "location_address" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "location_place_id" VARCHAR(255),
    "location_bounds" JSONB,
    "location_street" VARCHAR(255),
    "location_colony" VARCHAR(255),
    "location_city" VARCHAR(255),
    "location_state" VARCHAR(255),
    "location_postal_code" VARCHAR(10),
    "location_country" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "budget" JSONB NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "urgency" "public"."JobUrgency" NOT NULL DEFAULT 'normal',
    "status" "public"."JobStatus" NOT NULL DEFAULT 'open',
    "professions" JSONB NOT NULL,
    "images" JSONB,
    "price" VARCHAR(255) NOT NULL,
    "proposalsCount" INTEGER NOT NULL DEFAULT 0,
    "postedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "requirements" JSONB,
    "timeline" VARCHAR(255),
    "workType" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location_address" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "location_place_id" VARCHAR(255),
    "location_bounds" JSONB,
    "location_street" VARCHAR(255),
    "location_colony" VARCHAR(255),
    "location_city" VARCHAR(255),
    "location_state" VARCHAR(255),
    "location_postal_code" VARCHAR(10),
    "location_country" VARCHAR(255),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "id" SERIAL NOT NULL,
    "chat_type" "public"."ChatType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuer_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "message_text" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" SERIAL NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "message" TEXT,
    "title" TEXT,
    "type_message" "public"."MessageType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_sender" TEXT NOT NULL,
    "message_status" TEXT NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

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
    "rating_status_reviwer" BOOLEAN NOT NULL DEFAULT false,
    "rating_status_receiver" BOOLEAN NOT NULL DEFAULT false,
    "review_status_reviewer" BOOLEAN NOT NULL DEFAULT false,
    "review_status_receiver" BOOLEAN NOT NULL DEFAULT false,
    "rating_reviewer" INTEGER,
    "rating_receiver" INTEGER,
    "price_total" INTEGER,
    "currency" VARCHAR(3) DEFAULT 'MXN',
    "accepts_payment_methods" JSONB,

    CONSTRAINT "JobProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "comment" TEXT,
    "job_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" SERIAL NOT NULL,
    "id_location" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professions_name_key" ON "public"."professions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobProposal_message_id_key" ON "public"."JobProposal"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_job_id_key" ON "public"."reviews"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_id_location_type_key" ON "public"."locations"("id_location", "type");

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobProposal" ADD CONSTRAINT "JobProposal_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobProposal" ADD CONSTRAINT "JobProposal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
