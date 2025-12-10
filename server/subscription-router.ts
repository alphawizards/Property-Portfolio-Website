import { z } from "zod";
import Stripe from "stripe";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { isSecureRequest, getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import { SUBSCRIPTION_PRODUCTS, getTierFromPriceId } from "./products";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { sendSubscriptionConfirmation } from "./_core/email";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is missing. Subscription features will not work.");
}
const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-11-17.clover", // Updated to match server/subscription-router.ts
  typescript: true,
});

export const subscriptionRouter = router({
  /**
   * Get current user's subscription information
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.getUserSubscriptionInfo(ctx.user.id);
    return subscription || {
      subscriptionTier: "FREE" as const,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndDate: null,
    };
  }),

  /**
   * Create a Stripe Checkout session for subscription
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
        tier: z.enum(["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isSecure = isSecureRequest(ctx.req as any);
      const cookieOptions = getSessionCookieOptions(ctx.req as any);
      const product = SUBSCRIPTION_PRODUCTS[input.tier];
      const getHeader = (req: any, key: string) => {
        if (typeof req.headers?.get === 'function') return req.headers.get(key);
        if (req.headers && req.headers[key]) return req.headers[key];
        return null;
      };

      const origin = getHeader(ctx.req, 'origin');

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: input.priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/?success=true`,
        cancel_url: `${origin}/?canceled=true`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            user_id: ctx.user.id.toString(),
          },
        },
      });

      return {
        url: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await db.getUserSubscriptionInfo(ctx.user.id);

    if (!subscription?.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    return { success: true };
  }),

  /**
   * Get available subscription plans
   */
  getPlans: protectedProcedure.query(() => {
    return {
      free: SUBSCRIPTION_PRODUCTS.FREE,
      premiumMonthly: SUBSCRIPTION_PRODUCTS.PREMIUM_MONTHLY,
      premiumAnnual: SUBSCRIPTION_PRODUCTS.PREMIUM_ANNUAL,
    };
  }),

  handleCheckoutSuccess: publicProcedure
    .input(z.object({
      stripeCustomerId: z.string(),
      stripeSubscriptionId: z.string(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId);
      const priceId = subscription.items.data[0]?.price.id;

      if (priceId) {
        const tier = getTierFromPriceId(priceId);
        const status = subscription.status === "active" || subscription.status === "trialing" ? subscription.status : "active";

        await db.updateUserSubscription(input.userId, {
          subscriptionTier: tier,
          stripeCustomerId: input.stripeCustomerId,
          stripeSubscriptionId: input.stripeSubscriptionId,
          subscriptionStatus: status,
          subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
        });

        const database = db.db;
        const userResult = await database.select().from(users).where(eq(users.id, input.userId)).limit(1);
        const user = userResult.length > 0 ? userResult[0] : null;

        if (user?.email) {
          try {
            const billingCycle = tier === "PREMIUM_MONTHLY" ? "Monthly" : "Annual";
            const nextBillingDate = (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toLocaleDateString()
              : "N/A";

            await sendSubscriptionConfirmation(
              user.name || 'there',
              user.email,
              tier === "PREMIUM_MONTHLY" ? "Premium Monthly" : "Premium Annual",
              billingCycle,
              nextBillingDate
            );
          } catch (e) { console.error('Email failed', e); }
        }
      }
      return { success: true };
    }),

  syncSubscriptionStatus: publicProcedure
    .input(z.object({
      stripeSubscriptionId: z.string(),
      status: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByStripeSubscriptionId(input.stripeSubscriptionId);
      if (!user) return { success: false, error: "User not found" };

      const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId);
      const priceId = subscription.items.data[0]?.price.id;

      let tier = user.subscriptionTier;
      if (priceId) {
        tier = getTierFromPriceId(priceId);
      }

      if (input.status === "canceled") {
        await db.updateUserSubscription(user.id, {
          subscriptionTier: "FREE",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          subscriptionEndDate: null,
        });
      } else {
        await db.updateUserSubscription(user.id, {
          subscriptionTier: tier,
          subscriptionStatus: input.status as any,
          subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
        });
      }
      return { success: true };
    }),
});
