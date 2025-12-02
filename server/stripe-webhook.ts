import { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";
import { getTierFromPriceId } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Webhook] Checkout completed for session: ${session.id}`);

        // Extract user information from metadata
        const userId = session.metadata?.user_id;
        const customerEmail = session.customer_email || session.metadata?.customer_email;

        if (!userId) {
          console.error("[Webhook] Missing user_id in checkout session metadata");
          break;
        }

        // Get the subscription details
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;

          if (priceId) {
            const tier = getTierFromPriceId(priceId);

            // Update user subscription
            const status = subscription.status === "active" || subscription.status === "canceled" || subscription.status === "past_due" || subscription.status === "trialing" || subscription.status === "incomplete" ? subscription.status : "active";
            
            await db.updateUserSubscription(parseInt(userId), {
              subscriptionTier: tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: status,
              subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
            });

            console.log(`[Webhook] Updated user ${userId} to ${tier} tier`);
          }
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] Subscription updated: ${subscription.id}`);

        // Find user by Stripe subscription ID
        const user = await db.getUserByStripeSubscriptionId(subscription.id);
        if (!user) {
          console.error(`[Webhook] User not found for subscription: ${subscription.id}`);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        if (priceId) {
          const tier = getTierFromPriceId(priceId);

          const status = subscription.status === "active" || subscription.status === "canceled" || subscription.status === "past_due" || subscription.status === "trialing" || subscription.status === "incomplete" ? subscription.status : "active";
          
          await db.updateUserSubscription(user.id, {
            subscriptionTier: tier,
            subscriptionStatus: status,
            subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
          });

          console.log(`[Webhook] Updated subscription for user ${user.id} to ${tier}`);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] Subscription canceled: ${subscription.id}`);

        // Find user by Stripe subscription ID
        const user = await db.getUserByStripeSubscriptionId(subscription.id);
        if (!user) {
          console.error(`[Webhook] User not found for subscription: ${subscription.id}`);
          break;
        }

        // Downgrade to free tier
        await db.updateUserSubscription(user.id, {
          subscriptionTier: "FREE",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          subscriptionEndDate: null,
        });

        console.log(`[Webhook] Downgraded user ${user.id} to FREE tier`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Payment failed for invoice: ${invoice.id}`);

        if ((invoice as any).subscription) {
          const user = await db.getUserByStripeSubscriptionId((invoice as any).subscription as string);
          if (user) {
            await db.updateUserSubscription(user.id, {
              subscriptionStatus: "past_due",
            });
            console.log(`[Webhook] Marked user ${user.id} subscription as past_due`);
          }
        }

        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Webhook] Error processing event:`, error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
