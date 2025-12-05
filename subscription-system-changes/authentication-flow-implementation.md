# User Authentication Flow Implementation Plan

## Executive Summary

This document provides a complete implementation plan for the user authentication system with automatic subscription tier assignment. The system uses **Manus OAuth** for authentication (already integrated) and automatically assigns new users to the "Basic" subscription tier.

---

## Current State Analysis

### ✅ Already Implemented (Manus OAuth)

The project already has Manus OAuth authentication fully integrated:

1. **OAuth Callback Handler**: `/api/oauth/callback` (in `server/_core/oauth.ts`)
2. **Session Management**: JWT-based session cookies (in `server/_core/context.ts`)
3. **User Creation**: Automatic user creation on first login (in `server/_core/oauth.ts`)
4. **Protected Procedures**: `protectedProcedure` middleware (in `server/_core/trpc.ts`)
5. **Frontend Auth Hook**: `useAuth()` hook (in `client/src/hooks/useAuth.ts`)
6. **Login URL Helper**: `getLoginUrl()` function (in `client/src/lib/auth.ts`)

### ❌ Missing Components

1. **Subscription Tier Assignment**: No automatic tier assignment on user creation
2. **Default Role Assignment**: Users don't get default 'user' role
3. **Post-Registration Hook**: No hook to initialize user subscription
4. **Welcome Flow**: No onboarding or welcome screen
5. **Feature Access Check**: No frontend feature flag initialization

---

## Authentication Flow Architecture

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW USER REGISTRATION                         │
└─────────────────────────────────────────────────────────────────┘

1. User visits app (not logged in)
   │
   ├─► Frontend detects no auth
   │
   └─► Shows "Sign In with Manus" button
       │
       ├─► Redirects to: getLoginUrl()
       │   └─► https://api.manus.im/oauth/authorize?...
       │
       ├─► User completes OAuth on Manus portal
       │
       └─► Redirects back to: /api/oauth/callback?code=...
           │
           ├─► Backend exchanges code for user info
           │
           ├─► Check if user exists in database
           │   │
           │   ├─► User NOT found (NEW USER)
           │   │   │
           │   │   ├─► Create user record
           │   │   │   └─► INSERT INTO users (open_id, name, email, role)
           │   │   │       VALUES (oauth_id, name, email, 'user')
           │   │   │
           │   │   ├─► Assign default subscription (NEW STEP)
           │   │   │   └─► INSERT INTO user_subscriptions
           │   │   │       (user_id, tier_id, status)
           │   │   │       VALUES (new_user_id, basic_tier_id, 'active')
           │   │   │
           │   │   ├─► Create session cookie
           │   │   │
           │   │   └─► Redirect to: /dashboard?welcome=true
           │   │
           │   └─► User found (RETURNING USER)
           │       │
           │       ├─► Create session cookie
           │       │
           │       └─► Redirect to: /dashboard
           │
           └─► Frontend loads with authenticated session

┌─────────────────────────────────────────────────────────────────┐
│                    RETURNING USER LOGIN                          │
└─────────────────────────────────────────────────────────────────┘

1. User visits app (not logged in)
   │
   ├─► Clicks "Sign In"
   │
   ├─► OAuth flow (same as above)
   │
   └─► User found in database
       │
       ├─► Load existing subscription
       │
       ├─► Create session cookie
       │
       └─► Redirect to: /dashboard

┌─────────────────────────────────────────────────────────────────┐
│                    SESSION VALIDATION                            │
└─────────────────────────────────────────────────────────────────┘

Every API request:
   │
   ├─► Extract JWT from cookie
   │
   ├─► Verify JWT signature
   │
   ├─► Load user from database
   │   └─► SELECT * FROM users WHERE id = jwt.userId
   │
   ├─► Attach to context: ctx.user
   │
   └─► Proceed with request
