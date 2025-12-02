import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as calc from "./calculations";
import { TRPCError } from "@trpc/server";
import { subscriptionRouter } from "./subscription-router";

// ============ VALIDATION SCHEMAS ============

const propertySchema = z.object({
  nickname: z.string().min(1, "Property nickname is required"),
  address: z.string().min(1, "Address is required"),
  state: z.string().min(1, "State is required"),
  suburb: z.string().min(1, "Suburb is required"),
  propertyType: z.enum(["Residential", "Commercial", "Industrial", "Land"]),
  ownershipStructure: z.enum(["Trust", "Individual", "Company", "Partnership"]),
  linkedEntity: z.string().optional(),
  purchaseDate: z.date(),
  purchasePrice: z.number().int().positive("Purchase price must be positive"),
  saleDate: z.date().optional(),
  salePrice: z.number().int().positive().optional(),
  status: z.enum(["Actual", "Projected"]),
});

const propertyOwnershipSchema = z.object({
  ownerName: z.string().min(1, "Owner name is required"),
  percentage: z.number().int().min(0).max(100, "Percentage must be between 0 and 100"),
});

const purchaseCostsSchema = z.object({
  agentFee: z.number().int().min(0).default(0),
  stampDuty: z.number().int().min(0).default(0),
  legalFee: z.number().int().min(0).default(0),
  inspectionFee: z.number().int().min(0).default(0),
  otherCosts: z.number().int().min(0).default(0),
});

const usagePeriodSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional(),
  usageType: z.enum(["Investment", "PPOR"]),
});

const loanSchema = z.object({
  securityPropertyId: z.number().int().optional(),
  loanType: z.enum(["EquityLoan", "PrincipalLoan"]),
  lenderName: z.string().min(1, "Lender name is required"),
  loanPurpose: z.enum(["PropertyPurchase", "Renovation", "Investment", "Other"]),
  loanStructure: z.enum(["InterestOnly", "PrincipalAndInterest"]),
  startDate: z.date(),
  originalAmount: z.number().int().positive("Original amount must be positive"),
  currentAmount: z.number().int().positive("Current amount must be positive"),
  interestRate: z.number().int().positive("Interest rate must be positive"),
  remainingTermYears: z.number().int().min(0, "Remaining term cannot be negative"),
  remainingIOPeriodYears: z.number().int().min(0).default(0),
  repaymentFrequency: z.enum(["Monthly", "Fortnightly", "Weekly"]),
});

const valuationSchema = z.object({
  valuationDate: z.date(),
  value: z.number().int().positive("Value must be positive"),
});

const growthRatePeriodSchema = z.object({
  startYear: z.number().int(),
  endYear: z.number().int().optional(),
  growthRate: z.number().int(),
});

const rentalIncomeSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional(),
  amount: z.number().int().positive("Amount must be positive"),
  frequency: z.enum(["Monthly", "Weekly", "Fortnightly"]),
  growthRate: z.number().int().default(0),
});

const expenseLogSchema = z.object({
  date: z.date(),
  totalAmount: z.number().int().positive("Total amount must be positive"),
  frequency: z.enum(["Monthly", "Annual", "OneTime"]),
  growthRate: z.number().int().default(0),
});

const expenseBreakdownSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().int().positive("Amount must be positive"),
});

const depreciationScheduleSchema = z.object({
  asAtDate: z.date(),
  annualAmount: z.number().int().positive("Annual amount must be positive"),
});

const capitalExpenditureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().int().positive("Amount must be positive"),
  date: z.date(),
});

const portfolioGoalSchema = z.object({
  goalYear: z.number().int().min(new Date().getFullYear(), "Goal year must be in the future"),
  targetEquity: z.number().int().positive("Target equity must be positive"),
  targetValue: z.number().int().positive("Target value must be positive"),
});

// ============ ROUTERS ============

export const appRouter = router({
  system: systemRouter,
  subscription: subscriptionRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ PROPERTY OPERATIONS ============
  properties: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPropertiesByUserId(ctx.user.id);
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
        await db.updateProperty(input.id, input.data);
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

        // Validate that percentages sum to 100
        const totalPercentage = input.owners.reduce((sum, owner) => sum + owner.percentage, 0);
        if (totalPercentage !== 100) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ownership percentages must sum to 100" });
        }

        await db.setPropertyOwnership(
          input.propertyId,
          input.owners.map((o) => ({ ...o, propertyId: input.propertyId }))
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
        await db.upsertPurchaseCosts({ ...input.costs, propertyId: input.propertyId });
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
        const id = await db.createLoan({ ...input.loan, propertyId: input.propertyId });
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
        await db.updateLoan(input.id, input.data);
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
        const id = await db.addPropertyValuation({ ...input.valuation, propertyId: input.propertyId });
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
          value: input.value,
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
        const id = await db.addGrowthRatePeriod({ ...input.period, propertyId: input.propertyId });
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
        const id = await db.addRentalIncome({ ...input.income, propertyId: input.propertyId });
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
        const updates: Partial<{ amount: number; growthRate: number }> = {};
        if (input.weeklyRent !== undefined) {
          updates.amount = input.weeklyRent;
        }
        if (input.growthRate !== undefined) {
          updates.growthRate = input.growthRate;
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
        const expenseId = await db.createExpenseLog({ ...input.expense, propertyId: input.propertyId });

        if (input.breakdown && input.breakdown.length > 0) {
          for (const item of input.breakdown) {
            await db.addExpenseBreakdown({ ...item, expenseLogId: expenseId });
          }
        }

        return { id: expenseId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          breakdown: z.array(expenseBreakdownSchema),
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
        // Delete existing breakdown items
        await db.deleteExpenseBreakdownByLogId(input.id);
        // Add new breakdown items
        for (const item of input.breakdown) {
          await db.addExpenseBreakdown({ ...item, expenseLogId: input.id });
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
        const id = await db.addDepreciationSchedule({ ...input.schedule, propertyId: input.propertyId });
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
        const id = await db.addCapitalExpenditure({ ...input.capex, propertyId: input.propertyId });
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
        })
      )
      .query(async ({ input, ctx }) => {
        const portfolioData = await db.getUserPortfolioData(ctx.user.id);
        if (!portfolioData) return [];
        return calc.generatePortfolioProjections(portfolioData.properties, input.startYear, input.endYear);
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
        return calc.calculatePropertyEquity(data.property, data.loans, data.valuations, data.growthRates, input.year);
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
        return calc.calculatePropertyCashflow(data.property, data.loans, data.rental, data.expenses, data.depreciation, input.year);
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
  scenarios: router({
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
      await db.upsertPortfolioGoal({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

    getData: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPortfolioData(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
