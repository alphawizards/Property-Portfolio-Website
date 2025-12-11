// Server-side mock data adapted from client mock data
export const mockUser = {
  id: 1,
  openId: "user_mock_123",
  name: "John Smith",
  email: "john.smith@example.com",
  role: "user" as const,
  subscriptionTier: "PREMIUM_MONTHLY" as const,
  subscriptionStatus: "active" as const,
  createdAt: new Date("2020-01-01"),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  isActive: true,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionEndDate: null,
  loginMethod: "mock",
};

export const mockProperties = [
  {
    id: 1,
    userId: 1,
    portfolioId: 1,
    scenarioId: null,
    nickname: "Brisbane CBD Apartment",
    address: "Unit 507, 123 Queen Street, Brisbane QLD 4000",
    state: "Queensland",
    suburb: "Brisbane City",
    propertyType: "Residential" as const,
    ownershipStructure: "Trust" as const,
    linkedEntity: "Smith Family Trust",
    purchaseDate: new Date("2020-06-15"),
    purchasePrice: 65000000,
    saleDate: null,
    salePrice: null,
    status: "Actual" as const,
    createdAt: new Date("2020-06-15"),
    updatedAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    portfolioId: 1,
    scenarioId: null,
    nickname: "Sydney Parramatta House",
    address: "45 George Street, Parramatta NSW 2150",
    state: "New South Wales",
    suburb: "Parramatta",
    propertyType: "Residential" as const,
    ownershipStructure: "Company" as const,
    linkedEntity: "Smith Property Holdings Pty Ltd",
    purchaseDate: new Date("2021-03-20"),
    purchasePrice: 125000000,
    saleDate: null,
    salePrice: null,
    status: "Actual" as const,
    createdAt: new Date("2021-03-20"),
    updatedAt: new Date(),
  },
];

export const mockPortfolios = [
  {
    id: 1,
    userId: 1,
    name: "Primary Portfolio",
    type: "Normal" as const,
    description: "My main investment portfolio",
    createdAt: new Date("2020-01-01"),
    updatedAt: new Date(),
  }
];

export const mockGoal = {
  id: 1,
  userId: 1,
  goalYear: 2030,
  targetEquity: 500000000, // $5M
  targetCashflow: 15000000, // $150k
  targetValue: 1000000000, // $10M
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helpers for detailed data
export const getMockCompleteData = (propertyId: number) => {
  const property = mockProperties.find(p => p.id === propertyId);
  if (!property) return null;

  return {
    property,
    ownership: [{ id: 1, propertyId, ownerName: "John Smith", percentage: 100 }],
    costs: { id: 1, propertyId, agentFee: 0, stampDuty: 2000000, legalFee: 200000, inspectionFee: 50000, otherCosts: 0 },
    usagePeriods: [{ id: 1, propertyId, startDate: property.purchaseDate, endDate: null, usageType: "Investment" as const }],
    loans: [{
      id: 1,
      propertyId,
      securityPropertyId: null,
      loanType: "PrincipalLoan" as const,
      lenderName: "Mock Bank",
      loanPurpose: "PropertyPurchase" as const,
      loanStructure: "PrincipalAndInterest" as const,
      startDate: property.purchaseDate,
      originalAmount: Math.round(property.purchasePrice * 0.8),
      currentAmount: Math.round(property.purchasePrice * 0.75),
      interestRate: 600,
      remainingTermYears: 25,
      remainingIOPeriodYears: 0,
      repaymentFrequency: "Monthly" as const,
      offsetBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    valuations: [{ id: 1, propertyId, valuationDate: new Date(), value: Math.round(property.purchasePrice * 1.2) }],
    growthRates: [{ id: 1, propertyId, startYear: 2020, endYear: null, growthRate: 500 }],
    rental: [{ id: 1, propertyId, startDate: new Date(), endDate: null, amount: 65000, frequency: "Weekly" as const, growthRate: 300 }],
    expenses: [{ id: 1, propertyId, date: new Date(), totalAmount: 1500000, frequency: "Annual" as const, growthRate: 300 }],
    depreciation: [],
    capex: [],
  };
};
