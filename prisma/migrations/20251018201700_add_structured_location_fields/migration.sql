-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "location_city" VARCHAR(255),
ADD COLUMN     "location_colony" VARCHAR(255),
ADD COLUMN     "location_country" VARCHAR(255),
ADD COLUMN     "location_postal_code" VARCHAR(10),
ADD COLUMN     "location_state" VARCHAR(255),
ADD COLUMN     "location_street" VARCHAR(255);
