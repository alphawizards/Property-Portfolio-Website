/**
 * Mock Australian Property Data
 * 
 * Comprehensive test data for demonstration purposes
 * Includes realistic Australian property scenarios with typical costs, yields, and growth rates
 */

export const mockUser = {
  id: 1,
  openId: "mock-user-123",
  name: "John Smith",
  email: "john.smith@example.com",
  role: "user" as const,
  subscriptionTier: "PREMIUM_MONTHLY" as const,
  subscriptionStatus: "active" as const,
  createdAt: new Date("2020-01-01"),
  lastSignedIn: new Date(),
};

export const mockProperties = [
  {
    id: 1,
    userId: 1,
    nickname: "Brisbane CBD Apartment",
    address: "Unit 507, 123 Queen Street, Brisbane QLD 4000",
    state: "Queensland",
    suburb: "Brisbane City",
    propertyType: "Residential",
    ownershipStructure: "Trust",
    linkedEntity: "Smith Family Trust",
    purchaseDate: new Date("2020-06-15"),
    purchasePrice: 65000000, // $650,000 in cents
    status: "Actual",
    createdAt: new Date("2020-06-15"),
    
    // Related data
    ownership: [
      { id: 1, propertyId: 1, ownerName: "John Smith", ownershipPercentage: 5000 },
      { id: 2, propertyId: 1, ownerName: "Jane Smith", ownershipPercentage: 5000 },
    ],
    
    purchaseCosts: {
      id: 1,
      propertyId: 1,
      stampDuty: 2400000, // $24,000
      legalFees: 200000, // $2,000
      inspectionFees: 60000, // $600
      otherCosts: 150000, // $1,500
    },
    
    usagePeriods: [
      {
        id: 1,
        propertyId: 1,
        startDate: new Date("2020-07-01"),
        endDate: null,
        usageType: "Investment",
        isCurrentPeriod: true,
      },
    ],
    
    loans: [
      {
        id: 1,
        propertyId: 1,
        loanType: "Principal & Interest",
        lender: "Commonwealth Bank",
        originalAmount: 52000000, // $520,000
        currentBalance: 48000000, // $480,000
        interestRate: 565, // 5.65%
        startDate: new Date("2020-06-15"),
        loanTerm: 30,
        repaymentFrequency: "Monthly",
        isInterestOnly: false,
      },
    ],
    
    valuations: [
      {
        id: 1,
        propertyId: 1,
        valuationDate: new Date("2020-06-15"),
        estimatedValue: 65000000,
        valuationMethod: "Purchase Price",
      },
      {
        id: 2,
        propertyId: 1,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 78000000, // $780,000
        valuationMethod: "Market Estimate",
      },
    ],
    
    growthRates: [
      {
        id: 1,
        propertyId: 1,
        startDate: new Date("2020-06-15"),
        endDate: null,
        annualGrowthRate: 475, // 4.75%
        isCurrentPeriod: true,
      },
    ],
    
    rental: [
      {
        id: 1,
        propertyId: 1,
        weeklyRent: 65000, // $650/week
        startDate: new Date("2020-07-01"),
        endDate: null,
        isCurrentRent: true,
      },
    ],
    
    expenses: [
      {
        id: 1,
        propertyId: 1,
        year: 2024,
        totalExpenses: 1520000, // $15,200
        breakdown: [
          { id: 1, expenseLogId: 1, category: "Council Rates", amount: 280000, frequency: "Annually" },
          { id: 2, expenseLogId: 1, category: "Water Rates", amount: 140000, frequency: "Annually" },
          { id: 3, expenseLogId: 1, category: "Strata Fees", amount: 600000, frequency: "Annually" },
          { id: 4, expenseLogId: 1, category: "Property Management", amount: 280000, frequency: "Annually" },
          { id: 5, expenseLogId: 1, category: "Insurance", amount: 120000, frequency: "Annually" },
          { id: 6, expenseLogId: 1, category: "Repairs & Maintenance", amount: 100000, frequency: "Annually" },
        ],
      },
    ],
    
    depreciation: [
      {
        id: 1,
        propertyId: 1,
        asAtDate: new Date("2024-07-01"),
        annualAmount: 950000, // $9,500
      },
    ],
  },
  
  {
    id: 2,
    userId: 1,
    nickname: "Sydney Parramatta House",
    address: "45 George Street, Parramatta NSW 2150",
    state: "New South Wales",
    suburb: "Parramatta",
    propertyType: "Residential",
    ownershipStructure: "Company",
    linkedEntity: "Smith Property Holdings Pty Ltd",
    purchaseDate: new Date("2021-03-20"),
    purchasePrice: 125000000, // $1,250,000
    status: "Actual",
    createdAt: new Date("2021-03-20"),
    
    ownership: [
      { id: 3, propertyId: 2, ownerName: "Smith Property Holdings Pty Ltd", ownershipPercentage: 10000 },
    ],
    
    purchaseCosts: {
      id: 2,
      propertyId: 2,
      stampDuty: 5500000, // $55,000
      legalFees: 300000, // $3,000
      inspectionFees: 100000, // $1,000
      otherCosts: 200000, // $2,000
    },
    
    usagePeriods: [
      {
        id: 2,
        propertyId: 2,
        startDate: new Date("2021-04-01"),
        endDate: null,
        usageType: "Investment",
        isCurrentPeriod: true,
      },
    ],
    
    loans: [
      {
        id: 2,
        propertyId: 2,
        loanType: "Interest Only",
        lender: "Westpac",
        originalAmount: 100000000, // $1,000,000
        currentBalance: 100000000,
        interestRate: 595, // 5.95%
        startDate: new Date("2021-03-20"),
        loanTerm: 30,
        repaymentFrequency: "Monthly",
        isInterestOnly: true,
        interestOnlyPeriod: 5,
      },
    ],
    
    valuations: [
      {
        id: 3,
        propertyId: 2,
        valuationDate: new Date("2021-03-20"),
        estimatedValue: 125000000,
        valuationMethod: "Purchase Price",
      },
      {
        id: 4,
        propertyId: 2,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 145000000, // $1,450,000
        valuationMethod: "Market Estimate",
      },
    ],
    
    growthRates: [
      {
        id: 2,
        propertyId: 2,
        startDate: new Date("2021-03-20"),
        endDate: null,
        annualGrowthRate: 525, // 5.25%
        isCurrentPeriod: true,
      },
    ],
    
    rental: [
      {
        id: 2,
        propertyId: 2,
        weeklyRent: 95000, // $950/week
        startDate: new Date("2021-04-01"),
        endDate: null,
        isCurrentRent: true,
      },
    ],
    
    expenses: [
      {
        id: 2,
        propertyId: 2,
        year: 2024,
        totalExpenses: 1680000, // $16,800
        breakdown: [
          { id: 7, expenseLogId: 2, category: "Council Rates", amount: 350000, frequency: "Annually" },
          { id: 8, expenseLogId: 2, category: "Water Rates", amount: 180000, frequency: "Annually" },
          { id: 9, expenseLogId: 2, category: "Property Management", amount: 410000, frequency: "Annually" },
          { id: 10, expenseLogId: 2, category: "Insurance", amount: 180000, frequency: "Annually" },
          { id: 11, expenseLogId: 2, category: "Repairs & Maintenance", amount: 560000, frequency: "Annually" },
        ],
      },
    ],
    
    depreciation: [
      {
        id: 2,
        propertyId: 2,
        asAtDate: new Date("2024-07-01"),
        annualAmount: 1200000, // $12,000
      },
    ],
    
    capex: [
      {
        id: 1,
        propertyId: 2,
        name: "Kitchen & Bathroom Renovation",
        amount: 6500000, // $65,000
        date: new Date("2023-08-15"),
      },
    ],
  },
  
  {
    id: 3,
    userId: 1,
    nickname: "Melbourne Home",
    address: "78 Collins Street, Melbourne VIC 3000",
    state: "Victoria",
    suburb: "Melbourne",
    propertyType: "Residential",
    ownershipStructure: "Individual",
    linkedEntity: null,
    purchaseDate: new Date("2022-01-10"),
    purchasePrice: 92000000, // $920,000
    status: "Actual",
    createdAt: new Date("2022-01-10"),
    
    ownership: [
      { id: 4, propertyId: 3, ownerName: "John Smith", ownershipPercentage: 5000 },
      { id: 5, propertyId: 3, ownerName: "Jane Smith", ownershipPercentage: 5000 },
    ],
    
    purchaseCosts: {
      id: 3,
      propertyId: 3,
      stampDuty: 5000000, // $50,000
      legalFees: 250000, // $2,500
      inspectionFees: 80000, // $800
      otherCosts: 150000, // $1,500
    },
    
    usagePeriods: [
      {
        id: 3,
        propertyId: 3,
        startDate: new Date("2022-01-10"),
        endDate: null,
        usageType: "Owner Occupied",
        isCurrentPeriod: true,
      },
    ],
    
    loans: [
      {
        id: 3,
        propertyId: 3,
        loanType: "Principal & Interest",
        lender: "NAB",
        originalAmount: 73600000, // $736,000
        currentBalance: 68500000, // $685,000
        interestRate: 615, // 6.15%
        startDate: new Date("2022-01-10"),
        loanTerm: 30,
        repaymentFrequency: "Monthly",
        isInterestOnly: false,
      },
    ],
    
    valuations: [
      {
        id: 5,
        propertyId: 3,
        valuationDate: new Date("2022-01-10"),
        estimatedValue: 92000000,
        valuationMethod: "Purchase Price",
      },
      {
        id: 6,
        propertyId: 3,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 103000000, // $1,030,000
        valuationMethod: "Market Estimate",
      },
    ],
    
    growthRates: [
      {
        id: 3,
        propertyId: 3,
        startDate: new Date("2022-01-10"),
        endDate: null,
        annualGrowthRate: 450, // 4.5%
        isCurrentPeriod: true,
      },
    ],
    
    rental: [],
    
    expenses: [
      {
        id: 3,
        propertyId: 3,
        year: 2024,
        totalExpenses: 980000, // $9,800
        breakdown: [
          { id: 12, expenseLogId: 3, category: "Council Rates", amount: 320000, frequency: "Annually" },
          { id: 13, expenseLogId: 3, category: "Water Rates", amount: 160000, frequency: "Annually" },
          { id: 14, expenseLogId: 3, category: "Insurance", amount: 200000, frequency: "Annually" },
          { id: 15, expenseLogId: 3, category: "Repairs & Maintenance", amount: 300000, frequency: "Annually" },
        ],
      },
    ],
    
    depreciation: [],
  },
  
  {
    id: 4,
    userId: 1,
    nickname: "Gold Coast Development",
    address: "12 Surfers Paradise Boulevard, Surfers Paradise QLD 4217",
    state: "Queensland",
    suburb: "Surfers Paradise",
    propertyType: "Residential",
    ownershipStructure: "Trust",
    linkedEntity: "Smith Development Trust",
    purchaseDate: new Date("2023-09-05"),
    purchasePrice: 180000000, // $1,800,000
    status: "Actual",
    createdAt: new Date("2023-09-05"),
    
    ownership: [
      { id: 6, propertyId: 4, ownerName: "Smith Development Trust", ownershipPercentage: 10000 },
    ],
    
    purchaseCosts: {
      id: 4,
      propertyId: 4,
      stampDuty: 7200000, // $72,000
      legalFees: 400000, // $4,000
      inspectionFees: 150000, // $1,500
      otherCosts: 300000, // $3,000
    },
    
    usagePeriods: [
      {
        id: 4,
        propertyId: 4,
        startDate: new Date("2023-09-05"),
        endDate: null,
        usageType: "Investment",
        isCurrentPeriod: true,
      },
    ],
    
    loans: [
      {
        id: 4,
        propertyId: 4,
        loanType: "Interest Only",
        lender: "ANZ",
        originalAmount: 135000000, // $1,350,000
        currentBalance: 135000000,
        interestRate: 725, // 7.25%
        startDate: new Date("2023-09-05"),
        loanTerm: 5,
        repaymentFrequency: "Monthly",
        isInterestOnly: true,
        interestOnlyPeriod: 5,
      },
    ],
    
    valuations: [
      {
        id: 7,
        propertyId: 4,
        valuationDate: new Date("2023-09-05"),
        estimatedValue: 180000000,
        valuationMethod: "Purchase Price",
      },
      {
        id: 8,
        propertyId: 4,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 192000000, // $1,920,000
        valuationMethod: "Market Estimate",
      },
    ],
    
    growthRates: [
      {
        id: 4,
        propertyId: 4,
        startDate: new Date("2023-09-05"),
        endDate: null,
        annualGrowthRate: 650, // 6.5%
        isCurrentPeriod: true,
      },
    ],
    
    rental: [],
    
    expenses: [
      {
        id: 4,
        propertyId: 4,
        year: 2024,
        totalExpenses: 1200000, // $12,000
        breakdown: [
          { id: 16, expenseLogId: 4, category: "Council Rates", amount: 480000, frequency: "Annually" },
          { id: 17, expenseLogId: 4, category: "Water Rates", amount: 200000, frequency: "Annually" },
          { id: 18, expenseLogId: 4, category: "Insurance", amount: 320000, frequency: "Annually" },
          { id: 19, expenseLogId: 4, category: "Security & Maintenance", amount: 200000, frequency: "Annually" },
        ],
      },
    ],
    
    depreciation: [],
    
    capex: [
      {
        id: 2,
        propertyId: 4,
        name: "Subdivision & Development Approval",
        amount: 15000000, // $150,000
        date: new Date("2024-03-01"),
      },
    ],
  },
];

// Portfolio summary calculations
export const calculatePortfolioSummary = () => {
  const totalValue = mockProperties.reduce((sum, p) => {
    const latestVal = p.valuations[p.valuations.length - 1];
    return sum + latestVal.estimatedValue;
  }, 0);
  
  const totalDebt = mockProperties.reduce((sum, p) => {
    return sum + p.loans.reduce((loanSum, loan) => loanSum + loan.currentBalance, 0);
  }, 0);
  
  const totalEquity = totalValue - totalDebt;
  
  const annualRentalIncome = mockProperties.reduce((sum, p) => {
    const rent = p.rental[0]?.weeklyRent || 0;
    return sum + (rent * 52);
  }, 0);
  
  const annualExpenses = mockProperties.reduce((sum, p) => {
    return sum + (p.expenses[0]?.totalExpenses || 0);
  }, 0);
  
  return {
    totalValue,
    totalDebt,
    totalEquity,
    equityPercentage: (totalEquity / totalValue) * 100,
    annualRentalIncome,
    annualExpenses,
    netOperatingIncome: annualRentalIncome - annualExpenses,
    propertyCount: mockProperties.length,
  };
};
