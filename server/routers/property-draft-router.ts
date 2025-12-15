
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { propertyDrafts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const propertyDraftRouter = router({
  saveDraft: protectedProcedure
    .input(
      z.object({
        draftData: z.any(), // JSON data
        currentStep: z.number(),
        propertyNickname: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if draft exists
      const existingDraft = await ctx.db.query.propertyDrafts.findFirst({
        where: and(
            eq(propertyDrafts.userId, ctx.userId),
            // We assume one draft per user per portfolio for now, or just per user if portfolio not strict
            // But let's check by userId only for simplicity as per implementation guide
            eq(propertyDrafts.userId, ctx.userId)
        ),
      });

      if (existingDraft) {
        await ctx.db
          .update(propertyDrafts)
          .set({
            data: JSON.stringify(input.draftData),
            step: input.currentStep,
            propertyNickname: input.propertyNickname,
            lastSavedAt: new Date(),
          })
          .where(eq(propertyDrafts.id, existingDraft.id));
      } else {
        await ctx.db.insert(propertyDrafts).values({
          userId: ctx.userId,
          // portfolioId: ctx.portfolioId, // We need to get portfolio ID from context or input if multiple portfolios supported
          step: input.currentStep,
          data: JSON.stringify(input.draftData),
          propertyNickname: input.propertyNickname,
        });
      }
    }),

  getDraft: protectedProcedure.query(async ({ ctx }) => {
    const draft = await ctx.db.query.propertyDrafts.findFirst({
      where: eq(propertyDrafts.userId, ctx.userId),
    });

    if (!draft) return null;

    return {
      ...draft,
      data: JSON.parse(draft.data),
    };
  }),

  deleteDraft: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(propertyDrafts)
      .where(eq(propertyDrafts.userId, ctx.userId));
  }),
});
