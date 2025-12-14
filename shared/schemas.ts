import { z } from "zod";

export const portfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required").max(100, "Name too long"),
  type: z.enum(["Normal", "Trust", "Company"]).default("Normal"),
  description: z.string().max(500, "Description too long").optional(),
});

export const propertySchema = z.object({
  nickname: z.string().min(1, "Property nickname is required").max(100, "Nickname too long"),
  address: z.string().min(5, "Address is required").max(200, "Address too long"),
  state: z.string().min(2, "State is required").max(50),
  suburb: z.string().min(2, "Suburb is required").max(100),
  propertyType: z.enum(["Residential", "Commercial", "Industrial", "Land"]),
  ownershipStructure: z.enum(["Trust", "Individual", "Company", "Partnership"]),
  linkedEntity: z.string().max(100).optional(),
  purchaseDate: z.date(),
  purchasePrice: z.number().int().positive("Purchase price must be positive").max(1_000_000_000_00, "Price exceeds limit"), // 100 Billion cents
  saleDate: z.date().optional(),
  salePrice: z.number().int().positive().optional(),
  status: z.enum(["Actual", "Projected"]),
  scenarioId: z.number().int().optional(),
});

export const propertyOwnershipSchema = z.object({
  ownerName: z.string().min(1, "Owner name is required").max(100),
  percentage: z.number().int().min(0).max(100, "Percentage must be between 0 and 100"),
});

export const purchaseCostsSchema = z.object({
  agentFee: z.number().int().min(0).default(0),
  stampDuty: z.number().int().min(0).default(0),
  legalFee: z.number().int().min(0).default(0),
  inspectionFee: z.number().int().min(0).default(0),
  otherCosts: z.number().int().min(0).default(0),
});

export const usagePeriodSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional(),
  usageType: z.enum(["Investment", "PPOR"]),
});

export const loanSchema = z.object({
  securityPropertyId: z.number().int().optional(),
  loanType: z.enum(["EquityLoan", "PrincipalLoan"]),
  lenderName: z.string().min(1, "Lender name is required").max(100),
  loanPurpose: z.enum(["PropertyPurchase", "Renovation", "Investment", "Other"]),
  loanStructure: z.enum(["InterestOnly", "PrincipalAndInterest"]),
  startDate: z.date(),
  originalAmount: z.number().int().positive("Original amount must be positive"),
  currentAmount: z.number().int().positive("Current amount must be positive"),
  interestRate: z.number().int().positive("Interest rate must be positive").max(2000, "Interest rate too high (>20%)"), // Basis points
  remainingTermYears: z.number().int().min(0, "Remaining term cannot be negative").max(40, "Term too long"),
  remainingIOPeriodYears: z.number().int().min(0).default(0),
  repaymentFrequency: z.enum(["Monthly", "Fortnightly", "Weekly"]),
  offsetBalance: z.number().int().default(0),
});

export const valuationSchema = z.object({
  valuationDate: z.date(),
  value: z.number().int().positive("Value must be positive"),
});

export const growthRatePeriodSchema = z.object({
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().optional(),
  growthRate: z.number().int().min(-1000).max(2000), // -10% to +20%
});

export const rentalIncomeSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional(),
  amount: z.number().int().positive("Amount must be positive"),
  frequency: z.enum(["Monthly", "Weekly", "Fortnightly"]),
  growthRate: z.number().int().default(0),
});

export const expenseLogSchema = z.object({
  date: z.date(),
  totalAmount: z.number().int().positive("Total amount must be positive"),
  frequency: z.enum(["Monthly", "Annual", "OneTime"]),
  growthRate: z.number().int().default(0),
});

export const expenseBreakdownSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  amount: z.number().int().positive("Amount must be positive"),
  frequency: z.enum(["Weekly", "Monthly", "Quarterly", "Annually"]).default("Annually"),
});

export const depreciationScheduleSchema = z.object({
  asAtDate: z.date(),
  annualAmount: z.number().int().positive("Annual amount must be positive"),
});

export const capitalExpenditureSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number().int().positive("Amount must be positive"),
  date: z.date(),
});

export const portfolioGoalSchema = z.object({
  goalYear: z.number().int().min(new Date().getFullYear(), "Goal year must be in the future").max(2100),
  targetEquity: z.number().int().positive("Target equity must be positive"),
  targetValue: z.number().int().positive("Target value must be positive"),
});
