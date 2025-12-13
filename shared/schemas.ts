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
