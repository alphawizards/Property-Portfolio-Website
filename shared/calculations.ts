/**
 * Financial Calculations Engine for Property Portfolio Analysis
 *
 * All monetary values are in cents
 * All rates are in basis points (1 bp = 0.01%)
 */

import type {
  Property,
  Loan,
  PropertyValuation,
  GrowthRatePeriod,
  RentalIncome,
  ExpenseLog,
  DepreciationSchedule,
} from "../drizzle/schema";

// ============ UTILITY FUNCTIONS ============

/**
 * Convert basis points to decimal rate
 * Example: 550 basis points = 0.055 (5.5%)
 */
function basisPointsToRate(basisPoints: number): number {
  return basisPoints / 10000;
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents for storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Get the year from a date
 */
function getYear(date: Date): number {
  return date.getFullYear();
}

/**
 * Calculate compound growth
 */
function compoundGrowth(principal: number, rate: number, years: number): number {
  return principal * Math.pow(1 + rate, years);
}

// ============ LOAN CALCULATIONS ============

export interface LoanRepayment {
  monthlyPayment: number; // in cents
  annualPayment: number; // in cents
  principalPortion: number; // in cents (monthly)
  interestPortion: number; // in cents (monthly)
}

/**
 * Calculate Interest Only loan repayment
 */
export function calculateInterestOnlyRepayment(loan: Loan, rateOffset: number = 0): LoanRepayment {
  const annualRate = basisPointsToRate(loan.interestRate + rateOffset);
  const monthlyRate = annualRate / 12;
  const interestPortion = Math.round(loan.currentAmount * monthlyRate);

  return {
    monthlyPayment: interestPortion,
    annualPayment: interestPortion * 12,
    principalPortion: 0,
    interestPortion,
  };
}

/**
 * Calculate Principal & Interest loan repayment using amortization formula
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculatePrincipalAndInterestRepayment(loan: Loan, rateOffset: number = 0): LoanRepayment {
  const annualRate = basisPointsToRate(loan.interestRate + rateOffset);
  const monthlyRate = annualRate / 12;
  const numberOfPayments = loan.remainingTermYears * 12;

  if (monthlyRate <= 0) { // Safety check for negative rates or zero
    // No interest case
    const monthlyPayment = Math.round(loan.currentAmount / numberOfPayments);
    return {
      monthlyPayment,
      annualPayment: monthlyPayment * 12,
      principalPortion: monthlyPayment,
      interestPortion: 0,
    };
  }

  const monthlyPayment = Math.round(
    (loan.currentAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );

  const interestPortion = Math.round(loan.currentAmount * monthlyRate);
  const principalPortion = monthlyPayment - interestPortion;

  return {
    monthlyPayment,
    annualPayment: monthlyPayment * 12,
    principalPortion,
    interestPortion,
  };
}

/**
 * Calculate loan repayment based on loan structure
 */
export function calculateLoanRepayment(loan: Loan, rateOffset: number = 0): LoanRepayment {
  if (loan.loanStructure === "InterestOnly") {
    return calculateInterestOnlyRepayment(loan, rateOffset);
  } else {
    return calculatePrincipalAndInterestRepayment(loan, rateOffset);
  }
}

/**
 * Calculate remaining loan balance after a number of years
 */
export function calculateRemainingBalance(loan: Loan, yearsElapsed: number, rateOffset: number = 0): number {
  if (loan.loanStructure === "InterestOnly") {
    // Interest only loans don't reduce principal
    return loan.currentAmount;
  }

  const annualRate = basisPointsToRate(loan.interestRate + rateOffset);
  const monthlyRate = annualRate / 12;
  const totalPayments = loan.remainingTermYears * 12;
  const paymentsMade = yearsElapsed * 12;

  if (paymentsMade >= totalPayments) {
    return 0; // Loan fully paid off
  }

  const repayment = calculatePrincipalAndInterestRepayment(loan, rateOffset);
  const monthlyPayment = repayment.monthlyPayment;

  // Calculate remaining balance using amortization formula
  const remainingPayments = totalPayments - paymentsMade;

  if (monthlyRate <= 0) {
    return Math.round(loan.currentAmount - (monthlyPayment * paymentsMade));
  }

  const remainingBalance = (monthlyPayment * (Math.pow(1 + monthlyRate, remainingPayments) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, remainingPayments));

  return Math.round(remainingBalance);
}

// ============ PROPERTY VALUE PROJECTIONS ============

/**
 * Get the applicable growth rate for a given year
 */
function getGrowthRateForYear(year: number, growthRates: GrowthRatePeriod[]): number {
  // Sort by start year
  const sorted = [...growthRates].sort((a, b) => a.startYear - b.startYear);

  for (const period of sorted) {
    if (year >= period.startYear && (period.endYear === null || year <= period.endYear)) {
      return basisPointsToRate(period.growthRate);
    }
  }

  // Default to 0% growth if no period matches
  return 0;
}

/**
 * Calculate property value at a future year
 */
export function calculatePropertyValue(property: Property, valuations: PropertyValuation[], growthRates: GrowthRatePeriod[], targetYear: number): number {
  const purchaseYear = getYear(property.purchaseDate);

  // Find the most recent valuation before or at target year
  const sortedValuations = [...valuations].sort((a, b) => getYear(b.valuationDate) - getYear(a.valuationDate));

  let baseValue = property.purchasePrice;
  let baseYear = purchaseYear;

  for (const valuation of sortedValuations) {
    const valuationYear = getYear(valuation.valuationDate);
    if (valuationYear <= targetYear) {
      baseValue = valuation.value;
      baseYear = valuationYear;
      break;
    }
  }

  if (targetYear <= baseYear) {
    return baseValue;
  }

  // Apply growth rates year by year
  let currentValue = baseValue;
  for (let year = baseYear + 1; year <= targetYear; year++) {
    const growthRate = getGrowthRateForYear(year, growthRates);
    currentValue = Math.round(currentValue * (1 + growthRate));
  }

  return currentValue;
}

// ============ RENTAL INCOME PROJECTIONS ============

/**
 * Calculate annual rental income for a given year
 */
export function calculateRentalIncomeForYear(rentalIncomes: RentalIncome[], targetYear: number): number {
  let totalAnnualIncome = 0;

  for (const income of rentalIncomes) {
    const startYear = getYear(income.startDate);
    const endYear = income.endDate ? getYear(income.endDate) : null;

    // Check if this income stream is active in the target year
    if (targetYear >= startYear && (endYear === null || targetYear <= endYear)) {
      const yearsElapsed = targetYear - startYear;
      const growthRate = basisPointsToRate(income.growthRate);
      const currentAmount = Math.round(income.amount * Math.pow(1 + growthRate, yearsElapsed));

      // Convert to annual based on frequency
      let annualAmount = 0;
      if (income.frequency === "Monthly") {
        annualAmount = currentAmount * 12;
      } else if (income.frequency === "Weekly") {
        annualAmount = currentAmount * 52;
      } else if (income.frequency === "Fortnightly") {
        annualAmount = currentAmount * 26;
      }

      totalAnnualIncome += annualAmount;
    }
  }

  return totalAnnualIncome;
}

// ============ EXPENSE PROJECTIONS ============

/**
 * Calculate annual expenses for a given year
 * @param expenseGrowthOverride Optional override for expense growth rate (as percentage, e.g., 3 for 3%)
 */
export function calculateExpensesForYear(
  expenses: ExpenseLog[],
  targetYear: number,
  expenseGrowthOverride?: number
): number {
  let totalAnnualExpenses = 0;

  for (const expense of expenses) {
    const startYear = getYear(expense.date);
    const yearsElapsed = targetYear - startYear;

    if (yearsElapsed < 0) {
      continue; // Expense hasn't started yet
    }

    // Use override if provided, otherwise use expense-specific growth rate
    const growthRate = expenseGrowthOverride !== undefined
      ? expenseGrowthOverride / 100 // Convert percentage to rate
      : basisPointsToRate(expense.growthRate);
    const currentAmount = Math.round(expense.totalAmount * Math.pow(1 + growthRate, yearsElapsed));

    // Convert to annual based on frequency
    let annualAmount = 0;
    if (expense.frequency === "Monthly") {
      annualAmount = currentAmount * 12;
    } else if (expense.frequency === "Annual" || expense.frequency === "Annually") {
      annualAmount = currentAmount;
    } else if (expense.frequency === "Weekly") {
      annualAmount = currentAmount * 52;
    } else if (expense.frequency === "Quarterly") {
      annualAmount = currentAmount * 4;
    } else if (expense.frequency === "OneTime") {
      // One-time expenses only apply in the year they occur
      if (yearsElapsed === 0) {
        annualAmount = currentAmount;
      }
    }

    totalAnnualExpenses += annualAmount;
  }

  return totalAnnualExpenses;
}

// ============ EQUITY CALCULATIONS ============

export interface PropertyEquity {
  propertyValue: number; // in cents
  totalDebt: number; // in cents
  equity: number; // in cents
  lvr: number; // as percentage (0-100)
}

/**
 * Calculate property equity at a given year
 */
export function calculatePropertyEquity(
  property: Property,
  loans: Loan[],
  valuations: PropertyValuation[],
  growthRates: GrowthRatePeriod[],
  targetYear: number,
  interestRateOffset: number = 0
): PropertyEquity {
  const propertyValue = calculatePropertyValue(property, valuations, growthRates, targetYear);

  const purchaseYear = getYear(property.purchaseDate);
  const yearsElapsed = targetYear - purchaseYear;

  let totalDebt = 0;
  for (const loan of loans) {
    const loanStartYear = getYear(loan.startDate);
    const loanYearsElapsed = targetYear - loanStartYear;

    if (loanYearsElapsed < 0) {
      continue; // Loan hasn't started yet
    }

    const remainingBalance = calculateRemainingBalance(loan, loanYearsElapsed, interestRateOffset);
    totalDebt += remainingBalance;
  }

  const equity = propertyValue - totalDebt;
  const lvr = propertyValue > 0 ? (totalDebt / propertyValue) * 100 : 0;

  return {
    propertyValue,
    totalDebt,
    equity,
    lvr,
  };
}

// ============ CASHFLOW CALCULATIONS ============

export interface PropertyCashflow {
  rentalIncome: number; // in cents (annual)
  loanRepayments: number; // in cents (annual)
  expenses: number; // in cents (annual)
  depreciation: number; // in cents (annual)
  netCashflow: number; // in cents (annual)
}

/**
 * Calculate property cashflow for a given year
 */
export function calculatePropertyCashflow(
  property: Property,
  loans: Loan[],
  rentalIncomes: RentalIncome[],
  expenses: ExpenseLog[],
  depreciation: DepreciationSchedule[],
  targetYear: number,
  expenseGrowthOverride?: number,
  interestRateOffset: number = 0
): PropertyCashflow {
  const rentalIncome = calculateRentalIncomeForYear(rentalIncomes, targetYear);
  const expensesAmount = calculateExpensesForYear(expenses, targetYear, expenseGrowthOverride);

  let loanRepayments = 0;
  for (const loan of loans) {
    const loanStartYear = getYear(loan.startDate);
    if (targetYear >= loanStartYear) {
      const repayment = calculateLoanRepayment(loan, interestRateOffset);
      loanRepayments += repayment.annualPayment;
    }
  }

  // Find applicable depreciation
  let depreciationAmount = 0;
  const sortedDepreciation = [...depreciation].sort((a, b) => getYear(b.asAtDate) - getYear(a.asAtDate));
  for (const dep of sortedDepreciation) {
    const depYear = getYear(dep.asAtDate);
    if (targetYear >= depYear) {
      depreciationAmount = dep.annualAmount;
      break;
    }
  }

  const netCashflow = rentalIncome - loanRepayments - expensesAmount;

  return {
    rentalIncome,
    loanRepayments,
    expenses: expensesAmount,
    depreciation: depreciationAmount,
    netCashflow,
  };
}

// ============ PORTFOLIO-LEVEL CALCULATIONS ============

export interface PortfolioSummary {
  totalProperties: number;
  totalValue: number; // in cents
  totalDebt: number; // in cents
  totalEquity: number; // in cents
  averageLVR: number; // as percentage
  totalAnnualIncome: number; // in cents
  totalAnnualExpenses: number; // in cents
  totalAnnualCashflow: number; // in cents
}

export interface PropertyProjection {
  propertyId: number;
  propertyName: string;
  year: number;
  value: number;
  debt: number;
  equity: number;
  cashflow: number;
  rentalIncome: number;
  expenses: number;
  loanRepayments: number;
}

export interface PortfolioProjection {
  year: number;
  totalValue: number;
  totalDebt: number;
  totalEquity: number;
  totalCashflow: number;
  totalRentalIncome: number;
  totalExpenses: number;
  totalLoanRepayments: number;
  properties: PropertyProjection[];
}

/**
 * Calculate portfolio summary for a given year
 */
export function calculatePortfolioSummary(propertiesData: any[], targetYear: number): PortfolioSummary {
  let totalValue = 0;
  let totalDebt = 0;
  let totalEquity = 0;
  let totalAnnualIncome = 0;
  let totalAnnualExpenses = 0;
  let totalAnnualCashflow = 0;
  let totalLVR = 0;

  for (const data of propertiesData) {
    const equity = calculatePropertyEquity(data.property, data.loans, data.valuations, data.growthRates, targetYear);
    const cashflow = calculatePropertyCashflow(data.property, data.loans, data.rental, data.expenses, data.depreciation, targetYear);

    totalValue += equity.propertyValue;
    totalDebt += equity.totalDebt;
    totalEquity += equity.equity;
    totalAnnualIncome += cashflow.rentalIncome;
    totalAnnualExpenses += cashflow.expenses + cashflow.loanRepayments;
    totalAnnualCashflow += cashflow.netCashflow;
    totalLVR += equity.lvr;
  }

  const averageLVR = propertiesData.length > 0 ? totalLVR / propertiesData.length : 0;

  return {
    totalProperties: propertiesData.length,
    totalValue,
    totalDebt,
    totalEquity,
    averageLVR,
    totalAnnualIncome,
    totalAnnualExpenses,
    totalAnnualCashflow,
  };
}

/**
 * Generate portfolio projections over multiple years
 * @param expenseGrowthOverride Optional override for all expense growth rates (as percentage, e.g., 3 for 3%)
 * @param interestRateOffset Optional override for interest rates (in basis points)
 */
export function generatePortfolioProjections(
  propertiesData: any[],
  startYear: number,
  endYear: number,
  expenseGrowthOverride?: number,
  interestRateOffset: number = 0
): PortfolioProjection[] {
  const projections: PortfolioProjection[] = [];

  for (let year = startYear; year <= endYear; year++) {
    let totalValue = 0;
    let totalDebt = 0;
    let totalEquity = 0;
    let totalCashflow = 0;
    let totalRentalIncome = 0;
    let totalExpenses = 0;
    let totalLoanRepayments = 0;
    const properties: PropertyProjection[] = [];

    for (const data of propertiesData) {
      const equity = calculatePropertyEquity(data.property, data.loans, data.valuations, data.growthRates, year, interestRateOffset);
      const cashflow = calculatePropertyCashflow(
        data.property,
        data.loans,
        data.rental,
        data.expenses,
        data.depreciation,
        year,
        expenseGrowthOverride,
        interestRateOffset
      );

      totalValue += equity.propertyValue;
      totalDebt += equity.totalDebt;
      totalEquity += equity.equity;
      totalCashflow += cashflow.netCashflow;
      totalRentalIncome += cashflow.rentalIncome;
      totalExpenses += cashflow.expenses;
      totalLoanRepayments += cashflow.loanRepayments;

      properties.push({
        propertyId: data.property.id,
        propertyName: data.property.nickname,
        year,
        value: equity.propertyValue,
        debt: equity.totalDebt,
        equity: equity.equity,
        cashflow: cashflow.netCashflow,
        rentalIncome: cashflow.rentalIncome,
        expenses: cashflow.expenses,
        loanRepayments: cashflow.loanRepayments,
      });
    }

    projections.push({
      year,
      totalValue,
      totalDebt,
      totalEquity,
      totalCashflow,
      totalRentalIncome,
      totalExpenses,
      totalLoanRepayments,
      properties,
    });
  }

  return projections;
}

// ============ COMPARISON CALCULATIONS ============

export interface InvestmentComparison {
  year: number;
  propertyEquity: number; // in cents
  shareEquity: number; // in cents
  difference: number; // in cents
}

/**
 * Calculate buy-and-hold share strategy for comparison
 * Assumes initial investment equal to property deposit and ongoing contributions equal to property cashflow
 */
export function calculateShareStrategy(initialInvestment: number, annualContribution: number, annualReturn: number, years: number): number {
  const returnRate = annualReturn / 100;
  let balance = initialInvestment;

  for (let i = 0; i < years; i++) {
    balance = balance * (1 + returnRate) + annualContribution;
  }

  return Math.round(balance);
}

/**
 * Generate comparison between property and share investment
 */
export function generateInvestmentComparison(
  propertiesData: any[],
  startYear: number,
  endYear: number,
  shareAnnualReturn: number = 7 // Default 7% annual return
): InvestmentComparison[] {
  const comparisons: InvestmentComparison[] = [];

  // Calculate initial deposit (equity at start)
  const initialEquity = calculatePortfolioSummary(propertiesData, startYear);
  const initialInvestment = initialEquity.totalEquity;

  for (let year = startYear; year <= endYear; year++) {
    const yearsElapsed = year - startYear;
    const portfolioSummary = calculatePortfolioSummary(propertiesData, year);

    // Simplified: assume average cashflow over the period as contribution
    const avgAnnualCashflow = portfolioSummary.totalAnnualCashflow;
    const shareEquity = calculateShareStrategy(initialInvestment, avgAnnualCashflow, shareAnnualReturn, yearsElapsed);

    comparisons.push({
      year,
      propertyEquity: portfolioSummary.totalEquity,
      shareEquity,
      difference: portfolioSummary.totalEquity - shareEquity,
    });
  }

  return comparisons;
}
