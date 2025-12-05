/**
 * Feature Gates Module
 * 
 * Provides helper functions to check user subscription tier limits and feature access.
 * All functions return boolean or detailed status objects for authorization decisions.
 */

import { getDb } from "./db";
import { eq, and, isNull, or } from "drizzle-orm";
import { users, userSubscriptions, subscriptionTiers, properties } from "../drizzle/schema";

// ============ TYPE DEFINITIONS ============

export interface SubscriptionTier {
  id: number;
  tierName: string;
  displayName: string;
  propertyLimit: number;
  forecastYearsLimit: number;
  canUseTaxCalculator: number;
  canUseInvestmentComparison: number;
  canExportReports: number;
  canUseAdvancedAnalytics: number;
}

export interface UserSubscription {
  id: number;
  userId: number;
  tierId: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date | null;
  tier: SubscriptionTier;
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
  requiredTier: string;
  reason?: string;
}

// ============ CORE SUBSCRIPTION FUNCTIONS ============

/**
 * Get user's active subscription with tier details
 * Returns default "basic" tier if no subscription found
 */
export async function getUserSubscription(userId: number): Promise<UserSubscription | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: userSubscriptions.id,
      userId: userSubscriptions.userId,
      tierId: userSubscriptions.tierId,
      status: userSubscriptions.status,
      startDate: userSubscriptions.startDate,
      endDate: userSubscriptions.endDate,
      tier: {
        id: subscriptionTiers.id,
        tierName: subscriptionTiers.tierName,
        displayName: subscriptionTiers.displayName,
        propertyLimit: subscriptionTiers.propertyLimit,
        forecastYearsLimit: subscriptionTiers.forecastYearsLimit,
        canUseTaxCalculator: subscriptionTiers.canUseTaxCalculator,
        canUseInvestmentComparison: subscriptionTiers.canUseInvestmentComparison,
        canExportReports: subscriptionTiers.canExportReports,
        canUseAdvancedAnalytics: subscriptionTiers.canUseAdvancedAnalytics,
      },
    })
    .from(userSubscriptions)
    .innerJoin(subscriptionTiers, eq(userSubscriptions.tierId, subscriptionTiers.id))
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active'),
        or(
          isNull(userSubscriptions.endDate),
          // endDate is in the future
        )
      )
    )
    .limit(1);

  if (result.length === 0) {
    // Return default basic tier if no subscription found
    const basicTier = await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.tierName, 'basic'))
      .limit(1);

    if (basicTier.length === 0) {
      throw new Error("Default basic tier not found in database");
    }

    return {
      id: 0,
      userId,
      tierId: basicTier[0].id,
      status: 'active',
      startDate: new Date(),
      endDate: null,
      tier: {
        id: basicTier[0].id,
        tierName: basicTier[0].tierName,
        displayName: basicTier[0].displayName,
        propertyLimit: basicTier[0].propertyLimit,
        forecastYearsLimit: basicTier[0].forecastYearsLimit,
        canUseTaxCalculator: basicTier[0].canUseTaxCalculator,
        canUseInvestmentComparison: basicTier[0].canUseInvestmentComparison,
        canExportReports: basicTier[0].canExportReports,
        canUseAdvancedAnalytics: basicTier[0].canUseAdvancedAnalytics,
      },
    };
  }

  return result[0];
}

/**
 * Get user's current property count
 */
export async function getPropertyCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.userId, userId));

  return result.length;
}

/**
 * Check if user is admin (bypasses all subscription limits)
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 && result[0].role === 'admin';
}

// ============ FEATURE GATE FUNCTIONS ============

/**
 * Check if user can add another property
 * Returns detailed status including current count and limit
 * 
 * @param userId - User ID to check
 * @returns PropertyLimitStatus object with canAdd boolean
 * 
 * @example
 * const status = await canAddProperty(123);
 * if (!status.canAdd) {
 *   throw new TRPCError({
 *     code: 'FORBIDDEN',
 *     message: `Property limit reached (${status.currentCount}/${status.limit}). Upgrade to Pro for unlimited properties.`
 *   });
 * }
 */
