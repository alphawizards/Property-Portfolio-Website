import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
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
  depreciationSchedule,
  InsertDepreciationSchedule,
  capitalExpenditure,
  InsertCapitalExpenditure,
  portfolioGoals,
  InsertPortfolioGoal,
  loanScenarios,
  InsertLoanScenario,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PROPERTY OPERATIONS ============

export async function createProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(properties).values(property);
  return result[0].insertId;
}

export async function getPropertiesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(properties).where(eq(properties.userId, userId)).orderBy(desc(properties.createdAt));
}

export async function getPropertyById(propertyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProperty(propertyId: number, updates: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(properties).set(updates).where(eq(properties.id, propertyId));
}

export async function deleteProperty(propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing ownership records
  await db.delete(propertyOwnership).where(eq(propertyOwnership.propertyId, propertyId));

  // Insert new ownership records
  if (owners.length > 0) {
    await db.insert(propertyOwnership).values(owners);
  }
}

export async function getPropertyOwnership(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(propertyOwnership).where(eq(propertyOwnership.propertyId, propertyId));
}

// ============ PURCHASE COSTS OPERATIONS ============

export async function upsertPurchaseCosts(costs: InsertPurchaseCosts) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(purchaseCosts).where(eq(purchaseCosts.propertyId, propertyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PROPERTY USAGE PERIODS OPERATIONS ============

export async function addPropertyUsagePeriod(period: InsertPropertyUsagePeriod) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(propertyUsagePeriods).values(period);
  return result[0].insertId;
}

export async function getPropertyUsagePeriods(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(propertyUsagePeriods).where(eq(propertyUsagePeriods.propertyId, propertyId)).orderBy(asc(propertyUsagePeriods.startDate));
}

export async function deletePropertyUsagePeriod(periodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(propertyUsagePeriods).where(eq(propertyUsagePeriods.id, periodId));
}

// ============ LOAN OPERATIONS ============

export async function createLoan(loan: InsertLoan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(loans).values(loan);
  return result[0].insertId;
}

export async function getPropertyLoans(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(loans).where(eq(loans.propertyId, propertyId)).orderBy(desc(loans.createdAt));
}

export async function getLoanById(loanId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLoan(loanId: number, updates: Partial<InsertLoan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(loans).set(updates).where(eq(loans.id, loanId));
}

export async function deleteLoan(loanId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(loans).where(eq(loans.id, loanId));
}

// ============ PROPERTY VALUATION OPERATIONS ============

export async function addPropertyValuation(valuation: InsertPropertyValuation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(propertyValuations).values(valuation);
  return result[0].insertId;
}

export async function getPropertyValuations(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(propertyValuations).where(eq(propertyValuations.propertyId, propertyId)).orderBy(desc(propertyValuations.valuationDate));
}

export async function deletePropertyValuation(valuationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(propertyValuations).where(eq(propertyValuations.id, valuationId));
}

// ============ GROWTH RATE PERIODS OPERATIONS ============

export async function addGrowthRatePeriod(period: InsertGrowthRatePeriod) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(growthRatePeriods).values(period);
  return result[0].insertId;
}

export async function getGrowthRatePeriods(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(growthRatePeriods).where(eq(growthRatePeriods.propertyId, propertyId)).orderBy(asc(growthRatePeriods.startYear));
}

export async function deleteGrowthRatePeriod(periodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(growthRatePeriods).where(eq(growthRatePeriods.id, periodId));
}

// ============ RENTAL INCOME OPERATIONS ============

export async function addRentalIncome(income: InsertRentalIncome) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(rentalIncome).values(income);
  return result[0].insertId;
}

export async function getRentalIncome(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rentalIncome).where(eq(rentalIncome.propertyId, propertyId)).orderBy(desc(rentalIncome.startDate));
}

export async function updateRentalIncome(incomeId: number, updates: Partial<InsertRentalIncome>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(rentalIncome).set(updates).where(eq(rentalIncome.id, incomeId));
}

