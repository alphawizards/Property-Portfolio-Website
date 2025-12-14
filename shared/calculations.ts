/**
 * Financial Calculations Engine for Property Portfolio Analysis
 *
 * All monetary values are in cents (unless otherwise specified, but logic assumes consistent units)
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
import { Decimal, toDecimal, toCents } from "./decimal-utils";

// ============ UTILITY FUNCTIONS ============

/**
 * Convert basis points to decimal rate
 * Example: 550 basis points = 0.055 (5.5%)
 */
function basisPointsToRate(basisPoints: number | string | Decimal): Decimal {
  return toDecimal(basisPoints).div(10000);
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number | string | Decimal): number {
  return toDecimal(cents).div(100).toNumber();
}

/**
 * Convert dollars to cents for storage
 */
export function dollarsToCents(dollars: number | string | Decimal): number {
  return toDecimal(dollars).times(100).round().toNumber();
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
function compoundGrowth(principal: Decimal, rate: Decimal, years: number): Decimal {
  return principal.times(new Decimal(1).plus(rate).pow(years));
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
  const currentAmount = toDecimal(loan.currentAmount);
  const annualRate = basisPointsToRate(toDecimal(loan.interestRate).plus(rateOffset));
  const monthlyRate = annualRate.div(12);
  const interestPortion = currentAmount.times(monthlyRate).round();

  return {
    monthlyPayment: interestPortion.toNumber(),
    annualPayment: interestPortion.times(12).toNumber(),
    principalPortion: 0,
    interestPortion: interestPortion.toNumber(),
  };
}

/**
 * Calculate Principal & Interest loan repayment using amortization formula
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculatePrincipalAndInterestRepayment(loan: Loan, rateOffset: number = 0): LoanRepayment {
  const currentAmount = toDecimal(loan.currentAmount);
  const annualRate = basisPointsToRate(toDecimal(loan.interestRate).plus(rateOffset));
  const monthlyRate = annualRate.div(12);
  const numberOfPayments = loan.remainingTermYears * 12;

  if (monthlyRate.lte(0)) { // Safety check for negative rates or zero
    // No interest case
    const monthlyPayment = currentAmount.div(numberOfPayments).round();
    return {
      monthlyPayment: monthlyPayment.toNumber(),
      annualPayment: monthlyPayment.times(12).toNumber(),
      principalPortion: monthlyPayment.toNumber(),
      interestPortion: 0,
    };
  }

  // (1 + r)^n
  const ratePow = new Decimal(1).plus(monthlyRate).pow(numberOfPayments);

  // P * r * (1+r)^n
  const numerator = currentAmount.times(monthlyRate).times(ratePow);

  // (1+r)^n - 1
  const denominator = ratePow.minus(1);

  const monthlyPayment = numerator.div(denominator).round();
  const interestPortion = currentAmount.times(monthlyRate).round();
  const principalPortion = monthlyPayment.minus(interestPortion);

  return {
    monthlyPayment: monthlyPayment.toNumber(),
    annualPayment: monthlyPayment.times(12).toNumber(),
    principalPortion: principalPortion.toNumber(),
    interestPortion: interestPortion.toNumber(),
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
  const currentAmount = toDecimal(loan.currentAmount);

  if (loan.loanStructure === "InterestOnly") {
    // Interest only loans don't reduce principal
    return currentAmount.toNumber();
  }

  const annualRate = basisPointsToRate(toDecimal(loan.interestRate).plus(rateOffset));
  const monthlyRate = annualRate.div(12);
  const totalPayments = loan.remainingTermYears * 12;
  const paymentsMade = yearsElapsed * 12;

  if (paymentsMade >= totalPayments) {
    return 0; // Loan fully paid off
  }

  const repayment = calculatePrincipalAndInterestRepayment(loan, rateOffset);
  const monthlyPayment = toDecimal(repayment.monthlyPayment);

  // Calculate remaining balance using amortization formula
  const remainingPayments = totalPayments - paymentsMade;

  if (monthlyRate.lte(0)) {
    return currentAmount.minus(monthlyPayment.times(paymentsMade)).round().toNumber();
  }

  // Balance = P * ((1+r)^N - (1+r)^p) / ((1+r)^N - 1)
  // OR simpler: Balance using remaining payments formula:
  // B = PMT * [(1 - (1+r)^-n) / r] where n is remaining payments

  const onePlusR = new Decimal(1).plus(monthlyRate);
  const numerator = monthlyPayment.times(onePlusR.pow(remainingPayments).minus(1));
  const denominator = monthlyRate.times(onePlusR.pow(remainingPayments));

  const remainingBalance = numerator.div(denominator).round();

  return remainingBalance.toNumber();
}

// ============ PROPERTY VALUE PROJECTIONS ============

/**
 * Get the applicable growth rate for a given year
 */
function getGrowthRateForYear(year: number, growthRates: GrowthRatePeriod[]): Decimal {
  // Sort by start year
  const sorted = [...growthRates].sort((a, b) => a.startYear - b.startYear);

  for (const period of sorted) {
    if (year >= period.startYear && (period.endYear === null || year <= period.endYear)) {
      return basisPointsToRate(period.growthRate);
    }
  }

  // Default to 0% growth if no period matches
  return new Decimal(0);
}

/**
 * Calculate property value at a future year
 */
export function calculatePropertyValue(property: Property, valuations: PropertyValuation[], growthRates: GrowthRatePeriod[], targetYear: number): number {
  const purchaseYear = getYear(property.purchaseDate);

  // Find the most recent valuation before or at target year
  const sortedValuations = [...valuations].sort((a, b) => getYear(b.valuationDate) - getYear(a.valuationDate));

  let baseValue = toDecimal(property.purchasePrice);
  let baseYear = purchaseYear;

  for (const valuation of sortedValuations) {
    const valuationYear = getYear(valuation.valuationDate);
    if (valuationYear <= targetYear) {
      baseValue = toDecimal(valuation.value);
      baseYear = valuationYear;
      break;
    }
  }

  if (targetYear <= baseYear) {
    return baseValue.toNumber();
  }

  // Apply growth rates year by year
  let currentValue = baseValue;
  for (let year = baseYear + 1; year <= targetYear; year++) {
    const growthRate = getGrowthRateForYear(year, growthRates);
    currentValue = currentValue.times(new Decimal(1).plus(growthRate)).round();
  }

  return currentValue.toNumber();
}

// ============ RENTAL INCOME PROJECTIONS ============

/**
 * Calculate annual rental income for a given year
 */
export function calculateRentalIncomeForYear(rentalIncomes: RentalIncome[], targetYear: number): number {
  let totalAnnualIncome = new Decimal(0);

  for (const income of rentalIncomes) {
    const startYear = getYear(income.startDate);
    const endYear = income.endDate ? getYear(income.endDate) : null;

    // Check if this income stream is active in the target year
    if (targetYear >= startYear && (endYear === null || targetYear <= endYear)) {
      const yearsElapsed = targetYear - startYear;
      const growthRate = basisPointsToRate(income.growthRate);
      const amount = toDecimal(income.amount);
      const currentAmount = amount.times(new Decimal(1).plus(growthRate).pow(yearsElapsed)).round();

      // Convert to annual based on frequency
      let annualAmount = new Decimal(0);
      if (income.frequency === "Monthly") {
        annualAmount = currentAmount.times(12);
      } else if (income.frequency === "Weekly") {
        annualAmount = currentAmount.times(52);
      } else if (income.frequency === "Fortnightly") {
        annualAmount = currentAmount.times(26);
      } else if (income.frequency === "Annual" || income.frequency === "Annually") {
        annualAmount = currentAmount;
      }

      totalAnnualIncome = totalAnnualIncome.plus(annualAmount);
    }
  }

  return totalAnnualIncome.toNumber();
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
  let totalAnnualExpenses = new Decimal(0);

  for (const expense of expenses) {
    const startYear = getYear(expense.date);
    const yearsElapsed = targetYear - startYear;

    if (yearsElapsed < 0) {
      continue; // Expense hasn't started yet
    }

    // Use override if provided, otherwise use expense-specific growth rate
    const growthRate = expenseGrowthOverride !== undefined
      ? new Decimal(expenseGrowthOverride).div(100) // Convert percentage to rate
      : basisPointsToRate(expense.growthRate);

    const totalAmount = toDecimal(expense.totalAmount);
    const currentAmount = totalAmount.times(new Decimal(1).plus(growthRate).pow(yearsElapsed)).round();

    // Convert to annual based on frequency
    let annualAmount = new Decimal(0);
    if (expense.frequency === "Monthly") {
      annualAmount = currentAmount.times(12);
    } else if (expense.frequency === "Annual" || expense.frequency === "Annually") {
      annualAmount = currentAmount;
    } else if (expense.frequency === "Weekly") {
      annualAmount = currentAmount.times(52);
    } else if (expense.frequency === "Quarterly") {
      annualAmount = currentAmount.times(4);
    } else if (expense.frequency === "OneTime") {
      // One-time expenses only apply in the year they occur
      if (yearsElapsed === 0) {
        annualAmount = currentAmount;
      }
    }

    totalAnnualExpenses = totalAnnualExpenses.plus(annualAmount);
  }

  return totalAnnualExpenses.toNumber();
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
  const propertyValueDecimal = toDecimal(propertyValue);

  const purchaseYear = getYear(property.purchaseDate);
  // const yearsElapsed = targetYear - purchaseYear; // Not used directly

  let totalDebt = new Decimal(0);
  for (const loan of loans) {
    const loanStartYear = getYear(loan.startDate);
    const loanYearsElapsed = targetYear - loanStartYear;

    if (loanYearsElapsed < 0) {
      continue; // Loan hasn't started yet
    }

    const remainingBalance = calculateRemainingBalance(loan, loanYearsElapsed, interestRateOffset);
    totalDebt = totalDebt.plus(remainingBalance);
  }

  const equity = propertyValueDecimal.minus(totalDebt);

  const lvr = propertyValueDecimal.gt(0)
    ? totalDebt.div(propertyValueDecimal).times(100).toNumber()
    : 0;

  return {
    propertyValue,
    totalDebt: totalDebt.toNumber(),
    equity: equity.toNumber(),
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

  let loanRepayments = new Decimal(0);
  for (const loan of loans) {
    const loanStartYear = getYear(loan.startDate);
    if (targetYear >= loanStartYear) {
      const repayment = calculateLoanRepayment(loan, interestRateOffset);
      loanRepayments = loanRepayments.plus(repayment.annualPayment);
    }
  }

  // Find applicable depreciation
  let depreciationAmount = new Decimal(0);
  const sortedDepreciation = [...depreciation].sort((a, b) => getYear(b.asAtDate) - getYear(a.asAtDate));
  for (const dep of sortedDepreciation) {
    const depYear = getYear(dep.asAtDate);
    if (targetYear >= depYear) {
      depreciationAmount = toDecimal(dep.annualAmount);
      break;
    }
  }

  const netCashflow = toDecimal(rentalIncome)
    .minus(loanRepayments)
    .minus(expensesAmount);

  return {
    rentalIncome,
    loanRepayments: loanRepayments.toNumber(),
    expenses: expensesAmount,
    depreciation: depreciationAmount.toNumber(),
    netCashflow: netCashflow.toNumber(),
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
  let totalValue = new Decimal(0);
  let totalDebt = new Decimal(0);
  let totalEquity = new Decimal(0);
  let totalAnnualIncome = new Decimal(0);
  let totalAnnualExpenses = new Decimal(0);
  let totalAnnualCashflow = new Decimal(0);
  let totalLVR = new Decimal(0);

  for (const data of propertiesData) {
    const equity = calculatePropertyEquity(data.property, data.loans, data.valuations, data.growthRates, targetYear);
    const cashflow = calculatePropertyCashflow(data.property, data.loans, data.rental, data.expenses, data.depreciation, targetYear);

    totalValue = totalValue.plus(equity.propertyValue);
    totalDebt = totalDebt.plus(equity.totalDebt);
    totalEquity = totalEquity.plus(equity.equity);
    totalAnnualIncome = totalAnnualIncome.plus(cashflow.rentalIncome);
    totalAnnualExpenses = totalAnnualExpenses.plus(cashflow.expenses).plus(cashflow.loanRepayments);
    totalAnnualCashflow = totalAnnualCashflow.plus(cashflow.netCashflow);
    totalLVR = totalLVR.plus(equity.lvr);
  }

  const averageLVR = propertiesData.length > 0 ? totalLVR.div(propertiesData.length).toNumber() : 0;

  return {
    totalProperties: propertiesData.length,
    totalValue: totalValue.toNumber(),
    totalDebt: totalDebt.toNumber(),
    totalEquity: totalEquity.toNumber(),
    averageLVR,
    totalAnnualIncome: totalAnnualIncome.toNumber(),
    totalAnnualExpenses: totalAnnualExpenses.toNumber(),
    totalAnnualCashflow: totalAnnualCashflow.toNumber(),
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
    let totalValue = new Decimal(0);
    let totalDebt = new Decimal(0);
    let totalEquity = new Decimal(0);
    let totalCashflow = new Decimal(0);
    let totalRentalIncome = new Decimal(0);
    let totalExpenses = new Decimal(0);
    let totalLoanRepayments = new Decimal(0);
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

      totalValue = totalValue.plus(equity.propertyValue);
      totalDebt = totalDebt.plus(equity.totalDebt);
      totalEquity = totalEquity.plus(equity.equity);
      totalCashflow = totalCashflow.plus(cashflow.netCashflow);
      totalRentalIncome = totalRentalIncome.plus(cashflow.rentalIncome);
      totalExpenses = totalExpenses.plus(cashflow.expenses);
      totalLoanRepayments = totalLoanRepayments.plus(cashflow.loanRepayments);

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
      totalValue: totalValue.toNumber(),
      totalDebt: totalDebt.toNumber(),
      totalEquity: totalEquity.toNumber(),
      totalCashflow: totalCashflow.toNumber(),
      totalRentalIncome: totalRentalIncome.toNumber(),
      totalExpenses: totalExpenses.toNumber(),
      totalLoanRepayments: totalLoanRepayments.toNumber(),
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
export function calculateShareStrategy(initialInvestment: number | string | Decimal, annualContribution: number | string | Decimal, annualReturn: number, years: number): number {
  const returnRate = new Decimal(annualReturn).div(100);
  let balance = toDecimal(initialInvestment);
  const contribution = toDecimal(annualContribution);

  for (let i = 0; i < years; i++) {
    // balance = balance * (1 + returnRate) + annualContribution;
    balance = balance.times(new Decimal(1).plus(returnRate)).plus(contribution);
  }

  return balance.round().toNumber();
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
