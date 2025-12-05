# User Management & Subscription System Architecture

## Executive Summary

This document outlines the complete architecture for implementing a multi-tier user management system with role-based access control (RBAC) and subscription-based feature gating for the Property Portfolio Analyzer application.

---

## System Overview

### User Hierarchy

```
┌─────────────────────────────────────────┐
│              ADMIN USER                  │
│  - Full system access                    │
│  - User management                       │
│  - Subscription management               │
│  - All features unlocked                 │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────────┐   ┌───────▼──────────┐
│   PRO USER       │   │   BASIC USER     │
│  - Unlimited     │   │  - Max 2         │
│    properties    │   │    properties    │
│  - Unlimited     │   │  - Max 10 years  │
│    forecast      │   │    forecast      │
│  - All features  │   │  - Core features │
│  - Tax calc      │   │    only          │
│  - Comparisons   │   │  - Upgrade       │
│                  │   │    prompts       │
└──────────────────┘   └──────────────────┘
```

---

## Database Schema Design

### 1. Subscription Tiers Table

Stores available subscription plans and their feature limits.

```sql
CREATE TABLE subscription_tiers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tier_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Feature Limits
  property_limit INT NOT NULL,              -- Max properties (NULL = unlimited)
  forecast_years_limit INT NOT NULL,        -- Max forecast years (NULL = unlimited)
  
  -- Feature Flags
  can_use_tax_calculator BOOLEAN DEFAULT 0,
  can_use_investment_comparison BOOLEAN DEFAULT 0,
  can_export_reports BOOLEAN DEFAULT 0,
  can_use_advanced_analytics BOOLEAN DEFAULT 0,
  
  -- Pricing (for future payment integration)
  monthly_price_cents INT DEFAULT 0,
  annual_price_cents INT DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tier_name (tier_name),
  INDEX idx_active (is_active)
);
```

**Seed Data:**

```sql
INSERT INTO subscription_tiers (tier_name, display_name, description, property_limit, forecast_years_limit, can_use_tax_calculator, can_use_investment_comparison, can_export_reports, can_use_advanced_analytics, monthly_price_cents, annual_price_cents, sort_order) VALUES
('basic', 'Basic', 'Perfect for getting started with property investment analysis', 2, 10, 0, 0, 0, 0, 0, 0, 1),
('pro', 'Pro', 'Unlimited properties and advanced features for serious investors', 999, 50, 1, 1, 1, 1, 2900, 29900, 2);
```

### 2. User Subscriptions Table

Links users to their subscription tiers.

```sql
CREATE TABLE user_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tier_id INT NOT NULL,
  
  -- Subscription Period
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NULL,                  -- NULL = active, future date = scheduled end
  
  -- Status
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id),
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
);
```

### 3. Update Users Table

Add role field to existing users table.

```sql
ALTER TABLE users 
ADD COLUMN role ENUM('admin', 'user') DEFAULT 'user' AFTER email,
ADD INDEX idx_role (role);
```

---

## Authorization Architecture

### 1. Role-Based Access Control (RBAC)

**Roles:**
- **admin**: Full system access, user management, subscription management
- **user**: Standard user with subscription-based feature access

**Implementation Pattern:**

```typescript
// server/_core/authorization.ts

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Admin access required' 
    });
  }
  return next({ ctx });
});
```

### 2. Subscription-Based Feature Gates

**Feature Gate Helper Functions:**

```typescript
// server/feature-gates.ts

export interface UserSubscription {
  tier: {
    property_limit: number;
    forecast_years_limit: number;
    can_use_tax_calculator: boolean;
    can_use_investment_comparison: boolean;
    can_export_reports: boolean;
    can_use_advanced_analytics: boolean;
  };
  status: 'active' | 'expired' | 'cancelled';
}

export async function getUserSubscription(userId: number): Promise<UserSubscription> {
  // Fetch active subscription with tier details
}

export async function canAddProperty(userId: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const currentCount = await getPropertyCount(userId);
  return currentCount < subscription.tier.property_limit;
}

export async function canViewForecastYears(userId: number, years: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return years <= subscription.tier.forecast_years_limit;
}

export async function canUseTaxCalculator(userId: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.tier.can_use_tax_calculator;
}

export async function canUseInvestmentComparison(userId: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.tier.can_use_investment_comparison;
}
```

### 3. Backend Validation Flow

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  tRPC Procedure │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth Context   │ ◄─── Extract user from session
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Role Check     │ ◄─── Is admin? Continue : Check subscription
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feature Gate    │ ◄─── Check subscription tier limits
└────────┬────────┘
         │
         ├─── PASS ──► Execute business logic
         │
         └─── FAIL ──► Throw FORBIDDEN error with upgrade message
```

---

## API Endpoints (tRPC Procedures)

### 1. Admin User Management Router

```typescript
// server/routers.ts - admin namespace

