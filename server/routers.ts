import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as calc from "../shared/calculations";
import { TRPCError } from "@trpc/server";
import { subscriptionRouter } from "./subscription-router";
import { featureGatesRouter } from "./routers/feature-gates-router";
import { adminRouter } from "./routers/admin-router";
import { feedbackRouter } from "./routers/feedback-router";
import { authRouter } from "./routers/auth-router";
import { toDecimal, Decimal } from "../shared/decimal-utils";
import {
  portfolioSchema,
  propertySchema,
  propertyOwnershipSchema,
  purchaseCostsSchema,
  usagePeriodSchema,
  loanSchema,
  valuationSchema,
  growthRatePeriodSchema,
  rentalIncomeSchema,
  expenseLogSchema,
  expenseBreakdownSchema,
  depreciationScheduleSchema,
  capitalExpenditureSchema,
  portfolioGoalSchema
} from "@shared/schemas";

// ============ ROUTERS ============

export const appRouter = router({
  system: systemRouter,
  subscription: subscriptionRouter,
  featureGates: featureGatesRouter,
  admin: adminRouter,
  feedback: feedbackRouter,
  auth: authRouter,
  // ============ PORTFOLIO OPERATIONS ============
  portfolios: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPortfoliosByUserId(ctx.user.id);
    }),

    getDashboard: protectedProcedure
      .input(z.object({
        portfolioId: z.number().int().optional(),
        scenarioId: z.number().int().optional(),
        interestRateOffset: z.number().int().optional()
      }).nullable().optional())
      .query(async ({ input, ctx }) => {
        let properties;
        if (input?.portfolioId) {
          const portfolio = await db.getPortfolioById(input.portfolioId);
          if (!portfolio || portfolio.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this portfolio" });
          }
          properties = await db.getPropertiesByPortfolioId(input.portfolioId);
        } else {
          const scenarioId = input?.scenarioId ?? null;
          properties = await db.getPropertiesByUserId(ctx.user.id, scenarioId);
        }

        const currentYear = new Date().getFullYear();

        const propertiesWithFinancials = await Promise.all(
          properties.map(async (property) => {
            const data = await db.getCompletePropertyData(property.id);
            if (!data) {
              return {
                ...property,
                currentValue: parseFloat(property.purchasePrice.toString()),
                totalDebt: 0,
                equity: parseFloat(property.purchasePrice.toString()),
                lvr: 0,
              };
            }

            const financials = calc.calculatePropertyEquity(
              data.property,
              data.loans,
              data.valuations,
              data.growthRates,
              currentYear,
              input?.interestRateOffset ?? 0
            );

            return {
              ...property,
              currentValue: financials.propertyValue,
              totalDebt: financials.totalDebt,
              equity: financials.equity,
              lvr: financials.lvr,
            };
          })
        );

        const totalValue = propertiesWithFinancials.reduce((sum, p) => sum + p.currentValue, 0);
        const totalDebt = propertiesWithFinancials.reduce((sum, p) => sum + p.totalDebt, 0);
        const totalEquity = totalValue - totalDebt;

        const goal = await db.getPortfolioGoal(ctx.user.id);

        return {
          totalValue,
          totalDebt,
          totalEquity,
          propertyCount: properties.length,
          properties: propertiesWithFinancials,
          projections: [],
          goal,
        };
      }),

    getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input, ctx }) => {
      const portfolio = await db.getPortfolioById(input.id);
      if (!portfolio) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
      }
      if (portfolio.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this portfolio" });
      }
      return portfolio;
    }),

    getWithProperties: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input, ctx }) => {
      const portfolio = await db.getPortfolioById(input.id);
      if (!portfolio) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
      }
      if (portfolio.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this portfolio" });
      }
      const properties = await db.getPropertiesByPortfolioId(input.id);
      return { ...portfolio, properties };
    }),

    create: protectedProcedure.input(portfolioSchema).mutation(async ({ input, ctx }) => {
      const portfolioId = await db.createPortfolio({
        ...input,
        userId: ctx.user.id,
      });
      return { id: portfolioId };
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          data: portfolioSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const portfolio = await db.getPortfolioById(input.id);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this portfolio" });
        }
        await db.updatePortfolio(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const portfolio = await db.getPortfolioById(input.id);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this portfolio" });
      }
      // Check if portfolio has properties
      const properties = await db.getPropertiesByPortfolioId(input.id);
      if (properties.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete portfolio with properties. Please move or delete properties first."
        });
      }
      await db.deletePortfolio(input.id);
      return { success: true };
    }),
  }),

  // ============ SCENARIO OPERATIONS ============
  scenarios: router({
    list: protectedProcedure
      .input(z.void()) // Explicitly require no input
      .query(async ({ ctx }) => {
        try {
          return await db.getScenariosByUserId(ctx.user.id);
        } catch (error) {
          console.error("Error fetching scenarios:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch scenarios", cause: error });
        }
    }),

    clone: protectedProcedure
      .input(z.object({ portfolioId: z.number().int(), name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this portfolio" });
        }
        const scenarioId = await db.clonePortfolioToScenario(input.portfolioId, ctx.user.id, input.name);
        return { id: scenarioId };
      }),
  }),

  // ============ PROPERTY OPERATIONS ============
  properties: router({
    list: protectedProcedure
      .input(z.object({ scenarioId: z.number().int().optional() }).nullable().optional())
      .query(async ({ input, ctx }) => {
        const scenarioId = input?.scenarioId ?? null;
        return await db.getPropertiesByUserId(ctx.user.id, scenarioId);
      }),

    listWithFinancials: protectedProcedure
      .input(z.object({ scenarioId: z.number().int().optional() }).nullable().optional())
      .query(async ({ input, ctx }) => {
        const scenarioId = input?.scenarioId ?? null;
        const properties = await db.getPropertiesByUserId(ctx.user.id, scenarioId);
        const currentYear = new Date().getFullYear();

        const propertiesWithFinancials = await Promise.all(
          properties.map(async (property) => {
            const data = await db.getCompletePropertyData(property.id);
            if (!data) {
              return {
                ...property,
                currentValue: parseFloat(property.purchasePrice.toString()),
                totalDebt: 0,
                equity: parseFloat(property.purchasePrice.toString()),
                lvr: 0,
              };
            }

            const financials = calc.calculatePropertyEquity(
              data.property,
              data.loans,
              data.valuations,
              data.growthRates,
              currentYear
            );

            return {
              ...property,
              currentValue: financials.propertyValue,
              totalDebt: financials.totalDebt,
              equity: financials.equity,
              lvr: financials.lvr,
            };
          })
        );

        return propertiesWithFinancials;
      }),

    getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input, ctx }) => {
      const property = await db.getPropertyById(input.id);
      if (!property) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
      }
      if (property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this property" });
      }
      return property;
    }),

    getComplete: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input, ctx }) => {
      const data = await db.getCompletePropertyData(input.id);
      if (!data || data.property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this property" });
      }
      return data;
    }),

    create: protectedProcedure.input(propertySchema).mutation(async ({ input, ctx }) => {
      const propertyId = await db.createProperty({
        ...input,
        purchasePrice: input.purchasePrice.toString(),
        salePrice: input.salePrice?.toString(),
        userId: ctx.user.id,
      });
      return { id: propertyId };
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          data: propertySchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.id);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this property" });
        }

        const updateData: any = { ...input.data };
        if (input.data.purchasePrice !== undefined) updateData.purchasePrice = input.data.purchasePrice.toString();
        if (input.data.salePrice !== undefined) updateData.salePrice = input.data.salePrice.toString();

        await db.updateProperty(input.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const property = await db.getPropertyById(input.id);
      if (!property || property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this property" });
      }
      await db.deleteProperty(input.id);
      return { success: true };
    }),

    // Ownership management
    setOwnership: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          owners: z.array(propertyOwnershipSchema),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const totalPercentage = input.owners.reduce((sum, owner) => sum + owner.percentage, 0);
        if (totalPercentage !== 100) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ownership percentages must sum to 100" });
        }

        await db.setPropertyOwnership(
          input.propertyId,
          input.owners.map((o) => ({
            ...o,
            propertyId: input.propertyId,
            percentage: o.percentage.toString()
          }))
        );
        return { success: true };
      }),

    // Purchase costs
    setPurchaseCosts: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          costs: purchaseCostsSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.upsertPurchaseCosts({
          ...input.costs,
          propertyId: input.propertyId,
          agentFee: input.costs.agentFee.toString(),
          stampDuty: input.costs.stampDuty.toString(),
          legalFee: input.costs.legalFee.toString(),
          inspectionFee: input.costs.inspectionFee.toString(),
          otherCosts: input.costs.otherCosts.toString()
        });
        return { success: true };
      }),

    // Usage periods
    addUsagePeriod: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          period: usagePeriodSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.addPropertyUsagePeriod({ ...input.period, propertyId: input.propertyId });
        return { id };
      }),

    deleteUsagePeriod: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await db.deletePropertyUsagePeriod(input.id);
      return { success: true };
    }),
  }),

  // ============ LOAN OPERATIONS ============
  loans: router({
    getByProperty: protectedProcedure.input(z.object({ propertyId: z.number().int() })).query(async ({ input, ctx }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getPropertyLoans(input.propertyId);
    }),

    create: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          loan: loanSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.createLoan({
          ...input.loan,
          propertyId: input.propertyId,
          originalAmount: input.loan.originalAmount.toString(),
          currentAmount: input.loan.currentAmount.toString(),
          interestRate: input.loan.interestRate.toString(),
          offsetBalance: input.loan.offsetBalance.toString()
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          data: loanSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.id);
        if (!loan) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const property = await db.getPropertyById(loan.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const updateData: any = { ...input.data };
        if (input.data.originalAmount !== undefined) updateData.originalAmount = input.data.originalAmount.toString();
        if (input.data.currentAmount !== undefined) updateData.currentAmount = input.data.currentAmount.toString();
        if (input.data.interestRate !== undefined) updateData.interestRate = input.data.interestRate.toString();
        if (input.data.offsetBalance !== undefined) updateData.offsetBalance = input.data.offsetBalance.toString();

        await db.updateLoan(input.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const loan = await db.getLoanById(input.id);
      if (!loan) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const property = await db.getPropertyById(loan.propertyId);
      if (!property || property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.deleteLoan(input.id);
      return { success: true };
    }),
  }),

  // ============ VALUATION & GROWTH OPERATIONS ============
  valuations: router({
    getByProperty: protectedProcedure.input(z.object({ propertyId: z.number().int() })).query(async ({ input, ctx }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getPropertyValuations(input.propertyId);
    }),

    add: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          valuation: valuationSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.addPropertyValuation({
          ...input.valuation,
          propertyId: input.propertyId,
          value: input.valuation.value.toString()
        });
        return { id };
      }),

    updateCurrent: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          value: z.number().int(),
          date: z.date(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.addPropertyValuation({
          propertyId: input.propertyId,
          valuationDate: input.date,
          value: input.value.toString(),
        });
        return { id };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await db.deletePropertyValuation(input.id);
      return { success: true };
    }),
  }),

  growthRates: router({
    getByProperty: protectedProcedure.input(z.object({ propertyId: z.number().int() })).query(async ({ input, ctx }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getGrowthRatePeriods(input.propertyId);
    }),

    add: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          period: growthRatePeriodSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.addGrowthRatePeriod({
          ...input.period,
          propertyId: input.propertyId,
          growthRate: input.period.growthRate.toString()
        });
        return { id };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await db.deleteGrowthRatePeriod(input.id);
      return { success: true };
    }),
  }),

  // ============ RENTAL INCOME OPERATIONS ============
  rentalIncome: router({
    getByProperty: protectedProcedure.input(z.object({ propertyId: z.number().int() })).query(async ({ input, ctx }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getPropertyRentalIncome(input.propertyId);
    }),

    add: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          income: rentalIncomeSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.addRentalIncome({
          ...input.income,
          propertyId: input.propertyId,
          amount: input.income.amount.toString(),
          growthRate: input.income.growthRate.toString()
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          weeklyRent: z.number().optional(),
          growthRate: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const updates: Partial<{ amount: string; growthRate: string }> = {};
        if (input.weeklyRent !== undefined) {
          updates.amount = input.weeklyRent.toString();
        }
        if (input.growthRate !== undefined) {
          updates.growthRate = input.growthRate.toString();
        }
        await db.updateRentalIncome(input.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await db.deleteRentalIncome(input.id);
      return { success: true };
    }),
  }),

  // ============ EXPENSE OPERATIONS ============
  expenses: router({
    getByProperty: protectedProcedure.input(z.object({ propertyId: z.number().int() })).query(async ({ input, ctx }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || property.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getPropertyExpenses(input.propertyId);
    }),

    add: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          expense: expenseLogSchema,
          breakdown: z.array(expenseBreakdownSchema).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const expenseId = await db.createExpenseLog({
          ...input.expense,
          propertyId: input.propertyId,
          totalAmount: input.expense.totalAmount.toString(),
          growthRate: input.expense.growthRate.toString()
        });

        if (input.breakdown && input.breakdown.length > 0) {
          for (const item of input.breakdown) {
            await db.addExpenseBreakdown({
              ...item,
              expenseLogId: expenseId,
              amount: item.amount.toString()
            });
          }
        }

        return { id: expenseId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          breakdown: z.array(expenseBreakdownSchema).optional(),
          growthRate: z.number().optional(), // in basis points (e.g., 300 = 3%)
        })
      )
      .mutation(async ({ input, ctx }) => {
        const expenseLog = await db.getExpenseLogById(input.id);
        if (!expenseLog) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const property = await db.getPropertyById(expenseLog.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const updates: { totalAmount?: string; growthRate?: string } = {};
        if (input.growthRate !== undefined) {
          updates.growthRate = input.growthRate.toString();
        }

        if (input.breakdown) {
          // Calculate total amount from breakdown
          const totalAmount = input.breakdown.reduce((sum, item) => sum + item.amount, 0);
          updates.totalAmount = totalAmount.toString();
        }

        if (Object.keys(updates).length > 0) {
          await db.updateExpenseLog(input.id, updates);
        }

        if (input.breakdown) {
          // Delete existing breakdown items
          await db.deleteExpenseBreakdownByLogId(input.id);
          // Add new breakdown items
          for (const item of input.breakdown) {
            await db.addExpenseBreakdown({
              ...item,
              expenseLogId: input.id,
              amount: item.amount.toString()
            });
          }
        }
        return { success: true };
      }),

    getBreakdown: protectedProcedure.input(z.object({ expenseLogId: z.number().int() })).query(async ({ input }) => {
      return await db.getExpenseBreakdown(input.expenseLogId);
    }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await db.deleteExpenseLog(input.id);
      return { success: true };
    }),
  }),

  // ============ DEPRECIATION OPERATIONS ============
  depreciation: router({
    add: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          schedule: depreciationScheduleSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.addDepreciationSchedule({
          ...input.schedule,
          propertyId: input.propertyId,
          annualAmount: input.schedule.annualAmount.toString()
        });
        return { id };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await db.deleteDepreciationSchedule(input.id);
      return { success: true };
    }),
  }),

  // ============ CAPITAL EXPENDITURE OPERATIONS ============
  capex: router({
    add: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          capex: capitalExpenditureSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.addCapitalExpenditure({
          ...input.capex,
          propertyId: input.propertyId,
          amount: input.capex.amount.toString()
        });
        return { id };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await db.deleteCapitalExpenditure(input.id);
      return { success: true };
    }),
  }),

  // ============ CALCULATIONS ============
  calculations: router({
    portfolioSummary: protectedProcedure
      .input(z.object({ year: z.number().int() }))
      .query(async ({ input, ctx }) => {
        const portfolioData = await db.getUserPortfolioData(ctx.user.id);
        if (!portfolioData) return null;
        return calc.calculatePortfolioSummary(portfolioData.properties, input.year);
      }),

    portfolioProjections: protectedProcedure
      .input(
        z.object({
          startYear: z.number().int(),
          endYear: z.number().int(),
          expenseGrowthOverride: z.number().nullable().optional(), // Override expense growth rate (as percentage, e.g., 3 for 3%)
          scenarioId: z.number().int().optional(),
          interestRateOffset: z.number().int().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const scenarioId = input.scenarioId ?? null;
        const portfolioData = await db.getUserPortfolioData(ctx.user.id, scenarioId);
        if (!portfolioData) return [];
        return calc.generatePortfolioProjections(
          portfolioData.properties,
          input.startYear,
          input.endYear,
          input.expenseGrowthOverride ?? undefined,
          input.interestRateOffset ?? 0
        );
      }),

    propertyEquity: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          year: z.number().int(),
        })
      )
      .query(async ({ input, ctx }) => {
        const data = await db.getCompletePropertyData(input.propertyId);
        if (!data || data.property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return calc.calculatePropertyEquity(
          data.property,
          data.loans,
          data.valuations,
          data.growthRates,
          input.year
        );
      }),

    propertyCashflow: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          year: z.number().int(),
        })
      )
      .query(async ({ input, ctx }) => {
        const data = await db.getCompletePropertyData(input.propertyId);
        if (!data || data.property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return calc.calculatePropertyCashflow(
          data.property,
          data.loans,
          data.rental,
          data.expenses,
          data.depreciation,
          input.year
        );
      }),

    investmentComparison: protectedProcedure
      .input(
        z.object({
          startYear: z.number().int(),
          endYear: z.number().int(),
          shareAnnualReturn: z.number().default(7),
        })
      )
      .query(async ({ input, ctx }) => {
        const portfolioData = await db.getUserPortfolioData(ctx.user.id);
        if (!portfolioData) return [];
        return calc.generateInvestmentComparison(portfolioData.properties, input.startYear, input.endYear, input.shareAnnualReturn);
      }),
  }),

  // ============ LOAN SCENARIOS ============
  loanScenarios: router({
    getByProperty: protectedProcedure
      .input(z.object({ propertyId: z.number().int() }))
      .query(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getLoanScenariosByProperty(input.propertyId);
      }),

    save: protectedProcedure
      .input(
        z.object({
          propertyId: z.number().int(),
          name: z.string().min(1, "Scenario name is required"),
          description: z.string().optional(),
          propertyValue: z.number().int(),
          deposit: z.number().int(),
          loanAmount: z.number().int(),
          interestRate: z.number().int(),
          loanTerm: z.number().int(),
          repaymentFrequency: z.string(),
          interestOption: z.string(),
          offsetBalance: z.number().int().default(0),
          extraRepaymentAmount: z.number().int().default(0),
          extraRepaymentFrequency: z.string().optional(),
          propertyGrowthRate: z.number().int(),
          totalInterest: z.number().int().optional(),
          totalPayments: z.number().int().optional(),
          futurePropertyValue: z.number().int().optional(),
          projectionYears: z.number().int().default(30),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.saveLoanScenario({ ...input, userId: ctx.user.id });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        const scenario = await db.getLoanScenarioById(input.id);
        if (!scenario || scenario.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteLoanScenario(input.id);
        return { success: true };
      }),
  }),

  // ============ PORTFOLIO OPERATIONS ============
  portfolio: router({
    getGoal: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPortfolioGoal(ctx.user.id);
    }),

    setGoal: protectedProcedure.input(portfolioGoalSchema).mutation(async ({ input, ctx }) => {
      await db.upsertPortfolioGoal({
        ...input,
        userId: ctx.user.id,
        targetEquity: input.targetEquity.toString(),
        targetValue: input.targetValue.toString(),
        targetCashflow: undefined // Schema didn't have targetCashflow input?
      });
      return { success: true };
    }),

    getData: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPortfolioData(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
