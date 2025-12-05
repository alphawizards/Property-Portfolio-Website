/**
 * Feature Gates Usage Examples
 * 
 * This file demonstrates how to use the feature gate helper functions
 * in various scenarios throughout the application.
 */

import { TRPCError } from '@trpc/server';
import {
  canAddProperty,
  canViewForecastYears,
  canUseTaxCalculator,
  requireFeatureAccess,
  getUserFeatureAccess,
} from './feature-gates';

// ============ EXAMPLE 1: Property Creation with Limit Check ============

/**
 * Example: Check property limit before creating a new property
 * Used in: properties.create tRPC procedure
 */
async function examplePropertyCreation(userId: number, propertyData: any) {
  // Check if user can add more properties
  const propertyStatus = await canAddProperty(userId);
  
  if (!propertyStatus.canAdd) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Property limit reached (${propertyStatus.currentCount}/${propertyStatus.limit}). Upgrade to Pro for unlimited properties.`,
    });
  }
  
  // Proceed with property creation
  console.log(`User has ${propertyStatus.remaining} property slots remaining`);
  // ... create property logic
}

// ============ EXAMPLE 2: Forecast Year Validation ============

/**
 * Example: Validate forecast years before generating projections
 * Used in: calculations.equity, calculations.cashflow procedures
 */
async function exampleForecastValidation(userId: number, requestedYears: number) {
  // Check if user can view this many years
  const forecastStatus = await canViewForecastYears(userId, requestedYears);
  
  if (!forecastStatus.canView) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Forecast limit exceeded. Your plan allows ${forecastStatus.limit} years (requested: ${forecastStatus.requestedYears}). Upgrade to Pro for 50 years.`,
    });
  }
  
  // Proceed with forecast calculation
  console.log(`Generating ${requestedYears}-year forecast`);
  // ... calculation logic
}

// ============ EXAMPLE 3: Tax Calculator Access Check ============

/**
 * Example: Check tax calculator access before calculation
 * Used in: taxCalculator.calculate tRPC procedure
 */
