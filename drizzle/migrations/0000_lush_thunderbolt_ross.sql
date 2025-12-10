CREATE TYPE "public"."frequency" AS ENUM('Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Annually', 'Annual', 'OneTime');--> statement-breakpoint
CREATE TYPE "public"."loan_purpose" AS ENUM('PropertyPurchase', 'Renovation', 'Investment', 'Other');--> statement-breakpoint
CREATE TYPE "public"."loan_structure" AS ENUM('InterestOnly', 'PrincipalAndInterest');--> statement-breakpoint
CREATE TYPE "public"."loan_type" AS ENUM('EquityLoan', 'PrincipalLoan');--> statement-breakpoint
CREATE TYPE "public"."ownership_structure" AS ENUM('Trust', 'Individual', 'Company', 'Partnership');--> statement-breakpoint
CREATE TYPE "public"."portfolio_type" AS ENUM('Normal', 'Trust', 'Company');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('Actual', 'Projected');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('Residential', 'Commercial', 'Industrial', 'Land');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'suspended', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."usage_type" AS ENUM('Investment', 'PPOR');--> statement-breakpoint
CREATE TABLE "capital_expenditure" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "depreciation_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"asAtDate" timestamp NOT NULL,
	"annualAmount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_breakdown" (
	"id" serial PRIMARY KEY NOT NULL,
	"expenseLogId" integer NOT NULL,
	"category" varchar(255) NOT NULL,
	"amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"totalAmount" integer NOT NULL,
	"frequency" "frequency" NOT NULL,
	"growthRate" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extra_repayments" (
	"id" serial PRIMARY KEY NOT NULL,
	"loanId" integer NOT NULL,
	"amount" integer NOT NULL,
	"frequency" "frequency" NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp
);
--> statement-breakpoint
CREATE TABLE "growth_rate_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"startYear" integer NOT NULL,
	"endYear" integer,
	"growthRate" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interest_rate_forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"loanId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"startYear" integer NOT NULL,
	"endYear" integer,
	"forecastRate" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"basePropertyId" integer,
	"projectionYears" integer NOT NULL,
	"scenarioData" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"securityPropertyId" integer,
	"loanType" "loan_type" NOT NULL,
	"lenderName" varchar(255) NOT NULL,
	"loanPurpose" "loan_purpose" NOT NULL,
	"loanStructure" "loan_structure" NOT NULL,
	"startDate" timestamp NOT NULL,
	"originalAmount" integer NOT NULL,
	"currentAmount" integer NOT NULL,
	"interestRate" integer NOT NULL,
	"remainingTermYears" integer NOT NULL,
	"remainingIOPeriodYears" integer DEFAULT 0 NOT NULL,
	"repaymentFrequency" "frequency" NOT NULL,
	"offsetBalance" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lump_sum_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"loanId" integer NOT NULL,
	"amount" integer NOT NULL,
	"paymentDate" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"goalYear" integer NOT NULL,
	"targetEquity" integer,
	"targetCashflow" integer,
	"targetValue" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_goals_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "portfolio_type" DEFAULT 'Normal' NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"portfolioId" integer,
	"scenarioId" integer,
	"nickname" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"state" varchar(100) NOT NULL,
	"suburb" varchar(100) NOT NULL,
	"propertyType" "property_type" NOT NULL,
	"ownershipStructure" "ownership_structure" NOT NULL,
	"linkedEntity" varchar(255),
	"purchaseDate" timestamp NOT NULL,
	"purchasePrice" integer NOT NULL,
	"saleDate" timestamp,
	"salePrice" integer,
	"status" "property_status" DEFAULT 'Actual' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_ownership" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"ownerName" varchar(255) NOT NULL,
	"percentage" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_usage_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"usageType" "usage_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_valuations" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"valuationDate" timestamp NOT NULL,
	"value" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"agentFee" integer DEFAULT 0 NOT NULL,
	"stampDuty" integer DEFAULT 0 NOT NULL,
	"legalFee" integer DEFAULT 0 NOT NULL,
	"inspectionFee" integer DEFAULT 0 NOT NULL,
	"otherCosts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "purchase_costs_propertyId_unique" UNIQUE("propertyId")
);
--> statement-breakpoint
CREATE TABLE "rental_income" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"amount" integer NOT NULL,
	"frequency" "frequency" NOT NULL,
	"growthRate" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"originalPortfolioId" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "capital_expenditure" ADD CONSTRAINT "capital_expenditure_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "depreciation_schedule" ADD CONSTRAINT "depreciation_schedule_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_breakdown" ADD CONSTRAINT "expense_breakdown_expenseLogId_expense_logs_id_fk" FOREIGN KEY ("expenseLogId") REFERENCES "public"."expense_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_logs" ADD CONSTRAINT "expense_logs_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_repayments" ADD CONSTRAINT "extra_repayments_loanId_loans_id_fk" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_rate_periods" ADD CONSTRAINT "growth_rate_periods_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_rate_forecasts" ADD CONSTRAINT "interest_rate_forecasts_loanId_loans_id_fk" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_scenarios" ADD CONSTRAINT "loan_scenarios_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_scenarios" ADD CONSTRAINT "loan_scenarios_basePropertyId_properties_id_fk" FOREIGN KEY ("basePropertyId") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_securityPropertyId_properties_id_fk" FOREIGN KEY ("securityPropertyId") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lump_sum_payments" ADD CONSTRAINT "lump_sum_payments_loanId_loans_id_fk" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_goals" ADD CONSTRAINT "portfolio_goals_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_portfolioId_portfolios_id_fk" FOREIGN KEY ("portfolioId") REFERENCES "public"."portfolios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_ownership" ADD CONSTRAINT "property_ownership_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_usage_periods" ADD CONSTRAINT "property_usage_periods_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_valuations" ADD CONSTRAINT "property_valuations_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_costs" ADD CONSTRAINT "purchase_costs_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_income" ADD CONSTRAINT "rental_income_propertyId_properties_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_originalPortfolioId_portfolios_id_fk" FOREIGN KEY ("originalPortfolioId") REFERENCES "public"."portfolios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_tierId_subscription_tiers_id_fk" FOREIGN KEY ("tierId") REFERENCES "public"."subscription_tiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_subscription_tiers_name" ON "subscription_tiers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_subscriptions_user_id" ON "user_subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_tier_id" ON "user_subscriptions" USING btree ("tierId");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_status" ON "user_subscriptions" USING btree ("status");