CREATE TYPE "public"."feedback_category" AS ENUM('Bug', 'Feature Request', 'General', 'Complaint', 'Praise', 'Other');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('New', 'In Progress', 'Resolved', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_ANNUAL');--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'canceled' BEFORE 'suspended';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'past_due' BEFORE 'suspended';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'trialing' BEFORE 'suspended';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'incomplete' BEFORE 'suspended';--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"category" "feedback_category" NOT NULL,
	"rating" integer,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"userEmail" varchar(320),
	"userName" varchar(255),
	"source" varchar(50) NOT NULL,
	"status" "feedback_status" DEFAULT 'New' NOT NULL,
	"metadata" text,
	"adminNotes" text,
	"resolvedAt" timestamp,
	"resolvedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loan_scenarios" ADD COLUMN "propertyId" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscriptionTier" "subscription_tier" DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscriptionStatus" "subscription_status";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscriptionEndDate" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripeSubscriptionId" varchar(255);--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_resolvedBy_users_id_fk" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_scenarios" ADD CONSTRAINT "loan_scenarios_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;