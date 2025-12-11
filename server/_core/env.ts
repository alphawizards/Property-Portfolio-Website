import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Tally
  TALLY_WEBHOOK_SECRET: z.string().optional(),

  // Owner
  OWNER_OPENID: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().optional(),

  // App
  APP_URL: z.string().optional(),
  VITE_PUBLIC_APP_URL: z.string().optional(),

  // Stripe Prices
  STRIPE_PRICE_PREMIUM_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PREMIUM_ANNUAL: z.string().optional(),

  // Storage (Replit/Forge)
  BUILT_IN_FORGE_API_URL: z.string().optional(),
  BUILT_IN_FORGE_API_KEY: z.string().optional(),

  // AI
  OPENAI_API_KEY: z.string().optional(),
  // Platform/OAuth
  OAUTH_SERVER_URL: z.string().optional(),
  APP_ID: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(_env.error.format(), null, 4));
  process.exit(1);
}

export const ENV = {
  ..._env.data,
  ownerOpenId: _env.data.OWNER_OPENID,

  // Storage mappings
  forgeApiUrl: _env.data.BUILT_IN_FORGE_API_URL,
  forgeApiKey: _env.data.BUILT_IN_FORGE_API_KEY,

  // Platform/OAuth mappings
  oAuthServerUrl: _env.data.OAUTH_SERVER_URL,
  appId: _env.data.APP_ID,
  cookieSecret: _env.data.COOKIE_SECRET || "development_secret_key_123",
};
