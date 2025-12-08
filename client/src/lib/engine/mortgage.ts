/**
 * Premium Fintech Mortgage Calculator
 * 
 * Zero-latency, client-side financial calculation engine.
 * Uses Decimal.js for precise financial mathematics.
 * 
 * Key Features:
 * - Daily interest accrual (Australian standard)
 * - Support for P&I and Interest-Only loans
 * - Multiple repayment frequencies
 * - Complete amortization schedules
 * - LVR and equity calculations
 * - Regional variations (AU/US/UK)
 */

import Decimal from 'decimal.js';
import type {
  MortgageInput,
  RepaymentBreakdown,
  AmortizationSchedule,
  AmortizationEntry,
  LVRCalculation,
  GrowthForecast,
  CashflowProjection,
  TaxCalculation,
  ComparisonScenario,
  ScenarioComparison,
  Region,
} from './types';
import { REGIONAL_PARAMS, FREQUENCY_MULTIPLIERS, calculateLMI } from './constants';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class MortgageCalculator {
  /**
   * Calculate monthly repayment amount
   * 
   * Uses daily interest accrual for Australian loans.
   * For US loans, uses monthly compounding.
   * 
   * @param principal - Loan amount in cents
   * @param annualRate - Interest rate as percentage (e.g., 6.5)
   * @param termYears - Loan term in years
   * @param region - AU, US, or UK
   * @returns Monthly repayment in cents
   */
  static calculateMonthlyRepayment(
    principal: number,
    annualRate: number,
    termYears: number,
    region: Region = 'AU'
  ): number {
    const p = new Decimal(principal);
    const r = new Decimal(annualRate).div(100);
    const n = termYears * 12;
    const params = REGIONAL_PARAMS[region];

    let monthlyRate: Decimal;

    if (params.compoundingFrequency === 'daily') {
      // Australian method: Daily interest accrual
      const dailyRate = r.div(params.daysPerYear);
      // Approximate monthly rate from daily: (1 + daily)^(365/12) - 1
      monthlyRate = new Decimal(1)
        .plus(dailyRate)
        .pow(params.daysPerYear / 12)
        .minus(1);
    } else {
      // US/Monthly compounding
      monthlyRate = r.div(12);
    }

    // Standard amortization formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const numerator = p
      .mul(monthlyRate)
      .mul(new Decimal(1).plus(monthlyRate).pow(n));
    
    const denominator = new Decimal(1)
      .plus(monthlyRate)
      .pow(n)
      .minus(1);

    const monthlyPayment = numerator.div(denominator);

    return Math.round(monthlyPayment.toNumber());
  }

  /**
   * Calculate repayment for specific frequency
   */
  static calculateRepayment(input: MortgageInput): number {
    const monthlyPayment = this.calculateMonthlyRepayment(
      input.principal,
      input.annualRate,
      input.termYears,
      input.region
    );

    // For Interest Only, calculate just the interest portion
    if (input.structure === 'InterestOnly') {
      return this.calculateInterestOnlyRepayment(
        input.principal,
        input.annualRate,
        input.frequency,
        input.region
      );
    }

    // Convert monthly to requested frequency
    const multiplier = FREQUENCY_MULTIPLIERS[input.frequency];
    return Math.round((monthlyPayment * 12) / multiplier);
  }

  /**
   * Calculate interest-only repayment
   */
  private static calculateInterestOnlyRepayment(
    principal: number,
    annualRate: number,
    frequency: MortgageInput['frequency'],
    region: Region
  ): number {
    const p = new Decimal(principal);
    const r = new Decimal(annualRate).div(100);
    const params = REGIONAL_PARAMS[region];
    const paymentsPerYear = FREQUENCY_MULTIPLIERS[frequency];

    let periodRate: Decimal;

    if (params.compoundingFrequency === 'daily') {
      // Daily interest, paid at specified frequency
      const dailyRate = r.div(params.daysPerYear);
      const daysPerPeriod = params.daysPerYear / paymentsPerYear;
      periodRate = dailyRate.mul(daysPerPeriod);
    } else {
      periodRate = r.div(paymentsPerYear);
    }

    const interestPayment = p.mul(periodRate);
    return Math.round(interestPayment.toNumber());
  }

  /**
   * Generate complete amortization schedule
   */
  static generateAmortizationSchedule(input: MortgageInput): AmortizationSchedule {
    const entries: AmortizationEntry[] = [];
    const monthlyPayment = this.calculateMonthlyRepayment(
      input.principal,
      input.annualRate,
      input.termYears,
      input.region
    );

    let balance = new Decimal(input.principal);
    let cumulativePrincipal = new Decimal(0);
    let cumulativeInterest = new Decimal(0);
    const totalMonths = input.termYears * 12;
    const params = REGIONAL_PARAMS[input.region];
    const annualRate = new Decimal(input.annualRate).div(100);

    // Calculate monthly interest rate
    let monthlyRate: Decimal;
    if (params.compoundingFrequency === 'daily') {
      const dailyRate = annualRate.div(params.daysPerYear);
      monthlyRate = new Decimal(1)
        .plus(dailyRate)
        .pow(params.daysPerYear / 12)
        .minus(1);
    } else {
      monthlyRate = annualRate.div(12);
    }

    const startDate = new Date();

    for (let month = 1; month <= totalMonths; month++) {
      // Calculate interest for this period
      const interest = balance.mul(monthlyRate);
      
      // Calculate principal payment
      let principalPayment: Decimal;
      if (input.structure === 'InterestOnly') {
        principalPayment = new Decimal(0);
      } else {
        principalPayment = new Decimal(monthlyPayment).minus(interest);
      }

      // Update balance
      balance = balance.minus(principalPayment);
      cumulativePrincipal = cumulativePrincipal.plus(principalPayment);
      cumulativeInterest = cumulativeInterest.plus(interest);

      // Create payment date
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + month);

      entries.push({
        month,
        date: paymentDate,
        payment: Math.round(input.structure === 'InterestOnly' 
          ? interest.toNumber() 
          : monthlyPayment),
        principal: Math.round(principalPayment.toNumber()),
        interest: Math.round(interest.toNumber()),
        balance: Math.max(0, Math.round(balance.toNumber())),
        cumulativePrincipal: Math.round(cumulativePrincipal.toNumber()),
        cumulativeInterest: Math.round(cumulativeInterest.toNumber()),
      });

      // Break if loan is paid off
      if (balance.lte(0)) break;
    }

    return {
      entries,
      totalPaid: Math.round(cumulativePrincipal.plus(cumulativeInterest).toNumber()),
      totalInterest: Math.round(cumulativeInterest.toNumber()),
      totalPrincipal: Math.round(cumulativePrincipal.toNumber()),
    };
  }

  /**
   * Calculate LVR and equity
   */
  static calculateLVR(loanAmount: number, propertyValue: number): LVRCalculation {
    const loan = new Decimal(loanAmount);
    const value = new Decimal(propertyValue);
    
    const lvr = loan.div(value).mul(100);
    const equity = value.minus(loan);
    const requiresLMI = lvr.gt(80);
    const lmi = calculateLMI(loanAmount, lvr.toNumber());

    return {
      loanAmount,
      propertyValue,
      lvr: Math.round(lvr.toNumber() * 100) / 100, // 2 decimal places
      equity: Math.round(equity.toNumber()),
      lmi,
      requiresLMI,
    };
  }

  /**
   * Project property growth
   */
  static projectGrowth(
    currentValue: number,
    annualGrowthRate: number,
    years: number
  ): GrowthForecast {
    const valueArray: number[] = [];
    const yearArray: number[] = [];
    const growthRate = new Decimal(annualGrowthRate).div(100);
    let value = new Decimal(currentValue);

    for (let year = 0; year <= years; year++) {
      yearArray.push(year);
      valueArray.push(Math.round(value.toNumber()));
      
      // Compound growth
      value = value.mul(new Decimal(1).plus(growthRate));
    }

    const finalValue = valueArray[valueArray.length - 1];
    const totalGrowth = finalValue - currentValue;
    const totalGrowthPercent = ((totalGrowth / currentValue) * 100);

    return {
      years: yearArray,
      values: valueArray,
      growthRate: annualGrowthRate,
      totalGrowth,
      totalGrowthPercent: Math.round(totalGrowthPercent * 100) / 100,
    };
  }

  /**
   * Project cashflow over time
   */
  static projectCashflow(
    loanAmount: number,
    interestRate: number,
    termYears: number,
    rentalIncome: number,      // Annual in cents
    expenses: number,           // Annual in cents
    structure: MortgageInput['structure'],
    region: Region = 'AU',
    depreciation?: number       // Annual depreciation
  ): CashflowProjection[] {
    const projections: CashflowProjection[] = [];
    const monthlyRepayment = this.calculateMonthlyRepayment(
      loanAmount,
      interestRate,
      termYears,
      region
    );

    const monthlyRental = rentalIncome / 12;
    const monthlyExpenses = expenses / 12;
    const monthlyDepreciation = depreciation ? depreciation / 12 : 0;
    
    let cumulativeCashflow = 0;
    const startDate = new Date();

    for (let month = 1; month <= termYears * 12; month++) {
      const netCashflow = monthlyRental - monthlyExpenses - monthlyRepayment;
      cumulativeCashflow += netCashflow;

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + month);

      projections.push({
        month,
        date: paymentDate,
        rental: Math.round(monthlyRental),
        expenses: Math.round(monthlyExpenses),
        loanRepayment: Math.round(monthlyRepayment),
        netCashflow: Math.round(netCashflow),
        cumulativeCashflow: Math.round(cumulativeCashflow),
        depreciation: monthlyDepreciation ? Math.round(monthlyDepreciation) : undefined,
      });
    }

    return projections;
  }

  /**
   * Compare two loan scenarios
   */
  static compareScenarios(
    scenario1: MortgageInput,
    scenario2: MortgageInput
  ): ScenarioComparison {
    const schedule1 = this.generateAmortizationSchedule(scenario1);
    const schedule2 = this.generateAmortizationSchedule(scenario2);
    
    const monthlyPayment1 = this.calculateMonthlyRepayment(
      scenario1.principal,
      scenario1.annualRate,
      scenario1.termYears,
      scenario1.region
    );

    const monthlyPayment2 = this.calculateMonthlyRepayment(
      scenario2.principal,
      scenario2.annualRate,
      scenario2.termYears,
      scenario2.region
    );

    const scenarios: [ComparisonScenario, ComparisonScenario] = [
      {
        name: 'Scenario 1',
        loanAmount: scenario1.principal,
        interestRate: scenario1.annualRate,
        termYears: scenario1.termYears,
        structure: scenario1.structure,
        totalCost: schedule1.totalPaid,
        totalInterest: schedule1.totalInterest,
        monthlyRepayment: monthlyPayment1,
      },
      {
        name: 'Scenario 2',
        loanAmount: scenario2.principal,
        interestRate: scenario2.annualRate,
        termYears: scenario2.termYears,
        structure: scenario2.structure,
        totalCost: schedule2.totalPaid,
        totalInterest: schedule2.totalInterest,
        monthlyRepayment: monthlyPayment2,
      },
    ];

    const savings = schedule1.totalPaid - schedule2.totalPaid;
    const savingsPercent = (savings / schedule1.totalPaid) * 100;

    let recommendation: string;
    if (savings > 0) {
      recommendation = `Scenario 2 saves $${(savings / 100).toFixed(2)} (${savingsPercent.toFixed(1)}%) over the life of the loan.`;
    } else if (savings < 0) {
      recommendation = `Scenario 1 saves $${(Math.abs(savings) / 100).toFixed(2)} (${Math.abs(savingsPercent).toFixed(1)}%) over the life of the loan.`;
    } else {
      recommendation = 'Both scenarios result in the same total cost.';
    }

    return {
      scenarios,
      savings,
      savingsPercent,
      recommendation,
    };
  }

  /**
   * Calculate tax impact of investment property
   */
  static calculateTax(
    rentalIncome: number,      // Annual
    expenses: number,           // Annual deductible expenses
    loanInterest: number,       // Annual interest paid
    depreciation: number,       // Annual depreciation
    marginalTaxRate: number     // As percentage (e.g., 37 for 37%)
  ): TaxCalculation {
    const totalDeductions = expenses + loanInterest + depreciation;
    const taxableIncome = rentalIncome - totalDeductions;
    const taxRate = new Decimal(marginalTaxRate).div(100);
    
    // If negative, it's a tax deduction (benefit)
    const taxImpact = new Decimal(taxableIncome).mul(taxRate);
    const taxSavings = taxImpact.lt(0) ? Math.abs(taxImpact.toNumber()) : 0;
    const effectiveCashflow = rentalIncome - expenses - loanInterest + taxSavings;

    return {
      rentalIncome,
      deductibleExpenses: totalDeductions,
      loanInterest,
      depreciation,
      taxableIncome: Math.round(taxableIncome),
      taxSavings: Math.round(taxSavings),
      effectiveCashflow: Math.round(effectiveCashflow),
    };
  }
}
