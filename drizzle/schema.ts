// @ts-nocheck
import { 
  int, 
  varchar, 
  timestamp, 
  boolean, 
  decimal, 
  text, 
  mysqlEnum,
  datetime,
  uniqueIndex,
  index,
  mysqlTable,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm'; 

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean('is_active').notNull().default(true),
  subscriptionTier: mysqlEnum("subscriptionTier", ["FREE", "PREMIUM_MONTHLY", "PREMIUM_ANNUAL"]).default("FREE").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing", "incomplete"]),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  createdAt: timestamp("createdAt").default(() => sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(() => sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`).notNull(),
  lastSignedIn: timestamp("lastSignedIn").default(() => sql`CURRENT_TIMESTAMP`).notNull(),

});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Portfolios table - stores portfolio groupings of properties
 */
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["Normal", "Trust", "Company"]).default("Normal").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").default(() => sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(() => sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

/**
 * Properties table - stores core property information
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  portfolioId: int("portfolioId"),
  nickname: varchar("nickname", { length: 255 }).notNull(),
  address: text("address").notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  suburb: varchar("suburb", { length: 255 }).notNull(),
  propertyType: mysqlEnum("propertyType", ["Residential", "Commercial", "Industrial", "Land"]).default("Residential").notNull(),
  ownershipStructure: mysqlEnum("ownershipStructure", ["Trust", "Individual", "Company", "Partnership"]).notNull(),
  linkedEntity: varchar("linkedEntity", { length: 255 }),
  purchaseDate: datetime("purchaseDate").notNull(),
  purchasePrice: int("purchasePrice").notNull(), // in cents
  saleDate: datetime("saleDate"),
  salePrice: int("salePrice"), // in cents
  status: mysqlEnum("status", ["Actual", "Projected"]).default("Actual").notNull(),
  createdAt: timestamp("createdAt").default(() => sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(() => sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Property ownership - tracks ownership percentages
 */
export const propertyOwnership = mysqlTable("property_ownership", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  percentage: int("percentage").notNull(), // 0-100
});

export type PropertyOwnership = typeof propertyOwnership.$inferSelect;
export type InsertPropertyOwnership = typeof propertyOwnership.$inferInsert;

/**
 * Purchase costs - detailed breakdown of property purchase costs
 */
export const purchaseCosts = mysqlTable("purchase_costs", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().unique(),
  agentFee: int("agentFee").default(0).notNull(), // in cents
  stampDuty: int("stampDuty").default(0).notNull(), // in cents
  legalFee: int("legalFee").default(0).notNull(), // in cents
  inspectionFee: int("inspectionFee").default(0).notNull(), // in cents
  otherCosts: int("otherCosts").default(0).notNull(), // in cents
});

export type PurchaseCosts = typeof purchaseCosts.$inferSelect;
export type InsertPurchaseCosts = typeof purchaseCosts.$inferInsert;

/**
 * Property usage periods - tracks Investment vs PPOR over time
 */
export const propertyUsagePeriods = mysqlTable("property_usage_periods", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate"), // null for ongoing
  usageType: mysqlEnum("usageType", ["Investment", "PPOR"]).notNull(),
});

export type PropertyUsagePeriod = typeof propertyUsagePeriods.$inferSelect;
export type InsertPropertyUsagePeriod = typeof propertyUsagePeriods.$inferInsert;

/**
 * Loans - stores both equity loans and principal loans
 */