export async function canAddProperty(userId: number): Promise<PropertyLimitStatus> {
  // Admins have unlimited access
  if (await isAdmin(userId)) {
    return {
      currentCount: await getPropertyCount(userId),
      limit: 999,
      canAdd: true,
      remaining: 999,
      isUnlimited: true,
    };
  }

  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error("User subscription not found");
  }

  const currentCount = await getPropertyCount(userId);
  const limit = subscription.tier.propertyLimit;
  const canAdd = currentCount < limit;
  const remaining = Math.max(0, limit - currentCount);

  return {
    currentCount,
    limit,
    canAdd,
    remaining,
    isUnlimited: limit >= 999, // 999 is treated as unlimited
  };
}

/**
 * Check if user can view forecast for specified number of years
 * 
 * @param userId - User ID to check
 * @param years - Number of forecast years requested
 * @returns ForecastLimitStatus object with canView boolean
 * 
 * @example
 * const status = await canViewForecastYears(123, 30);
 * if (!status.canView) {
 *   throw new TRPCError({
 *     code: 'FORBIDDEN',
 *     message: `Forecast limit exceeded. Your plan allows ${status.limit} years. Upgrade to Pro for ${status.limit === 10 ? '50' : 'unlimited'} years.`
 *   });
 * }
 */
export async function canViewForecastYears(userId: number, years: number): Promise<ForecastLimitStatus> {
  // Admins have unlimited access
  if (await isAdmin(userId)) {
    return {
      requestedYears: years,
      limit: 50,
      canView: true,
      isUnlimited: true,
    };
  }

  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error("User subscription not found");
  }

  const limit = subscription.tier.forecastYearsLimit;
  const canView = years <= limit;

  return {
    requestedYears: years,
    limit,
    canView,
    isUnlimited: limit >= 50, // 50 is treated as unlimited for practical purposes
  };
}

/**
 * Check if user can use tax calculator feature
 * 
 * @param userId - User ID to check
 * @returns FeatureAccessStatus object with hasAccess boolean
 * 
 * @example
 * const status = await canUseTaxCalculator(123);
 * if (!status.hasAccess) {
 *   throw new TRPCError({
 *     code: 'FORBIDDEN',
 *     message: `Tax Calculator requires ${status.requiredTier} subscription. You are currently on ${status.tierName}.`
 *   });
 * }
 */
export async function canUseTaxCalculator(userId: number): Promise<FeatureAccessStatus> {
  // Admins have unlimited access
  if (await isAdmin(userId)) {
    return {
      hasAccess: true,
      tierName: 'admin',
      requiredTier: 'admin',
    };
  }

  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error("User subscription not found");
  }

  const hasAccess = subscription.tier.canUseTaxCalculator === 1;

  return {
    hasAccess,
    tierName: subscription.tier.tierName,
    requiredTier: hasAccess ? subscription.tier.tierName : 'pro',
    reason: hasAccess ? undefined : 'Tax Calculator is a Pro feature',
  };
}

/**
 * Check if user can use investment comparison feature
 * 
 * @param userId - User ID to check
 * @returns FeatureAccessStatus object with hasAccess boolean
 */
export async function canUseInvestmentComparison(userId: number): Promise<FeatureAccessStatus> {
  // Admins have unlimited access
  if (await isAdmin(userId)) {
    return {
      hasAccess: true,
      tierName: 'admin',
      requiredTier: 'admin',
    };
  }

  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error("User subscription not found");
  }

  const hasAccess = subscription.tier.canUseInvestmentComparison === 1;

  return {
    hasAccess,
    tierName: subscription.tier.tierName,
    requiredTier: hasAccess ? subscription.tier.tierName : 'pro',
    reason: hasAccess ? undefined : 'Investment Comparison is a Pro feature',
  };
}

/**
 * Check if user can export reports
 * 
 * @param userId - User ID to check
 * @returns FeatureAccessStatus object with hasAccess boolean
 */
