import { trpc } from "@/lib/trpc";
import { ReactNode } from "react";
import { UpgradePrompt } from "./UpgradePrompt";

interface FeatureGateProps {
  feature: "taxCalculator" | "investmentComparison" | "exportReports" | "advancedAnalytics";
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
}

const FEATURE_NAMES = {
  taxCalculator: "Advanced Tax Calculator",
  investmentComparison: "Investment Comparison",
  exportReports: "Export Reports",
  advancedAnalytics: "Advanced Analytics",
};

const FEATURE_DESCRIPTIONS = {
  taxCalculator: "Calculate tax implications of your property investments with precision",
  investmentComparison: "Compare property investments against shares and other asset classes",
  exportReports: "Export detailed reports as PDF documents",
  advancedAnalytics: "Access advanced charts, forecasts, and financial analysis",
};

/**
 * FeatureGate Component
 * 
 * Conditionally renders children based on user's feature access.
 * Shows upgrade prompt if user doesn't have access.
 * 
 * @example
 * ```tsx
 * <FeatureGate feature="taxCalculator">
 *   <TaxCalculator />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ feature, children, fallback, compact = false }: FeatureGateProps) {
  const { data: access, isLoading } = trpc.featureGates.getAllFeatureAccess.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasAccess = access?.features?.[feature] ?? false;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradePrompt
      feature={FEATURE_NAMES[feature]}
      description={FEATURE_DESCRIPTIONS[feature]}
      compact={compact}
    />
  );
}
