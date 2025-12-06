import { trpc } from '../utils/trpc';

export interface SubscriptionInfo {
  tier: {
    name: string;
    displayName: string;
    maxProperties: number;
    maxForecastYears: number;
    features: {
      advancedAnalytics: boolean;
      scenarioComparison: boolean;
      exportReports: boolean;
      taxCalculator: boolean;
    };
  };
  status: string;
  startDate: Date;
  endDate: Date | null;
}

export interface FeatureAccess {
  tierId: number;
  tierName: string;
  tierDisplayName: string;
  status: string;
  propertyLimit: number;
  currentPropertyCount: number;
  canAddMoreProperties: boolean;
  maxForecastYears: number;
  features: {
    advancedAnalytics: boolean;
    scenarioComparison: boolean;
    exportReports: boolean;
    taxCalculator: boolean;
  };
  isAdmin: boolean;
}

/**
 * Hook to get user's subscription information
 */
export function useSubscription() {
  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = trpc.auth.getSubscription.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    subscription,
    isLoading,
    error: error?.message,
    refetch,
  };
}

/**
 * Hook to get user's feature access
 */
export function useFeatureAccess() {
  const {
    data: features,
    isLoading,
    error,
    refetch,
  } = trpc.auth.getFeatureAccess.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    features,
    isLoading,
    error: error?.message,
    refetch,
  };
}

/**
 * Hook to check if user can add property
 */
export function useCanAddProperty() {
  const {
    data,
    isLoading,
    error,
  } = trpc.auth.canAddProperty.useQuery();

  return {
    canAdd: data?.canAdd ?? false,
    currentCount: data?.currentCount ?? 0,
    limit: data?.limit ?? 0,
    message: data?.message,
    isLoading,
    error: error?.message,
  };
}

/**
 * Hook to check if feature is available
 */
export function useHasFeature(feature: 'advancedAnalytics' | 'scenarioComparison' | 'exportReports' | 'taxCalculator') {
  const {
    data,
    isLoading,
    error,
  } = trpc.auth.hasFeature.useQuery(feature);

  return {
    hasFeature: data?.hasFeature ?? false,
    message: data?.message,
    isLoading,
    error: error?.message,
  };
}

/**
 * Hook to get all subscription tiers
 */
export function useSubscriptionTiers() {
  const {
    data: tiers,
    isLoading,
    error,
  } = trpc.auth.getAllTiers.useQuery();

  return {
    tiers,
    isLoading,
    error: error?.message,
  };
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const {
    data,
    isLoading,
    error,
  } = trpc.auth.isAdmin.useQuery();

  return {
    isAdmin: data?.isAdmin ?? false,
    isLoading,
    error: error?.message,
  };
}

/**
 * Hook for checking multiple features at once
 */
export function useFeatures(...features: Array<'advancedAnalytics' | 'scenarioComparison' | 'exportReports' | 'taxCalculator'>) {
  const { features: userFeatures } = useFeatureAccess();

  return features.reduce((acc, feature) => {
    acc[feature] = userFeatures?.features[feature] ?? false;
    return acc;
  }, {} as Record<string, boolean>);
}
