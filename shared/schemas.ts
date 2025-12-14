import { z } from "zod";

// Enums
export const AssetTypeEnum = z.enum(["Cash", "Stock", "Crypto", "Vehicle", "Property", "Other"]);
export const LiabilityTypeEnum = z.enum(["CreditCard", "PersonalLoan", "StudentLoan", "AutoLoan", "Other"]);
export const ContributionFrequencyEnum = z.enum(["Monthly", "Annually", "OneTime"]);
export const PaymentFrequencyEnum = z.enum(["Monthly", "Fortnightly", "Weekly"]);

// Metadata Schema (Flexible JSONB)
const MetadataSchema = z.record(z.string(), z.any()).optional();

// Asset Schema
export const insertAssetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: AssetTypeEnum.default("Cash"),
    balance: z.number(), // Input as number, stored as numeric
    currency: z.string().default("AUD"),
    growthRate: z.number().default(0),
    scenarioId: z.number().int().optional().nullable(),

    // Forecasting
    contributionAmount: z.number().default(0),
    contributionFrequency: ContributionFrequencyEnum.default("Monthly"),

    metadata: MetadataSchema,
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;

// Liability Schema
export const insertLiabilitySchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: LiabilityTypeEnum.default("Other"),
    balance: z.number(),
    interestRate: z.number().default(0),
    scenarioId: z.number().int().optional().nullable(),

    // Forecasting
    paymentAmount: z.number().default(0),
    paymentFrequency: PaymentFrequencyEnum.default("Monthly"),

    metadata: MetadataSchema,
});

export type InsertLiability = z.infer<typeof insertLiabilitySchema>;

// Wizard Schema for Zapiio-style flow
export const wizardPropertySchema = z.object({
    // Step 1: Details
    nickname: z.string().min(1, "Nickname is required"),
    address: z.string().min(1, "Address is required"),
    state: z.string().min(1, "State is required"),
    suburb: z.string().min(1, "Suburb is required"),
    purchaseDate: z.date(),
    owners: z.array(z.object({
        name: z.string().min(1, "Owner name is required"),
        percentage: z.number().min(0).max(100, "Percentage must be between 0 and 100")
    })).min(1, "At least one owner is required").refine((owners) => {
        const total = owners.reduce((sum, o) => sum + o.percentage, 0);
        return Math.abs(total - 100) < 0.1; // Float tolerance
    }, "Ownership percentages must sum to 100%"),

    // Step 2: Usage
    usageType: z.enum(["Investment", "PPOR"]),

    // Step 3: Financials
    purchasePrice: z.number().min(0, "Purchase price must be positive"),
    stampDuty: z.number().min(0).optional(),
    legalFee: z.number().min(0).optional(),
    otherCosts: z.number().min(0).optional(),

    // Optional Scenario Context
    scenarioId: z.number().int().optional().nullable(),
});

export type WizardPropertyFormData = z.infer<typeof wizardPropertySchema>;