export async function canExportReports(userId: number): Promise<FeatureAccessStatus> {
  // Admins have unlimited access
  if (await isAdmin(userId)) {
    return {
      hasAccess: true,
      tierName: 'admin',
      requiredTier: 'admin',
    };
  }

  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error("User subscription not found");
  }

  const hasAccess = subscription.tier.canExportReports === 1;

  return {
    hasAccess,
    tierName: subscription.tier.tierName,
    requiredTier: hasAccess ? subscription.tier.tierName : 'pro',
    reason: hasAccess ? undefined : 'Report Export is a Pro feature',
  };
}

/**
 * Check if user can use advanced analytics
 * 
 * @param userId - User ID to check
 * @returns FeatureAccessStatus object with hasAccess boolean
 */
export async function canUseAdvancedAnalytics(userId: number): Promise<FeatureAccessStatus> {
  // Admins have unlimited access
  if (await isAdmin(userId)) {
    return {
      hasAccess: true,
      tierName: 'admin',
      requiredTier: 'admin',
    };
  }

  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error("User subscription not found");
  }

  const hasAccess = subscription.tier.canUseAdvancedAnalytics === 1;

  return {
    hasAccess,
    tierName: subscription.tier.tierName,
    requiredTier: hasAccess ? subscription.tier.tierName : 'pro',
    reason: hasAccess ? undefined : 'Advanced Analytics is a Pro feature',
  };
}

// ============ CONVENIENCE FUNCTIONS ============

/**
 * Get all feature access for a user (useful for frontend feature flags)
 * 
 * @param userId - User ID to check
 * @returns Object with all feature access booleans
 * 
 * @example
 * const features = await getUserFeatureAccess(123);
 * if (features.canUseTaxCalculator) {
 *   // Show tax calculator
 * }
 */
export async function getUserFeatureAccess(userId: number) {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error("User subscription not found");
  }

  const admin = await isAdmin(userId);
  const propertyStatus = await canAddProperty(userId);

  return {
    isAdmin: admin,
    tierName: subscription.tier.tierName,
    displayName: subscription.tier.displayName,
    
    // Property limits
    propertyLimit: subscription.tier.propertyLimit,
    currentPropertyCount: propertyStatus.currentCount,
    canAddProperty: propertyStatus.canAdd,
    remainingProperties: propertyStatus.remaining,
    
    // Forecast limits
    forecastYearsLimit: subscription.tier.forecastYearsLimit,
    
    // Feature flags
    canUseTaxCalculator: admin || subscription.tier.canUseTaxCalculator === 1,
    canUseInvestmentComparison: admin || subscription.tier.canUseInvestmentComparison === 1,
    canExportReports: admin || subscription.tier.canExportReports === 1,
    canUseAdvancedAnalytics: admin || subscription.tier.canUseAdvancedAnalytics === 1,
  };
}

/**
 * Validate feature access and throw error if not allowed
 * Convenience function for use in tRPC procedures
 * 
 * @param userId - User ID to check
 * @param feature - Feature name to check
 * @throws TRPCError with FORBIDDEN code if access denied
 * 
 * @example
 * await requireFeatureAccess(ctx.user.id, 'tax_calculator');
 */
export async function requireFeatureAccess(
  userId: number,
  feature: 'tax_calculator' | 'investment_comparison' | 'export_reports' | 'advanced_analytics'
): Promise<void> {
  let status: FeatureAccessStatus;

  switch (feature) {
    case 'tax_calculator':
      status = await canUseTaxCalculator(userId);
      break;
    case 'investment_comparison':
      status = await canUseInvestmentComparison(userId);
      break;
    case 'export_reports':
      status = await canExportReports(userId);
      break;
    case 'advanced_analytics':
      status = await canUseAdvancedAnalytics(userId);
      break;
  }

  if (!status.hasAccess) {
    const { TRPCError } = await import('@trpc/server');
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${status.reason}. Upgrade to ${status.requiredTier} to unlock this feature.`,
    });
  }
}