export async function deleteRentalIncome(incomeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(rentalIncome).where(eq(rentalIncome.id, incomeId));
}

// ============ EXPENSE OPERATIONS ============

export async function createExpenseLog(expense: InsertExpenseLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(expenseLogs).values(expense);
  return result[0].insertId;
}

export async function getExpenseLogs(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(expenseLogs).where(eq(expenseLogs.propertyId, propertyId)).orderBy(desc(expenseLogs.date));
}

export async function deleteExpenseLog(expenseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete breakdown items first
  await db.delete(expenseBreakdown).where(eq(expenseBreakdown.expenseLogId, expenseId));
  // Delete the expense log
  await db.delete(expenseLogs).where(eq(expenseLogs.id, expenseId));
}

export async function addExpenseBreakdown(breakdown: InsertExpenseBreakdown) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(expenseBreakdown).values(breakdown);
  return result[0].insertId;
}

export async function getExpenseBreakdown(expenseLogId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(expenseBreakdown).where(eq(expenseBreakdown.expenseLogId, expenseLogId));
}

export async function getExpenseLogById(expenseId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(expenseLogs).where(eq(expenseLogs.id, expenseId));
  return results[0] || null;
}

export async function updateExpenseLog(expenseId: number, data: Partial<InsertExpenseLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(expenseLogs).set(data).where(eq(expenseLogs.id, expenseId));
}

export async function deleteExpenseBreakdownByLogId(expenseLogId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(expenseBreakdown).where(eq(expenseBreakdown.expenseLogId, expenseLogId));
}

// ============ DEPRECIATION SCHEDULE OPERATIONS ============

export async function addDepreciationSchedule(schedule: InsertDepreciationSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(depreciationSchedule).values(schedule);
  return result[0].insertId;
}

export async function getDepreciationSchedule(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(depreciationSchedule).where(eq(depreciationSchedule.propertyId, propertyId)).orderBy(desc(depreciationSchedule.asAtDate));
}

export async function deleteDepreciationSchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(depreciationSchedule).where(eq(depreciationSchedule.id, scheduleId));
}

// ============ CAPITAL EXPENDITURE OPERATIONS ============

export async function addCapitalExpenditure(capex: InsertCapitalExpenditure) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(capitalExpenditure).values(capex);
  return result[0].insertId;
}

export async function getCapitalExpenditure(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(capitalExpenditure).where(eq(capitalExpenditure.propertyId, propertyId)).orderBy(desc(capitalExpenditure.date));
}

export async function deleteCapitalExpenditure(capexId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(capitalExpenditure).where(eq(capitalExpenditure.id, capexId));
}

// ============ PORTFOLIO GOALS OPERATIONS ============

export async function upsertPortfolioGoal(goal: InsertPortfolioGoal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(portfolioGoals).where(eq(portfolioGoals.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ COMPLEX QUERIES FOR PORTFOLIO ANALYSIS ============

export async function getCompletePropertyData(propertyId: number) {
  const db = await getDb();
  if (!db) return null;

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

export async function getUserPortfolioData(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const userProperties = await getPropertiesByUserId(userId);
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
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user subscription: database not available");
    return;
  }

  const updateData: any = {};
  if (data.subscriptionTier !== undefined) updateData.subscriptionTier = data.subscriptionTier;
  if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId;
  if (data.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = data.stripeSubscriptionId;
  if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
  if (data.subscriptionEndDate !== undefined) updateData.subscriptionEndDate = data.subscriptionEndDate;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function getUserByStripeSubscriptionId(subscriptionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSubscriptionInfo(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user subscription: database not available");
    return undefined;
  }

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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(loanScenarios).values(scenario);
  return Number((result as any).insertId);
}

export async function getLoanScenariosByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(loanScenarios)
    .where(eq(loanScenarios.propertyId, propertyId))
    .orderBy(desc(loanScenarios.createdAt));
}

export async function getLoanScenarioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(loanScenarios).where(eq(loanScenarios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteLoanScenario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(loanScenarios).where(eq(loanScenarios.id, id));
}
