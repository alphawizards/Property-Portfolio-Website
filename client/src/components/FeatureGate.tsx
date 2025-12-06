import React from 'react';
import { useHasFeature, useCanAddProperty, useIsAdmin } from '../hooks/useSubscription';

interface FeatureGateProps {
  feature: 'advancedAnalytics' | 'scenarioComparison' | 'exportReports' | 'taxCalculator';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

/**
 * Component that gates content behind a feature flag
 * Shows fallback or message if feature is not available
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showMessage = true,
}: FeatureGateProps) {
  const { hasFeature, message, isLoading } = useHasFeature(feature);

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!hasFeature) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            {message || `This feature requires a subscription upgrade`}
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface PropertyLimitGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that gates property creation behind limit check
 */
export function PropertyLimitGate({
  children,
  fallback,
}: PropertyLimitGateProps) {
  const { canAdd, message, isLoading } = useCanAddProperty();

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!canAdd) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{message || 'You have reached your property limit'}</p>
      </div>
    );
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that gates content to admins only
 */
export function AdminOnly({
  children,
  fallback,
}: AdminOnlyProps) {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}
