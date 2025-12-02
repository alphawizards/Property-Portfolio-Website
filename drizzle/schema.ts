import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, datetime } from "drizzle-orm/mysql-core";

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Properties table - stores core property information
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