```

---

## Implementation Steps

### Phase 1: Database Schema (Already Created)

✅ Tables created in `sql/03_subscription_system.sql`:
- `subscription_tiers` (Basic, Pro)
- `user_subscriptions` (user → tier mapping)
- `users.role` (admin/user field)

**Action Required**: Execute SQL script to create tables and seed data.

### Phase 2: Backend - Subscription Assignment Hook

**File**: `server/_core/oauth.ts` (modify existing)

**Current Code** (simplified):
```typescript
// In handleOAuthCallback function
const existingUser = await db.getUserByOpenId(userInfo.sub);

if (!existingUser) {
  // Create new user
  const userId = await db.createUser({
    openId: userInfo.sub,
    name: userInfo.name,
    email: userInfo.email,
  });
  
  // ❌ Missing: Assign default subscription
  
  return createSession(userId);
}
```

**New Code** (with subscription assignment):
```typescript
// In handleOAuthCallback function
const existingUser = await db.getUserByOpenId(userInfo.sub);

if (!existingUser) {
  // Create new user
  const userId = await db.createUser({
    openId: userInfo.sub,
    name: userInfo.name,
    email: userInfo.email,
    role: 'user', // ✅ Set default role
  });
  
  // ✅ NEW: Assign default Basic subscription
  await db.assignDefaultSubscription(userId);
  
  // ✅ NEW: Log new user registration
  console.log(`[AUTH] New user registered: ${userInfo.email} (ID: ${userId})`);
  
  return createSession(userId);
}
```

### Phase 3: Database Helper Functions

**File**: `server/db.ts` (add new functions)

```typescript
/**
 * Assign default Basic subscription to new user
 */
export async function assignDefaultSubscription(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get Basic tier ID
  const basicTier = await db
    .select({ id: subscriptionTiers.id })
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.tierName, 'basic'))
    .limit(1);

  if (basicTier.length === 0) {
    throw new Error("Default Basic tier not found in database");
  }

  // Create subscription
  await db.insert(userSubscriptions).values({
    userId,
    tierId: basicTier[0].id,
    status: 'active',
    startDate: new Date(),
    endDate: null, // No expiry for free tier
  });
}

/**
 * Get user with subscription details
 */
