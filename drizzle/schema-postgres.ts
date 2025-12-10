// Complete PostgreSQL schema for Property Portfolio Analyzer
import {
  serial,
  varchar,
  timestamp,
  boolean,
  numeric,
  text,
  pgEnum,
  pgTable,
  uniqueIndex,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ ENUMS ============

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const portfolioTypeEnum = pgEnum('type', ['Normal', 'Trust', 'Company']);
export const propertyTypeEnum = pgEnum('propertyType', ['Residential', 'Commercial', 'Industrial', 'Land']);
export const ownershipStructureEnum = pgEnum('ownershipStructure', ['Trust', 'Individual', 'Company', 'Partnership']);
export const statusEnum = pgEnum('status', ['Actual', 'Projected']);
export const usageTypeEnum = pgEnum('usageType', ['Investment', 'PPOR']);
export const loanTypeEnum = pgEnum('loanType', ['EquityLoan', 'PrincipalLoan']);
export const loanPurposeEnum = pgEnum('loanPurpose', ['PropertyPurchase', 'Renovation', 'Investment', 'Other']);
export const loanStructureEnum = pgEnum('loanStructure', ['InterestOnly', 'PrincipalAndInterest']);
export const repaymentFrequencyEnum = pgEnum('repaymentFrequency', ['Monthly', 'Fortnightly', 'Weekly']);
export const rentalFrequencyEnum = pgEnum('frequency', ['Monthly', 'Weekly', 'Fortnightly']);
export const expenseFrequencyEnum = pgEnum('expenseFrequency', ['Monthly', 'Annual', 'OneTime', 'Weekly', 'Quarterly', 'Annually']);
export const extraRepaymentFrequencyEnum = pgEnum('extraRepaymentFrequency', ['Monthly', 'Fortnightly', 'Weekly', 'Annually']);
export const feedbackCategoryEnum = pgEnum('feedbackCategory', ['Bug', 'Feature Request', 'General', 'Complaint', 'Praise', 'Other']);
export const feedbackStatusEnum = pgEnum('feedbackStatus', ['New', 'In Progress', 'Resolved', 'Closed']);

// ============ USERS TABLE ============

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default('user').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionTier: varchar("subscriptionTier", { length: 50 }).default('FREE'),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }).default('active'),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ PORTFOLIOS TABLE ============

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: portfolioTypeEnum("type").default('Normal').notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

// ============ PROPERTIES TABLE ============

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  portfolioId: integer("portfolioId"),
  scenarioId: integer("scenarioId"),
  nickname: varchar("nickname", { length: 255 }).notNull(),
  address: text("address").notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  suburb: varchar("suburb", { length: 255 }).notNull(),
  propertyType: propertyTypeEnum("propertyType").default('Residential').notNull(),
  ownershipStructure: ownershipStructureEnum("ownershipStructure").notNull(),
  linkedEntity: varchar("linkedEntity", { length: 255 }),
  purchaseDate: timestamp("purchaseDate").notNull(),
  purchasePrice: integer("purchasePrice").notNull(), // in cents
  saleDate: timestamp("saleDate"),
  salePrice: integer("salePrice"), // in cents
  status: statusEnum("status").default('Actual').notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ============ PROPERTY OWNERSHIP TABLE ============

export const propertyOwnership = pgTable("property_ownership", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  percentage: integer("percentage").notNull(), // 0-100
});

export type PropertyOwnership = typeof propertyOwnership.$inferSelect;
export type InsertPropertyOwnership = typeof propertyOwnership.$inferInsert;

