/**
 * Loan Calculation Utilities
 * Based on Mortgage Monster functionality
 */

export interface LoanParams {
  propertyValue: number; // in cents
  deposit: number; // in cents
  loanAmount: number; // in cents
  interestRate: number; // in basis points (5.5% = 550)
  termYears: number;
  repaymentFrequency: 'Monthly' | 'Fortnightly' | 'Weekly';
  loanStructure: 'InterestOnly' | 'PrincipalAndInterest';
  offsetBalance?: number; // in cents
  startDate: Date;
}

export interface ExtraPayment {
  amount: number; // in cents
  frequency: 'Monthly' | 'Fortnightly' | 'Weekly' | 'Annually';
  startDate: Date;
  endDate?: Date;
}

export interface LumpSum {
  amount: number; // in cents
  date: Date;
}

export interface InterestRateForecast {
  year: number;
  rate: number; // in basis points
}

export interface PropertyGrowthForecast {
  year: number;
  growthRate: number; // in basis points
}

export interface RepaymentProjection {
  year: number;
  month: number;
  date: Date;
  balance: number; // in cents
  principal: number; // in cents
  interest: number; // in cents
  payment: number; // in cents
  propertyValue: number; // in cents
  equity: number; // in cents
  lvr: number; // percentage
}

/**
 * Convert frequency to payments per year
 */
export function getPaymentsPerYear(frequency: string): number {
  switch (frequency) {
    case 'Weekly':
      return 52;
    case 'Fortnightly':
      return 26;
    case 'Monthly':
      return 12;
    case 'Annually':
      return 1;
    default:
      return 12;
  }
}

/**
 * Calculate monthly repayment for Principal & Interest loan
 */
export function calculatePIRepayment(
  principal: number, // in cents
  annualRate: number, // in basis points
  termYears: number,
  paymentsPerYear: number
): number {
  const rate = annualRate / 10000 / paymentsPerYear; // Convert basis points to decimal per period
  const numPayments = termYears * paymentsPerYear;
  
  if (rate === 0) return principal / numPayments;
  
  const payment = principal * (rate * Math.pow(1 + rate, numPayments)) / (Math.pow(1 + rate, numPayments) - 1);
  return Math.round(payment);
}

/**
 * Calculate interest-only repayment
 */
export function calculateIORepayment(
  principal: number, // in cents
  annualRate: number, // in basis points
  paymentsPerYear: number
): number {
  const rate = annualRate / 10000 / paymentsPerYear;
  return Math.round(principal * rate);
}

/**
 * Get interest rate for a specific year based on forecasts
 */
export function getInterestRateForYear(
  baseRate: number, // in basis points
  year: number,
  forecasts: InterestRateForecast[]
): number {
  if (!forecasts || forecasts.length === 0) return baseRate;
  
  // Find the applicable forecast for this year
  const sortedForecasts = [...forecasts].sort((a, b) => a.year - b.year);
  
  for (let i = sortedForecasts.length - 1; i >= 0; i--) {
    if (year >= sortedForecasts[i].year) {
      return sortedForecasts[i].rate;
    }
  }
  
  return baseRate;
}

/**
 * Get property growth rate for a specific year based on forecasts
 */
export function getGrowthRateForYear(
  baseRate: number, // in basis points
  year: number,
  forecasts: PropertyGrowthForecast[]
): number {
  if (!forecasts || forecasts.length === 0) return baseRate;
  
  const sortedForecasts = [...forecasts].sort((a, b) => a.year - b.year);
  
  for (let i = sortedForecasts.length - 1; i >= 0; i--) {
    if (year >= sortedForecasts[i].year) {
      return sortedForecasts[i].growthRate;
    }
  }
  
  return baseRate;
}

/**
 * Calculate loan projections over time with variable rates
 */
