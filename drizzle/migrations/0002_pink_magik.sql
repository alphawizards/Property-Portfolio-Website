CREATE TYPE "public"."asset_type" AS ENUM('Cash', 'Stock', 'Crypto', 'Vehicle', 'Property', 'Other');--> statement-breakpoint
CREATE TYPE "public"."contribution_frequency" AS ENUM('Monthly', 'Annually', 'OneTime');--> statement-breakpoint
CREATE TYPE "public"."liability_type" AS ENUM('CreditCard', 'PersonalLoan', 'StudentLoan', 'AutoLoan', 'Other');--> statement-breakpoint
CREATE TYPE "public"."payment_frequency" AS ENUM('Monthly', 'Fortnightly', 'Weekly');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"scenarioId" integer,
	"name" varchar(255) NOT NULL,
	"type" "asset_type" DEFAULT 'Cash' NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'AUD' NOT NULL,
	"growthRate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"contributionAmount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"contributionFrequency" "contribution_frequency" DEFAULT 'Monthly' NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"scenarioId" integer,
	"name" varchar(255) NOT NULL,
	"type" "liability_type" DEFAULT 'Other' NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"interestRate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"paymentAmount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"paymentFrequency" "payment_frequency" DEFAULT 'Monthly' NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_scenarioId_scenarios_id_fk" FOREIGN KEY ("scenarioId") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_scenarioId_scenarios_id_fk" FOREIGN KEY ("scenarioId") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assets_user_id" ON "assets" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_assets_scenario_id" ON "assets" USING btree ("scenarioId");--> statement-breakpoint
CREATE INDEX "idx_liabilities_user_id" ON "liabilities" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_liabilities_scenario_id" ON "liabilities" USING btree ("scenarioId");