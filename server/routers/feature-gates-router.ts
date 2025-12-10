/**
 * Feature Gates tRPC Router
 * 
 * Exposes feature gate checks to the frontend via tRPC.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import * as featureGates from "../feature-gates";
import { db } from "../db";

export const featureGatesRouter = router({
  /**
   * Check if user can add a new property
   */
  canAddProperty: protectedProcedure.query(async ({ ctx }) => {
    // const db = await getDb();
    return await featureGates.canAddProperty(db, ctx.user.id);
  }),

  /**
   * Get property count for current user
   */
  getPropertyCount: protectedProcedure.query(async ({ ctx }) => {
    // const db = await getDb();
    return await featureGates.getPropertyCount(db, ctx.user.id);
  }),

  /**
   * Check if user can view forecast for requested years
   */
  canViewForecast: protectedProcedure
    .input(z.object({ years: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      // const db = await getDb();
      return await featureGates.canViewForecast(db, ctx.user.id, input.years);
    }),

  /**
   * Check tax calculator access
   */
  canUseTaxCalculator: protectedProcedure.query(async ({ ctx }) => {
    // const db = await getDb();
    return await featureGates.canUseTaxCalculator(db, ctx.user.id);
  }),

  /**
   * Check investment comparison access
   */
  canUseInvestmentComparison: protectedProcedure.query(async ({ ctx }) => {
    // const db = await getDb();
    return await featureGates.canUseInvestmentComparison(db, ctx.user.id);
  }),

  /**
   * Check report export access
   */
  canExportReports: protectedProcedure.query(async ({ ctx }) => {
    // const db = await getDb();
    return await featureGates.canExportReports(db, ctx.user.id);
  }),

  /**
   * Check advanced analytics access
   */
  canUseAdvancedAnalytics: protectedProcedure.query(async ({ ctx }) => {
    // const db = await getDb();
    return await featureGates.canUseAdvancedAnalytics(db, ctx.user.id);
  }),

  /**
   * Get all feature access at once (reduces round trips)
   */
  getAllFeatureAccess: protectedProcedure.query(async ({ ctx }) => {
    // const db = await getDb();
    return await featureGates.getAllFeatureAccess(db, ctx.user.id);
  }),
});
