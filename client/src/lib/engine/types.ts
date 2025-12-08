/**
 * Financial Calculation Engine - Type Definitions
 * 
 * Pure TypeScript types for zero-latency mortgage calculations.
 * All currency values are in cents (AUD unless specified).
 */

export type Region = 'AU' | 'US' | 'UK';

export type LoanStructure = 'PrincipalAndInterest' | 'InterestOnly';

export type RepaymentFrequency = 'Weekly' | 'Fortnightly' | 'Monthly';

/**
 * Core mortgage parameters
 */
export interface MortgageInput {
  principal: number;           // Loan amount in cents
  annualRate: number;          // Interest rate as percentage (e.g., 6.5 for 6.5%)
  termYears: number;           // Loan term in years
  structure: LoanStructure;    // P&I or IO
  frequency: RepaymentFrequency;
  region: Region;              // Different regions have different calculation methods
}

/**
 * Monthly repayment breakdown
 */
export interface RepaymentBreakdown {
  totalRepayment: number;      // Total monthly payment in cents
  principal: number;           // Principal portion in cents
  interest: number;            // Interest portion in cents
  remainingBalance: number;    // Remaining loan balance in cents
}

/**
 * Single amortization schedule entry
 */
export interface AmortizationEntry {
  month: number;               // Month number (1-360 for 30 year loan)
  date: Date;                  // Payment date
  payment: number;             // Total payment in cents
  principal: number;           // Principal paid in cents
  interest: number;            // Interest paid in cents
  balance: number;             // Remaining balance in cents
  cumulativePrincipal: number; // Total principal paid to date
  cumulativeInterest: number;  // Total interest paid to date
}

/**
 * Complete amortization schedule
 */
export interface AmortizationSchedule {
  entries: AmortizationEntry[];
  totalPaid: number;           // Total amount paid over life of loan
  totalInterest: number;       // Total interest paid
  totalPrincipal: number;      // Total principal paid (should equal loan amount)
}

/**
 * Loan-to-Value Ratio calculation
 */
export interface LVRCalculation {
  loanAmount: number;          // In cents
  propertyValue: number;       // In cents
  lvr: number;                 // As percentage (e.g., 80 for 80%)
  equity: number;              // In cents
  lmi: number;                 // Lenders Mortgage Insurance (if applicable)
  requiresLMI: boolean;        // True if LVR > 80%
}

/**
 * Property growth forecast
 */
export interface GrowthForecast {
  years: number[];             // Array of year numbers
  values: number[];            // Property values in cents
  growthRate: number;          // Annual growth rate as percentage
  totalGrowth: number;         // Total growth in cents
  totalGrowthPercent: number;  // Total growth as percentage
}

/**
 * Cashflow projection
 */
export interface CashflowProjection {
  month: number;
  date: Date;
  rental: number;              // Rental income in cents
  expenses: number;            // Total expenses in cents
  loanRepayment: number;       // Loan repayment in cents
  netCashflow: number;         // Net cashflow in cents (can be negative)
  cumulativeCashflow: number;  // Running total
  depreciation?: number;       // Tax depreciation benefit
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  rentalIncome: number;        // Annual rental income
  deductibleExpenses: number;  // Total deductible expenses
  loanInterest: number;        // Deductible interest
  depreciation: number;        // Depreciation deduction
  taxableIncome: number;       // Rental income - deductions
  taxSavings: number;          // Tax benefit (if negative income)
  effectiveCashflow: number;   // After-tax cashflow
}

/**
 * Comparison scenario
 */
export interface ComparisonScenario {
  name: string;
  loanAmount: number;
  interestRate: number;
  termYears: number;
  structure: LoanStructure;
  totalCost: number;           // Total cost over loan life
  totalInterest: number;       // Total interest paid
  monthlyRepayment: number;    // Monthly repayment amount
}

/**
 * Result of comparing two scenarios
 */
export interface ScenarioComparison {
  scenarios: [ComparisonScenario, ComparisonScenario];
  savings: number;             // Savings of scenario 2 vs scenario 1
  savingsPercent: number;      // Savings as percentage
  recommendation: string;      // Human-readable recommendation
}

/**
 * Regional calculation parameters
 */
export interface RegionalParams {
  daysPerYear: number;         // 365 for AU, 360 for US
  compoundingFrequency: 'daily' | 'monthly';
  lmiThreshold: number;        // LVR threshold for LMI (80 for AU)
  stampDutyRate?: number;      // Varies by region/state
}
