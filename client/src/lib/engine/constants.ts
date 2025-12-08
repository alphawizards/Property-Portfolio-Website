/**
 * Regional Constants for Financial Calculations
 * 
 * Different regions have different calculation methods and parameters.
 */

import type { Region, RegionalParams } from './types';

/**
 * Regional calculation parameters
 */
export const REGIONAL_PARAMS: Record<Region, RegionalParams> = {
  AU: {
    daysPerYear: 365,
    compoundingFrequency: 'daily',
    lmiThreshold: 80,  // LMI required above 80% LVR
    stampDutyRate: 4.0, // Approximate (varies by state)
  },
  US: {
    daysPerYear: 360,  // US uses 360-day year
    compoundingFrequency: 'monthly',
    lmiThreshold: 80,  // PMI required above 80% LTV
    stampDutyRate: 0,  // No stamp duty in most US states
  },
  UK: {
    daysPerYear: 365,
    compoundingFrequency: 'daily',
    lmiThreshold: 75,  // Insurance required above 75% LTV
    stampDutyRate: 2.0, // Approximate SDLT
  },
};

/**
 * Repayment frequency multipliers
 */
export const FREQUENCY_MULTIPLIERS = {
  Weekly: 52,
  Fortnightly: 26,
  Monthly: 12,
} as const;

/**
 * LMI calculation rates (approximate)
 * Based on LVR bands - actual rates vary by lender
 */
export const LMI_RATES = {
  80: 0,      // No LMI
  85: 1.5,    // 1.5% of loan amount
  90: 2.5,    // 2.5% of loan amount
  95: 4.0,    // 4.0% of loan amount
} as const;

/**
 * Standard depreciation rates (Australian Tax Office)
 */
export const DEPRECIATION_RATES = {
  building: 2.5,        // 2.5% per year (40 year life)
  plantEquipment: 20.0, // 20% declining balance (appliances, carpets, etc.)
} as const;

/**
 * Typical property expense ratios (as percentage of property value per year)
 */
export const EXPENSE_RATIOS = {
  councilRates: 0.4,      // ~0.4% of property value
  insurance: 0.2,         // ~0.2% of property value
  maintenance: 0.5,       // ~0.5% of property value
  propertyManagement: 8.0, // 8% of rental income (not property value)
  strataFees: 0.8,        // ~0.8% for apartments
} as const;

/**
 * Tax brackets (Australian - 2024/25)
 */
export const TAX_BRACKETS_AU = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 19 },
  { min: 45001, max: 120000, rate: 32.5 },
  { min: 120001, max: 180000, rate: 37 },
  { min: 180001, max: Infinity, rate: 45 },
] as const;

/**
 * Typical rental yields by property type (Australian market)
 */
export const TYPICAL_YIELDS = {
  residential: 4.5,    // 4.5% gross yield
  commercial: 7.0,     // 7.0% gross yield
  industrial: 8.0,     // 8.0% gross yield
} as const;

/**
 * Capital growth rates (historical Australian averages)
 */
export const GROWTH_RATES = {
  conservative: 4.0,   // Conservative estimate
  moderate: 6.0,       // Moderate estimate
  optimistic: 8.0,     // Optimistic estimate
} as const;

/**
 * Interest rate stress test buffer (APRA requirement)
 */
export const STRESS_TEST_BUFFER = 3.0; // Add 3% to current rate

/**
 * Maximum loan amounts by LVR for different property values
 */
export function getMaxLoanAmount(propertyValue: number, targetLVR: number): number {
  return Math.floor((propertyValue * targetLVR) / 100);
}

/**
 * Calculate LMI based on loan amount and LVR
 */
export function calculateLMI(loanAmount: number, lvr: number): number {
  if (lvr <= 80) return 0;
  
  let rate = 0;
  if (lvr <= 85) rate = LMI_RATES[85];
  else if (lvr <= 90) rate = LMI_RATES[90];
  else rate = LMI_RATES[95];
  
  return Math.floor((loanAmount * rate) / 100);
}

/**
 * Calculate stamp duty (varies by state, this is NSW approximation)
 */
export function calculateStampDuty(propertyValue: number, region: Region = 'AU'): number {
  const rate = REGIONAL_PARAMS[region].stampDutyRate || 0;
  return Math.floor((propertyValue * rate) / 100);
}
