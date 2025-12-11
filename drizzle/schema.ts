/**
 * Complete PostgreSQL Schema
 * Full property portfolio schema adapted for PostgreSQL
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum('role', ['user', 'admin']);
// Updated to match code usage (canceled vs cancelled) and added missing statuses
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'trialing', 'incomplete', 'suspended', 'expired', 'cancelled']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['FREE', 'PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']);

export const portfolioTypeEnum = pgEnum('portfolio_type', ['Normal', 'Trust', 'Company']);
export const propertyTypeEnum = pgEnum('property_type', ['Residential', 'Commercial', 'Industrial', 'Land']);
export const ownershipStructureEnum = pgEnum('ownership_structure', ['Trust', 'Individual', 'Company', 'Partnership']);
export const propertyStatusEnum = pgEnum('property_status', ['Actual', 'Projected']);
export const usageTypeEnum = pgEnum('usage_type', ['Investment', 'PPOR']);
export const loanTypeEnum = pgEnum('loan_type', ['EquityLoan', 'PrincipalLoan']);
export const loanPurposeEnum = pgEnum('loan_purpose', ['PropertyPurchase', 'Renovation', 'Investment', 'Other']);
export const loanStructureEnum = pgEnum('loan_structure', ['InterestOnly', 'PrincipalAndInterest']);
export const frequencyEnum = pgEnum('frequency', ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Annually', 'Annual', 'OneTime']);

export const feedbackCategoryEnum = pgEnum('feedback_category', ["Bug", "Feature Request", "General", "Complaint", "Praise", "Other"]);
export const feedbackStatusEnum = pgEnum('feedback_status', ["New", "In Progress", "Resolved", "Closed"]);

// ============================================================================
// USERS & SUBSCRIPTIONS
// ============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default('user').notNull(),
  isActive: boolean('is_active').notNull().default(true),

  // Subscription fields (Ported from functionality requirements)
  subscriptionTier: subscriptionTierEnum("subscriptionTier").default('FREE').notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscriptionStatus"),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  description: text("description"),
  maxProperties: integer("maxProperties").notNull().default(0),
  maxForecastYears: integer("maxForecastYears").notNull().default(10),
  canUseAdvancedAnalytics: boolean("canUseAdvancedAnalytics").notNull().default(false),
  canUseScenarioComparison: boolean("canUseScenarioComparison").notNull().default(false),
  canExportReports: boolean("canExportReports").notNull().default(false),
  canUseTaxCalculator: boolean("canUseTaxCalculator").notNull().default(false),
  priceMonthly: numeric("priceMonthly", { precision: 10, scale: 2 }).notNull().default("0"),
  priceYearly: numeric("priceYearly", { precision: 10, scale: 2 }).notNull().default("0"),
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripePriceIdYearly", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex("idx_subscription_tiers_name").on(table.name),
}));

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tierId: integer("tierId").notNull().references(() => subscriptionTiers.id, { onDelete: 'restrict' }),
  status: subscriptionStatusEnum("status").notNull().default('active'),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_user_subscriptions_user_id").on(table.userId),
  tierIdIdx: index("idx_user_subscriptions_tier_id").on(table.tierId),
  statusIdx: index("idx_user_subscriptions_status").on(table.status),
}));

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

// ============================================================================
// PORTFOLIOS
// ============================================================================

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  type: portfolioTypeEnum("type").default('Normal').notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

export const portfolioGoals = pgTable("portfolio_goals", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  goalYear: integer("goalYear").notNull(),
  targetEquity: integer("targetEquity"),
  targetCashflow: integer("targetCashflow"),
  targetValue: integer("targetValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PortfolioGoal = typeof portfolioGoals.$inferSelect;
export type InsertPortfolioGoal = typeof portfolioGoals.$inferInsert;

// ============================================================================
// PROPERTIES
// ============================================================================

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  portfolioId: integer("portfolioId").references(() => portfolios.id, { onDelete: 'set null' }),
  scenarioId: integer("scenarioId"),
  nickname: varchar("nickname", { length: 255 }).notNull(),
  address: text("address").notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  suburb: varchar("suburb", { length: 100 }).notNull(),
  propertyType: propertyTypeEnum("propertyType").notNull(),
  ownershipStructure: ownershipStructureEnum("ownershipStructure").notNull(),
  linkedEntity: varchar("linkedEntity", { length: 255 }),
  purchaseDate: timestamp("purchaseDate").notNull(),
  purchasePrice: integer("purchasePrice").notNull(),
  saleDate: timestamp("saleDate"),
  salePrice: integer("salePrice"),
  status: propertyStatusEnum("status").default('Actual').notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

export const propertyOwnership = pgTable("property_ownership", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  percentage: integer("percentage").notNull(),
});

export type PropertyOwnership = typeof propertyOwnership.$inferSelect;
export type InsertPropertyOwnership = typeof propertyOwnership.$inferInsert;

export const purchaseCosts = pgTable("purchase_costs", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }).unique(),
  agentFee: integer("agentFee").default(0).notNull(),
  stampDuty: integer("stampDuty").default(0).notNull(),
  legalFee: integer("legalFee").default(0).notNull(),
  inspectionFee: integer("inspectionFee").default(0).notNull(),
  otherCosts: integer("otherCosts").default(0).notNull(),
});

export type PurchaseCosts = typeof purchaseCosts.$inferSelect;
export type InsertPurchaseCosts = typeof purchaseCosts.$inferInsert;

export const propertyUsagePeriods = pgTable("property_usage_periods", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  usageType: usageTypeEnum("usageType").notNull(),
});

export type PropertyUsagePeriod = typeof propertyUsagePeriods.$inferSelect;
export type InsertPropertyUsagePeriod = typeof propertyUsagePeriods.$inferInsert;

export const propertyValuations = pgTable("property_valuations", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  valuationDate: timestamp("valuationDate").notNull(),
  value: integer("value").notNull(),
});

export type PropertyValuation = typeof propertyValuations.$inferSelect;
export type InsertPropertyValuation = typeof propertyValuations.$inferInsert;

export const growthRatePeriods = pgTable("growth_rate_periods", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  startYear: integer("startYear").notNull(),
  endYear: integer("endYear"),
  growthRate: integer("growthRate").notNull(),
});

export type GrowthRatePeriod = typeof growthRatePeriods.$inferSelect;
export type InsertGrowthRatePeriod = typeof growthRatePeriods.$inferInsert;

// ============================================================================
// LOANS
// ============================================================================

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  securityPropertyId: integer("securityPropertyId").references(() => properties.id, { onDelete: 'set null' }),
  loanType: loanTypeEnum("loanType").notNull(),
  lenderName: varchar("lenderName", { length: 255 }).notNull(),
  loanPurpose: loanPurposeEnum("loanPurpose").notNull(),
  loanStructure: loanStructureEnum("loanStructure").notNull(),
  startDate: timestamp("startDate").notNull(),
  originalAmount: integer("originalAmount").notNull(),
  currentAmount: integer("currentAmount").notNull(),
  interestRate: integer("interestRate").notNull(),
  remainingTermYears: integer("remainingTermYears").notNull(),
  remainingIOPeriodYears: integer("remainingIOPeriodYears").default(0).notNull(),
  repaymentFrequency: frequencyEnum("repaymentFrequency").notNull(),
  offsetBalance: integer("offsetBalance").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

export const loanScenarios = pgTable("loan_scenarios", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  propertyId: integer("propertyId").references(() => properties.id, { onDelete: 'set null' }), // Added back propertyId as it was referenced in errors
  basePropertyId: integer("basePropertyId").references(() => properties.id, { onDelete: 'set null' }),
  projectionYears: integer("projectionYears").notNull(),
  scenarioData: text("scenarioData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LoanScenario = typeof loanScenarios.$inferSelect;
export type InsertLoanScenario = typeof loanScenarios.$inferInsert;

// ============================================================================
// INCOME & EXPENSES
// ============================================================================

export const rentalIncome = pgTable("rental_income", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  amount: integer("amount").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  growthRate: integer("growthRate").default(0).notNull(),
});

export type RentalIncome = typeof rentalIncome.$inferSelect;
export type InsertRentalIncome = typeof rentalIncome.$inferInsert;

export const expenseLogs = pgTable("expense_logs", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  totalAmount: integer("totalAmount").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  growthRate: integer("growthRate").default(0).notNull(),
});

export type ExpenseLog = typeof expenseLogs.$inferSelect;
export type InsertExpenseLog = typeof expenseLogs.$inferInsert;

export const expenseBreakdown = pgTable("expense_breakdown", {
  id: serial("id").primaryKey(),
  expenseLogId: integer("expenseLogId").notNull().references(() => expenseLogs.id, { onDelete: 'cascade' }),
  category: varchar("category", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
});

export type ExpenseBreakdown = typeof expenseBreakdown.$inferSelect;
export type InsertExpenseBreakdown = typeof expenseBreakdown.$inferInsert;

export const depreciationSchedule = pgTable("depreciation_schedule", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  asAtDate: timestamp("asAtDate").notNull(),
  annualAmount: integer("annualAmount").notNull(),
});

export type DepreciationSchedule = typeof depreciationSchedule.$inferSelect;
export type InsertDepreciationSchedule = typeof depreciationSchedule.$inferInsert;

export const capitalExpenditure = pgTable("capital_expenditure", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull(),
});

export type CapitalExpenditure = typeof capitalExpenditure.$inferSelect;
export type InsertCapitalExpenditure = typeof capitalExpenditure.$inferInsert;

// ============================================================================
// SCENARIOS
// ============================================================================

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  originalPortfolioId: integer("originalPortfolioId").references(() => portfolios.id, { onDelete: 'set null' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

// ============================================================================
// EXTRA LOAN FEATURES
// ============================================================================

export const extraRepayments = pgTable("extra_repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loanId").notNull().references(() => loans.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
});

export type ExtraRepayment = typeof extraRepayments.$inferSelect;
export type InsertExtraRepayment = typeof extraRepayments.$inferInsert;

export const lumpSumPayments = pgTable("lump_sum_payments", {
  id: serial("id").primaryKey(),
  loanId: integer("loanId").notNull().references(() => loans.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
});

export type LumpSumPayment = typeof lumpSumPayments.$inferSelect;
export type InsertLumpSumPayment = typeof lumpSumPayments.$inferInsert;

export const interestRateForecasts = pgTable("interest_rate_forecasts", {
  id: serial("id").primaryKey(),
  loanId: integer("loanId").notNull().references(() => loans.id, { onDelete: 'cascade' }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startYear: integer("startYear").notNull(),
  endYear: integer("endYear"),
  forecastRate: integer("forecastRate").notNull(),
});

export type InterestRateForecast = typeof interestRateForecasts.$inferSelect;
export type InsertInterestRateForecast = typeof interestRateForecasts.$inferInsert;

// ============================================================================
// FEEDBACK
// ============================================================================

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: 'set null' }),
  category: feedbackCategoryEnum("category").notNull(),
  rating: integer("rating"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  userEmail: varchar("userEmail", { length: 320 }),
  userName: varchar("userName", { length: 255 }),
  source: varchar("source", { length: 50 }).notNull(), // 'in-app', 'tally', 'email'
  status: feedbackStatusEnum("status").default('New').notNull(),
  metadata: text("metadata"), // JSON string
  adminNotes: text("adminNotes"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: integer("resolvedBy").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;