admin: router({
  // List all users with pagination
  listUsers: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      search: z.string().optional(),
      role: z.enum(['admin', 'user']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await db.listUsers(input);
    }),

  // Get user details
  getUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getUserDetails(input.userId);
    }),

  // Update user role
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['admin', 'user']),
    }))
    .mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  // Update user subscription
  updateUserSubscription: adminProcedure
    .input(z.object({
      userId: z.number(),
      tierId: z.number(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateUserSubscription(input.userId, input.tierId, input.endDate);
      return { success: true };
    }),

  // Get subscription tiers
  getSubscriptionTiers: adminProcedure
    .query(async () => {
      return await db.getSubscriptionTiers();
    }),

  // User statistics
  getUserStats: adminProcedure
    .query(async () => {
      return await db.getUserStatistics();
    }),
}),
```

### 2. User Subscription Router

```typescript
// server/routers.ts - subscription namespace

subscription: router({
  // Get current user's subscription
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.getUserSubscription(ctx.user.id);
    }),

  // Get available tiers
  getTiers: protectedProcedure
    .query(async () => {
      return await db.getActiveSubscriptionTiers();
    }),

  // Check feature access
  checkFeature: protectedProcedure
    .input(z.object({
      feature: z.enum(['tax_calculator', 'investment_comparison', 'export_reports', 'advanced_analytics']),
    }))
    .query(async ({ input, ctx }) => {
      const subscription = await getUserSubscription(ctx.user.id);
      const canAccess = subscription.tier[`can_use_${input.feature}`];
      return { canAccess, currentTier: subscription.tier.tier_name };
    }),

  // Check property limit
  checkPropertyLimit: protectedProcedure
    .query(async ({ ctx }) => {
      const subscription = await getUserSubscription(ctx.user.id);
      const currentCount = await db.getPropertyCount(ctx.user.id);
      return {
        current: currentCount,
        limit: subscription.tier.property_limit,
        canAdd: currentCount < subscription.tier.property_limit,
      };
    }),

  // Check forecast limit
  checkForecastLimit: protectedProcedure
    .input(z.object({ years: z.number() }))
    .query(async ({ input, ctx }) => {
      const subscription = await getUserSubscription(ctx.user.id);
      return {
        requested: input.years,
        limit: subscription.tier.forecast_years_limit,
        canView: input.years <= subscription.tier.forecast_years_limit,
      };
    }),
}),
```

### 3. Protected Property Operations

```typescript
// server/routers.ts - properties namespace (updated)

properties: router({
  create: protectedProcedure
    .input(propertySchema)
    .mutation(async ({ input, ctx }) => {
      // Check if user can add more properties
      const canAdd = await canAddProperty(ctx.user.id);
      if (!canAdd) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Property limit reached. Upgrade to Pro for unlimited properties.',
        });
      }
      
      const id = await db.createProperty({ ...input, userId: ctx.user.id });
      return { id };
    }),
  
  // ... other property operations
}),
```

---

## Frontend Components

### 1. Admin Dashboard

**Location:** `client/src/pages/AdminDashboard.tsx`

**Features:**
- User list table with search and filtering
- Role management (admin/user toggle)
- Subscription tier assignment
- User statistics dashboard
- Activity logs

**Component Structure:**

```tsx
<AdminDashboard>
  <AdminHeader />
  
  <Tabs>
    <Tab value="users">
      <UserManagementTable 
        users={users}
        onRoleChange={handleRoleChange}
        onSubscriptionChange={handleSubscriptionChange}
      />
    </Tab>
    
    <Tab value="subscriptions">
      <SubscriptionTiersTable 
        tiers={tiers}
      />
    </Tab>
    
    <Tab value="statistics">
      <UserStatisticsCards />
      <ActivityChart />
    </Tab>
  </Tabs>
