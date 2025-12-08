import { relations } from "drizzle-orm";
import {
  users,
  portfolios,
  properties,
  propertyOwnership,
  purchaseCosts,
  propertyUsagePeriods,
  loans,
  propertyValuations,
  growthRatePeriods,
  rentalIncome,
  expenseLogs,
  expenseBreakdown,
  depreciationSchedule,
  capitalExpenditure,
  portfolioGoals,
  extraRepayments,
  lumpSumPayments,
  interestRateForecasts,
  loanScenarios,
  documents,
  scenarios,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  portfolios: many(portfolios),
  properties: many(properties),
  portfolioGoal: one(portfolioGoals, {
    fields: [users.id],
    references: [portfolioGoals.userId],
  }),
  loanScenarios: many(loanScenarios),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [properties.portfolioId],
    references: [portfolios.id],
  }),
  scenario: one(scenarios, {
    fields: [properties.scenarioId],
    references: [scenarios.id],
  }),
  purchaseCosts: one(purchaseCosts, {
    fields: [properties.id],
    references: [purchaseCosts.propertyId],
  }),
  ownership: many(propertyOwnership),
  usagePeriods: many(propertyUsagePeriods),
  loans: many(loans),
  valuations: many(propertyValuations),
  growthRates: many(growthRatePeriods),
  rentalIncomes: many(rentalIncome),
  expenses: many(expenseLogs),
  depreciation: many(depreciationSchedule),
  capitalExpenditure: many(capitalExpenditure),
  loanScenarios: many(loanScenarios),
  documents: many(documents),
}));

export const propertyOwnershipRelations = relations(propertyOwnership, ({ one }) => ({
  property: one(properties, {
    fields: [propertyOwnership.propertyId],
    references: [properties.id],
  }),
}));

export const purchaseCostsRelations = relations(purchaseCosts, ({ one }) => ({
  property: one(properties, {
    fields: [purchaseCosts.propertyId],
    references: [properties.id],
  }),
}));

export const propertyUsagePeriodsRelations = relations(propertyUsagePeriods, ({ one }) => ({
  property: one(properties, {
    fields: [propertyUsagePeriods.propertyId],
    references: [properties.id],
  }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  property: one(properties, {
    fields: [loans.propertyId],
    references: [properties.id],
  }),
  extraRepayments: many(extraRepayments),
  lumpSumPayments: many(lumpSumPayments),
  interestRateForecasts: many(interestRateForecasts),
}));

export const propertyValuationsRelations = relations(propertyValuations, ({ one }) => ({
  property: one(properties, {
    fields: [propertyValuations.propertyId],
    references: [properties.id],
  }),
}));

export const growthRatePeriodsRelations = relations(growthRatePeriods, ({ one }) => ({
  property: one(properties, {
    fields: [growthRatePeriods.propertyId],
    references: [properties.id],
  }),
}));

export const rentalIncomeRelations = relations(rentalIncome, ({ one }) => ({
  property: one(properties, {
    fields: [rentalIncome.propertyId],
    references: [properties.id],
  }),
}));

export const expenseLogsRelations = relations(expenseLogs, ({ one, many }) => ({
  property: one(properties, {
    fields: [expenseLogs.propertyId],
    references: [properties.id],
  }),
  breakdown: many(expenseBreakdown),
}));

export const expenseBreakdownRelations = relations(expenseBreakdown, ({ one }) => ({
  expenseLog: one(expenseLogs, {
    fields: [expenseBreakdown.expenseLogId],
    references: [expenseLogs.id],
  }),
}));

export const depreciationScheduleRelations = relations(depreciationSchedule, ({ one }) => ({
  property: one(properties, {
    fields: [depreciationSchedule.propertyId],
    references: [properties.id],
  }),
}));

export const capitalExpenditureRelations = relations(capitalExpenditure, ({ one }) => ({
  property: one(properties, {
    fields: [capitalExpenditure.propertyId],
    references: [properties.id],
  }),
}));

export const portfolioGoalsRelations = relations(portfolioGoals, ({ one }) => ({
  user: one(users, {
    fields: [portfolioGoals.userId],
    references: [users.id],
  }),
}));

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  user: one(users, {
    fields: [scenarios.userId],
    references: [users.id],
  }),
  originalPortfolio: one(portfolios, {
    fields: [scenarios.originalPortfolioId],
    references: [portfolios.id],
  }),
  properties: many(properties),
}));

export const extraRepaymentsRelations = relations(extraRepayments, ({ one }) => ({
  loan: one(loans, {
    fields: [extraRepayments.loanId],
    references: [loans.id],
  }),
}));

export const lumpSumPaymentsRelations = relations(lumpSumPayments, ({ one }) => ({
  loan: one(loans, {
    fields: [lumpSumPayments.loanId],
    references: [loans.id],
  }),
}));

export const interestRateForecastsRelations = relations(interestRateForecasts, ({ one }) => ({
  loan: one(loans, {
    fields: [interestRateForecasts.loanId],
    references: [loans.id],
  }),
}));

export const loanScenariosRelations = relations(loanScenarios, ({ one }) => ({
  property: one(properties, {
    fields: [loanScenarios.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [loanScenarios.userId],
    references: [users.id],
  }),
}));