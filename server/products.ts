/**
 * Subscription products and pricing configuration
 * 
 * This file defines the subscription tiers for the Property Portfolio Analyzer.
 * Products are created in Stripe and referenced here by their Price IDs.
 */

export const SUBSCRIPTION_PRODUCTS = {
  FREE: {
    name: "Free",
    description: "Get started with basic property portfolio tracking",
    features: [
      "Up to 2 properties",
      "Basic financial projections (10 years)",
      "Dashboard with charts",
      "Property management",
    ],
    limits: {
      maxProperties: 2,
      maxProjectionYears: 10,
      advancedFeatures: false,
    },
    price: 0,
    stripePriceId: null, // Free tier doesn't need Stripe
  },
  
  PREMIUM_MONTHLY: {
    name: "Premium Monthly",
    description: "Full access to all features with monthly billing",
    features: [
      "Unlimited properties",
      "Extended projections (up to 50 years)",
      "Investment comparison tool",
      "Advanced analytics",
      "Export reports (PDF/Excel)",
      "Priority support",
    ],
    limits: {
      maxProperties: Infinity,
      maxProjectionYears: 50,
      advancedFeatures: true,
    },
    price: 29.99,
    interval: "month" as const,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "price_premium_monthly_placeholder",
  },
  
  PREMIUM_ANNUAL: {
    name: "Premium Annual",
    description: "Full access to all features with annual billing (save 20%)",
    features: [
      "Unlimited properties",
      "Extended projections (up to 50 years)",
      "Investment comparison tool",
      "Advanced analytics",
      "Export reports (PDF/Excel)",
      "Priority support",
      "20% discount vs monthly",
    ],
    limits: {
      maxProperties: Infinity,
      maxProjectionYears: 50,
      advancedFeatures: true,
    },
    price: 287.88, // $23.99/month when billed annually
    interval: "year" as const,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || "price_premium_annual_placeholder",
  },
} as const;

export type SubscriptionTier = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

/**
 * Check if a user's subscription tier allows a specific feature
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: keyof typeof SUBSCRIPTION_PRODUCTS.FREE.limits): boolean {
  const product = SUBSCRIPTION_PRODUCTS[tier];
  return product.limits[feature] === true || product.limits[feature] === Infinity;
}

/**
 * Get the maximum allowed value for a feature based on subscription tier
 */
export function getFeatureLimit(tier: SubscriptionTier, feature: keyof typeof SUBSCRIPTION_PRODUCTS.FREE.limits): number | boolean {
  const product = SUBSCRIPTION_PRODUCTS[tier];
  return product.limits[feature];
}

/**
 * Determine subscription tier from Stripe Price ID
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === SUBSCRIPTION_PRODUCTS.PREMIUM_MONTHLY.stripePriceId) {
    return "PREMIUM_MONTHLY";
  }
  if (priceId === SUBSCRIPTION_PRODUCTS.PREMIUM_ANNUAL.stripePriceId) {
    return "PREMIUM_ANNUAL";
  }
  return "FREE";
}
