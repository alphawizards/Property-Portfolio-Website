CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'suspended', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "subscription_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"displayName" varchar(100) NOT NULL,
	"description" text,
	"maxProperties" integer DEFAULT 0 NOT NULL,
	"maxForecastYears" integer DEFAULT 10 NOT NULL,
	"canUseAdvancedAnalytics" boolean DEFAULT false NOT NULL,
	"canUseScenarioComparison" boolean DEFAULT false NOT NULL,
	"canExportReports" boolean DEFAULT false NOT NULL,
	"canUseTaxCalculator" boolean DEFAULT false NOT NULL,
	"priceMonthly" numeric(10, 2) DEFAULT '0' NOT NULL,
	"priceYearly" numeric(10, 2) DEFAULT '0' NOT NULL,
	"stripePriceIdMonthly" varchar(255),
	"stripePriceIdYearly" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tierId" integer NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"startDate" timestamp DEFAULT now() NOT NULL,
	"endDate" timestamp,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"cancelledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"stripeCustomerId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_tierId_subscription_tiers_id_fk" FOREIGN KEY ("tierId") REFERENCES "public"."subscription_tiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_subscription_tiers_name" ON "subscription_tiers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_subscriptions_user_id" ON "user_subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_tier_id" ON "user_subscriptions" USING btree ("tierId");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_status" ON "user_subscriptions" USING btree ("status");