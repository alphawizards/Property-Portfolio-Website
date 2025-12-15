CREATE TABLE "property_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"portfolioId" integer,
	"step" integer DEFAULT 1 NOT NULL,
	"data" text NOT NULL,
	"propertyNickname" varchar(255),
	"lastSavedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "capital_expenditure" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "depreciation_schedule" ALTER COLUMN "annualAmount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "expense_breakdown" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "expense_logs" ALTER COLUMN "totalAmount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "expense_logs" ALTER COLUMN "growthRate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "expense_logs" ALTER COLUMN "growthRate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "extra_repayments" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "growth_rate_periods" ALTER COLUMN "growthRate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "interest_rate_forecasts" ALTER COLUMN "forecastRate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "originalAmount" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "currentAmount" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "interestRate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "offsetBalance" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "offsetBalance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "lump_sum_payments" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "portfolio_goals" ALTER COLUMN "targetEquity" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "portfolio_goals" ALTER COLUMN "targetCashflow" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "portfolio_goals" ALTER COLUMN "targetValue" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "purchasePrice" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "salePrice" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "property_ownership" ALTER COLUMN "percentage" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "property_valuations" ALTER COLUMN "value" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "agentFee" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "agentFee" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "stampDuty" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "stampDuty" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "legalFee" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "legalFee" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "inspectionFee" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "inspectionFee" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "otherCosts" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "purchase_costs" ALTER COLUMN "otherCosts" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "rental_income" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rental_income" ALTER COLUMN "growthRate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "rental_income" ALTER COLUMN "growthRate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "property_drafts" ADD CONSTRAINT "property_drafts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_drafts" ADD CONSTRAINT "property_drafts_portfolioId_portfolios_id_fk" FOREIGN KEY ("portfolioId") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;