export async function getUserWithSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      subscription: {
        id: userSubscriptions.id,
        tierId: userSubscriptions.tierId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        tier: {
          tierName: subscriptionTiers.tierName,
          displayName: subscriptionTiers.displayName,
          propertyLimit: subscriptionTiers.propertyLimit,
          forecastYearsLimit: subscriptionTiers.forecastYearsLimit,
        },
      },
    })
    .from(users)
    .leftJoin(
      userSubscriptions,
      and(
        eq(users.id, userSubscriptions.userId),
        eq(userSubscriptions.status, 'active')
      )
    )
    .leftJoin(subscriptionTiers, eq(userSubscriptions.tierId, subscriptionTiers.id))
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
```

### Phase 4: Update Drizzle Schema

**File**: `drizzle/schema.ts` (add new tables)

```typescript
// Subscription Tiers Table
export const subscriptionTiers = mysqlTable('subscription_tiers', {
  id: int('id').primaryKey().autoincrement(),
  tierName: varchar('tier_name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Limits
  propertyLimit: int('property_limit').notNull().default(2),
  forecastYearsLimit: int('forecast_years_limit').notNull().default(10),
  
  // Feature flags
  canUseTaxCalculator: tinyint('can_use_tax_calculator').notNull().default(0),
  canUseInvestmentComparison: tinyint('can_use_investment_comparison').notNull().default(0),
  canExportReports: tinyint('can_export_reports').notNull().default(0),
  canUseAdvancedAnalytics: tinyint('can_use_advanced_analytics').notNull().default(0),
  
  // Pricing
  monthlyPriceCents: int('monthly_price_cents').notNull().default(0),
  annualPriceCents: int('annual_price_cents').notNull().default(0),
  
  // Metadata
  isActive: tinyint('is_active').notNull().default(1),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// User Subscriptions Table
export const userSubscriptions = mysqlTable('user_subscriptions', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tierId: int('tier_id').notNull().references(() => subscriptionTiers.id),
  
  startDate: timestamp('start_date').notNull().defaultNow(),
  endDate: timestamp('end_date'),
  status: mysqlEnum('status', ['active', 'expired', 'cancelled']).notNull().default('active'),
  
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// Update users table to add role field
export const users = mysqlTable('users', {
  // ... existing fields
  role: mysqlEnum('role', ['admin', 'user']).notNull().default('user'),
  // ... rest of fields
});

// Type exports
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;
export type SelectSubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type SelectUserSubscription = typeof userSubscriptions.$inferSelect;
```

### Phase 5: Frontend - Feature Access Hook

**File**: `client/src/hooks/useFeatureAccess.ts` (new file)

```typescript
import { trpc } from '@/lib/trpc';

export function useFeatureAccess() {
  const { data: features, isLoading } = trpc.user.getFeatureAccess.useQuery();

  return {
    features,
    isLoading,
    
    // Convenience helpers
    canAddProperty: features?.canAddProperty ?? false,
    propertyLimit: features?.propertyLimit ?? 2,
    currentPropertyCount: features?.currentPropertyCount ?? 0,
    remainingProperties: features?.remainingProperties ?? 0,
    
    forecastYearsLimit: features?.forecastYearsLimit ?? 10,
    
    canUseTaxCalculator: features?.canUseTaxCalculator ?? false,
    canUseInvestmentComparison: features?.canUseInvestmentComparison ?? false,
    canExportReports: features?.canExportReports ?? false,
    
    tierName: features?.tierName ?? 'basic',
    displayName: features?.displayName ?? 'Basic',
    isAdmin: features?.isAdmin ?? false,
  };
}
```

### Phase 6: Frontend - Welcome Screen (Optional)

**File**: `client/src/pages/Welcome.tsx` (new file)

```typescript
import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { features } = useFeatureAccess();

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Property Portfolio Analyzer! 🎉</CardTitle>
          <CardDescription>
            Your account has been created successfully. You're on the {features?.displayName} plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">What you can do with {features?.displayName}:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <span>Track up to <strong>{features?.propertyLimit} properties</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <span>View <strong>{features?.forecastYearsLimit}-year</strong> equity, cashflow, and debt projections</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <span>Analyze rental income and expenses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <span>Track loan scenarios and repayments</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Want more?</h4>
            <p className="text-sm text-blue-800 mb-3">
              Upgrade to <strong>Pro</strong> for unlimited properties, 50-year forecasts, 
              tax calculator, and investment comparisons.
            </p>
            <Button variant="outline" size="sm">
              View Pro Features
            </Button>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={() => setLocation('/dashboard')}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Phase 7: tRPC API Endpoints

**File**: `server/routers.ts` (add new endpoints)

```typescript
// User feature access endpoint
user: router({
  getFeatureAccess: protectedProcedure
    .query(async ({ ctx }) => {
      return await getUserFeatureAccess(ctx.user.id);
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.getUserWithSubscription(ctx.user.id);
    }),
}),
```

---

## Testing Checklist

### New User Registration Flow

- [ ] Visit app while logged out
- [ ] Click "Sign In with Manus"
- [ ] Complete OAuth on Manus portal
- [ ] Verify redirected to `/dashboard?welcome=true`
- [ ] Check database: user record created with role='user'
- [ ] Check database: user_subscriptions record created with tier='basic'
- [ ] Verify feature access: 2 property limit, 10 year forecast
- [ ] Verify tax calculator shows upgrade prompt

### Returning User Login Flow

- [ ] Log out from app
- [ ] Click "Sign In with Manus"
- [ ] Complete OAuth
- [ ] Verify redirected to `/dashboard` (no welcome param)
- [ ] Verify subscription loaded correctly
- [ ] Verify feature access matches tier

### Admin User Flow

- [ ] Promote user to admin via SQL: `UPDATE users SET role = 'admin' WHERE id = 1`
- [ ] Log in as admin
- [ ] Verify unlimited property access
- [ ] Verify all features unlocked
- [ ] Verify admin navigation visible

### Subscription Upgrade Flow

- [ ] Log in as basic user
- [ ] Try to add 3rd property → blocked with upgrade prompt
- [ ] Upgrade to Pro via SQL: `UPDATE user_subscriptions SET tier_id = 2 WHERE user_id = 1`
- [ ] Refresh page
- [ ] Verify can now add unlimited properties
- [ ] Verify tax calculator accessible

---

## Database Migration Steps

### Step 1: Execute SQL Script

```bash
# Connect to your database
mysql -u username -p database_name < sql/03_subscription_system.sql

# Or via Drizzle
cd /home/ubuntu/property-portfolio-analyzer
pnpm db:push
```

### Step 2: Verify Tables Created

```sql
SHOW TABLES LIKE '%subscription%';
-- Should show: subscription_tiers, user_subscriptions

DESCRIBE users;
-- Should show: role ENUM('admin', 'user')
```

### Step 3: Verify Seed Data

```sql
SELECT * FROM subscription_tiers;
-- Should show: basic (2 properties, 10 years), pro (999 properties, 50 years)

SELECT COUNT(*) FROM user_subscriptions;
-- Should show: number of existing users (all assigned to basic)
```

### Step 4: Promote Your Account to Admin

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Verify
SELECT id, name, email, role FROM users WHERE role = 'admin';
```

---

## Code Changes Summary

### Files to Modify

1. **`server/_core/oauth.ts`**
   - Add `assignDefaultSubscription()` call after user creation
   - Add role='user' to createUser call

2. **`server/db.ts`**
   - Add `assignDefaultSubscription()` function
   - Add `getUserWithSubscription()` function
   - Import subscription schema types

3. **`drizzle/schema.ts`**
   - Add `subscriptionTiers` table definition
   - Add `userSubscriptions` table definition
   - Add `role` field to `users` table
   - Export types

4. **`server/routers.ts`**
   - Add `user.getFeatureAccess` endpoint
   - Add `user.getProfile` endpoint

### Files to Create

1. **`client/src/hooks/useFeatureAccess.ts`**
   - Feature access hook for frontend

2. **`client/src/pages/Welcome.tsx`** (optional)
   - Welcome screen for new users

3. **`server/feature-gates.ts`** (already created)
   - Feature gate helper functions

---

## Environment Variables

No new environment variables required. Manus OAuth credentials already configured:
- `OAUTH_SERVER_URL`
- `VITE_APP_ID`
- `VITE_OAUTH_PORTAL_URL`
- `JWT_SECRET`

---

## Security Considerations

1. **Session Security**: JWT tokens are HTTP-only cookies (already secure)
2. **Role Validation**: Always validate role on backend, never trust frontend
3. **Subscription Check**: Verify subscription status on every protected operation
4. **Default Role**: All new users get 'user' role (not 'admin')
5. **Admin Promotion**: Only via direct database access (no API endpoint)

---

## Rollback Plan

If issues occur, rollback steps:

1. **Remove subscription tables**:
   ```sql
   DROP TABLE user_subscriptions;
   DROP TABLE subscription_tiers;
   ALTER TABLE users DROP COLUMN role;
   ```

2. **Revert code changes**: Use git to revert modified files

3. **Clear sessions**: Users will need to log in again

---

## Future Enhancements

1. **Stripe Integration**: Add payment processing for Pro subscriptions
2. **Trial Periods**: 14-day Pro trial for new users
3. **Email Notifications**: Welcome email, subscription expiry reminders
4. **Usage Analytics**: Track feature usage by tier
5. **Referral Program**: Earn Pro subscription through referrals
6. **Custom Tiers**: Enterprise tier with custom limits

---

## Summary

This implementation plan provides a complete authentication flow with automatic subscription assignment:

✅ **Manus OAuth**: Already integrated, no changes needed
✅ **User Creation**: Automatically creates user record on first login
✅ **Default Subscription**: Assigns Basic tier to all new users
✅ **Role Assignment**: Sets default 'user' role
✅ **Feature Gates**: Backend validation for all protected features
✅ **Frontend Hooks**: Easy feature access checking in React components
✅ **Admin System**: Promote users to admin for unlimited access
✅ **Upgrade Path**: Clear path from Basic → Pro

**Estimated Implementation Time**: 2-3 hours
**Testing Time**: 1 hour
**Total**: 3-4 hours

Ready to implement? I can start with Phase 1 (database schema) and work through each phase systematically.
