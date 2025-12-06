// @ts-nocheck
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { db, getDb } from '../db';
import { userSubscriptions, subscriptionTiers, properties } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user's feature access based on subscription tier
 */
export async function getUserFeatureAccess(userId: number) {
  const database = await getDb();
  
  const subscription = await database.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, userId),
    with: {
      tier: true,
    },
  });

  if (!subscription) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User subscription not found',
    });
  }

  // Check if subscription is still active
  if (subscription.status !== 'active') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Subscription is not active',
    });
  }

  // Check if subscription has expired
  if (subscription.endDate && new Date() > subscription.endDate) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Subscription has expired',
    });
  }

  // Get current property count
  const propertyList = await database.query.properties.findMany({
    where: eq(properties.userId, userId),
  });

  return {
    tierId: subscription.tierId,
    tierName: subscription.tier.name,
    tierDisplayName: subscription.tier.displayName,
    status: subscription.status,
    propertyLimit: subscription.tier.maxProperties,
    currentPropertyCount: propertyList.length,
    canAddMoreProperties:
      subscription.tier.maxProperties === 0 ||
      propertyList.length < subscription.tier.maxProperties,
    maxForecastYears: subscription.tier.maxForecastYears,
    features: {
      advancedAnalytics: subscription.tier.canUseAdvancedAnalytics,
      scenarioComparison: subscription.tier.canUseScenarioComparison,
      exportReports: subscription.tier.canExportReports,
      taxCalculator: subscription.tier.canUseTaxCalculator,
    },
    startDate: subscription.startDate,
    endDate: subscription.endDate,
  };
}

/**
 * Create a protected procedure that checks feature access
 */
export function featureGatedProcedure(feature: 'advancedAnalytics' | 'scenarioComparison' | 'exportReports' | 'taxCalculator') {
  return protectedProcedure.use(async (opts) => {
    const userId = opts.ctx.user.id;
    const features = await getUserFeatureAccess(userId);

    if (!features.features[feature]) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This feature requires a subscription upgrade`,
      });
    }

    return opts.next();
  });
}

/**
 * Middleware to validate property limit before creation
 */
export function propertyLimitMiddleware() {
  return protectedProcedure.use(async (opts) => {
    const userId = opts.ctx.user.id;
    const features = await getUserFeatureAccess(userId);

    if (!features.canAddMoreProperties) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You have reached your property limit of ${features.propertyLimit}. Upgrade to Pro for unlimited properties.`,
      });
    }

    return opts.next();
  });
}

/**
 * Feature gates router
 */
export const featureGatesRouter = router({
  getFeatureAccess: protectedProcedure.query(async ({ ctx }) => {
    return getUserFeatureAccess(ctx.user.id);
  }),

  canAddProperty: protectedProcedure.query(async ({ ctx }) => {
    const features = await getUserFeatureAccess(ctx.user.id);
    return {
      canAdd: features.canAddMoreProperties,
      currentCount: features.currentPropertyCount,
      limit: features.propertyLimit,
      message: !features.canAddMoreProperties
        ? `Property limit (${features.propertyLimit}) reached. Upgrade to Pro.`
        : null,
    };
  }),
});