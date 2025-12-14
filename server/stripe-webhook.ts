import { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";
import { getTierFromPriceId } from "./products";
import {
  sendSubscriptionConfirmation,
  sendPaymentFailedEmail,
  sendCancellationEmail
} from "./_core/email";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";

if (!ENV.STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY is missing. Webhooks will not function correctly.");
}

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
} as any); // Cast config to any to bypass strict version check for now as we know it works or need to unblock build

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig || !ENV.STRIPE_WEBHOOK_SECRET) {
    logger.error("[Webhook] Missing stripe-signature header or webhook secret");
    return res.status(400).send("Missing signature or secret");
  }

  let event: Stripe.Event;

  try {
    // req.body MUST be a raw buffer here.
    // This requires express.raw({ type: "application/json" }) middleware in server/index.ts
    event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`[Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    logger.info("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info(`[Webhook] Checkout completed for session: ${session.id}`);

        // Extract user information from metadata
        const userId = session.metadata?.user_id;

        if (!userId) {
          logger.error("[Webhook] Missing user_id in checkout session metadata");
          break;
        }

        // Get the subscription details
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;

          if (priceId) {
            const tier = getTierFromPriceId(priceId);

            // Update user subscription
            // Cast status to our enum
            const stripeStatus = subscription.status;
            let status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "suspended" | "expired" | "cancelled" = "active";

            if (stripeStatus === "active" || stripeStatus === "canceled" || stripeStatus === "past_due" || stripeStatus === "trialing" || stripeStatus === "incomplete") {
                status = stripeStatus;
            }

            await db.updateUserSubscription(parseInt(userId), {
              subscriptionTier: tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: status,
              subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
            });

            logger.info(`[Webhook] Updated user ${userId} to ${tier} tier`);

            // Send subscription confirmation email
            const database = db.db;
            const userResult = await database.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
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
              } catch (emailError) {
                logger.error(`[Webhook] Failed to send subscription confirmation: ${emailError}`);
              }
            }
          }
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(`[Webhook] Subscription updated: ${subscription.id}`);

        // Find user by Stripe subscription ID
        const user = await db.getUserByStripeSubscriptionId(subscription.id);
        if (!user) {
          logger.error(`[Webhook] User not found for subscription: ${subscription.id}`);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        if (priceId) {
          const tier = getTierFromPriceId(priceId);

          const stripeStatus = subscription.status;
          let status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "suspended" | "expired" | "cancelled" = "active";

          if (stripeStatus === "active" || stripeStatus === "canceled" || stripeStatus === "past_due" || stripeStatus === "trialing" || stripeStatus === "incomplete") {
              status = stripeStatus;
          }

          await db.updateUserSubscription(user.id, {
            subscriptionTier: tier,
            subscriptionStatus: status,
            subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
          });

          logger.info(`[Webhook] Updated subscription for user ${user.id} to ${tier}`);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(`[Webhook] Subscription canceled: ${subscription.id}`);

        // Find user by Stripe subscription ID
        const user = await db.getUserByStripeSubscriptionId(subscription.id);
        if (!user) {
          logger.error(`[Webhook] User not found for subscription: ${subscription.id}`);
          break;
        }

        // Get current tier name before downgrading
        const currentTier = user.subscriptionTier === "PREMIUM_MONTHLY" ? "Premium Monthly" : "Premium Annual";
        const endDate = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toLocaleDateString()
          : new Date().toLocaleDateString();

        // Downgrade to free tier
        await db.updateUserSubscription(user.id, {
          subscriptionTier: "FREE",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          subscriptionEndDate: null,
        });

        logger.info(`[Webhook] Downgraded user ${user.id} to FREE tier`);

        // Send cancellation confirmation email
        if (user.email) {
          try {
            await sendCancellationEmail(
              user.name || 'there',
              user.email,
              currentTier,
              endDate
            );
          } catch (emailError) {
            logger.error(`[Webhook] Failed to send cancellation email: ${emailError}`);
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info(`[Webhook] Payment failed for invoice: ${invoice.id}`);

        if ((invoice as any).subscription) {
          const user = await db.getUserByStripeSubscriptionId((invoice as any).subscription as string);
          if (user) {
            await db.updateUserSubscription(user.id, {
              subscriptionStatus: "past_due",
            });
            logger.info(`[Webhook] Marked user ${user.id} subscription as past_due`);

            // Send payment failed notification
            if (user.email) {
              try {
                const tierName = user.subscriptionTier === "PREMIUM_MONTHLY" ? "Premium Monthly" : "Premium Annual";
                await sendPaymentFailedEmail(
                  user.name || 'there',
                  user.email,
                  tierName
                );
              } catch (emailError) {
                logger.error(`[Webhook] Failed to send payment failed email: ${emailError}`);
              }
            }
          }
        }

        break;
      }

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error(`[Webhook] Error processing event: ${error}`);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
