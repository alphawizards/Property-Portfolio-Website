/**
 * Golden Master Test Profile: "The Balanced Portfolio"
 * 
 * This script creates a comprehensive test user with three distinct properties
 * to stress-test Dashboard.tsx charts, calculation engines, and database schemas.
 * 
 * Demo User: demo@propertywizards.com
 * Tier: PREMIUM_ANNUAL (all features unlocked)
 * 
 * Properties:
 * - Property A: "The Cash Cow" - Low debt, positive cashflow, 10 years old
 * - Property B: "The Tax Deductor" - High debt, negative cashflow, depreciation heavy
 * - Property C: "The Future Project" - Commercial property, projected status
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { 
  users,
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

async function seedGoldenMaster() {
  console.log("🌟 Seeding Golden Master Test Profile...\n");

  try {
    // ============================================================================
    // STEP 1: Create/Update Demo User with Premium Annual Tier
    // ============================================================================
    console.log("👤 Creating demo user...");
    
    const demoEmail = "demo@propertywizards.com";
    const demoOpenId = "demo_golden_master_12345";
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, demoEmail)).limit(1);
    
    let userId;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      // Update to premium tier
      await db.update(users)
        .set({ 
          subscriptionTier: "PREMIUM_ANNUAL",
          subscriptionStatus: "active",
          role: "user"
        })
        .where(eq(users.id, userId));
      console.log(`✓ Updated existing user (ID: ${userId}) to PREMIUM_ANNUAL tier`);
    } else {
      const [newUser] = await db.insert(users).values({
        openId: demoOpenId,
        name: "Demo Golden Master",
        email: demoEmail,
        loginMethod: "email",
        role: "user",
        subscriptionTier: "PREMIUM_ANNUAL",
        subscriptionStatus: "active",
      });
      userId = newUser.insertId;
      console.log(`✓ Created new demo user (ID: ${userId})`);
    }

    console.log("\n📊 Creating balanced portfolio with 3 properties...\n");

    // ============================================================================
    // PROPERTY A: "THE CASH COW"
    // Bought 10 years ago, low debt (LVR 40%), positive cashflow
    // Purpose: Test equity calculations and historical valuation plotting
    // ============================================================================
    console.log("🐄 PROPERTY A: The Cash Cow (Sydney Apartment)");
    
    const [propertyA] = await db.insert(properties).values({
      userId: userId,
      nickname: "Sydney Cash Cow",
      address: "42 Harbour Street, Sydney NSW 2000",
      state: "New South Wales",
      suburb: "Sydney CBD",
      propertyType: "Residential",
      ownershipStructure: "Individual",
      linkedEntity: null,
      purchaseDate: new Date("2015-03-15"),
      purchasePrice: 45000000, // $450k in cents
      status: "Actual",
    });
    const propertyAId = propertyA.insertId;

    // Ownership
    await db.insert(propertyOwnership).values({
      propertyId: propertyAId,
      ownerName: "Demo Golden Master",
      percentage: 100,
    });

    // Purchase costs
    await db.insert(purchaseCosts).values({
      propertyId: propertyAId,
      agentFee: 0,
      stampDuty: 1800000, // ~4% for NSW
      legalFee: 120000,
      inspectionFee: 50000,
      otherCosts: 100000,
    });

    // Usage period (investment from day 1)
    await db.insert(propertyUsagePeriods).values({
      propertyId: propertyAId,
      startDate: new Date("2015-03-15"),
      endDate: null,
      usageType: "Investment",
    });

    // Loan - Originally 80% LVR, now paid down to 40% LVR
    const loanAOriginal = 36000000; // 80% of $450k
    const loanACurrent = 28000000; // Paid down over 10 years
    await db.insert(loans).values({
      propertyId: propertyAId,
      securityPropertyId: propertyAId,
      loanType: "PrincipalLoan",
      lenderName: "Westpac",
      loanPurpose: "PropertyPurchase",
      loanStructure: "PrincipalAndInterest",
      startDate: new Date("2015-03-15"),
      originalAmount: loanAOriginal,
      currentAmount: loanACurrent,
      interestRate: 525, // 5.25%
      remainingTermYears: 20, // 30 year loan, 10 years in
      remainingIOPeriodYears: 0,
      repaymentFrequency: "Monthly",
    });

    // RICH HISTORICAL VALUATIONS (2015-2025, yearly data points)
    const propertyAYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const propertyABaseValue = 45000000; // $450k starting value
    const propertyAValuations = propertyAYears.map((year, index) => ({
      propertyId: propertyAId,
      valuationDate: new Date(`${year}-07-01`),
      value: Math.round(propertyABaseValue * Math.pow(1.06, index)), // 6% compound growth
    }));
    await db.insert(propertyValuations).values(propertyAValuations);

    // Growth rate periods
    await db.insert(growthRatePeriods).values([
      {
        propertyId: propertyAId,
        startYear: 2025,
        endYear: 2030,
        growthRate: 500, // 5%
      },
      {
        propertyId: propertyAId,
        startYear: 2030,
        endYear: null,
        growthRate: 400, // 4%
      },
    ]);

    // Rental income - Strong rental yield
    await db.insert(rentalIncome).values({
      propertyId: propertyAId,
      startDate: new Date("2015-04-01"),
      endDate: null,
      amount: 75000, // $750/week
      frequency: "Weekly",
      growthRate: 300, // 3% annual growth
    });

    // Expenses - Well maintained property
    const [expenseA] = await db.insert(expenseLogs).values({
      propertyId: propertyAId,
      date: new Date("2025-01-01"),
      totalAmount: 80000, // $800/month
      frequency: "Monthly",
      growthRate: 300,
    });

    await db.insert(expenseBreakdown).values([
      { expenseLogId: expenseA.insertId, category: "Council Rates", amount: 25000 },
      { expenseLogId: expenseA.insertId, category: "Water Rates", amount: 8000 },
      { expenseLogId: expenseA.insertId, category: "Insurance", amount: 12000 },
      { expenseLogId: expenseA.insertId, category: "Property Management", amount: 24000 },
      { expenseLogId: expenseA.insertId, category: "Maintenance & Repairs", amount: 11000 },
    ]);

    // Depreciation (older property, minimal depreciation left)
    await db.insert(depreciationSchedule).values({
      propertyId: propertyAId,
      asAtDate: new Date("2025-07-01"),
      annualAmount: 200000, // $2,000/year (minimal)
    });

    console.log(`✓ Property A created (ID: ${propertyAId})`);
    console.log("  - Purchase: $450k (2015)");
    console.log("  - Current Value: $803k (10 years @ 6% growth)");
    console.log("  - Debt: $280k (40% LVR)");
    console.log("  - Equity: $523k");
    console.log("  - Cashflow: POSITIVE (~$29k/year)");
    console.log("  - Historical data: 11 valuation points\n");

    // ============================================================================
    // PROPERTY B: "THE TAX DEDUCTOR"
    // New build, high debt (LVR 90%), negative cashflow, depreciation heavy
    // Purpose: Test expenseGrowthOverride logic and negative cashflow visualization
    // ============================================================================
    console.log("📉 PROPERTY B: The Tax Deductor (Melbourne New Build)");
    
    const [propertyB] = await db.insert(properties).values({
      userId: userId,
      nickname: "Melbourne Tax Saver",
      address: "Level 18/99 Development Drive, Melbourne VIC 3000",
      state: "Victoria",
      suburb: "Melbourne CBD",
      propertyType: "Residential",
      ownershipStructure: "Trust",
      linkedEntity: "Golden Master Family Trust",
      purchaseDate: new Date("2023-06-01"),
      purchasePrice: 58000000, // $580k (brand new apartment)
      status: "Actual",
    });
    const propertyBId = propertyB.insertId;

    // Ownership
    await db.insert(propertyOwnership).values([
      {
        propertyId: propertyBId,
        ownerName: "Golden Master Family Trust",
        percentage: 100,
      },
    ]);

    // Purchase costs
    await db.insert(purchaseCosts).values({
      propertyId: propertyBId,
      agentFee: 0,
      stampDuty: 2500000, // VIC stamp duty
      legalFee: 150000,
      inspectionFee: 0, // New build
      otherCosts: 300000, // Builder warranty, etc.
    });

    // Usage period
    await db.insert(propertyUsagePeriods).values({
      propertyId: propertyBId,
      startDate: new Date("2023-06-01"),
      endDate: null,
      usageType: "Investment",
    });

    // High LVR loan - 90% LVR, Interest Only
    const loanBAmount = 52200000; // 90% of $580k
    await db.insert(loans).values({
      propertyId: propertyBId,
      securityPropertyId: propertyBId,
      loanType: "PrincipalLoan",
      lenderName: "ANZ Bank",
      loanPurpose: "PropertyPurchase",
      loanStructure: "InterestOnly",
      startDate: new Date("2023-06-01"),
      originalAmount: loanBAmount,
      currentAmount: loanBAmount,
      interestRate: 625, // 6.25% (higher rate for IO + high LVR)
      remainingTermYears: 28,
      remainingIOPeriodYears: 3,
      repaymentFrequency: "Monthly",
    });

    // Valuations (slight decrease due to market softening)
    await db.insert(propertyValuations).values([
      {
        propertyId: propertyBId,
        valuationDate: new Date("2023-06-01"),
        value: 58000000, // Purchase price
      },
      {
        propertyId: propertyBId,
        valuationDate: new Date("2024-06-01"),
        value: 56500000, // Down 2.5%
      },
      {
        propertyId: propertyBId,
        valuationDate: new Date("2025-11-01"),
        value: 57000000, // Slight recovery
      },
    ]);

    // Growth rate periods (slower growth for new builds)
    await db.insert(growthRatePeriods).values([
      {
        propertyId: propertyBId,
        startYear: 2025,
        endYear: 2028,
        growthRate: 300, // 3% (slower growth)
      },
      {
        propertyId: propertyBId,
        startYear: 2028,
        endYear: null,
        growthRate: 450, // 4.5%
      },
    ]);

    // Rental income - Lower yield on new builds
    await db.insert(rentalIncome).values({
      propertyId: propertyBId,
      startDate: new Date("2023-07-01"),
      endDate: null,
      amount: 55000, // $550/week (lower yield ~4.9%)
      frequency: "Weekly",
      growthRate: 250, // 2.5% growth
    });

    // Expenses - High expenses (strata, management)
    const [expenseB] = await db.insert(expenseLogs).values({
      propertyId: propertyBId,
      date: new Date("2025-01-01"),
      totalAmount: 140000, // $1,400/month (HIGH)
      frequency: "Monthly",
      growthRate: 400, // 4% growth (strata increases)
    });

    await db.insert(expenseBreakdown).values([
      { expenseLogId: expenseB.insertId, category: "Council Rates", amount: 30000 },
      { expenseLogId: expenseB.insertId, category: "Water Rates", amount: 10000 },
      { expenseLogId: expenseB.insertId, category: "Insurance", amount: 18000 },
      { expenseLogId: expenseB.insertId, category: "Property Management", amount: 18000 },
      { expenseLogId: expenseB.insertId, category: "Maintenance & Repairs", amount: 8000 },
      { expenseLogId: expenseB.insertId, category: "Strata Fees", amount: 56000 }, // HIGH strata
    ]);

    // HIGH DEPRECIATION (new build)
    await db.insert(depreciationSchedule).values({
      propertyId: propertyBId,
      asAtDate: new Date("2025-07-01"),
      annualAmount: 1800000, // $18,000/year (SIGNIFICANT tax benefit)
    });

    console.log(`✓ Property B created (ID: ${propertyBId})`);
    console.log("  - Purchase: $580k (2023)");
    console.log("  - Current Value: $570k (slight market decline)");
    console.log("  - Debt: $522k (90% LVR)");
    console.log("  - Equity: $48k");
    console.log("  - Cashflow: NEGATIVE (-$20k/year before depreciation)");
    console.log("  - Depreciation: $18k/year (TAX ADVANTAGE)");
    console.log("  - Historical data: 3 valuation points\n");

    // ============================================================================
    // PROPERTY C: "THE FUTURE PROJECT"
    // Commercial property, projected status (not yet purchased)
    // Purpose: Test how dashboard handles hypothetical vs actual assets
    // ============================================================================
    console.log("🏢 PROPERTY C: The Future Project (Brisbane Commercial)");
    
    const [propertyC] = await db.insert(properties).values({
      userId: userId,
      nickname: "Brisbane Commercial - Projected",
      address: "456 Enterprise Boulevard, Brisbane QLD 4000",
      state: "Queensland",
      suburb: "Brisbane CBD",
      propertyType: "Commercial",
      ownershipStructure: "Company",
      linkedEntity: "Golden Master Pty Ltd",
      purchaseDate: new Date("2026-03-01"), // FUTURE DATE
      purchasePrice: 95000000, // $950k
      status: "Projected", // KEY: This is a projected property
    });
    const propertyCId = propertyC.insertId;

    // Ownership
    await db.insert(propertyOwnership).values({
      propertyId: propertyCId,
      ownerName: "Golden Master Pty Ltd",
      percentage: 100,
    });

    // Purchase costs (estimated)
    await db.insert(purchaseCosts).values({
      propertyId: propertyCId,
      agentFee: 0,
      stampDuty: 5200000, // ~5.5% QLD commercial
      legalFee: 200000,
      inspectionFee: 100000,
      otherCosts: 250000,
    });

    // Usage period (will be investment)
    await db.insert(propertyUsagePeriods).values({
      propertyId: propertyCId,
      startDate: new Date("2026-03-01"),
      endDate: null,
      usageType: "Investment",
    });

    // Projected loan - 70% LVR (commercial lending)
    const loanCAmount = 66500000; // 70% of $950k
    await db.insert(loans).values({
      propertyId: propertyCId,
      securityPropertyId: propertyCId,
      loanType: "PrincipalLoan",
      lenderName: "NAB Commercial",
      loanPurpose: "PropertyPurchase",
      loanStructure: "PrincipalAndInterest",
      startDate: new Date("2026-03-01"),
      originalAmount: loanCAmount,
      currentAmount: loanCAmount,
      interestRate: 650, // 6.50% (commercial rate)
      remainingTermYears: 15, // Shorter term for commercial
      remainingIOPeriodYears: 0,
      repaymentFrequency: "Monthly",
    });

    // Projected valuation
    await db.insert(propertyValuations).values({
      propertyId: propertyCId,
      valuationDate: new Date("2026-03-01"),
      value: 95000000,
    });

    // Growth rate (commercial property)
    await db.insert(growthRatePeriods).values([
      {
        propertyId: propertyCId,
        startYear: 2026,
        endYear: 2030,
        growthRate: 400, // 4%
      },
      {
        propertyId: propertyCId,
        startYear: 2030,
        endYear: null,
        growthRate: 350, // 3.5%
      },
    ]);

    // Projected rental income (commercial lease)
    await db.insert(rentalIncome).values({
      propertyId: propertyCId,
      startDate: new Date("2026-03-01"),
      endDate: null,
      amount: 130000, // $1,300/week (~7.1% yield - commercial)
      frequency: "Weekly",
      growthRate: 350, // 3.5% (CPI linked lease)
    });

    // Projected expenses (lower for commercial - tenant pays most)
    const [expenseC] = await db.insert(expenseLogs).values({
      propertyId: propertyCId,
      date: new Date("2026-03-01"),
      totalAmount: 60000, // $600/month
      frequency: "Monthly",
      growthRate: 350,
    });

    await db.insert(expenseBreakdown).values([
      { expenseLogId: expenseC.insertId, category: "Council Rates", amount: 20000 },
      { expenseLogId: expenseC.insertId, category: "Insurance", amount: 25000 },
      { expenseLogId: expenseC.insertId, category: "Property Management", amount: 15000 },
    ]);

    // No depreciation schedule yet (not purchased)

    console.log(`✓ Property C created (ID: ${propertyCId})`);
    console.log("  - Status: PROJECTED (not yet purchased)");
    console.log("  - Projected Purchase: $950k (March 2026)");
    console.log("  - Projected Debt: $665k (70% LVR)");
    console.log("  - Property Type: Commercial");
    console.log("  - Projected Yield: 7.1% (strong commercial return)");
    console.log("  - Cashflow: POSITIVE when purchased (~$26k/year)\n");

    // ============================================================================
    // FINAL SUMMARY
    // ============================================================================
    console.log("✅ Golden Master Test Profile Created Successfully!\n");
    console.log("=" .repeat(70));
    console.log("PORTFOLIO SUMMARY");
    console.log("=" .repeat(70));
    console.log(`User: demo@propertywizards.com (ID: ${userId})`);
    console.log("Tier: PREMIUM_ANNUAL (all features unlocked)");
    console.log("");
    console.log("PROPERTY A - The Cash Cow:");
    console.log("  Type: Residential | Status: Actual | Age: 10 years");
    console.log("  Value: $803k | Debt: $280k | LVR: 40% | Equity: $523k");
    console.log("  Cashflow: POSITIVE $29k/year | Depreciation: $2k/year");
    console.log("  Data Points: 11 historical valuations (2015-2025)");
    console.log("");
    console.log("PROPERTY B - The Tax Deductor:");
    console.log("  Type: Residential (New Build) | Status: Actual | Age: 2 years");
    console.log("  Value: $570k | Debt: $522k | LVR: 90% | Equity: $48k");
    console.log("  Cashflow: NEGATIVE -$20k/year | Depreciation: $18k/year");
    console.log("  Data Points: 3 historical valuations (2023-2025)");
    console.log("");
    console.log("PROPERTY C - The Future Project:");
    console.log("  Type: Commercial | Status: PROJECTED | Purchase: March 2026");
    console.log("  Value: $950k | Debt: $665k | LVR: 70% | Equity: $285k");
    console.log("  Cashflow: POSITIVE $26k/year (when purchased)");
    console.log("  Data Points: 1 projected valuation");
    console.log("");
    console.log("TOTAL PORTFOLIO (Current + Projected):");
    console.log("  Total Value: $2,323k");
    console.log("  Total Debt: $1,467k");
    console.log("  Total Equity: $856k");
    console.log("  Average LVR: 63%");
    console.log("  Combined Cashflow: $35k/year (after Property C purchase)");
    console.log("=" .repeat(70));
    console.log("");
    console.log("🎯 This profile tests:");
    console.log("  ✓ Equity calculations (Property A - low LVR)");
    console.log("  ✓ Historical valuation plotting (Property A - 11 data points)");
    console.log("  ✓ Negative cashflow visualization (Property B)");
    console.log("  ✓ High depreciation benefits (Property B - $18k/year)");
    console.log("  ✓ Projected vs Actual asset handling (Property C)");
    console.log("  ✓ Different property types (Residential, Commercial)");
    console.log("  ✓ Different ownership structures (Individual, Trust, Company)");
    console.log("  ✓ Multiple loan structures (P&I, IO, different LVRs)");
    console.log("");
    console.log("🚀 Ready to test Dashboard.tsx with realistic data!");

  } catch (error) {
    console.error("\n❌ Error seeding Golden Master data:", error);
    throw error;
  }

  process.exit(0);
}

seedGoldenMaster();