// ============ FEEDBACK TABLE ============

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId"), // nullable for anonymous feedback
  category: feedbackCategoryEnum("category").default('General').notNull(),
  rating: integer("rating"), // 1-5 stars, nullable
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  userEmail: varchar("userEmail", { length: 320 }), // for anonymous users
  userName: varchar("userName", { length: 255 }), // for anonymous users
  status: feedbackStatusEnum("status").default('New').notNull(),
  adminNotes: text("adminNotes"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: integer("resolvedBy"), // admin user ID
  source: varchar("source", { length: 50 }).default('in-app'), // 'in-app', 'tally', 'email'
  metadata: text("metadata"), // JSON string for extra data (browser, page URL, etc)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

// ============ BROADCAST EMAILS TABLE ============

export const broadcastEmails = pgTable("broadcast_emails", {
  id: serial("id").primaryKey(),
  createdBy: integer("createdBy").notNull(), // admin user ID
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(), // HTML content
  recipientFilter: varchar("recipientFilter", { length: 100 }), // 'all', 'free', 'premium', 'specific'
  recipientCount: integer("recipientCount").default(0),
  sentCount: integer("sentCount").default(0),
  openCount: integer("openCount").default(0),
  clickCount: integer("clickCount").default(0),
  loopsTransactionalId: varchar("loopsTransactionalId", { length: 255 }), // Loops.so campaign ID
  status: varchar("status", { length: 50 }).default('draft'), // 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BroadcastEmail = typeof broadcastEmails.$inferSelect;
export type InsertBroadcastEmail = typeof broadcastEmails.$inferInsert;

// ============ PURCHASE COSTS TABLE ============

export const purchaseCosts = pgTable("purchase_costs", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull().unique(),
  agentFee: integer("agentFee").default(0).notNull(), // in cents
  stampDuty: integer("stampDuty").default(0).notNull(), // in cents
  legalFee: integer("legalFee").default(0).notNull(), // in cents
  inspectionFee: integer("inspectionFee").default(0).notNull(), // in cents
  otherCosts: integer("otherCosts").default(0).notNull(), // in cents
});

export type PurchaseCosts = typeof purchaseCosts.$inferSelect;
export type InsertPurchaseCosts = typeof purchaseCosts.$inferInsert;

// ============ PROPERTY USAGE PERIODS TABLE ============

export const propertyUsagePeriods = pgTable("property_usage_periods", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"), // null for ongoing
  usageType: usageTypeEnum("usageType").notNull(),
});

export type PropertyUsagePeriod = typeof propertyUsagePeriods.$inferSelect;
export type InsertPropertyUsagePeriod = typeof propertyUsagePeriods.$inferInsert;

// ============ LOANS TABLE ============

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  securityPropertyId: integer("securityPropertyId"),
  loanType: loanTypeEnum("loanType").notNull(),
  lenderName: varchar("lenderName", { length: 255 }).notNull(),
  loanPurpose: loanPurposeEnum("loanPurpose").notNull(),
  loanStructure: loanStructureEnum("loanStructure").notNull(),
  startDate: timestamp("startDate").notNull(),
  originalAmount: integer("originalAmount").notNull(), // in cents
  currentAmount: integer("currentAmount").notNull(), // in cents
  interestRate: integer("interestRate").notNull(), // in basis points (5.5% = 550)
  remainingTermYears: integer("remainingTermYears").notNull(),
  remainingIOPeriodYears: integer("remainingIOPeriodYears").default(0).notNull(),
  repaymentFrequency: repaymentFrequencyEnum("repaymentFrequency").default('Monthly').notNull(),
  offsetBalance: integer("offsetBalance").default(0).notNull(), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

// ============ PROPERTY VALUATIONS TABLE ============

export const propertyValuations = pgTable("property_valuations", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  valuationDate: timestamp("valuationDate").notNull(),
  value: integer("value").notNull(), // in cents
});

export type PropertyValuation = typeof propertyValuations.$inferSelect;
export type InsertPropertyValuation = typeof propertyValuations.$inferInsert;

// ============ GROWTH RATE PERIODS TABLE ============

export const growthRatePeriods = pgTable("growth_rate_periods", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  startYear: integer("startYear").notNull(),
  endYear: integer("endYear"), // null for forever
  growthRate: integer("growthRate").notNull(), // in basis points (7% = 700)
});

export type GrowthRatePeriod = typeof growthRatePeriods.$inferSelect;
export type InsertGrowthRatePeriod = typeof growthRatePeriods.$inferInsert;

// ============ RENTAL INCOME TABLE ============

export const rentalIncome = pgTable("rental_income", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"), // null for ongoing
  amount: integer("amount").notNull(), // in cents
  frequency: rentalFrequencyEnum("frequency").default('Monthly').notNull(),
  growthRate: integer("growthRate").default(0).notNull(), // in basis points
});

export type RentalIncome = typeof rentalIncome.$inferSelect;
export type InsertRentalIncome = typeof rentalIncome.$inferInsert;

// ============ EXPENSE LOGS TABLE ============

export const expenseLogs = pgTable("expense_logs", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  date: timestamp("date").notNull(),
  totalAmount: integer("totalAmount").notNull(), // in cents
  frequency: expenseFrequencyEnum("frequency").notNull(),
  growthRate: integer("growthRate").default(0).notNull(), // in basis points
});

export type ExpenseLog = typeof expenseLogs.$inferSelect;
export type InsertExpenseLog = typeof expenseLogs.$inferInsert;

// ============ EXPENSE BREAKDOWN TABLE ============

export const expenseBreakdown = pgTable("expense_breakdown", {
  id: serial("id").primaryKey(),
  expenseLogId: integer("expenseLogId").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  amount: integer("amount").notNull(), // in cents
  frequency: expenseFrequencyEnum("frequency").default('Annually').notNull(),
});

export type ExpenseBreakdown = typeof expenseBreakdown.$inferSelect;
export type InsertExpenseBreakdown = typeof expenseBreakdown.$inferInsert;

