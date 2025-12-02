import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  properties, 
  propertyOwnership, 
  purchaseCosts, 
  propertyUsagePeriods,
  loans,
  propertyValuations,
  growthRatePeriods,
  rentalIncome,
  expenseLogs,
  expenseBreakdown,
  depreciationSchedule,
  capitalExpenditure
} from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seedTestData() {
  console.log("🌱 Seeding test property data...");

  try {
    // Get the current user (assuming user ID 1 exists)
    const userId = 1;

    // 1. Create Investment Property
    console.log("Creating investment property...");
    const [property] = await db.insert(properties).values({
      userId: userId,
      nickname: "Brisbane Investment",
      address: "123 Queen Street, Brisbane QLD 4000",
      state: "Queensland",
      suburb: "Brisbane City",
      propertyType: "Residential",
      ownershipStructure: "Trust",
      linkedEntity: "Smith Family Trust",
      purchaseDate: new Date("2020-01-15"),
      purchasePrice: 65000000, // $650k in cents
      status: "Actual",
    });

    const propertyId = property.insertId;
    console.log(`✓ Property created (ID: ${propertyId})`);

    // 2. Add Ownership
    console.log("Adding ownership details...");
    await db.insert(propertyOwnership).values([
      {
        propertyId: propertyId,
        ownerName: "John Smith",
        percentage: 50,
      },
      {
        propertyId: propertyId,
        ownerName: "Jane Smith",
        percentage: 50,
      },
    ]);
    console.log("✓ Ownership added");

    // 3. Add Purchase Costs
    console.log("Adding purchase costs...");
    await db.insert(purchaseCosts).values({
      propertyId: propertyId,
      agentFee: 0, // Buyer doesn't pay agent fee in Australia
      stampDuty: 2500000, // ~3.85% for QLD in cents
      legalFee: 150000, // in cents
      inspectionFee: 50000, // in cents
      otherCosts: 200000, // Misc costs in cents
    });
    console.log("✓ Purchase costs added");

    // 4. Add Usage Period (Investment from day 1)
    console.log("Adding usage period...");
    await db.insert(propertyUsagePeriods).values({
      propertyId: propertyId,
      startDate: new Date("2020-01-15"),
      endDate: null, // Ongoing
      usageType: "Investment",
    });
    console.log("✓ Usage period added");

    // 5. Add Main Principal Loan (80% LVR with 5 year IO)
    console.log("Adding main principal loan...");
    const loanAmount = 52000000; // 80% of $650k in cents
    const loanStartDate = new Date("2020-01-15");
    
    await db.insert(loans).values({
      propertyId: propertyId,
      securityPropertyId: propertyId,
      loanType: "PrincipalLoan",
      lenderName: "Commonwealth Bank",
      loanPurpose: "PropertyPurchase",
      loanStructure: "InterestOnly",
      startDate: loanStartDate,
      originalAmount: loanAmount,
      currentAmount: loanAmount, // Still IO, no principal paid
      interestRate: 550, // 5.50% (stored as basis points)
      remainingTermYears: 25, // 30 year loan, 5 years in
      remainingIOPeriodYears: 0, // IO period ended
      repaymentFrequency: "Monthly",
    });
    console.log("✓ Main loan added");

    // 6. Add Equity Loan (Used for renovation)
    console.log("Adding equity loan...");
    await db.insert(loans).values({
      propertyId: propertyId,
      securityPropertyId: propertyId,
      loanType: "EquityLoan",
      lenderName: "Commonwealth Bank",
      loanPurpose: "Renovation",
      loanStructure: "InterestOnly",
      startDate: new Date("2022-06-01"),
      originalAmount: 5000000, // $50k in cents
      currentAmount: 5000000, // in cents
      interestRate: 600, // 6.00%
      remainingTermYears: 8,
      remainingIOPeriodYears: 3,
      repaymentFrequency: "Monthly",
    });
    console.log("✓ Equity loan added");

    // 7. Add Property Valuations
    console.log("Adding property valuations...");
    await db.insert(propertyValuations).values([
      {
        propertyId: propertyId,
        valuationDate: new Date("2020-01-15"),
        value: 65000000, // Purchase price in cents
      },
      {
        propertyId: propertyId,
        valuationDate: new Date("2022-06-01"),
        value: 75000000, // After 2.5 years in cents
      },
      {
        propertyId: propertyId,
        valuationDate: new Date("2025-12-02"),
        value: 85000000, // Current valuation in cents
      },
    ]);
    console.log("✓ Valuations added");

    // 8. Add Growth Rate Periods
    console.log("Adding growth rate projections...");
    await db.insert(growthRatePeriods).values([
      {
        propertyId: propertyId,
        startYear: 2025,
        endYear: 2030,
        growthRate: 500, // 5% per year
      },
      {
        propertyId: propertyId,
        startYear: 2030,
        endYear: 2040,
        growthRate: 400, // 4% per year
      },
      {
        propertyId: propertyId,
        startYear: 2040,
        endYear: null, // Forever
        growthRate: 350, // 3.5% per year
      },
    ]);
    console.log("✓ Growth rates added");

    // 9. Add Rental Income
    console.log("Adding rental income...");
    await db.insert(rentalIncome).values({
      propertyId: propertyId,
      startDate: new Date("2020-02-01"),
      endDate: null, // Ongoing
      amount: 65000, // $650 per week in cents
      frequency: "Weekly",
      growthRate: 300, // 3% annual growth
    });
    console.log("✓ Rental income added");

    // 10. Add Expenses
    console.log("Adding expenses...");
    const [expense] = await db.insert(expenseLogs).values({
      propertyId: propertyId,
      date: new Date("2025-01-01"),
      totalAmount: 120000, // $1,200 per month in cents
      frequency: "Monthly",
      growthRate: 300, // 3% annual growth
    });

    const expenseId = expense.insertId;

    // Add expense breakdown
    await db.insert(expenseBreakdown).values([
      {
        expenseLogId: expenseId,
        category: "Council Rates",
        amount: 35000, // in cents
      },
      {
        expenseLogId: expenseId,
        category: "Water Rates",
        amount: 10000, // in cents
      },
      {
        expenseLogId: expenseId,
        category: "Insurance",
        amount: 15000, // in cents
      },
      {
        expenseLogId: expenseId,
        category: "Property Management",
        amount: 28000, // ~8% of rent in cents
      },
      {
        expenseLogId: expenseId,
        category: "Maintenance & Repairs",
        amount: 20000, // in cents
      },
      {
        expenseLogId: expenseId,
        category: "Strata Fees",
        amount: 12000, // in cents
      },
    ]);
    console.log("✓ Expenses added");

    // 11. Add Depreciation Schedule
    console.log("Adding depreciation schedule...");
    await db.insert(depreciationSchedule).values({
      propertyId: propertyId,
      asAtDate: new Date("2025-07-01"),
      annualAmount: 850000, // $8,500 per year in cents
    });
    console.log("✓ Depreciation added");

    // 12. Add Capital Expenditure (Renovation)
    console.log("Adding capital expenditure...");
    await db.insert(capitalExpenditure).values({
      propertyId: propertyId,
      name: "Kitchen & Bathroom Renovation",
      amount: 5000000, // in cents
      date: new Date("2022-06-15"),
    });
    console.log("✓ Capital expenditure added");

    console.log("\n✅ Test data seeded successfully!");
    console.log("\nProperty Summary:");
    console.log("- Purchase Price: $650,000");
    console.log("- Current Value: $850,000");
    console.log("- Main Loan: $520,000 @ 5.50% IO");
    console.log("- Equity Loan: $50,000 @ 6.00% IO");
    console.log("- Total Debt: $570,000");
    console.log("- Equity: $280,000 (32.9% LVR)");
    console.log("- Rental Income: $650/week ($33,800/year)");
    console.log("- Expenses: $1,200/month ($14,400/year)");
    console.log("- Net Cashflow: ~$19,400/year (before tax)");
    console.log("- Depreciation: $8,500/year");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }

  process.exit(0);
}

seedTestData();
