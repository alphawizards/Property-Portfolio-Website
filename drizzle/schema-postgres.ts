// PostgreSQL schema for subscription system
// This is a minimal schema focusing on subscription tables for PlanetScale PostgreSQL
import { 
  serial,
  varchar, 
  timestamp, 
  boolean, 
  numeric, 
  text,
  pgEnum,
  pgTable,
  uniqueIndex,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * User role enum
 */
export const roleEnum = pgEnum('role', ['user', 'admin']);

/**
 * Subscription status enum
 */
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'suspended',
  'expired',
  'cancelled'
]);

/**
 * Core user table
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default('user').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription tiers table
 */
export const subscriptionTiers = pgTable(
  "subscription_tiers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    displayName: varchar("displayName", { length: 100 }).notNull(),
    description: text("description"),
    maxProperties: integer("maxProperties").notNull().default(0), // 0 = unlimited
    maxForecastYears: integer("maxForecastYears").notNull().default(10),
    canUseAdvancedAnalytics: boolean("canUseAdvancedAnalytics").notNull().default(false),
    canUseScenarioComparison: boolean("canUseScenarioComparison").notNull().default(false),
    canExportReports: boolean("canExportReports").notNull().default(false),
    canUseTaxCalculator: boolean("canUseTaxCalculator").notNull().default(false),
    priceMonthly: numeric("priceMonthly", { precision: 10, scale: 2 }).notNull().default("0"),
    priceYearly: numeric("priceYearly", { precision: 10, scale: 2 }).notNull().default("0"),
    stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 255 }),
    stripePriceIdYearly: varchar("stripePriceIdYearly", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("idx_subscription_tiers_name").on(table.name),
  })
);

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;

/**
 * User subscriptions table
 */
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
    tierId: integer("tierId").notNull().references(() => subscriptionTiers.id, { onDelete: 'restrict' }),
    status: subscriptionStatusEnum("status").notNull().default('active'),
    startDate: timestamp("startDate").defaultNow().notNull(),
    endDate: timestamp("endDate"),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
    currentPeriodStart: timestamp("currentPeriodStart"),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("idx_user_subscriptions_user_id").on(table.userId),
    tierIdIdx: index("idx_user_subscriptions_tier_id").on(table.tierId),
    statusIdx: index("idx_user_subscriptions_status").on(table.status),
  })
);

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * RELATIONS
 */
export const subscriptionTiersRelations = relations(subscriptionTiers, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  tier: one(subscriptionTiers, {
    fields: [userSubscriptions.tierId],
    references: [subscriptionTiers.id],
  }),
}));