// ============ DEPRECIATION SCHEDULE TABLE ============

export const depreciationSchedule = pgTable("depreciation_schedule", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  asAtDate: timestamp("asAtDate").notNull(),
  annualAmount: integer("annualAmount").notNull(), // in cents
});

export type DepreciationSchedule = typeof depreciationSchedule.$inferSelect;
export type InsertDepreciationSchedule = typeof depreciationSchedule.$inferInsert;

// ============ CAPITAL EXPENDITURE TABLE ============

export const capitalExpenditure = pgTable("capital_expenditure", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: integer("amount").notNull(), // in cents
  date: timestamp("date").notNull(),
});

export type CapitalExpenditure = typeof capitalExpenditure.$inferSelect;
export type InsertCapitalExpenditure = typeof capitalExpenditure.$inferInsert;

// ============ PORTFOLIO GOALS TABLE ============

export const portfolioGoals = pgTable("portfolio_goals", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  goalYear: integer("goalYear").notNull(),
  targetEquity: integer("targetEquity").notNull(), // in cents
  targetValue: integer("targetValue"),
  targetCashflow: integer("targetCashflow"),
});

export type PortfolioGoal = typeof portfolioGoals.$inferSelect;
export type InsertPortfolioGoal = typeof portfolioGoals.$inferInsert;

// ============ EXTRA REPAYMENTS TABLE ============

export const extraRepayments = pgTable("extra_repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loanId").notNull(),
  amount: integer("amount").notNull(), // in cents
  frequency: extraRepaymentFrequencyEnum("frequency").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"), // null for full term
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExtraRepayment = typeof extraRepayments.$inferSelect;
export type InsertExtraRepayment = typeof extraRepayments.$inferInsert;

// ============ LUMP SUM PAYMENTS TABLE ============

export const lumpSumPayments = pgTable("lump_sum_payments", {
  id: serial("id").primaryKey(),
  loanId: integer("loanId").notNull(),
  amount: integer("amount").notNull(), // in cents
  paymentDate: timestamp("paymentDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LumpSumPayment = typeof lumpSumPayments.$inferSelect;
export type InsertLumpSumPayment = typeof lumpSumPayments.$inferInsert;

// ============ INTEREST RATE FORECASTS TABLE ============

export const interestRateForecasts = pgTable("interest_rate_forecasts", {
  id: serial("id").primaryKey(),
  loanId: integer("loanId").notNull(),
  startYear: integer("startYear").notNull(),
  endYear: integer("endYear"), // null for forever
  forecastRate: integer("forecastRate").notNull(), // in basis points
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterestRateForecast = typeof interestRateForecasts.$inferSelect;
export type InsertInterestRateForecast = typeof interestRateForecasts.$inferInsert;

// ============ LOAN SCENARIOS TABLE ============

export const loanScenarios = pgTable("loan_scenarios", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  propertyValue: integer("propertyValue").notNull(), // in cents
  deposit: integer("deposit").notNull(), // in cents
  loanAmount: integer("loanAmount").notNull(), // in cents
  interestRate: integer("interestRate").notNull(), // in basis points
  loanTerm: integer("loanTerm").notNull(), // in months
  repaymentFrequency: varchar("repaymentFrequency", { length: 50 }).notNull(),
  interestOption: varchar("interestOption", { length: 50 }).notNull(),
  offsetBalance: integer("offsetBalance").default(0),
  extraRepaymentAmount: integer("extraRepaymentAmount").default(0),
  extraRepaymentFrequency: varchar("extraRepaymentFrequency", { length: 50 }),
  propertyGrowthRate: integer("propertyGrowthRate").notNull(),
  totalInterest: integer("totalInterest"),
  totalPayments: integer("totalPayments"),
  futurePropertyValue: integer("futurePropertyValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LoanScenario = typeof loanScenarios.$inferSelect;
export type InsertLoanScenario = typeof loanScenarios.$inferInsert;

// ============ SCENARIOS TABLE ============

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  originalPortfolioId: integer("originalPortfolioId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

// ============ DOCUMENTS TABLE ============

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 512 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ============ SUBSCRIPTION TIERS TABLE ============

export const subscriptionTiers = pgTable(
  "subscription_tiers",
  {
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
  },
  (table) => ({
    nameIdx: uniqueIndex("idx_subscription_tiers_name").on(table.name),
  })
);

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;

// ============ USER SUBSCRIPTIONS TABLE ============

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'suspended',
  'expired',
  'cancelled'
]);

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    tierId: integer("tierId").notNull(),
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
  },
  (table) => ({
    userIdIdx: index("idx_user_subscriptions_user_id").on(table.userId),
    tierIdIdx: index("idx_user_subscriptions_tier_id").on(table.tierId),
    statusIdx: index("idx_user_subscriptions_status").on(table.status),
  })
);

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
