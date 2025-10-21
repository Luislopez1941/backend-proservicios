ALTER TABLE "JobProposal" ADD COLUMN IF NOT EXISTS "rating_reviewer" INTEGER;
ALTER TABLE "JobProposal" ADD COLUMN IF NOT EXISTS "rating_receiver" INTEGER;