</AdminDashboard>
```

### 2. Upgrade Prompt Modal

**Location:** `client/src/components/UpgradePromptModal.tsx`

**Trigger Scenarios:**
- Basic user tries to add 3rd property
- Basic user selects 20+ year forecast
- Basic user clicks on Tax Calculator
- Basic user clicks on Investment Comparison

**Component:**

```tsx
<UpgradePromptModal 
  isOpen={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  feature="Tax Calculator"
  currentTier="Basic"
  requiredTier="Pro"
>
  <SubscriptionComparisonTable />
  <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
</UpgradePromptModal>
```

### 3. Feature Gate Wrapper

**Location:** `client/src/components/FeatureGate.tsx`

**Usage:**

```tsx
<FeatureGate 
  feature="tax_calculator"
  fallback={<UpgradePrompt feature="Tax Calculator" />}
>
  <TaxCalculatorSection />
</FeatureGate>
```

### 4. Property Limit Indicator

**Location:** `client/src/components/PropertyLimitIndicator.tsx`

**Display:**

```tsx
<PropertyLimitIndicator>
  Properties: 2 / 2 (Upgrade for unlimited)
</PropertyLimitIndicator>
```

---

## Feature Access Matrix

| Feature | Admin | Pro User | Basic User |
|---------|-------|----------|------------|
| **Core Features** |
| Add Properties | ✅ Unlimited | ✅ Unlimited | ⚠️ Max 2 |
| View Dashboard | ✅ | ✅ | ✅ |
| Equity Projections | ✅ 50 years | ✅ 50 years | ⚠️ 10 years |
| Cashflow Projections | ✅ 50 years | ✅ 50 years | ⚠️ 10 years |
| Debt Tracking | ✅ 50 years | ✅ 50 years | ⚠️ 10 years |
| **Advanced Features** |
| Tax Calculator | ✅ | ✅ | ❌ Upgrade |
| Investment Comparison | ✅ | ✅ | ❌ Upgrade |
| Export Reports | ✅ | ✅ | ❌ Upgrade |
| Advanced Analytics | ✅ | ✅ | ❌ Upgrade |
| **Admin Features** |
| User Management | ✅ | ❌ | ❌ |
| Subscription Management | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |

---

## Implementation Workflow

### Phase 1: Database Setup

1. Create `subscription_tiers` table
2. Create `user_subscriptions` table
3. Add `role` field to `users` table
4. Seed subscription tiers (Basic, Pro)
5. Assign default "Basic" tier to existing users
6. Set your account to "admin" role

### Phase 2: Backend Authorization

1. Create `server/feature-gates.ts` with helper functions
2. Create `adminProcedure` middleware in `server/_core/authorization.ts`
3. Add subscription validation to property creation
4. Add forecast year validation to calculation endpoints
5. Create admin user management router
6. Create user subscription router
7. Write unit tests for authorization logic

### Phase 3: Frontend Feature Gates

1. Create `FeatureGate` wrapper component
2. Create `UpgradePromptModal` component
3. Add property limit check to "Add Property" button
4. Add forecast year limit to year selector
5. Wrap Tax Calculator in feature gate
6. Wrap Investment Comparison in feature gate
7. Add property/forecast limit indicators

### Phase 4: Admin Dashboard

1. Create `AdminDashboard` page
2. Create `UserManagementTable` component
3. Create `SubscriptionEditor` component
4. Add admin navigation link (visible only to admins)
5. Implement user search and filtering
6. Add user statistics cards

### Phase 5: Testing

1. Test admin account creation and permissions
2. Test basic user property limit (2 max)
3. Test basic user forecast limit (10 years max)
4. Test pro user unlimited access
5. Test upgrade prompts display correctly
6. Test admin user management functions

---

## Required Inputs

### 1. Admin Account Setup

**Input:**
- Your email address (to set as admin)
- Or user ID (to promote to admin)

**Action:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 2. Default Subscription Assignment

**Input:**
- All existing users → Basic tier
- New users → Basic tier (default)

**Action:**
```sql
INSERT INTO user_subscriptions (user_id, tier_id, status)
SELECT id, (SELECT id FROM subscription_tiers WHERE tier_name = 'basic'), 'active'
FROM users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);
```

---

## Expected Outputs

### 1. Admin Dashboard

- **User List**: Paginated table with all users
- **Role Management**: Toggle admin/user roles
- **Subscription Management**: Assign/change subscription tiers
- **Statistics**: Total users, active subscriptions, property count

### 2. Feature Gates

- **Property Limit**: "You've reached your property limit (2/2). Upgrade to Pro for unlimited properties."
- **Forecast Limit**: Year selector disabled beyond 10 years with tooltip
- **Tax Calculator**: Entire section replaced with upgrade prompt
- **Investment Comparison**: Button shows upgrade modal on click

### 3. Upgrade Prompts

- **Modal Title**: "Upgrade to Pro"
- **Feature**: "Tax Calculator requires Pro subscription"
- **Comparison Table**: Basic vs Pro features
- **CTA**: "Upgrade Now" button

### 4. User Subscription Status

- **Current Tier**: "Basic" or "Pro"
- **Properties**: "2 / 2" or "5 / Unlimited"
- **Forecast**: "10 years" or "50 years"
- **Features**: List of available/locked features

---

## Security Considerations

1. **Role Validation**: Always validate role on backend, never trust frontend
2. **Subscription Check**: Verify subscription status on every protected operation
3. **Admin Actions**: Log all admin actions (role changes, subscription updates)
4. **Rate Limiting**: Implement rate limiting on subscription checks
5. **Audit Trail**: Track subscription changes and admin actions

---

## Future Enhancements

1. **Payment Integration**: Stripe subscription payments
2. **Trial Periods**: 14-day Pro trial for new users
3. **Usage Analytics**: Track feature usage by tier
4. **Custom Tiers**: Enterprise tier with custom limits
5. **Referral Program**: Earn Pro subscription through referrals
6. **Downgrade Flow**: Handle tier downgrades gracefully

---

## Summary

This architecture provides a complete multi-tier user management system with:

✅ **Role-Based Access Control**: Admin vs User roles
✅ **Subscription Tiers**: Basic (2 properties, 10 years) vs Pro (unlimited)
✅ **Feature Gates**: Backend validation and frontend prompts
✅ **Admin Dashboard**: User management and subscription control
✅ **Upgrade Flow**: Clear upgrade prompts and comparison tables
✅ **Scalability**: Easy to add new tiers and features
✅ **Security**: Backend-enforced authorization

Ready to implement? Let me know and I'll start with Phase 1: Database Setup.
