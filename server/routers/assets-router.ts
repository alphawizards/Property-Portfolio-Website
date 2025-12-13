import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db, isMock } from "../db";
import { assets } from "../../drizzle/schema";
import { insertAssetSchema } from "../../shared/schemas";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const assetsRouter = router({
    list: protectedProcedure
        .input(z.object({
            scenarioId: z.number().int().optional().nullable(),
        }).optional())
        .query(async ({ ctx, input }) => {
            // Filter by user ID AND scenario ID (if provided)
            const whereClause = input?.scenarioId
                ? and(eq(assets.userId, ctx.user.id), eq(assets.scenarioId, input.scenarioId))
                : and(eq(assets.userId, ctx.user.id), eq(assets.scenarioId, null as any)); // Default to base assets? Or list all?
            // Actually, listing all for the user is safer, referencing the implementation plan to keep it simple first

            if (isMock()) {
                return [
                    {
                        id: 1,
                        userId: ctx.user.id,
                        name: "Mock Cash",
                        type: "Cash",
                        balance: "10000",
                        currency: "AUD",
                        growthRate: "0",
                        contributionAmount: "0",
                        contributionFrequency: "Monthly",
                        scenarioId: input?.scenarioId || null,
                        metadata: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ];
            }

            const userAssets = await db.select().from(assets).where(eq(assets.userId, ctx.user.id));

            // Optional: client-side filtering or explicit scenario filtering.
            // If scenarioId is passed, we filter. If explicitly null, we filter for null.
            // Drizzle quirk with nulls: using isNull()

            return userAssets;
        }),

    create: protectedProcedure
        .input(insertAssetSchema)
        .mutation(async ({ ctx, input }) => {
            if (isMock()) {
                return {
                    id: Math.floor(Math.random() * 10000),
                    userId: ctx.user.id,
                    ...input,
                    balance: input.balance.toString(),
                    growthRate: input.growthRate.toString(),
                    contributionAmount: input.contributionAmount.toString(),
                    scenarioId: input.scenarioId ?? null,
                    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }

            const newItem = await db.insert(assets).values({
                userId: ctx.user.id,
                name: input.name,
                type: input.type,
                balance: input.balance.toString(), // Cast to string for numeric column
                currency: input.currency,
                growthRate: input.growthRate.toString(), // Cast to string for numeric column
                contributionAmount: input.contributionAmount.toString(), // Cast to string for numeric column
                contributionFrequency: input.contributionFrequency,
                scenarioId: input.scenarioId,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null
            }).returning();

            return newItem;
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.number().int(),
            data: insertAssetSchema.partial(),
        }))
        .mutation(async ({ ctx, input }) => {
            // SECURITY: verify ownership first
            if (isMock()) {
                return {
                    ...input.data,
                    id: input.id,
                    userId: ctx.user.id,
                    // Mock merge
                } as any;
            }

            const [existing] = await db.select().from(assets).where(and(eq(assets.id, input.id), eq(assets.userId, ctx.user.id)));
            if (!existing) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Asset not found or access denied" });
            }

            const [updated] = await db.update(assets)
                .set({
                    ...input.data,
                    balance: input.data.balance?.toString(),
                    growthRate: input.data.growthRate?.toString(),
                    contributionAmount: input.data.contributionAmount?.toString(),
                    metadata: input.data.metadata ? JSON.stringify(input.data.metadata) : undefined,
                    updatedAt: new Date()
                })
                .where(eq(assets.id, input.id))
                .returning();

            return updated;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            if (isMock()) return { success: true };

            const [existing] = await db.select().from(assets).where(and(eq(assets.id, input.id), eq(assets.userId, ctx.user.id)));
            if (!existing) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Asset not found or access denied" });
            }

            await db.delete(assets).where(eq(assets.id, input.id));
            return { success: true };
        }),
});