export function calculateLoanProjections(
  params: LoanParams,
  interestForecasts: InterestRateForecast[] = [],
  propertyForecasts: PropertyGrowthForecast[] = [],
  extraPayments: ExtraPayment[] = [],
  lumpSums: LumpSum[] = []
): RepaymentProjection[] {
  const projections: RepaymentProjection[] = [];
  const paymentsPerYear = getPaymentsPerYear(params.repaymentFrequency);
  const totalPayments = params.termYears * paymentsPerYear;
  
  let balance = params.loanAmount;
  let propertyValue = params.propertyValue;
  let currentDate = new Date(params.startDate);
  
  for (let i = 0; i < totalPayments; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get current interest rate
    const currentRate = getInterestRateForYear(params.interestRate, year, interestForecasts);
    
    // Calculate interest for this period
    const periodRate = currentRate / 10000 / paymentsPerYear;
    const effectiveBalance = Math.max(0, balance - (params.offsetBalance || 0));
    const interestPayment = Math.round(effectiveBalance * periodRate);
    
    // Calculate principal payment
    let principalPayment = 0;
    if (params.loanStructure === 'PrincipalAndInterest') {
      const payment = calculatePIRepayment(balance, currentRate, params.termYears - (i / paymentsPerYear), paymentsPerYear);
      principalPayment = payment - interestPayment;
    }
    
    // Add extra payments for this period
    let extraPayment = 0;
    extraPayments.forEach(extra => {
      if (currentDate >= extra.startDate && (!extra.endDate || currentDate <= extra.endDate)) {
        const extraPaymentsPerYear = getPaymentsPerYear(extra.frequency);
        // Check if this period aligns with the extra payment frequency
        if (i % Math.floor(paymentsPerYear / extraPaymentsPerYear) === 0) {
          extraPayment += extra.amount;
        }
      }
    });
    
    // Add lump sum payments for this period
    lumpSums.forEach(lump => {
      const lumpDate = new Date(lump.date);
      if (lumpDate.getFullYear() === year && lumpDate.getMonth() === month) {
        extraPayment += lump.amount;
      }
    });
    
    principalPayment += extraPayment;
    
    const totalPayment = interestPayment + principalPayment;
    balance = Math.max(0, balance - principalPayment);
    
    // Calculate property value growth
    const growthRate = getGrowthRateForYear(400, year, propertyForecasts); // Default 4%
    const annualGrowth = growthRate / 10000;
    if (i % paymentsPerYear === 0 && i > 0) {
      propertyValue = Math.round(propertyValue * (1 + annualGrowth));
    }
    
    const equity = propertyValue - balance;
    const lvr = balance > 0 ? (balance / propertyValue) * 100 : 0;
    
    projections.push({
      year,
      month,
      date: new Date(currentDate),
      balance,
      principal: principalPayment,
      interest: interestPayment,
      payment: totalPayment,
      propertyValue,
      equity,
      lvr,
    });
    
    // Advance to next payment period
    if (params.repaymentFrequency === 'Monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (params.repaymentFrequency === 'Fortnightly') {
      currentDate.setDate(currentDate.getDate() + 14);
    } else if (params.repaymentFrequency === 'Weekly') {
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    if (balance === 0) break;
  }
  
  return projections;
}

/**
 * Aggregate projections by year for charting
 */
export function aggregateByYear(projections: RepaymentProjection[]) {
  const yearlyData: Record<number, {
    year: number;
    totalPrincipal: number;
    totalInterest: number;
    totalPayment: number;
    endBalance: number;
    endPropertyValue: number;
    endEquity: number;
    avgLvr: number;
  }> = {};
  
  projections.forEach(p => {
    if (!yearlyData[p.year]) {
      yearlyData[p.year] = {
        year: p.year,
        totalPrincipal: 0,
        totalInterest: 0,
        totalPayment: 0,
        endBalance: p.balance,
        endPropertyValue: p.propertyValue,
        endEquity: p.equity,
        avgLvr: p.lvr,
      };
    }
    
    yearlyData[p.year].totalPrincipal += p.principal;
    yearlyData[p.year].totalInterest += p.interest;
    yearlyData[p.year].totalPayment += p.payment;
    yearlyData[p.year].endBalance = p.balance;
    yearlyData[p.year].endPropertyValue = p.propertyValue;
    yearlyData[p.year].endEquity = p.equity;
    yearlyData[p.year].avgLvr = p.lvr;
  });
  
  return Object.values(yearlyData).sort((a, b) => a.year - b.year);
}
