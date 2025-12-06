// @ts-nocheck
// Subscription helper functions - separated to avoid type inference issues with drizzle query API
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { userSubscriptions, subscriptionTiers, users, properties } from "../drizzle/schema";

/**
 * Get user's current subscription with tier details
 */
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  
  const subscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, userId),
    with: {
      tier: true,
    },
  });

  return subscription || null;
}

/**
 * Get subscription tier by name
 */
export async function getSubscriptionTierByName(tierName: string) {
  const db = await getDb();
  
  const tier = await db.query.subscriptionTiers.findFirst({
    where: eq(subscriptionTiers.name, tierName),
  });

  return tier || null;
}

/**
 * Get all subscription tiers
 */
export async function getAllSubscriptionTiers() {
  const db = await getDb();
  
  return await db.query.subscriptionTiers.findMany();
}

/**
 * Assign default subscription to new user
 */
export async function assignDefaultSubscription(userId: number) {
  const db = await getDb();
  
  const basicTier = await getSubscriptionTierByName('basic');
  
  if (!basicTier) {
    throw new Error('Basic subscription tier not found');
  }

  const result = await db.insert(userSubscriptions).values({
    userId,
    tierId: basicTier.id,
    status: 'active',
    startDate: new Date(),
    endDate: null,
  });

  return result;
}

/**
 * Upgrade user to a new tier
 */
export async function upgradeUserSubscription(userId: number, newTierId: number) {
  const db = await getDb();
  
  const result = await db.update(userSubscriptions)
    .set({
      tierId: newTierId,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  return result;
}

/**
 * Suspend user subscription
 */
export async function suspendUserSubscription(userId: number) {
  const db = await getDb();
  
  const result = await db.update(userSubscriptions)
    .set({
      status: 'suspended',
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  return result;
}

/**
 * Cancel user subscription
 */
export async function cancelUserSubscription(userId: number) {
  const db = await getDb();
  
  const result = await db.update(userSubscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  return result;
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user?.role === 'admin' || false;
}

/**
 * Get user feature access
 */
export async function getUserFeatureAccess(userId: number) {
  const db = await getDb();
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user?.role === 'admin') {
    return {
      tierId: -1,
      tierName: 'admin',
      tierDisplayName: 'Admin',
      status: 'active',
      propertyLimit: 0,
      currentPropertyCount: 0,
      canAddMoreProperties: true,
      maxForecastYears: 50,
      features: {
        advancedAnalytics: true,
        scenarioComparison: true,
        exportReports: true,
        taxCalculator: true,
      },
      startDate: new Date(),
      endDate: null,
      isAdmin: true,
    };
  }

  const subscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, userId),
    with: {
      tier: true,
    },
  });

  if (!subscription) {
    throw new Error('User subscription not found');
  }

  if (subscription.status !== 'active') {
    throw new Error('Subscription is not active');
  }

  if (subscription.endDate && new Date() > subscription.endDate) {
    throw new Error('Subscription has expired');
  }

  const propertyCount = await db.query.properties.findMany({
    where: eq(properties.userId, userId),
  });

  return {
    tierId: subscription.tierId,
    tierName: subscription.tier.name,
    tierDisplayName: subscription.tier.displayName,
    status: subscription.status,
    propertyLimit: subscription.tier.maxProperties,
    currentPropertyCount: propertyCount.length,
    canAddMoreProperties:
      subscription.tier.maxProperties === 0 ||
      propertyCount.length < subscription.tier.maxProperties,
    maxForecastYears: subscription.tier.maxForecastYears,
    features: {
      advancedAnalytics: subscription.tier.canUseAdvancedAnalytics,
      scenarioComparison: subscription.tier.canUseScenarioComparison,
      exportReports: subscription.tier.canExportReports,
      taxCalculator: subscription.tier.canUseTaxCalculator,
    },
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    isAdmin: false,
  };
}

/**
 * Count active users by tier
 */
export async function countUsersByTier() {
  const db = await getDb();
  
  const results = await db.query.userSubscriptions.findMany({
    where: eq(userSubscriptions.status, 'active'),
    with: {
      tier: true,
    },
  });

  const counts: Record<string, number> = {};
  for (const sub of results) {
    counts[sub.tier.name] = (counts[sub.tier.name] || 0) + 1;
  }

  return counts;
}