async function exampleTaxCalculatorAccess(userId: number) {
  // Check if user can use tax calculator
  const taxStatus = await canUseTaxCalculator(userId);
  
  if (!taxStatus.hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Tax Calculator requires ${taxStatus.requiredTier} subscription. You are currently on ${taxStatus.tierName}. Upgrade to unlock this feature.`,
    });
  }
  
  // Proceed with tax calculation
  console.log('User has access to tax calculator');
  // ... tax calculation logic
}

// ============ EXAMPLE 4: Using requireFeatureAccess Helper ============

/**
 * Example: Simplified feature access check using helper
 * Used in: Any tRPC procedure requiring feature access
 */
async function exampleRequireFeatureAccess(userId: number) {
  // This will throw TRPCError automatically if access denied
  await requireFeatureAccess(userId, 'tax_calculator');
  
  // If we reach here, user has access
  console.log('Access granted, proceeding with feature');
  // ... feature logic
}

// ============ EXAMPLE 5: Get All Feature Access for Frontend ============

/**
 * Example: Get complete feature access for frontend feature flags
 * Used in: user.getFeatureAccess tRPC procedure
 */
async function exampleGetAllFeatures(userId: number) {
  // Get all feature access in one call
  const features = await getUserFeatureAccess(userId);
  
  console.log('User Feature Access:', {
    tier: features.displayName,
    properties: `${features.currentPropertyCount}/${features.propertyLimit}`,
    canAddMore: features.canAddProperty,
    forecastYears: features.forecastYearsLimit,
    taxCalculator: features.canUseTaxCalculator,
    investmentComparison: features.canUseInvestmentComparison,
    exportReports: features.canExportReports,
    advancedAnalytics: features.canUseAdvancedAnalytics,
  });
  
  return features;
}

// ============ EXAMPLE 6: tRPC Procedure Integration ============

/**
 * Example: Complete tRPC procedure with feature gate
 * Shows how to integrate feature gates into actual procedures
 */
const exampleTRPCProcedure = {
  // Property creation with limit check
  createProperty: async (input: any, ctx: any) => {
    const propertyStatus = await canAddProperty(ctx.user.id);
    
    if (!propertyStatus.canAdd) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Property limit reached (${propertyStatus.currentCount}/${propertyStatus.limit}). Upgrade to Pro for unlimited properties.`,
      });
    }
    
    // Create property
    // ... implementation
    
    return { 
      success: true, 
      remaining: propertyStatus.remaining 
    };
  },
  
  // Equity calculation with forecast limit
  calculateEquity: async (input: { years: number }, ctx: any) => {
    const forecastStatus = await canViewForecastYears(ctx.user.id, input.years);
    
    if (!forecastStatus.canView) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Forecast limit exceeded. Your plan allows ${forecastStatus.limit} years. Upgrade to Pro for 50 years.`,
      });
    }
    
    // Calculate equity
    // ... implementation
    
    return { /* equity data */ };
  },
  
  // Tax calculator with feature access check
  calculateTax: async (input: any, ctx: any) => {
    await requireFeatureAccess(ctx.user.id, 'tax_calculator');
    
    // Calculate tax
    // ... implementation
    
    return { /* tax data */ };
  },
  
  // Get user feature access
  getFeatureAccess: async (ctx: any) => {
    return await getUserFeatureAccess(ctx.user.id);
  },
};

// ============ EXAMPLE 7: Frontend Usage Pattern ============

/**
 * Example: How frontend would use feature access data
 * This would be in a React component
 */
const exampleFrontendUsage = `
// In a React component
const { data: features } = trpc.user.getFeatureAccess.useQuery();

// Conditionally render "Add Property" button
{features?.canAddProperty ? (
  <Button onClick={handleAddProperty}>Add Property</Button>
) : (
  <Button onClick={showUpgradeModal} variant="outline">
    Add Property (Upgrade Required)
  </Button>
)}

// Show property limit indicator
<div>
  Properties: {features?.currentPropertyCount} / {features?.propertyLimit}
  {!features?.canAddProperty && (
    <span className="text-red-600 ml-2">Limit reached</span>
  )}
</div>

// Limit year selector options
<Select>
  {[10, 20, 30, 40, 50].map(years => (
    <SelectItem 
      value={years} 
      disabled={years > features?.forecastYearsLimit}
    >
      {years} Years
      {years > features?.forecastYearsLimit && ' (Pro)'}
    </SelectItem>
  ))}
</Select>

// Conditionally render tax calculator
{features?.canUseTaxCalculator ? (
  <TaxCalculatorSection />
) : (
  <UpgradePrompt feature="Tax Calculator" requiredTier="Pro" />
)}
`;

// ============ EXAMPLE 8: Error Handling Pattern ============

/**
 * Example: Proper error handling for feature gates
 */
async function exampleErrorHandling(userId: number) {
  try {
    // Check property limit
    const status = await canAddProperty(userId);
    
    if (!status.canAdd) {
      // Return user-friendly error with upgrade CTA
      return {
        success: false,
        error: 'PROPERTY_LIMIT_REACHED',
        message: `You've reached your property limit (${status.currentCount}/${status.limit}).`,
        upgrade: {
          currentTier: 'basic',
          requiredTier: 'pro',
          benefits: [
            'Unlimited properties',
            '50-year forecasts',
            'Tax calculator',
            'Investment comparisons',
          ],
        },
      };
    }
    
    // Proceed with operation
    return { success: true };
    
  } catch (error) {
    console.error('Feature gate check failed:', error);
    throw error;
  }
}

// ============ EXAMPLE 9: Batch Feature Checks ============

/**
 * Example: Check multiple features at once for efficiency
 */
async function exampleBatchFeatureCheck(userId: number) {
  // Get all features in one database query
  const features = await getUserFeatureAccess(userId);
  
  // Check multiple conditions
  const checks = {
    canAddProperty: features.canAddProperty,
    canUse30YearForecast: 30 <= features.forecastYearsLimit,
    canUseTaxCalculator: features.canUseTaxCalculator,
    canExportReports: features.canExportReports,
  };
  
  // Return batch results
  return {
    tier: features.tierName,
    checks,
    limits: {
      properties: `${features.currentPropertyCount}/${features.propertyLimit}`,
      forecastYears: features.forecastYearsLimit,
    },
  };
}

// ============ EXAMPLE 10: Admin Bypass Pattern ============

/**
 * Example: How admin users bypass all limits
 */
async function exampleAdminBypass(userId: number) {
  // All feature gate functions automatically check for admin role
  const propertyStatus = await canAddProperty(userId);
  
  if (propertyStatus.isUnlimited) {
    console.log('Admin user detected - unlimited access');
  }
  
  // Admin users will always have:
  // - canAdd: true
  // - limit: 999
  // - isUnlimited: true
  // - hasAccess: true (for all features)
}

export {
  examplePropertyCreation,
  exampleForecastValidation,
  exampleTaxCalculatorAccess,
  exampleRequireFeatureAccess,
  exampleGetAllFeatures,
  exampleTRPCProcedure,
  exampleErrorHandling,
  exampleBatchFeatureCheck,
  exampleAdminBypass,
};
