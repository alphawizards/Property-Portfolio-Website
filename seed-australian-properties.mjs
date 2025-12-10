/**
 * Enhanced Australian Property Test Data Seeder
 * 
 * This script creates realistic test data for Australian investment properties
 * including typical costs, rental income, expenses, and growth projections.
 */

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
  capitalExpenditure,
  users
} from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

// Check if database is configured
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not configured in .env file");
  console.log("\n📝 To use this seeder, you need to:");
  console.log("1. Set up a PlanetScale database (or MySQL compatible)");
  console.log("2. Add DATABASE_URL to your .env file");
  console.log("3. Run: npm run db:push");
  console.log("4. Then run this seeder again\n");
  process.exit(1);
}

const client = new Client({ url: process.env.DATABASE_URL });
const db = drizzle(client);

async function seedAustralianProperties() {
  console.log("🇦🇺 Seeding Australian Property Portfolio Test Data...\n");

  try {
    // Create or get test user
    console.log("👤 Setting up test user...");
    let userId;
    
    try {
      // Try to get existing user first
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log(`✓ Using existing user (ID: ${userId})`);
      } else {
        // Create a test user
        const [newUser] = await db.insert(users).values({
          openId: "test-user-" + Date.now(),
          email: "test@example.com",
          name: "Test User",
          role: "user",
          subscriptionTier: "PREMIUM_MONTHLY",
        }).$returningId();
        userId = newUser.id;
        console.log(`✓ Created test user (ID: ${userId})`);
      }
    } catch (error) {
      console.log("⚠️  Using userId = 1 (assuming it exists)");
      userId = 1;
    }

    // ========================================
    // PROPERTY 1: Brisbane Investment Apartment
    // ========================================
    console.log("\n🏢 Creating Property 1: Brisbane Investment Apartment...");
    const [prop1] = await db.insert(properties).values({
      userId: userId,
      nickname: "Brisbane CBD Apartment",
      address: "Unit 507, 123 Queen Street, Brisbane QLD 4000",
      state: "Queensland",
      suburb: "Brisbane City",
      propertyType: "Residential",
      ownershipStructure: "Trust",
      linkedEntity: "Smith Family Trust",
      purchaseDate: new Date("2020-06-15"),
      purchasePrice: 65000000, // $650,000
      status: "Actual",
    }).$returningId();
    const propId1 = prop1.id;
    console.log(`✓ Created property (ID: ${propId1})`);

    // Ownership
    await db.insert(propertyOwnership).values([
      { propertyId: propId1, ownerName: "John Smith", ownershipPercentage: 5000 },
      { propertyId: propId1, ownerName: "Jane Smith", ownershipPercentage: 5000 },
    ]);

    // Purchase Costs (QLD stamp duty ~3-4%)
    await db.insert(purchaseCosts).values({
      propertyId: propId1,
      stampDuty: 2400000, // $24,000
      legalFees: 200000, // $2,000
      inspectionFees: 60000, // $600
      otherCosts: 150000, // $1,500
    });

    // Usage Period
    await db.insert(propertyUsagePeriods).values({
      propertyId: propId1,
      startDate: new Date("2020-07-01"),
      usageType: "Investment",
      isCurrentPeriod: true,
    });

    // Loan (80% LVR, P&I)
    await db.insert(loans).values({
      propertyId: propId1,
      loanType: "Principal & Interest",
      lender: "Commonwealth Bank",
      originalAmount: 52000000, // $520,000 (80% LVR)
      currentBalance: 48000000, // $480,000 (paid down)
      interestRate: 565, // 5.65%
      startDate: new Date("2020-06-15"),
      loanTerm: 30,
      repaymentFrequency: "Monthly",
      isInterestOnly: false,
    });

    // Valuations
    await db.insert(propertyValuations).values([
      {
        propertyId: propId1,
        valuationDate: new Date("2020-06-15"),
        estimatedValue: 65000000,
        valuationMethod: "Purchase Price",
      },
      {
        propertyId: propId1,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 78000000, // $780,000 (20% growth over 4.5 years)
        valuationMethod: "Market Estimate",
      },
    ]);

    // Growth Rate
    await db.insert(growthRatePeriods).values({
      propertyId: propId1,
      startDate: new Date("2020-06-15"),
      annualGrowthRate: 475, // 4.75% p.a.
      isCurrentPeriod: true,
    });

    // Rental Income
    await db.insert(rentalIncome).values({
      propertyId: propId1,
      weeklyRent: 65000, // $650/week
      startDate: new Date("2020-07-01"),
      isCurrentRent: true,
    });

    // Expenses
    const [expense1] = await db.insert(expenseLogs).values({
      propertyId: propId1,
      year: 2024,
      totalExpenses: 1520000, // $15,200/year
    }).$returningId();

    await db.insert(expenseBreakdown).values([
      { expenseLogId: expense1.id, category: "Council Rates", amount: 280000 }, // $2,800
      { expenseLogId: expense1.id, category: "Water Rates", amount: 140000 }, // $1,400
      { expenseLogId: expense1.id, category: "Strata Fees", amount: 600000 }, // $6,000
      { expenseLogId: expense1.id, category: "Property Management", amount: 280000 }, // $2,800 (~8.3% of rent)
      { expenseLogId: expense1.id, category: "Insurance", amount: 120000 }, // $1,200
      { expenseLogId: expense1.id, category: "Repairs & Maintenance", amount: 100000 }, // $1,000
    ]);

    // Depreciation
    await db.insert(depreciationSchedule).values({
      propertyId: propId1,
      asAtDate: new Date("2024-07-01"),
      annualAmount: 950000, // $9,500/year
    });

    console.log("✓ Brisbane apartment complete");

    // ========================================
    // PROPERTY 2: Sydney Investment House
    // ========================================
    console.log("\n🏡 Creating Property 2: Sydney Investment House...");
    const [prop2] = await db.insert(properties).values({
      userId: userId,
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
    }).$returningId();
    const propId2 = prop2.id;

    await db.insert(propertyOwnership).values({
      propertyId: propId2,
      ownerName: "Smith Property Holdings Pty Ltd",
      ownershipPercentage: 10000,
    });

    // NSW stamp duty (~4-5% for investment)
    await db.insert(purchaseCosts).values({
      propertyId: propId2,
      stampDuty: 5500000, // $55,000
      legalFees: 300000, // $3,000
      inspectionFees: 100000, // $1,000
      otherCosts: 200000, // $2,000
    });

    await db.insert(propertyUsagePeriods).values({
      propertyId: propId2,
      startDate: new Date("2021-04-01"),
      usageType: "Investment",
      isCurrentPeriod: true,
    });

    // Interest Only loan for 5 years
    await db.insert(loans).values({
      propertyId: propId2,
      loanType: "Interest Only",
      lender: "Westpac",
      originalAmount: 100000000, // $1,000,000 (80% LVR)
      currentBalance: 100000000,
      interestRate: 595, // 5.95%
      startDate: new Date("2021-03-20"),
      loanTerm: 30,
      repaymentFrequency: "Monthly",
      isInterestOnly: true,
      interestOnlyPeriod: 5,
    });

    await db.insert(propertyValuations).values([
      {
        propertyId: propId2,
        valuationDate: new Date("2021-03-20"),
        estimatedValue: 125000000,
        valuationMethod: "Purchase Price",
      },
      {
        propertyId: propId2,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 145000000, // $1,450,000 (16% growth)
        valuationMethod: "Market Estimate",
      },
    ]);

    await db.insert(growthRatePeriods).values({
      propertyId: propId2,
      startDate: new Date("2021-03-20"),
      annualGrowthRate: 525, // 5.25% p.a.
      isCurrentPeriod: true,
    });

    await db.insert(rentalIncome).values({
      propertyId: propId2,
      weeklyRent: 95000, // $950/week
      startDate: new Date("2021-04-01"),
      isCurrentRent: true,
    });

    const [expense2] = await db.insert(expenseLogs).values({
      propertyId: propId2,
      year: 2024,
      totalExpenses: 1680000, // $16,800/year
    }).$returningId();

    await db.insert(expenseBreakdown).values([
      { expenseLogId: expense2.id, category: "Council Rates", amount: 350000 }, // $3,500
      { expenseLogId: expense2.id, category: "Water Rates", amount: 180000 }, // $1,800
      { expenseLogId: expense2.id, category: "Property Management", amount: 410000 }, // $4,100
      { expenseLogId: expense2.id, category: "Insurance", amount: 180000 }, // $1,800
      { expenseLogId: expense2.id, category: "Repairs & Maintenance", amount: 560000 }, // $5,600
    ]);

    await db.insert(depreciationSchedule).values({
      propertyId: propId2,
      asAtDate: new Date("2024-07-01"),
      annualAmount: 1200000, // $12,000/year
    });

    // Renovation
    await db.insert(capitalExpenditure).values({
      propertyId: propId2,
      name: "Kitchen & Bathroom Renovation",
      amount: 6500000, // $65,000
      date: new Date("2023-08-15"),
    });

    console.log("✓ Sydney house complete");

    // ========================================
    // PROPERTY 3: Melbourne PPOR
    // ========================================
    console.log("\n🏠 Creating Property 3: Melbourne PPOR (Owner-Occupied)...");
    const [prop3] = await db.insert(properties).values({
      userId: userId,
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
    }).$returningId();
    const propId3 = prop3.id;

    await db.insert(propertyOwnership).values([
      { propertyId: propId3, ownerName: "John Smith", ownershipPercentage: 5000 },
      { propertyId: propId3, ownerName: "Jane Smith", ownershipPercentage: 5000 },
    ]);

    // VIC stamp duty (with PPOR concessions)
    await db.insert(purchaseCosts).values({
      propertyId: propId3,
      stampDuty: 5000000, // $50,000 (with concessions)
      legalFees: 250000, // $2,500
      inspectionFees: 80000, // $800
      otherCosts: 150000, // $1,500
    });

    await db.insert(propertyUsagePeriods).values({
      propertyId: propId3,
      startDate: new Date("2022-01-10"),
      usageType: "Owner Occupied",
      isCurrentPeriod: true,
    });

    // Owner-occupied loan (lower rate)
    await db.insert(loans).values({
      propertyId: propId3,
      loanType: "Principal & Interest",
      lender: "NAB",
      originalAmount: 73600000, // $736,000 (80% LVR)
      currentBalance: 68500000, // $685,000
      interestRate: 615, // 6.15%
      startDate: new Date("2022-01-10"),
      loanTerm: 30,
      repaymentFrequency: "Monthly",
      isInterestOnly: false,
    });

    await db.insert(propertyValuations).values([
      {
        propertyId: propId3,
        valuationDate: new Date("2022-01-10"),
        estimatedValue: 92000000,
        valuationMethod: "Purchase Price",
      },
      {
        propertyId: propId3,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 103000000, // $1,030,000 (~12% growth)
        valuationMethod: "Market Estimate",
      },
    ]);

    await db.insert(growthRatePeriods).values({
      propertyId: propId3,
      startDate: new Date("2022-01-10"),
      annualGrowthRate: 450, // 4.5% p.a.
      isCurrentPeriod: true,
    });

    // No rental income (owner-occupied)

    // Expenses (owner pays these)
    const [expense3] = await db.insert(expenseLogs).values({
      propertyId: propId3,
      year: 2024,
      totalExpenses: 980000, // $9,800/year
    }).$returningId();

    await db.insert(expenseBreakdown).values([
      { expenseLogId: expense3.id, category: "Council Rates", amount: 320000 }, // $3,200
      { expenseLogId: expense3.id, category: "Water Rates", amount: 160000 }, // $1,600
      { expenseLogId: expense3.id, category: "Insurance", amount: 200000 }, // $2,000
      { expenseLogId: expense3.id, category: "Repairs & Maintenance", amount: 300000 }, // $3,000
    ]);

    console.log("✓ Melbourne PPOR complete");

    // ========================================
    // PROPERTY 4: Gold Coast Development Opportunity
    // ========================================
    console.log("\n🏗️  Creating Property 4: Gold Coast Development Site...");
    const [prop4] = await db.insert(properties).values({
      userId: userId,
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
    }).$returningId();
    const propId4 = prop4.id;

    await db.insert(propertyOwnership).values({
      propertyId: propId4,
      ownerName: "Smith Development Trust",
      ownershipPercentage: 10000,
    });

    await db.insert(purchaseCosts).values({
      propertyId: propId4,
      stampDuty: 7200000, // $72,000
      legalFees: 400000, // $4,000
      inspectionFees: 150000, // $1,500
      otherCosts: 300000, // $3,000
    });

    await db.insert(propertyUsagePeriods).values({
      propertyId: propId4,
      startDate: new Date("2023-09-05"),
      usageType: "Investment",
      isCurrentPeriod: true,
    });

    // Development loan (interest only)
    await db.insert(loans).values({
      propertyId: propId4,
      loanType: "Interest Only",
      lender: "ANZ",
      originalAmount: 135000000, // $1,350,000 (75% LVR)
      currentBalance: 135000000,
      interestRate: 725, // 7.25% (development rate)
      startDate: new Date("2023-09-05"),
      loanTerm: 5,
      repaymentFrequency: "Monthly",
      isInterestOnly: true,
      interestOnlyPeriod: 5,
    });

    await db.insert(propertyValuations).values([
      {
        propertyId: propId4,
        valuationDate: new Date("2023-09-05"),
        estimatedValue: 180000000,
        valuationMethod: "Purchase Price",
      },
      {
        propertyId: propId4,
        valuationDate: new Date("2024-12-01"),
        estimatedValue: 192000000, // $1,920,000 (post-development potential)
        valuationMethod: "Market Estimate",
      },
    ]);

    await db.insert(growthRatePeriods).values({
      propertyId: propId4,
      startDate: new Date("2023-09-05"),
      annualGrowthRate: 650, // 6.5% p.a. (development area)
      isCurrentPeriod: true,
    });

    // Currently under development - no rental income

    const [expense4] = await db.insert(expenseLogs).values({
      propertyId: propId4,
      year: 2024,
      totalExpenses: 1200000, // $12,000/year (holding costs)
    }).$returningId();

    await db.insert(expenseBreakdown).values([
      { expenseLogId: expense4.id, category: "Council Rates", amount: 480000 }, // $4,800
      { expenseLogId: expense4.id, category: "Water Rates", amount: 200000 }, // $2,000
      { expenseLogId: expense4.id, category: "Insurance", amount: 320000 }, // $3,200
      { expenseLogId: expense4.id, category: "Security & Maintenance", amount: 200000 }, // $2,000
    ]);

    // Development costs
    await db.insert(capitalExpenditure).values({
      propertyId: propId4,
      name: "Subdivision & Development Approval",
      amount: 15000000, // $150,000
      date: new Date("2024-03-01"),
    });

    console.log("✓ Gold Coast development complete");

    // ========================================
    // SUMMARY
    // ========================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ AUSTRALIAN PROPERTY PORTFOLIO - TEST DATA COMPLETE");
    console.log("=".repeat(60));
    console.log("\n📊 PORTFOLIO SUMMARY:\n");
    
    console.log("Property 1: Brisbane CBD Apartment");
    console.log("  • Purchase: $650,000 (2020) → Current: $780,000");
    console.log("  • Loan: $480,000 @ 5.65% P&I");
    console.log("  • Rental: $650/week ($33,800/year)");
    console.log("  • Expenses: $15,200/year");
    console.log("  • Net Yield: 2.85% | Equity: $300,000\n");
    
    console.log("Property 2: Sydney Parramatta House");
    console.log("  • Purchase: $1,250,000 (2021) → Current: $1,450,000");
    console.log("  • Loan: $1,000,000 @ 5.95% IO");
    console.log("  • Rental: $950/week ($49,400/year)");
    console.log("  • Expenses: $16,800/year");
    console.log("  • Net Yield: 2.25% | Equity: $450,000\n");
    
    console.log("Property 3: Melbourne PPOR");
    console.log("  • Purchase: $920,000 (2022) → Current: $1,030,000");
    console.log("  • Loan: $685,000 @ 6.15% P&I");
    console.log("  • Owner Occupied (No rental income)");
    console.log("  • Expenses: $9,800/year");
    console.log("  • Equity: $345,000\n");
    
    console.log("Property 4: Gold Coast Development");
    console.log("  • Purchase: $1,800,000 (2023) → Current: $1,920,000");
    console.log("  • Loan: $1,350,000 @ 7.25% IO");
    console.log("  • Development Site (No rental income)");
    console.log("  • Holding Costs: $12,000/year");
    console.log("  • Equity: $570,000\n");
    
    console.log("─".repeat(60));
    console.log("TOTAL PORTFOLIO VALUE: $5,180,000");
    console.log("TOTAL DEBT: $3,515,000");
    console.log("TOTAL EQUITY: $1,665,000 (32.1% equity)");
    console.log("ANNUAL RENTAL INCOME: $83,200");
    console.log("ANNUAL EXPENSES: $54,000");
    console.log("NET OPERATING INCOME: $29,200/year");
    console.log("─".repeat(60));
    
    console.log("\n🎯 Next Steps:");
    console.log("  1. Login to the application");
    console.log("  2. View your dashboard with 4 properties");
    console.log("  3. Explore property details, cash flow, and projections");
    console.log("  4. Test the premium features with this comprehensive data\n");

  } catch (error) {
    console.error("\n❌ Error seeding data:", error);
    throw error;
  }
}

seedAustralianProperties()
  .then(() => {
    console.log("✓ Seeding completed successfully\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Seeding failed:", error);
    process.exit(1);
  });
