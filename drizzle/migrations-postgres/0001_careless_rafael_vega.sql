ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionTier" varchar(50) DEFAULT 'FREE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionStatus" varchar(50) DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionEndDate" timestamp;
