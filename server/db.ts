import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { Client } from "@planetscale/database";
import * as schema from "../drizzle/schema";
import {
  InsertUser,
  users,
  portfolios,
  InsertPortfolio,
  properties,
  InsertProperty,
  propertyOwnership,
  InsertPropertyOwnership,
  purchaseCosts,
  InsertPurchaseCosts,
  propertyUsagePeriods,
  InsertPropertyUsagePeriod,
  loans,
  InsertLoan,
  propertyValuations,
  InsertPropertyValuation,
  growthRatePeriods,
  InsertGrowthRatePeriod,
  rentalIncome,
  InsertRentalIncome,
  expenseLogs,
  InsertExpenseLog,
  expenseBreakdown,
  InsertExpenseBreakdown,
  ExpenseBreakdown,
  depreciationSchedule,
  InsertDepreciationSchedule,
  capitalExpenditure,
  InsertCapitalExpenditure,
  portfolioGoals,
  InsertPortfolioGoal,
  loanScenarios,
  InsertLoanScenario,
  scenarios,
  InsertScenario,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

// Global connection cache for serverless environments
const globalForDb = globalThis as unknown as { conn: ReturnType<typeof drizzle> };

const client = new Client({ url: process.env.DATABASE_URL });
export const db = globalForDb.conn ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") globalForDb.conn = db;

/*
export async function getDb() {
  if (_db) return _db;
  if (globalForDb.conn) return globalForDb.conn;

  if (process.env.DATABASE_URL) {
    try {
      const client = new Client({
        url: process.env.DATABASE_URL,
      });
      _db = drizzle(client, { schema });
      
      // Cache connection in non-production environments to avoid exhausting connections during HMR
      if (process.env.NODE_ENV !== "production") {
        globalForDb.conn = _db;
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
*/

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  // const db = await getDb();

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PlanetScale/MySQL compatible upsert
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  // const db = await getDb();

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PORTFOLIO OPERATIONS ============

export async function createPortfolio(portfolio: InsertPortfolio) {
  // const db = await getDb();

  // MySQL does not support RETURNING, use insertId
  const result = await db.insert(portfolios).values(portfolio);
  return Number(result.insertId);
}

export async function getPortfoliosByUserId(userId: number) {
  // const db = await getDb();

  return await db.select().from(portfolios).where(eq(portfolios.userId, userId));
}

export async function getPortfolioById(id: number) {
  // const db = await getDb();

  const results = await db.select().from(portfolios).where(eq(portfolios.id, id));
  return results[0] || null;
}

export async function updatePortfolio(id: number, data: Partial<InsertPortfolio>) {
  // const db = await getDb();

  await db.update(portfolios).set(data).where(eq(portfolios.id, id));
}

export async function deletePortfolio(id: number) {
  // const db = await getDb();

  await db.delete(portfolios).where(eq(portfolios.id, id));
}

export async function getPropertiesByPortfolioId(portfolioId: number) {
  // const db = await getDb();

  return await db.select().from(properties).where(eq(properties.portfolioId, portfolioId));
}

// ============ PROPERTY OPERATIONS ============

export async function createProperty(property: InsertProperty) {
  // const db = await getDb();

  const result = await db.insert(properties).values(property);
  return Number(result.insertId);
}

export async function getPropertiesByUserId(userId: number, scenarioId?: number | null) {
  // const db = await getDb();

  const conditions = [eq(properties.userId, userId)];

  if (scenarioId === null) {
    conditions.push(isNull(properties.scenarioId));
  } else if (scenarioId !== undefined) {
    conditions.push(eq(properties.scenarioId, scenarioId));
  }

  return await db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt));
}

