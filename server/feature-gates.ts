/**
 * Feature Gates Module
 * 
 * Enforces subscription tier limits and feature access.
 * Works with existing schema (users table with subscriptionTier enum).
 */

import { users, properties } from "../drizzle/schema-postgres";
import { eq, and, count } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";

// ============ TYPE DEFINITIONS ============

export type SubscriptionTier = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

export interface SubscriptionLimits {
  propertyLimit: number;
  forecastYearsLimit: number;
  canUseTaxCalculator: boolean;
  canUseInvestmentComparison: boolean;
  canExportReports: boolean;
  canUseAdvancedAnalytics: boolean;
}

export interface PropertyLimitStatus {
  currentCount: number;
  limit: number;
  canAdd: boolean;
  remaining: number;
  isUnlimited: boolean;
}

export interface ForecastLimitStatus {
  requestedYears: number;
  limit: number;
  canView: boolean;
  isUnlimited: boolean;
}

export interface FeatureAccessStatus {
  hasAccess: boolean;
  tierName: string;
  requiresPremium: boolean;
  reason?: string;
}

// ============ TIER CONFIGURATION ============

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  FREE: {
    propertyLimit: 2,
    forecastYearsLimit: 10,
    canUseTaxCalculator: false,
    canUseInvestmentComparison: false,
    canExportReports: false,
    canUseAdvancedAnalytics: false,
  },
  PREMIUM_MONTHLY: {
    propertyLimit: -1, // unlimited
    forecastYearsLimit: -1, // unlimited
    canUseTaxCalculator: true,
    canUseInvestmentComparison: true,
    canExportReports: true,
    canUseAdvancedAnalytics: true,
  },
  PREMIUM_ANNUAL: {
    propertyLimit: -1, // unlimited
    forecastYearsLimit: -1, // unlimited
    canUseTaxCalculator: true,
    canUseInvestmentComparison: true,
    canExportReports: true,
    canUseAdvancedAnalytics: true,
  },
};

// ============ HELPER FUNCTIONS ============

/**
 * Get subscription limits for a tier
 */
export function getTierLimits(tier: SubscriptionTier): SubscriptionLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if tier is premium (any paid tier)
 */
export function isPremiumTier(tier: SubscriptionTier): boolean {
  return tier === "PREMIUM_MONTHLY" || tier === "PREMIUM_ANNUAL";
}

// ============ PROPERTY LIMIT CHECKS ============

/**
 * Check if user can add a new property
 * @param db Database instance
 * @param userId User ID to check
 * @returns PropertyLimitStatus with detailed information
 */
export async function canAddProperty(
  db: MySql2Database<any>,
  userId: number
): Promise<PropertyLimitStatus> {
  // Get user's subscription tier
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const tier = user[0].subscriptionTier;
  const limits = getTierLimits(tier);

  // Count current properties
  const result = await db
    .select({ count: count() })
    .from(properties)
    .where(eq(properties.userId, userId));

  const currentCount = result[0]?.count ?? 0;
  const limit = limits.propertyLimit;
  const isUnlimited = limit === -1;
  const canAdd = isUnlimited || currentCount < limit;
  const remaining = isUnlimited ? -1 : Math.max(0, limit - currentCount);

  return {
    currentCount,
    limit,
    canAdd,
    remaining,
    isUnlimited,
  };
}

/**
 * Get property count for user
 */
export async function getPropertyCount(db: MySql2Database<any>, userId: number): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(properties)
    .where(eq(properties.userId, userId));

  return result[0]?.count ?? 0;
}

// ============ FORECAST LIMIT CHECKS ============

/**
 * Check if user can view forecast for requested years
 * @param db Database instance
 * @param userId User ID to check
 * @param requestedYears Number of years requested
 * @returns ForecastLimitStatus with detailed information
 */
export async function canViewForecast(
  db: MySql2Database<any>,
  userId: number,
  requestedYears: number
): Promise<ForecastLimitStatus> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const tier = user[0].subscriptionTier;
  const limits = getTierLimits(tier);
  const limit = limits.forecastYearsLimit;
  const isUnlimited = limit === -1;
  const canView = isUnlimited || requestedYears <= limit;

  return {
    requestedYears,
    limit,
    canView,
    isUnlimited,
  };
}

// ============ FEATURE ACCESS CHECKS ============

/**
 * Check if user can use tax calculator
 */
export async function canUseTaxCalculator(
  db: MySql2Database<any>,
  userId: number
): Promise<FeatureAccessStatus> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const tier = user[0].subscriptionTier;
  const limits = getTierLimits(tier);
  const hasAccess = limits.canUseTaxCalculator;

  return {
    hasAccess,
    tierName: tier,
    requiresPremium: !hasAccess,
    reason: hasAccess ? undefined : "Tax calculator requires Premium subscription",
  };
}

/**
 * Check if user can use investment comparison
 */
export async function canUseInvestmentComparison(
  db: MySql2Database<any>,
  userId: number
): Promise<FeatureAccessStatus> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const tier = user[0].subscriptionTier;
  const limits = getTierLimits(tier);
  const hasAccess = limits.canUseInvestmentComparison;

  return {
    hasAccess,
    tierName: tier,
    requiresPremium: !hasAccess,
    reason: hasAccess ? undefined : "Investment comparison requires Premium subscription",
  };
}

/**
 * Check if user can export reports
 */
export async function canExportReports(
  db: MySql2Database<any>,
  userId: number
): Promise<FeatureAccessStatus> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const tier = user[0].subscriptionTier;
  const limits = getTierLimits(tier);
  const hasAccess = limits.canExportReports;

  return {
    hasAccess,
    tierName: tier,
    requiresPremium: !hasAccess,
    reason: hasAccess ? undefined : "Report exports require Premium subscription",
  };
}

/**
 * Check if user can use advanced analytics
 */
export async function canUseAdvancedAnalytics(
  db: MySql2Database<any>,
  userId: number
): Promise<FeatureAccessStatus> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const tier = user[0].subscriptionTier;
  const limits = getTierLimits(tier);
  const hasAccess = limits.canUseAdvancedAnalytics;

  return {
    hasAccess,
    tierName: tier,
    requiresPremium: !hasAccess,
    reason: hasAccess ? undefined : "Advanced analytics require Premium subscription",
  };
}

// ============ BULK ACCESS CHECK ============

/**
 * Get all feature access for a user (useful for UI rendering)
 */
export async function getAllFeatureAccess(db: MySql2Database<any>, userId: number) {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const tier = user[0].subscriptionTier;
  const limits = getTierLimits(tier);
  const propertyStatus = await canAddProperty(db, userId);

  return {
    tier,
    isPremium: isPremiumTier(tier),
    limits,
    propertyStatus,
    features: {
      taxCalculator: limits.canUseTaxCalculator,
      investmentComparison: limits.canUseInvestmentComparison,
      exportReports: limits.canExportReports,
      advancedAnalytics: limits.canUseAdvancedAnalytics,
    },
  };
}