export const loans = mysqlTable("loans", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  securityPropertyId: int("securityPropertyId"), // property used as security (can be different)
  loanType: mysqlEnum("loanType", ["EquityLoan", "PrincipalLoan"]).notNull(),
  lenderName: varchar("lenderName", { length: 255 }).notNull(),
  loanPurpose: mysqlEnum("loanPurpose", ["PropertyPurchase", "Renovation", "Investment", "Other"]).notNull(),
  loanStructure: mysqlEnum("loanStructure", ["InterestOnly", "PrincipalAndInterest"]).notNull(),
  startDate: datetime("startDate").notNull(),
  originalAmount: int("originalAmount").notNull(), // in cents
  currentAmount: int("currentAmount").notNull(), // in cents
  interestRate: int("interestRate").notNull(), // in basis points (5.5% = 550)
  remainingTermYears: int("remainingTermYears").notNull(),
  remainingIOPeriodYears: int("remainingIOPeriodYears").default(0).notNull(),
  repaymentFrequency: mysqlEnum("repaymentFrequency", ["Monthly", "Fortnightly", "Weekly"]).default("Monthly").notNull(),
  offsetBalance: int("offsetBalance").default(0).notNull(), // in cents - offset account balance
  createdAt: timestamp("createdAt").default(() => sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(() => sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * Property valuations - tracks property value over time
 */
export const propertyValuations = mysqlTable("property_valuations", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  valuationDate: datetime("valuationDate").notNull(),
  value: int("value").notNull(), // in cents
});

export type PropertyValuation = typeof propertyValuations.$inferSelect;
export type InsertPropertyValuation = typeof propertyValuations.$inferInsert;

/**
 * Growth rate periods - defines expected growth rates for different time periods
 */
export const growthRatePeriods = mysqlTable("growth_rate_periods", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  startYear: int("startYear").notNull(),
  endYear: int("endYear"), // null for forever
  growthRate: int("growthRate").notNull(), // in basis points (7% = 700)
});

export type GrowthRatePeriod = typeof growthRatePeriods.$inferSelect;
export type InsertGrowthRatePeriod = typeof growthRatePeriods.$inferInsert;

/**
 * Rental income - tracks rental income streams
 */
export const rentalIncome = mysqlTable("rental_income", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate"), // null for ongoing
  amount: int("amount").notNull(), // in cents
  frequency: mysqlEnum("frequency", ["Monthly", "Weekly", "Fortnightly"]).default("Monthly").notNull(),
  growthRate: int("growthRate").default(0).notNull(), // in basis points
});

export type RentalIncome = typeof rentalIncome.$inferSelect;
export type InsertRentalIncome = typeof rentalIncome.$inferInsert;

/**
 * Expense logs - records property expenses over time
 */
export const expenseLogs = mysqlTable("expense_logs", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  date: datetime("date").notNull(),
  totalAmount: int("totalAmount").notNull(), // in cents
  frequency: mysqlEnum("frequency", ["Monthly", "Annual", "OneTime"]).notNull(),
  growthRate: int("growthRate").default(0).notNull(), // in basis points
});

export type ExpenseLog = typeof expenseLogs.$inferSelect;
export type InsertExpenseLog = typeof expenseLogs.$inferInsert;

/**
 * Expense breakdown - detailed categorization of expenses
 */
export const expenseBreakdown = mysqlTable("expense_breakdown", {
  id: int("id").autoincrement().primaryKey(),
  expenseLogId: int("expenseLogId").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // in cents
  frequency: mysqlEnum("frequency", ["Weekly", "Monthly", "Quarterly", "Annually"]).default("Annually").notNull(),
});

export type ExpenseBreakdown = typeof expenseBreakdown.$inferSelect;
export type InsertExpenseBreakdown = typeof expenseBreakdown.$inferInsert;

/**
 * Depreciation schedule - tracks depreciation for tax purposes
 */
export const depreciationSchedule = mysqlTable("depreciation_schedule", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  asAtDate: datetime("asAtDate").notNull(),
  annualAmount: int("annualAmount").notNull(), // in cents
});

export type DepreciationSchedule = typeof depreciationSchedule.$inferSelect;
export type InsertDepreciationSchedule = typeof depreciationSchedule.$inferInsert;

/**
 * Capital expenditure - records capital improvements
 */
export const capitalExpenditure = mysqlTable("capital_expenditure", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // in cents
  date: datetime("date").notNull(),
});

export type CapitalExpenditure = typeof capitalExpenditure.$inferSelect;
export type InsertCapitalExpenditure = typeof capitalExpenditure.$inferInsert;

/**
 * Portfolio goals - stores user-defined portfolio goals
 */
export const portfolioGoals = mysqlTable("portfolio_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  goalYear: int("goalYear").notNull(),
  targetEquity: int("targetEquity").notNull(), // in cents
  targetValue: int("targetValue").notNull(), // in cents
});

export type PortfolioGoal = typeof portfolioGoals.$inferSelect;
export type InsertPortfolioGoal = typeof portfolioGoals.$inferInsert;

/**
 * Extra repayments - tracks recurring extra payments on loans
 */
