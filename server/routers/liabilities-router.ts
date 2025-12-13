import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db, isMock } from "../db";
import { liabilities } from "../../drizzle/schema";
import { insertLiabilitySchema } from "../../shared/schemas";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const liabilitiesRouter = router({
    list: protectedProcedure
        .input(z.object({
            scenarioId: z.number().int().optional().nullable(),
        }).optional())
        .query(async ({ ctx, input }) => {
            if (isMock()) {
                return [
                    {
                        id: 1,
                        userId: ctx.user.id,
                        name: "Mock Credit Card",
                        type: "CreditCard",
                        balance: "5000",
                        interestRate: "20",
                        paymentAmount: "200",
                        paymentFrequency: "Monthly",
                        scenarioId: input?.scenarioId || null,
                        metadata: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ];
            }

            const userLiabilities = await db.select().from(liabilities).where(eq(liabilities.userId, ctx.user.id));
            return userLiabilities;
        }),

    create: protectedProcedure
        .input(insertLiabilitySchema)
        .mutation(async ({ ctx, input }) => {
            if (isMock()) {
                return {
                    id: Math.floor(Math.random() * 10000),
                    userId: ctx.user.id,
                    ...input,
                    balance: input.balance.toString(),
                    interestRate: input.interestRate.toString(),
                    paymentAmount: input.paymentAmount.toString(),
                    scenarioId: input.scenarioId ?? null,
                    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }

            const [newItem] = await db.insert(liabilities).values({
                userId: ctx.user.id,
                name: input.name,
                type: input.type,
                balance: input.balance.toString(),
                interestRate: input.interestRate.toString(),
                paymentAmount: input.paymentAmount.toString(),
                paymentFrequency: input.paymentFrequency,
                scenarioId: input.scenarioId,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null
            }).returning();

            return newItem;
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.number().int(),
            data: insertLiabilitySchema.partial(),
        }))
        .mutation(async ({ ctx, input }) => {
            const [existing] = await db.select().from(liabilities).where(and(eq(liabilities.id, input.id), eq(liabilities.userId, ctx.user.id)));
            if (!existing) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Liability not found or access denied" });
            }

            const [updated] = await db.update(liabilities)
                .set({
                    ...input.data,
                    balance: input.data.balance?.toString(),
                    interestRate: input.data.interestRate?.toString(),
                    paymentAmount: input.data.paymentAmount?.toString(),
                    metadata: input.data.metadata ? JSON.stringify(input.data.metadata) : undefined,
                    updatedAt: new Date()
                })
                .where(eq(liabilities.id, input.id))
                .returning();

            return updated;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            if (isMock()) return { success: true };

            const [existing] = await db.select().from(liabilities).where(and(eq(liabilities.id, input.id), eq(liabilities.userId, ctx.user.id)));
            if (!existing) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Liability not found or access denied" });
            }

            await db.delete(liabilities).where(eq(liabilities.id, input.id));
            return { success: true };
        }),
});
