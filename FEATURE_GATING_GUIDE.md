# Feature Gating Implementation Guide

## Overview
Feature gating enforces subscription tier limits and prompts free users to upgrade when accessing premium features.

## Backend Implementation

### Feature Gate Functions (`server/feature-gates.ts`)
```typescript
// Check property limit
const status = await canAddProperty(db, userId);
// Returns: { currentCount, limit, canAdd, remaining, isUnlimited }

// Check forecast access
const forecastStatus = await canViewForecast(db, userId, requestedYears);
// Returns: { requestedYears, limit, canView, isUnlimited }

// Check feature access
const taxAccess = await canUseTaxCalculator(db, userId);
// Returns: { hasAccess, tierName, requiresPremium, reason? }

// Get all at once (recommended)
const allAccess = await getAllFeatureAccess(db, userId);
```

### tRPC Router (`server/routers/feature-gates-router.ts`)
All feature gate functions are exposed via tRPC:
```typescript
trpc.featureGates.canAddProperty.useQuery()
trpc.featureGates.canUseTaxCalculator.useQuery()
trpc.featureGates.getAllFeatureAccess.useQuery() // Get all at once
```

## Frontend Usage

### 1. FeatureGate Component (Recommended)
Automatically handles access checks and shows upgrade prompts:

```tsx
import { FeatureGate } from "@/components/FeatureGate";

// Wrap premium features
<FeatureGate feature="taxCalculator">
  <TaxCalculator />
</FeatureGate>

<FeatureGate feature="exportReports" compact>
  <ExportButton />
</FeatureGate>
```

**Features:**
- `taxCalculator` - Advanced tax calculation tools
- `investmentComparison` - Property vs shares comparison
- `exportReports` - PDF export functionality
- `advancedAnalytics` - Advanced charts and forecasts

### 2. Manual Access Check
For custom UI/logic:

```tsx
import { trpc } from "@/lib/trpc";

function MyComponent() {
  const { data: access } = trpc.featureGates.getAllFeatureAccess.useQuery();

  if (!access?.features.taxCalculator) {
    return <UpgradePrompt feature="Tax Calculator" />;
  }

  return <TaxCalculator />;
}
```

### 3. Property Limit Enforcement

```tsx
import { trpc } from "@/lib/trpc";
import { UpgradePrompt } from "@/components/UpgradePrompt";

function AddPropertyButton() {
  const { data: propertyStatus } = trpc.featureGates.canAddProperty.useQuery();

  if (!propertyStatus?.canAdd) {
    return (
      <UpgradePrompt
        feature="Add More Properties"
        description={`You've reached the limit of ${propertyStatus?.limit} properties on the free plan.`}
        compact
      />
    );
  }

  return <Button onClick={handleAddProperty}>Add Property</Button>;
}
```

### 4. Forecast Year Limiting

```tsx
function ForecastSettings() {
  const [years, setYears] = useState(10);
  const { data: forecastAccess } = trpc.featureGates.canViewForecast.useQuery({ years });

  return (
    <div>
      <input
        type="number"
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        max={forecastAccess?.isUnlimited ? 999 : forecastAccess?.limit}
      />
      {!forecastAccess?.canView && (
        <p className="text-red-600">
          Free plan limited to {forecastAccess?.limit} years. Upgrade for unlimited forecasts.
        </p>
      )}
    </div>
  );
}
```

## Tier Limits Configuration

**Free Tier:**
- 2 properties maximum
- 10-year forecast limit
- ❌ No tax calculator
- ❌ No investment comparison
- ❌ No PDF exports
- ❌ No advanced analytics

**Premium (Monthly/Annual):**
- ✅ Unlimited properties
- ✅ Unlimited forecast years
- ✅ Tax calculator
- ✅ Investment comparison
- ✅ PDF exports
- ✅ Advanced analytics

## Backend Enforcement

Always enforce limits on backend routes:

```typescript
// In property creation route
properties: router({
  create: protectedProcedure.mutation(async ({ ctx, input }) => {
    const db = await getDb();
    const canAdd = await canAddProperty(db, ctx.user.id);
    
    if (!canAdd.canAdd) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Property limit reached. Free plan allows ${canAdd.limit} properties.`,
      });
    }

    // Create property...
  }),
}),
```

## Examples in the Codebase

1. **Subscription Page** (`client/src/pages/Subscription.tsx`)
   - Displays current plan and limits
   - Shows feature comparison
   - Handles upgrades

2. **FeatureGate Component** (`client/src/components/FeatureGate.tsx`)
   - Wraps premium features
   - Shows upgrade prompts

3. **UpgradePrompt Component** (`client/src/components/UpgradePrompt.tsx`)
   - Reusable upgrade UI
   - Compact and full-size variants

## Testing

```typescript
// Test as free user
- Try adding 3rd property → Should show upgrade prompt
- Access tax calculator → Should show upgrade prompt

// Test as premium user
- Add unlimited properties → Should work
- Access all features → Should work
```

## Common Patterns

### Conditional Feature Rendering
```tsx
const { data: access } = trpc.featureGates.getAllFeatureAccess.useQuery();

return (
  <div>
    {access?.features.advancedAnalytics ? (
      <AdvancedCharts />
    ) : (
      <BasicCharts />
    )}
  </div>
);
```

### Feature Status Badge
```tsx
{!access?.features.exportReports && (
  <Badge variant="outline" className="ml-2">
    <Crown className="mr-1 h-3 w-3" />
    Premium
  </Badge>
)}
```

### Disabled State with Tooltip
```tsx
<Button
  disabled={!access?.features.exportReports}
  title={!access?.features.exportReports ? "Upgrade to Premium" : ""}
>
  Export PDF
</Button>
```
