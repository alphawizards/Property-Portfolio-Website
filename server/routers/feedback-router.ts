/**
 * Feedback Router - User feedback and support system
 * Handles in-app feedback, Tally.so integration, and admin management
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { feedback, users } from "../../drizzle/schema-postgres";
import { eq, desc, and, sql } from "drizzle-orm";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const feedbackRouter = router({
  /**
   * Submit feedback (authenticated users)
   */
  submit: protectedProcedure
    .input(
      z.object({
        category: z.enum(["Bug", "Feature Request", "General", "Complaint", "Praise", "Other"]),
        rating: z.number().int().min(1).max(5).optional(),
        title: z.string().min(3).max(255),
        message: z.string().min(10).max(5000),
        metadata: z.string().optional(), // JSON string with browser info, page URL, etc
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const result = await db
        .insert(feedback)
        .values({
          userId: ctx.user.id,
          category: input.category,
          rating: input.rating,
          title: input.title,
          message: input.message,
          userEmail: ctx.user.email || undefined,
          userName: ctx.user.name || undefined,
          source: "in-app",
          status: "New",
          metadata: input.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: feedback.id });

      return {
        success: true,
        feedbackId: result[0]?.id,
        message: "Thank you for your feedback! We'll review it shortly.",
      };
    }),

  /**
   * Submit feedback (anonymous via Tally.so webhook)
   */
  submitAnonymous: publicProcedure
    .input(
      z.object({
        category: z.enum(["Bug", "Feature Request", "General", "Complaint", "Praise", "Other"]).default("General"),
        rating: z.number().int().min(1).max(5).optional(),
        title: z.string().min(3).max(255),
        message: z.string().min(10).max(5000),
        userEmail: z.string().email().optional(),
        userName: z.string().max(255).optional(),
        source: z.enum(["tally", "in-app", "email"]).default("tally"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      const result = await db
        .insert(feedback)
        .values({
          userId: null, // anonymous
          category: input.category,
          rating: input.rating,
          title: input.title,
          message: input.message,
          userEmail: input.userEmail,
          userName: input.userName,
          source: input.source,
          status: "New",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: feedback.id });

      return {
        success: true,
        feedbackId: result[0]?.id,
        message: "Thank you for your feedback!",
      };
    }),

  /**
   * Get user's own feedback
   */
  getMyFeedback: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const userFeedback = await db
      .select({
        id: feedback.id,
        category: feedback.category,
        rating: feedback.rating,
        title: feedback.title,
        message: feedback.message,
        status: feedback.status,
        adminNotes: feedback.adminNotes,
        resolvedAt: feedback.resolvedAt,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
      })
      .from(feedback)
      .where(eq(feedback.userId, ctx.user.id))
      .orderBy(desc(feedback.createdAt));

    return userFeedback;
  }),

  /**
   * Get all feedback (admin only)
   */
  getAll: adminProcedure
    .input(
      z.object({
        status: z.enum(["All", "New", "In Progress", "Resolved", "Closed"]).default("All"),
        category: z.enum(["All", "Bug", "Feature Request", "General", "Complaint", "Praise", "Other"]).default("All"),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const { status, category, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      // Build query
      let query = db
        .select({
          id: feedback.id,
          userId: feedback.userId,
          userName: feedback.userName,
          userEmail: feedback.userEmail,
          category: feedback.category,
          rating: feedback.rating,
          title: feedback.title,
          message: feedback.message,
          status: feedback.status,
          source: feedback.source,
          adminNotes: feedback.adminNotes,
          resolvedAt: feedback.resolvedAt,
          resolvedBy: feedback.resolvedBy,
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
        })
        .from(feedback);

      // Apply filters
      const conditions = [];
      if (status !== "All") {
        conditions.push(eq(feedback.status, status));
      }
      if (category !== "All") {
        conditions.push(eq(feedback.category, category));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const allFeedback = await query.orderBy(desc(feedback.createdAt)).limit(pageSize).offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(feedback)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = Number(totalResult[0]?.count ?? 0);

      return {
        feedback: allFeedback,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Update feedback status (admin only)
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        feedbackId: z.number().int(),
        status: z.enum(["New", "In Progress", "Resolved", "Closed"]),
        adminNotes: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.adminNotes !== undefined) {
        updateData.adminNotes = input.adminNotes;
      }

      if (input.status === "Resolved" || input.status === "Closed") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = ctx.user.id;
      }

      await db.update(feedback).set(updateData).where(eq(feedback.id, input.feedbackId));

      return { success: true, message: "Feedback updated successfully" };
    }),

  /**
   * Get feedback statistics (admin only)
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();

    // Total feedback by status
    const statusStats = await db
      .select({
        status: feedback.status,
        count: sql<number>`count(*)`,
      })
      .from(feedback)
      .groupBy(feedback.status);

    // Total feedback by category
    const categoryStats = await db
      .select({
        category: feedback.category,
        count: sql<number>`count(*)`,
      })
      .from(feedback)
      .groupBy(feedback.category);

    // Recent feedback (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedback)
      .where(sql`${feedback.createdAt} >= ${sevenDaysAgo}`);

    // Average rating
    const avgRatingResult = await db
      .select({
        avg: sql<number>`AVG(CAST(${feedback.rating} AS DECIMAL))`,
      })
      .from(feedback)
      .where(sql`${feedback.rating} IS NOT NULL`);

    const avgRating = avgRatingResult[0]?.avg ? Number(avgRatingResult[0].avg).toFixed(2) : null;

    return {
      statusBreakdown: statusStats.reduce(
        (acc, { status, count }) => {
          acc[status] = Number(count);
          return acc;
        },
        {} as Record<string, number>
      ),
      categoryBreakdown: categoryStats.reduce(
        (acc, { category, count }) => {
          acc[category] = Number(count);
          return acc;
        },
        {} as Record<string, number>
      ),
      recentFeedbackCount: Number(recentCount[0]?.count ?? 0),
      averageRating: avgRating,
    };
  }),

  /**
   * Delete feedback (admin only)
   */
  delete: adminProcedure
    .input(z.object({ feedbackId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      await db.delete(feedback).where(eq(feedback.id, input.feedbackId));

      return { success: true, message: "Feedback deleted successfully" };
    }),
});
