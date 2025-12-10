import { z } from "zod";
import Stripe from "stripe";
import { protectedProcedure, router } from "./_core/trpc";
import { isSecureRequest, getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import { SUBSCRIPTION_PRODUCTS } from "./products";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is missing. Subscription features will not work.");
}
const stripe = new Stripe(stripeKey, {
  apiVersion: "2024-11-20.acacia", // Updated to a known valid version or keep user's if valid.
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
      const origin = 'get' in ctx.req.headers && typeof ctx.req.headers.get === 'function'
        ? ctx.req.headers.get('origin')
        : (ctx.req as any).headers.origin;

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
});
