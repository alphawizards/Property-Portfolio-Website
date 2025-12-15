import { describe, it, expect } from 'vitest';
import * as calc from './calculations';
import { toDecimal } from './decimal-utils';

describe('Financial Calculations', () => {
  describe('calculatePrincipalAndInterestRepayment', () => {
    it('calculates correct monthly payment for standard loan', () => {
      // $500,000 loan, 6% interest, 30 years
      const loan = {
        id: 1,
        propertyId: 1,
        securityPropertyId: null,
        loanType: "PrincipalLoan",
        lenderName: "Test Bank",
        loanPurpose: "PropertyPurchase",
        loanStructure: "PrincipalAndInterest",
        startDate: new Date(),
        originalAmount: "50000000", // $500k in cents
        currentAmount: "50000000",
        interestRate: "600", // 6%
        remainingTermYears: 30,
        remainingIOPeriodYears: 0,
        repaymentFrequency: "Monthly",
        offsetBalance: "0",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = calc.calculatePrincipalAndInterestRepayment(loan as any);

      // Expected: ~$2,997.75 per month = 299775 cents
      // PMT = 500000 * (0.005 * (1.005)^360) / ((1.005)^360 - 1)
      // = 2997.75

      expect(result.monthlyPayment).toBeGreaterThan(299770);
      expect(result.monthlyPayment).toBeLessThan(299780);
    });

    it('handles zero interest rate', () => {
      const loan = {
        id: 1,
        propertyId: 1,
        securityPropertyId: null,
        loanType: "PrincipalLoan",
        lenderName: "Test Bank",
        loanPurpose: "PropertyPurchase",
        loanStructure: "PrincipalAndInterest",
        startDate: new Date(),
        originalAmount: "120000", // $1200
        currentAmount: "120000",
        interestRate: "0", // 0%
        remainingTermYears: 1, // 12 months
        remainingIOPeriodYears: 0,
        repaymentFrequency: "Monthly",
        offsetBalance: "0",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = calc.calculatePrincipalAndInterestRepayment(loan as any);
      // $1200 / 12 = $100 = 10000 cents
      expect(result.monthlyPayment).toBe(10000);
    });
  });

  describe('calculatePropertyEquity', () => {
    it('calculates simple equity without growth', () => {
      const property = {
        id: 1,
        userId: 1,
        portfolioId: null,
        scenarioId: null,
        nickname: "Test Prop",
        address: "123 St",
        state: "NSW",
        suburb: "Sydney",
        propertyType: "Residential",
        ownershipStructure: "Individual",
        linkedEntity: null,
        purchaseDate: new Date("2020-01-01"),
        purchasePrice: "50000000", // $500k
        saleDate: null,
        salePrice: null,
        status: "Actual",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const loans = [{
        id: 1,
        propertyId: 1,
        securityPropertyId: null,
        loanType: "PrincipalLoan",
        lenderName: "Bank",
        loanPurpose: "PropertyPurchase",
        loanStructure: "InterestOnly", // Balance stays same
        startDate: new Date("2020-01-01"),
        originalAmount: "40000000", // $400k
        currentAmount: "40000000",
        interestRate: "500",
        remainingTermYears: 30,
        remainingIOPeriodYears: 5,
        repaymentFrequency: "Monthly",
        offsetBalance: "0",
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      const result = calc.calculatePropertyEquity(
        property as any,
        loans as any[],
        [], // no valuations
        [], // no growth rates
        2020
      );

      expect(result.propertyValue).toBe(50000000);
      expect(result.totalDebt).toBe(40000000);
      expect(result.equity).toBe(10000000); // $100k
      expect(result.lvr).toBe(80); // 80%
    });
  });
});

// Helper function to convert dollars to cents for cleaner test cases
const D2C = (dollars: number) => Math.round(dollars * 100);

describe("calculateUsableEquity", () => {
  // Test Case 1: Positive Usable Equity (Happy Path)
  it("should calculate positive usable equity with default LVR (80%)", () => {
    const propertyValue = D2C(1_000_000); // $1,000,000
    const totalDebt = D2C(200_000); // $200,000
    // Max Borrowable: $800,000. Usable Equity: $800,000 - $200,000 = $600,000
    const expected = D2C(600_000);

    // We need to import calculateUsableEquity from calculations.ts
    // Since the existing file imports * as calc, we will use calc.calculateUsableEquity
    expect(calc.calculateUsableEquity(propertyValue, totalDebt)).toBe(expected);
  });

  // Test Case 2: Zero Usable Equity (Debt equals Max Borrowable)
  it("should return zero when debt equals the max borrowable amount", () => {
    const propertyValue = D2C(1_000_000); // $1,000,000
    const totalDebt = D2C(800_000); // $800,000 (80% LVR)
    const expected = 0;

    expect(calc.calculateUsableEquity(propertyValue, totalDebt)).toBe(expected);
  });

  // Test Case 3: Negative Usable Equity (Debt exceeds Max Borrowable)
  it("should return zero when debt exceeds the max borrowable amount", () => {
    const propertyValue = D2C(1_000_000); // $1,000,000
    const totalDebt = D2C(900_000); // $900,000
    // Max Borrowable: $800,000. Usable Equity: -$100,000. Should be capped at 0.
    const expected = 0;

    expect(calc.calculateUsableEquity(propertyValue, totalDebt)).toBe(expected);
  });

  // Test Case 4: Custom maxLVR (90%)
  it("should calculate usable equity with a custom maxLVR (90%)", () => {
    const propertyValue = D2C(1_000_000); // $1,000,000
    const totalDebt = D2C(100_000); // $100,000
    const customLVR = 0.90;
    // Max Borrowable: $900,000. Usable Equity: $900,000 - $100,000 = $800,000
    const expected = D2C(800_000);

    expect(calc.calculateUsableEquity(propertyValue, totalDebt, customLVR)).toBe(expected);
  });

  // Test Case 5: Zero Property Value
  it("should return zero when property value is zero", () => {
    const propertyValue = 0;
    const totalDebt = D2C(100_000);
    const expected = 0;

    expect(calc.calculateUsableEquity(propertyValue, totalDebt)).toBe(expected);
  });

  // Test Case 6: Zero Debt
  it("should return max borrowable amount when total debt is zero", () => {
    const propertyValue = D2C(500_000); // $500,000
    const totalDebt = 0;
    // Max Borrowable: $500,000 * 0.80 = $400,000
    const expected = D2C(400_000);

    expect(calc.calculateUsableEquity(propertyValue, totalDebt)).toBe(expected);
  });
});
