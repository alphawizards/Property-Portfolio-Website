import "dotenv/config";
import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
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

const client = new Client({
  url: process.env.DATABASE_URL,
});

const db = drizzle(client);

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
    }).$returningId();

    const propertyId = property.id;
    console.log(`✓ Property created (ID: ${propertyId})`);

    // 2. Add Ownership
    console.log("Adding ownership details...");
    await db.insert(propertyOwnership).values([
      {
        propertyId: propertyId,
        ownerName: "John Smith",
        ownershipPercentage: 10000, // 100% in basis points
      },
    ]);
    console.log("✓ Ownership added");

    // 3. Add Purchase Costs
    console.log("Adding purchase costs...");
    await db.insert(purchaseCosts).values({
      propertyId: propertyId,
      stampDuty: 2600000, // $26k
      legalFees: 150000, // $1.5k
      inspectionFees: 50000, // $500
      otherCosts: 100000, // $1k
    });
    console.log("✓ Purchase costs added");

    // 4. Add Usage Period
    console.log("Adding usage period...");
    await db.insert(propertyUsagePeriods).values({
      propertyId: propertyId,
      startDate: new Date("2020-01-15"),
      usageType: "Investment",
      isCurrentPeriod: true,
    });
    console.log("✓ Usage period added");

    // 5. Add Loan
    console.log("Adding loan...");
    const [loan] = await db.insert(loans).values({
      propertyId: propertyId,
      loanType: "Principal & Interest",
      lender: "Commonwealth Bank",
      originalAmount: 52000000, // $520k (80% LVR)
      currentBalance: 48500000, // $485k after some payments
      interestRate: 425, // 4.25% in basis points
      startDate: new Date("2020-01-15"),
      loanTerm: 30,
      repaymentFrequency: "Monthly",
      isInterestOnly: false,
    }).$returningId();
    console.log(`✓ Loan added (ID: ${loan.id})`);

    // 6. Add Property Valuations
    console.log("Adding valuations...");
    await db.insert(propertyValuations).values([
      {
        propertyId: propertyId,
        valuationDate: new Date("2020-01-15"),
        estimatedValue: 65000000, // Purchase price
        valuationMethod: "Purchase Price",
      },
      {
        propertyId: propertyId,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 75000000, // Current estimate
        valuationMethod: "Market Estimate",
      },
    ]);
    console.log("✓ Valuations added");

    // 7. Add Growth Rate Periods
    console.log("Adding growth rate periods...");
    await db.insert(growthRatePeriods).values({
      propertyId: propertyId,
      startDate: new Date("2020-01-15"),
      annualGrowthRate: 500, // 5% in basis points
      isCurrentPeriod: true,
    });
    console.log("✓ Growth rate added");

    // 8. Add Rental Income
    console.log("Adding rental income...");
    await db.insert(rentalIncome).values({
      propertyId: propertyId,
      weeklyRent: 65000, // $650/week
      startDate: new Date("2020-02-01"),
      isCurrentRent: true,
    });
    console.log("✓ Rental income added");

    // 9. Add Expense Logs
    console.log("Adding expenses...");
    const [expenseLog] = await db.insert(expenseLogs).values({
      propertyId: propertyId,
      year: 2024,
      totalExpenses: 1250000, // $12.5k
    }).$returningId();

    await db.insert(expenseBreakdown).values([
      {
        expenseLogId: expenseLog.id,
        category: "Council Rates",
        amount: 250000, // $2.5k
      },
      {
        expenseLogId: expenseLog.id,
        category: "Water Rates",
        amount: 120000, // $1.2k
      },
      {
        expenseLogId: expenseLog.id,
        category: "Property Management",
        amount: 180000, // $1.8k (yearly management fees)
      },
      {
        expenseLogId: expenseLog.id,
        category: "Insurance",
        amount: 150000, // $1.5k
      },
      {
        expenseLogId: expenseLog.id,
        category: "Repairs & Maintenance",
        amount: 550000, // $5.5k
      },
    ]);
    console.log("✓ Expenses added");

    // ========================================
    // PROPERTY 2: Sydney Development
    // ========================================
    console.log("\nCreating Sydney development property...");
    const [property2] = await db.insert(properties).values({
      userId: userId,
      nickname: "Sydney Development",
      address: "456 George Street, Sydney NSW 2000",
      state: "New South Wales",
      suburb: "Sydney",
      propertyType: "Residential",
      ownershipStructure: "Company",
      linkedEntity: "Smith Developments Pty Ltd",
      purchaseDate: new Date("2023-06-01"),
      purchasePrice: 120000000, // $1.2M
      status: "Actual",
    }).$returningId();

    const propertyId2 = property2.id;
    console.log(`✓ Property 2 created (ID: ${propertyId2})`);

    await db.insert(propertyOwnership).values({
      propertyId: propertyId2,
      ownerName: "Smith Developments Pty Ltd",
      ownershipPercentage: 10000,
    });

    await db.insert(purchaseCosts).values({
      propertyId: propertyId2,
      stampDuty: 5400000, // $54k
      legalFees: 350000, // $3.5k
      inspectionFees: 100000, // $1k
      otherCosts: 200000, // $2k
    });

    await db.insert(propertyUsagePeriods).values({
      propertyId: propertyId2,
      startDate: new Date("2023-06-01"),
      usageType: "Investment",
      isCurrentPeriod: true,
    });

    await db.insert(loans).values({
      propertyId: propertyId2,
      loanType: "Interest Only",
      lender: "Westpac",
      originalAmount: 90000000, // $900k (75% LVR)
      currentBalance: 90000000,
      interestRate: 575, // 5.75%
      startDate: new Date("2023-06-01"),
      loanTerm: 30,
      repaymentFrequency: "Monthly",
      isInterestOnly: true,
      interestOnlyPeriod: 5,
    });

    await db.insert(propertyValuations).values([
      {
        propertyId: propertyId2,
        valuationDate: new Date("2023-06-01"),
        estimatedValue: 120000000,
        valuationMethod: "Purchase Price",
      },
      {
        propertyId: propertyId2,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 128000000, // Slight appreciation
        valuationMethod: "Market Estimate",
      },
    ]);

    await db.insert(growthRatePeriods).values({
      propertyId: propertyId2,
      startDate: new Date("2023-06-01"),
      annualGrowthRate: 600, // 6%
      isCurrentPeriod: true,
    });

    // Currently under renovation - no rental income yet
    console.log("✓ Property 2 complete (under renovation, no rental)");

    // ========================================
    // PROPERTY 3: Melbourne PPOR
    // ========================================
    console.log("\nCreating Melbourne PPOR...");
    const [property3] = await db.insert(properties).values({
      userId: userId,
      nickname: "Melbourne PPOR",
      address: "789 Collins Street, Melbourne VIC 3000",
      state: "Victoria",
      suburb: "Melbourne",
      propertyType: "Residential",
      ownershipStructure: "Individual",
      linkedEntity: null,
      purchaseDate: new Date("2022-03-10"),
      purchasePrice: 85000000, // $850k
      status: "Actual",
    }).$returningId();

    const propertyId3 = property3.id;
    console.log(`✓ Property 3 created (ID: ${propertyId3})`);

    await db.insert(propertyOwnership).values([
      {
        propertyId: propertyId3,
        ownerName: "John Smith",
        ownershipPercentage: 5000, // 50%
      },
      {
        propertyId: propertyId3,
        ownerName: "Jane Smith",
        ownershipPercentage: 5000, // 50%
      },
    ]);

    await db.insert(purchaseCosts).values({
      propertyId: propertyId3,
      stampDuty: 4600000, // $46k
      legalFees: 200000, // $2k
      inspectionFees: 80000, // $800
      otherCosts: 150000, // $1.5k
    });

    await db.insert(propertyUsagePeriods).values({
      propertyId: propertyId3,
      startDate: new Date("2022-03-10"),
      usageType: "Owner Occupied",
      isCurrentPeriod: true,
    });

    await db.insert(loans).values({
      propertyId: propertyId3,
      loanType: "Principal & Interest",
      lender: "NAB",
      originalAmount: 68000000, // $680k (80% LVR)
      currentBalance: 64500000, // $645k
      interestRate: 550, // 5.5%
      startDate: new Date("2022-03-10"),
      loanTerm: 30,
      repaymentFrequency: "Monthly",
      isInterestOnly: false,
    });

    await db.insert(propertyValuations).values([
      {
        propertyId: propertyId3,
        valuationDate: new Date("2022-03-10"),
        estimatedValue: 85000000,
        valuationMethod: "Purchase Price",
      },
      {
        propertyId: propertyId3,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 92000000, // Good appreciation
        valuationMethod: "Market Estimate",
      },
    ]);

    await db.insert(growthRatePeriods).values({
      propertyId: propertyId3,
      startDate: new Date("2022-03-10"),
      annualGrowthRate: 450, // 4.5%
      isCurrentPeriod: true,
    });

    // No rental income - owner occupied
    console.log("✓ Property 3 complete (PPOR, no rental)");

    console.log("\n✅ Test data seeding complete!");
    console.log("\nSummary:");
    console.log("• Brisbane Investment: $650k property with rental income");
    console.log("• Sydney Development: $1.2M property under renovation");
    console.log("• Melbourne PPOR: $850k owner-occupied property");
    console.log("\nTotal portfolio value: $2.7M");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

seedTestData()
  .then(() => {
    console.log("✓ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Seed failed:", error);
    process.exit(1);
  });
