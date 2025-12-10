/**
 * Admin Router - Admin-only operations
 * Requires user.role === "admin"
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { users, properties } from "../../drizzle/schema";
import { eq, count, desc, sql } from "drizzle-orm";

// Middleware to check admin role
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Get all users with subscription stats
   */
  getAllUsers: adminProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(50),
        sortBy: z.enum(["createdAt", "lastSignedIn", "subscriptionTier"]).default("createdAt"),
        filterTier: z.enum(["ALL", "FREE", "PREMIUM_MONTHLY", "PREMIUM_ANNUAL"]).default("ALL"),
      })
    )
    .query(async ({ input }) => {
      // const db = await getDb();
      const { page, pageSize, sortBy, filterTier } = input;
      const offset = (page - 1) * pageSize;

      // Build query
      let query: any = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          subscriptionTier: users.subscriptionTier,
          subscriptionStatus: users.subscriptionStatus,
          subscriptionEndDate: users.subscriptionEndDate,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
          stripeCustomerId: users.stripeCustomerId,
        })
        .from(users);

      // Filter by tier if not ALL
      if (filterTier !== "ALL") {
        query = query.where(eq(users.subscriptionTier, filterTier as any));
      }

      // Apply sorting
      if (sortBy === "createdAt") {
        query = query.orderBy(desc(users.createdAt));
      } else if (sortBy === "lastSignedIn") {
        query = query.orderBy(desc(users.lastSignedIn));
      } else {
        query = query.orderBy(desc(users.subscriptionTier));
      }

      const allUsers = await query.limit(pageSize).offset(offset);

      // Get total count for pagination
      const totalResult = await db.select({ count: count() }).from(users);
      const total = totalResult[0]?.count ?? 0;

      return {
        users: allUsers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get dashboard statistics
   */
  getStats: adminProcedure.query(async () => {
    // const db = await getDb();

    // Total users by tier
    const tierStats = await db
      .select({
        tier: users.subscriptionTier,
        count: count(),
      })
      .from(users)
      .groupBy(users.subscriptionTier);

    // Total properties
    const totalPropertiesResult = await db.select({ count: count() }).from(properties);
    const totalProperties = totalPropertiesResult[0]?.count ?? 0;

    // Active subscriptions
    const activeSubscriptionsResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.subscriptionStatus, "active"));
    const activeSubscriptions = activeSubscriptionsResult[0]?.count ?? 0;

    // Total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count ?? 0;

    // Users created this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newUsersThisMonthResult = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${thisMonthStart}`);
    const newUsersThisMonth = newUsersThisMonthResult[0]?.count ?? 0;

    return {
      totalUsers,
      activeSubscriptions,
      totalProperties,
      newUsersThisMonth,
      tierBreakdown: tierStats.reduce(
        (acc: Record<string, number>, { tier, count }) => {
          if (tier) {
            acc[tier] = count;
          } else {
            acc["FREE"] = (acc["FREE"] || 0) + count;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }),

  /**
   * Get user details with all properties
   */
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input }) => {
      // const db = await getDb();

      const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const userProperties = await db
        .select({
          id: properties.id,
          nickname: properties.nickname,
          address: properties.address,
          purchasePrice: properties.purchasePrice,
          createdAt: properties.createdAt,
        })
        .from(properties)
        .where(eq(properties.userId, input.userId));

      return {
        user: user[0],
        properties: userProperties,
        propertyCount: userProperties.length,
      };
    }),

  /**
   * Update user subscription tier (admin override)
   */
  updateUserTier: adminProcedure
    .input(
      z.object({
        userId: z.number().int(),
        tier: z.enum(["FREE", "PREMIUM_MONTHLY", "PREMIUM_ANNUAL"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // const db = await getDb();

      await db
        .update(users)
        .set({
          subscriptionTier: input.tier,
          subscriptionStatus: input.tier === "FREE" ? null : "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      console.log(
        `[Admin] Updated user ${input.userId} to ${input.tier}${input.reason ? `. Reason: ${input.reason}` : ""}`
      );

      return { success: true };
    }),

  /**
   * Get revenue metrics (estimated based on subscriptions)
   */
  /**
   * Get revenue metrics (estimated based on subscriptions)
   */
  getRevenueMetrics: adminProcedure.query(async () => {
    // const db = await getDb();

    const subscriptions = await db
      .select({
        tier: users.subscriptionTier,
        status: users.subscriptionStatus,
        count: count(),
      })
      .from(users)
      .where(eq(users.subscriptionStatus, "active"))
      .groupBy(users.subscriptionTier, users.subscriptionStatus);

    // Pricing (from products.ts)
    const MONTHLY_PRICE = 19;
    const ANNUAL_PRICE = 190;

    let monthlyRecurringRevenue = 0;
    let annualRecurringRevenue = 0;

    subscriptions.forEach(({ tier, count: subCount }) => {
      if (tier === "PREMIUM_MONTHLY") {
        monthlyRecurringRevenue += MONTHLY_PRICE * subCount;
        annualRecurringRevenue += MONTHLY_PRICE * 12 * subCount;
      } else if (tier === "PREMIUM_ANNUAL") {
        monthlyRecurringRevenue += (ANNUAL_PRICE / 12) * subCount;
        annualRecurringRevenue += ANNUAL_PRICE * subCount;
      }
    });

    return {
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
      annualRecurringRevenue: Math.round(annualRecurringRevenue * 100) / 100,
      activeSubscriptionCount: subscriptions.reduce((acc: number, { count: c }) => acc + c, 0),
    };
  }),
});
