import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    subscriptionTier: "FREE",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    subscriptionEndDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        origin: "https://example.com",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("subscription.getPlans", () => {
  it("returns available subscription plans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.subscription.getPlans();

    expect(plans).toHaveProperty("free");
    expect(plans).toHaveProperty("premiumMonthly");
    expect(plans).toHaveProperty("premiumAnnual");

    expect(plans.free.name).toBe("Free");
    expect(plans.free.price).toBe(0);
    expect(plans.free.limits.maxProperties).toBe(2);

    expect(plans.premiumMonthly.name).toBe("Premium Monthly");
    expect(plans.premiumMonthly.price).toBe(29.99);
    expect(plans.premiumMonthly.limits.maxProperties).toBe(Infinity);

    expect(plans.premiumAnnual.name).toBe("Premium Annual");
    expect(plans.premiumAnnual.price).toBe(287.88);
    expect(plans.premiumAnnual.limits.maxProperties).toBe(Infinity);
  });
});

describe("subscription.getSubscription", () => {
  it("returns user subscription information", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const subscription = await caller.subscription.getSubscription();

    expect(subscription).toHaveProperty("subscriptionTier");
    expect(subscription).toHaveProperty("stripeCustomerId");
    expect(subscription).toHaveProperty("stripeSubscriptionId");
    expect(subscription).toHaveProperty("subscriptionStatus");
    expect(subscription).toHaveProperty("subscriptionEndDate");
  });
});