export async function getPropertyById(propertyId: number) {
  // const db = await getDb();

  const result = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProperty(propertyId: number, updates: Partial<InsertProperty>) {
  // const db = await getDb();

  await db.update(properties).set(updates).where(eq(properties.id, propertyId));
}

export async function deleteProperty(propertyId: number) {
  // const db = await getDb();

  // Delete all related records first
  await db.delete(propertyOwnership).where(eq(propertyOwnership.propertyId, propertyId));
  await db.delete(purchaseCosts).where(eq(purchaseCosts.propertyId, propertyId));
  await db.delete(propertyUsagePeriods).where(eq(propertyUsagePeriods.propertyId, propertyId));
  await db.delete(loans).where(eq(loans.propertyId, propertyId));
  await db.delete(propertyValuations).where(eq(propertyValuations.propertyId, propertyId));
  await db.delete(growthRatePeriods).where(eq(growthRatePeriods.propertyId, propertyId));
  await db.delete(rentalIncome).where(eq(rentalIncome.propertyId, propertyId));
  await db.delete(expenseLogs).where(eq(expenseLogs.propertyId, propertyId));
  await db.delete(depreciationSchedule).where(eq(depreciationSchedule.propertyId, propertyId));
  await db.delete(capitalExpenditure).where(eq(capitalExpenditure.propertyId, propertyId));

  // Delete the property itself
  await db.delete(properties).where(eq(properties.id, propertyId));
}

// ============ PROPERTY OWNERSHIP OPERATIONS ============

export async function setPropertyOwnership(propertyId: number, owners: InsertPropertyOwnership[]) {
  // const db = await getDb();

  // Delete existing ownership records
  await db.delete(propertyOwnership).where(eq(propertyOwnership.propertyId, propertyId));

  // Insert new ownership records
  if (owners.length > 0) {
    await db.insert(propertyOwnership).values(owners);
  }
}

export async function getPropertyOwnership(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(propertyOwnership).where(eq(propertyOwnership.propertyId, propertyId));
}

// ============ PURCHASE COSTS OPERATIONS ============

export async function upsertPurchaseCosts(costs: InsertPurchaseCosts) {
  // const db = await getDb();

  // MySQL equivalent of onConflictDoUpdate
  await db
    .insert(purchaseCosts)
    .values(costs)
    .onDuplicateKeyUpdate({
      set: {
        agentFee: costs.agentFee,
        stampDuty: costs.stampDuty,
        legalFee: costs.legalFee,
        inspectionFee: costs.inspectionFee,
        otherCosts: costs.otherCosts,
      },
    });
}

export async function getPurchaseCosts(propertyId: number) {
  // const db = await getDb();

  const result = await db.select().from(purchaseCosts).where(eq(purchaseCosts.propertyId, propertyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PROPERTY USAGE PERIODS OPERATIONS ============

export async function addPropertyUsagePeriod(period: InsertPropertyUsagePeriod) {
  // const db = await getDb();

  const result = await db.insert(propertyUsagePeriods).values(period);
  return Number(result.insertId);
}

export async function getPropertyUsagePeriods(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(propertyUsagePeriods).where(eq(propertyUsagePeriods.propertyId, propertyId)).orderBy(asc(propertyUsagePeriods.startDate));
}

export async function deletePropertyUsagePeriod(periodId: number) {
  // const db = await getDb();

  await db.delete(propertyUsagePeriods).where(eq(propertyUsagePeriods.id, periodId));
}

// ============ LOAN OPERATIONS ============

export async function createLoan(loan: InsertLoan) {
  // const db = await getDb();

  const result = await db.insert(loans).values(loan);
  return Number(result.insertId);
}

export async function getPropertyLoans(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(loans).where(eq(loans.propertyId, propertyId)).orderBy(desc(loans.createdAt));
}

export async function getLoanById(loanId: number) {
  // const db = await getDb();

  const result = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLoan(loanId: number, updates: Partial<InsertLoan>) {
  // const db = await getDb();

  await db.update(loans).set(updates).where(eq(loans.id, loanId));
}

export async function deleteLoan(loanId: number) {
  // const db = await getDb();

  await db.delete(loans).where(eq(loans.id, loanId));
}

// ============ PROPERTY VALUATION OPERATIONS ============

export async function addPropertyValuation(valuation: InsertPropertyValuation) {
  // const db = await getDb();

  const result = await db.insert(propertyValuations).values(valuation);
  return Number(result.insertId);
}

export async function getPropertyValuations(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(propertyValuations).where(eq(propertyValuations.propertyId, propertyId)).orderBy(desc(propertyValuations.valuationDate));
}

export async function deletePropertyValuation(valuationId: number) {
  // const db = await getDb();

  await db.delete(propertyValuations).where(eq(propertyValuations.id, valuationId));
}

// ============ GROWTH RATE PERIODS OPERATIONS ============

export async function addGrowthRatePeriod(period: InsertGrowthRatePeriod) {
  // const db = await getDb();

  const result = await db.insert(growthRatePeriods).values(period);
  return Number(result.insertId);
}

export async function getGrowthRatePeriods(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(growthRatePeriods).where(eq(growthRatePeriods.propertyId, propertyId)).orderBy(asc(growthRatePeriods.startYear));
}

export async function deleteGrowthRatePeriod(periodId: number) {
  // const db = await getDb();

  await db.delete(growthRatePeriods).where(eq(growthRatePeriods.id, periodId));
}

// ============ RENTAL INCOME OPERATIONS ============

export async function addRentalIncome(income: InsertRentalIncome) {
  // const db = await getDb();

  const result = await db.insert(rentalIncome).values(income);
  return Number(result.insertId);
}

export async function getRentalIncome(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(rentalIncome).where(eq(rentalIncome.propertyId, propertyId)).orderBy(desc(rentalIncome.startDate));
}

export async function updateRentalIncome(incomeId: number, updates: Partial<InsertRentalIncome>) {
  // const db = await getDb();

  await db.update(rentalIncome).set(updates).where(eq(rentalIncome.id, incomeId));
}

export async function deleteRentalIncome(incomeId: number) {
  // const db = await getDb();

  await db.delete(rentalIncome).where(eq(rentalIncome.id, incomeId));
}

// ============ EXPENSE OPERATIONS ============

export async function createExpenseLog(expense: InsertExpenseLog) {
  // const db = await getDb();

  const result = await db.insert(expenseLogs).values(expense);
  return Number(result.insertId);
}

export async function getExpenseLogs(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(expenseLogs).where(eq(expenseLogs.propertyId, propertyId)).orderBy(desc(expenseLogs.date));
}

export async function deleteExpenseLog(expenseId: number) {
  // const db = await getDb();

  // Delete breakdown items first
  await db.delete(expenseBreakdown).where(eq(expenseBreakdown.expenseLogId, expenseId));
  // Delete the expense log
  await db.delete(expenseLogs).where(eq(expenseLogs.id, expenseId));
}

export async function addExpenseBreakdown(breakdown: InsertExpenseBreakdown) {
  // const db = await getDb();

  const result = await db.insert(expenseBreakdown).values(breakdown);
  return Number(result.insertId);
}

export async function getExpenseBreakdown(expenseLogId: number) {
  // const db = await getDb();

  return await db.select().from(expenseBreakdown).where(eq(expenseBreakdown.expenseLogId, expenseLogId));
}

/**
 * Convert expense amount to weekly value based on frequency
 * @param amount Amount in cents
 * @param frequency Payment frequency
 * @returns Weekly amount in cents
 */
export function convertToWeeklyExpense(amount: number, frequency: "Weekly" | "Monthly" | "Quarterly" | "Annually" | "Annual" | "OneTime"): number {
  switch (frequency) {
    case "Weekly":
      return amount;
    case "Monthly":
      return Math.round(amount / 4.33); // Average weeks per month
    case "Quarterly":
      return Math.round(amount / 13); // 13 weeks per quarter
    case "Annually":
    case "Annual":
      return Math.round(amount / 52); // 52 weeks per year
    case "OneTime":
      return 0; // One-time expenses don't have a weekly equivalent for cashflow
    default:
      return amount;
  }
}

/**
 * Calculate total weekly expenses from breakdown
 * @param breakdown Array of expense breakdown items
 * @returns Total weekly expenses in cents
 */
export function calculateWeeklyExpenses(breakdown: ExpenseBreakdown[]): number {
  return breakdown.reduce((total, item) => {
    return total + convertToWeeklyExpense(item.amount, item.frequency);
  }, 0);
}

export async function getExpenseLogById(expenseId: number) {
  // const db = await getDb();

  const results = await db.select().from(expenseLogs).where(eq(expenseLogs.id, expenseId));
  return results[0] || null;
}

export async function updateExpenseLog(expenseId: number, data: Partial<InsertExpenseLog>) {
  // const db = await getDb();

  await db.update(expenseLogs).set(data).where(eq(expenseLogs.id, expenseId));
}

export async function deleteExpenseBreakdownByLogId(expenseLogId: number) {
  // const db = await getDb();

  await db.delete(expenseBreakdown).where(eq(expenseBreakdown.expenseLogId, expenseLogId));
}

// ============ DEPRECIATION SCHEDULE OPERATIONS ============

export async function addDepreciationSchedule(schedule: InsertDepreciationSchedule) {
  // const db = await getDb();

  const result = await db.insert(depreciationSchedule).values(schedule);
  return Number(result.insertId);
}

export async function getDepreciationSchedule(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(depreciationSchedule).where(eq(depreciationSchedule.propertyId, propertyId)).orderBy(desc(depreciationSchedule.asAtDate));
}

export async function deleteDepreciationSchedule(scheduleId: number) {
  // const db = await getDb();

  await db.delete(depreciationSchedule).where(eq(depreciationSchedule.id, scheduleId));
}

// ============ CAPITAL EXPENDITURE OPERATIONS ============

export async function addCapitalExpenditure(capex: InsertCapitalExpenditure) {
  // const db = await getDb();

  const result = await db.insert(capitalExpenditure).values(capex);
  return Number(result.insertId);
}

export async function getCapitalExpenditure(propertyId: number) {
  // const db = await getDb();

  return await db.select().from(capitalExpenditure).where(eq(capitalExpenditure.propertyId, propertyId)).orderBy(desc(capitalExpenditure.date));
}

export async function deleteCapitalExpenditure(capexId: number) {
  // const db = await getDb();

  await db.delete(capitalExpenditure).where(eq(capitalExpenditure.id, capexId));
}

// ============ PORTFOLIO GOALS OPERATIONS ============

export async function upsertPortfolioGoal(goal: InsertPortfolioGoal) {
  // const db = await getDb();

  // MySQL / PlanetScale compatible upsert
  await db
    .insert(portfolioGoals)
    .values(goal)
    .onDuplicateKeyUpdate({
      set: {
        goalYear: goal.goalYear,
        targetEquity: goal.targetEquity,
        targetValue: goal.targetValue,
      },
    });
}

export async function getPortfolioGoal(userId: number) {
  // const db = await getDb();

  const result = await db.select().from(portfolioGoals).where(eq(portfolioGoals.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ COMPLEX QUERIES FOR PORTFOLIO ANALYSIS ============

export async function getCompletePropertyData(propertyId: number) {
  // const db = await getDb();

  const property = await getPropertyById(propertyId);
  if (!property) return null;

  const [ownership, costs, usagePeriods, propertyLoans, valuations, growthRates, rental, expenses, depreciation, capex] = await Promise.all([
    getPropertyOwnership(propertyId),
    getPurchaseCosts(propertyId),
    getPropertyUsagePeriods(propertyId),
    getPropertyLoans(propertyId),
    getPropertyValuations(propertyId),
    getGrowthRatePeriods(propertyId),
    getRentalIncome(propertyId),
    getExpenseLogs(propertyId),
    getDepreciationSchedule(propertyId),
    getCapitalExpenditure(propertyId),
  ]);

  return {
    property,
    ownership,
    costs,
    usagePeriods,
    loans: propertyLoans,
    valuations,
    growthRates,
    rental,
    expenses,
    depreciation,
    capex,
  };
}

export async function getUserPortfolioData(userId: number, scenarioId?: number | null) {
  // const db = await getDb();

  const userProperties = await getPropertiesByUserId(userId, scenarioId);
  const goal = await getPortfolioGoal(userId);

  const propertiesData = await Promise.all(userProperties.map((prop) => getCompletePropertyData(prop.id)));

  return {
    properties: propertiesData.filter((p) => p !== null),
    goal,
  };
}


// ============ SUBSCRIPTION OPERATIONS ============

export async function updateUserSubscription(
  userId: number,
  data: {
    subscriptionTier?: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | null;
    subscriptionEndDate?: Date | null;
  }
) {
  // const db = await getDb();

  const updateData: any = {};
  if (data.subscriptionTier !== undefined) updateData.subscriptionTier = data.subscriptionTier;
  if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId;
  if (data.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = data.stripeSubscriptionId;
  if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
  if (data.subscriptionEndDate !== undefined) updateData.subscriptionEndDate = data.subscriptionEndDate;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function getUserByStripeSubscriptionId(subscriptionId: string) {
  // const db = await getDb();

  const result = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSubscriptionInfo(userId: number) {
  // const db = await getDb();

  const result = await db
    .select({
      subscriptionTier: users.subscriptionTier,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionEndDate: users.subscriptionEndDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}


export async function getPropertyRentalIncome(propertyId: number) {
  return await getRentalIncome(propertyId);
}

export async function getPropertyExpenses(propertyId: number) {
  return await getExpenseLogs(propertyId);
}


// ============ LOAN SCENARIOS OPERATIONS ============

export async function saveLoanScenario(scenario: InsertLoanScenario) {
  // const db = await getDb();

  const result = await db.insert(loanScenarios).values(scenario);
  return Number(result.insertId);
}

export async function getLoanScenariosByProperty(propertyId: number) {
  // const db = await getDb();

  return await db
    .select()
    .from(loanScenarios)
    .where(eq(loanScenarios.propertyId, propertyId))
    .orderBy(desc(loanScenarios.createdAt));
}

export async function getLoanScenarioById(id: number) {
  // const db = await getDb();

  const result = await db.select().from(loanScenarios).where(eq(loanScenarios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteLoanScenario(id: number) {
  // const db = await getDb();

  await db.delete(loanScenarios).where(eq(loanScenarios.id, id));
}

// ============ SCENARIO OPERATIONS ============

export async function getScenariosByUserId(userId: number) {
  // const db = await getDb();

  return await db.select().from(scenarios).where(eq(scenarios.userId, userId)).orderBy(desc(scenarios.createdAt));
}

export async function createScenario(scenario: InsertScenario) {
  // const db = await getDb();

  const result = await db.insert(scenarios).values(scenario);
  return Number(result.insertId);
}

export async function clonePortfolioToScenario(portfolioId: number, userId: number, scenarioName: string) {
  // const db = await getDb();

  // PlanetScale does not support transactions in the same way as Postgres, but drizzle-orm abstract it.
  // HOWEVER, for serverless, we should be careful. Drizzle mysql-core supports transactions.

  return await db.transaction(async (tx) => {
    // 1. Create Scenario
    const scenarioInsertResult = await tx.insert(scenarios).values({
      userId,
      originalPortfolioId: portfolioId,
      name: scenarioName,
    });
    const scenarioId = Number(scenarioInsertResult.insertId);

    // 2. Get Properties
    const propertiesList = await tx.select().from(properties).where(eq(properties.portfolioId, portfolioId));

    // 3. Clone Properties
    for (const property of propertiesList) {
      // Clone property
      const { id: _, createdAt: __, updatedAt: ___, ...propertyData } = property;

      const distinctNickname = `${property.nickname} (Scenario)`;

      const newPropertyResult = await tx.insert(properties).values({
        ...propertyData,
        scenarioId,
        nickname: distinctNickname,
        portfolioId: null, // Scenarios don't belong to a portfolio in the same way
      });
      const newPropertyId = Number(newPropertyResult.insertId);

      // Helper to clone related data
      const cloneRelated = async (table: any, getData: () => Promise<any[]>, fkField: string, extraFields: Record<string, any> = {}) => {
        const items = await getData();
        if (items.length > 0) {
          const newItems = items.map((item) => {
            const { id, createdAt, updatedAt, ...rest } = item;
            return { ...rest, [fkField]: newPropertyId, ...extraFields };
          });
          await tx.insert(table).values(newItems);
        }
      };

      // Clone ALL related data for this property
      // We have to query inside the transaction or use the data we could fetch before?
      // For simplicity/correctness, we'll query by original ID.
      // NOTE: We are using 'tx' but simple fetch functions use 'db'. 
      // We should ideally pass 'tx' to helper functions or inline the queries.
      // Given the refactor, let's inline simple selects using 'tx' to be safe.

      // Ownership
      const owners = await tx.select().from(propertyOwnership).where(eq(propertyOwnership.propertyId, property.id));
      if (owners.length) await tx.insert(propertyOwnership).values(owners.map(({ id, ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Costs
      const costs = await tx.select().from(purchaseCosts).where(eq(purchaseCosts.propertyId, property.id));
      if (costs.length) await tx.insert(purchaseCosts).values(costs.map(({ ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Usage
      const usage = await tx.select().from(propertyUsagePeriods).where(eq(propertyUsagePeriods.propertyId, property.id));
      if (usage.length) await tx.insert(propertyUsagePeriods).values(usage.map(({ id, ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Loans
      const loansData = await tx.select().from(loans).where(eq(loans.propertyId, property.id));
      if (loansData.length) await tx.insert(loans).values(loansData.map(({ id, createdAt, updatedAt, ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Valuations
      const valuations = await tx.select().from(propertyValuations).where(eq(propertyValuations.propertyId, property.id));
      if (valuations.length) await tx.insert(propertyValuations).values(valuations.map(({ id, ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Growth
      const growth = await tx.select().from(growthRatePeriods).where(eq(growthRatePeriods.propertyId, property.id));
      if (growth.length) await tx.insert(growthRatePeriods).values(growth.map(({ id, ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Rental
      const rental = await tx.select().from(rentalIncome).where(eq(rentalIncome.propertyId, property.id));
      if (rental.length) await tx.insert(rentalIncome).values(rental.map(({ id, ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Expense Logs
      const expenses = await tx.select().from(expenseLogs).where(eq(expenseLogs.propertyId, property.id));
      for (const expense of expenses) {
        const { id: oldExpenseId, ...expenseData } = expense;
        const newExpenseResult = await tx.insert(expenseLogs).values({ ...expenseData, propertyId: newPropertyId });
        const newExpenseId = Number(newExpenseResult.insertId);

        // Expense Breakdown
        const breakdown = await tx.select().from(expenseBreakdown).where(eq(expenseBreakdown.expenseLogId, oldExpenseId));
        if (breakdown.length) await tx.insert(expenseBreakdown).values(breakdown.map(({ id, ...r }) => ({ ...r, expenseLogId: newExpenseId })));
      }

      // Depreciation
      const dep = await tx.select().from(depreciationSchedule).where(eq(depreciationSchedule.propertyId, property.id));
      if (dep.length) await tx.insert(depreciationSchedule).values(dep.map(({ id, ...r }) => ({ ...r, propertyId: newPropertyId })));

      // Capex
      const caps = await tx.select().from(capitalExpenditure).where(eq(capitalExpenditure.propertyId, property.id));
      if (caps.length) await tx.insert(capitalExpenditure).values(caps.map(({ id, ...r }) => ({ ...r, propertyId: newPropertyId })));
    }

    return scenarioId;
  });
}
