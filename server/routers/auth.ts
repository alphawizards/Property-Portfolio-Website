import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import {
  getUserSubscription,
  getAllSubscriptionTiers,
  upgradeUserSubscription,
  getUserFeatureAccess,
  isUserAdmin,
} from '../db-subscription';
import { z } from 'zod';

/**
 * Authentication and subscription router
 */
export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    try {
      const { getSessionCookieOptions } = require('../_core/cookies');
      const { COOKIE_NAME } = require('@shared/const');
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    } catch (e) {
      // ignore if cookies helper not available in this context
    }
    return { success: true } as const;
  }),
  /**
   * Get current user's subscription info
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await getUserSubscription(ctx.user.id);
      
      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        });
      }

      return {
        id: subscription.id,
        userId: subscription.userId,
        tier: {
          id: subscription.tier.id,
          name: subscription.tier.name,
          displayName: subscription.tier.displayName,
          description: subscription.tier.description,
          maxProperties: subscription.tier.maxProperties,
          maxForecastYears: subscription.tier.maxForecastYears,
          features: {
            advancedAnalytics: subscription.tier.canUseAdvancedAnalytics,
            scenarioComparison: subscription.tier.canUseScenarioComparison,
            exportReports: subscription.tier.canExportReports,
            taxCalculator: subscription.tier.canUseTaxCalculator,
          },
          pricing: {
            monthly: subscription.tier.priceMonthly,
            yearly: subscription.tier.priceYearly,
          },
        },
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        createdAt: subscription.createdAt,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch subscription',
      });
    }
  }),

  /**
   * Get user's feature access
   */
  getFeatureAccess: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getUserFeatureAccess(ctx.user.id);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch features',
      });
    }
  }),

  /**
   * Check if user can add property
   */
  canAddProperty: protectedProcedure.query(async ({ ctx }) => {
    try {
      const features = await getUserFeatureAccess(ctx.user.id);
      
      return {
        canAdd: features.canAddMoreProperties,
        currentCount: features.currentPropertyCount,
        limit: features.propertyLimit,
        tierName: features.tierName,
        message: !features.canAddMoreProperties
          ? `Property limit (${features.propertyLimit}) reached. Upgrade to ${features.tierName === 'basic' ? 'Pro' : 'Admin'}.`
          : null,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check property limit',
      });
    }
  }),

  /**
   * Check if feature is available
   */
  hasFeature: protectedProcedure
    .input(
      z.enum([
        'advancedAnalytics',
        'scenarioComparison',
        'exportReports',
        'taxCalculator',
      ])
    )
    .query(async ({ ctx, input }) => {
      try {
        const features = await getUserFeatureAccess(ctx.user.id);
        const hasFeature = features.features[input];

        return {
          hasFeature,
          feature: input,
          tierName: features.tierName,
          message: !hasFeature
            ? `Feature requires ${features.tierName === 'basic' ? 'Pro' : 'Admin'} subscription`
            : null,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check feature access',
        });
      }
    }),

  /**
   * Get all available tiers (for pricing page)
   */
  getAllTiers: publicProcedure.query(async () => {
    try {
      const tiers = await getAllSubscriptionTiers();

      return tiers.map((tier: any) => ({
        id: tier.id,
        name: tier.name,
        displayName: tier.displayName,
        description: tier.description,
        features: {
          advancedAnalytics: tier.canUseAdvancedAnalytics,
          scenarioComparison: tier.canUseScenarioComparison,
          exportReports: tier.canExportReports,
          taxCalculator: tier.canUseTaxCalculator,
        },
        limits: {
          maxProperties: tier.maxProperties,
          maxForecastYears: tier.maxForecastYears,
        },
        pricing: {
          monthly: tier.priceMonthly,
          yearly: tier.priceYearly,
          stripePriceIdMonthly: tier.stripePriceIdMonthly,
          stripePriceIdYearly: tier.stripePriceIdYearly,
        },
      }));
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch subscription tiers',
      });
    }
  }),

  /**
   * Check if user is admin
   */
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    try {
      const admin = await isUserAdmin(ctx.user.id);
      return { isAdmin: admin };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check admin status',
      });
    }
  }),
});