export const extraRepayments = mysqlTable("extra_repayments", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  amount: int("amount").notNull(), // in cents
  frequency: mysqlEnum("frequency", ["Monthly", "Fortnightly", "Weekly", "Annually"]).notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate"), // null for full term
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type ExtraRepayment = typeof extraRepayments.$inferSelect;
export type InsertExtraRepayment = typeof extraRepayments.$inferInsert;

/**
 * Lump sum payments - tracks one-time extra payments on loans
 */
export const lumpSumPayments = mysqlTable("lump_sum_payments", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  amount: int("amount").notNull(), // in cents
  paymentDate: datetime("paymentDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LumpSumPayment = typeof lumpSumPayments.$inferSelect;
export type InsertLumpSumPayment = typeof lumpSumPayments.$inferInsert;

/**
 * Interest rate forecasts - stores variable interest rate projections
 */
export const interestRateForecasts = mysqlTable("interest_rate_forecasts", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  startYear: int("startYear").notNull(),
  endYear: int("endYear"), // null for forever
  forecastRate: int("forecastRate").notNull(), // in basis points
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterestRateForecast = typeof interestRateForecasts.$inferSelect;
export type InsertInterestRateForecast = typeof interestRateForecasts.$inferInsert;

/**
 * Loan scenarios - stores saved calculator scenarios for comparison
 */
export const loanScenarios = mysqlTable("loan_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Loan parameters
  propertyValue: int("propertyValue").notNull(), // in cents
  deposit: int("deposit").notNull(), // in cents
  loanAmount: int("loanAmount").notNull(), // in cents
  interestRate: int("interestRate").notNull(), // in basis points
  loanTerm: int("loanTerm").notNull(), // in months
  repaymentFrequency: varchar("repaymentFrequency", { length: 50 }).notNull(),
  interestOption: varchar("interestOption", { length: 50 }).notNull(),
  
  // Extra payments
  offsetBalance: int("offsetBalance").default(0), // in cents
  extraRepaymentAmount: int("extraRepaymentAmount").default(0), // in cents
  extraRepaymentFrequency: varchar("extraRepaymentFrequency", { length: 50 }),
  
  // Property growth
  propertyGrowthRate: int("propertyGrowthRate").notNull(), // in basis points
  
  // Calculated results
  totalInterest: int("totalInterest"), // in cents
  totalPayments: int("totalPayments"), // in cents
  futurePropertyValue: int("futurePropertyValue"), // in cents
  
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(sql`CURRENT_TIMESTAMP`).$onUpdate(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type LoanScenario = typeof loanScenarios.$inferSelect;
export type InsertLoanScenario = typeof loanScenarios.$inferInsert;

/**
 * SUBSCRIPTION SYSTEM TABLES
 */
export const subscriptionTiers = mysqlTable(
  "subscription_tiers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    displayName: varchar("displayName", { length: 100 }).notNull(),
    description: text("description"),
    maxProperties: int("maxProperties").notNull().default(0), // 0 = unlimited
    maxForecastYears: int("maxForecastYears").notNull().default(10),
    canUseAdvancedAnalytics: boolean("canUseAdvancedAnalytics").notNull().default(false),
    canUseScenarioComparison: boolean("canUseScenarioComparison").notNull().default(false),
    canExportReports: boolean("canExportReports").notNull().default(false),
    canUseTaxCalculator: boolean("canUseTaxCalculator").notNull().default(false),
    priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }).notNull().default("0"),
    priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }).notNull().default("0"),
    stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 255 }),
    stripePriceIdYearly: varchar("stripePriceIdYearly", { length: 255 }),
    createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updatedAt").default(sql`CURRENT_TIMESTAMP`).$onUpdate(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("idx_subscription_tiers_name").on(table.name),
  })
);

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;

export const userSubscriptions = mysqlTable(
  "user_subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tierId: int("tierId").notNull(),
    status: mysqlEnum("status", ["active", "suspended", "expired", "cancelled"]).notNull().default("active"),
    startDate: datetime("startDate").notNull().default(sql`CURRENT_TIMESTAMP`),
    endDate: datetime("endDate"),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
    currentPeriodStart: datetime("currentPeriodStart"),
    currentPeriodEnd: datetime("currentPeriodEnd"),
    cancelledAt: datetime("cancelledAt"),
    createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updatedAt").default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("idx_user_subscriptions_user_id").on(table.userId),
    tierIdIdx: index("idx_user_subscriptions_tier_id").on(table.tierId),
    statusIdx: index("idx_user_subscriptions_status").on(table.status),
  })
);

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * RELATIONS
 */
export const subscriptionTiersRelations = relations(subscriptionTiers, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  tier: one(subscriptionTiers, {
    fields: [userSubscriptions.tierId],
    references: [subscriptionTiers.id],
  }),
}));