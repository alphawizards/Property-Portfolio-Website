import React from 'react';
import { useSubscriptionTiers, useSubscription } from '../hooks/useSubscription';
import { CheckIcon } from '@heroicons/react/24/solid';

export function PricingTable() {
  const { tiers, isLoading } = useSubscriptionTiers();
  const { subscription } = useSubscription();

  if (isLoading) {
    return <div className="text-center py-8">Loading pricing...</div>;
  }

  if (!tiers) {
    return <div className="text-center py-8 text-red-600">Failed to load tiers</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map((tier: any) => (
        <div
          key={tier.id}
          className={`rounded-lg border p-6 ${
            subscription?.tier.name === tier.name
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200'
          }`}
        >
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-bold">{tier.displayName}</h3>
            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
          </div>

          {/* Pricing */}
          <div className="mb-4">
            <div className="text-3xl font-bold">
              ${typeof tier.pricing.monthly === 'string' 
                ? parseFloat(tier.pricing.monthly) 
                : tier.pricing.monthly}
            </div>
            <p className="text-sm text-gray-600">/month</p>
          </div>

          {/* Current Badge */}
          {subscription?.tier.name === tier.name && (
            <div className="mb-4 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded">
              Current Plan
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {tier.limits.maxProperties === 0
                  ? 'Unlimited'
                  : tier.limits.maxProperties}{' '}
                Properties
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">
                {tier.limits.maxForecastYears} year forecasts
              </span>
            </div>

            {tier.features.advancedAnalytics && (
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm">Advanced Analytics</span>
              </div>
            )}

            {tier.features.scenarioComparison && (
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm">Scenario Comparison</span>
              </div>
            )}

            {tier.features.exportReports && (
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm">Export Reports</span>
              </div>
            )}

            {tier.features.taxCalculator && (
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm">Tax Calculator</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {subscription?.tier.name === tier.name ? (
            <button
              disabled
              className="w-full py-2 bg-gray-200 text-gray-600 rounded font-semibold"
            >
              Current Plan
            </button>
          ) : (
            <button className="w-full py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">
              Upgrade to {tier.displayName}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
