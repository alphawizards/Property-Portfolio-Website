/**
 * Comprehensive Australian Property Portfolio Seeder
 * 
 * Creates 4 realistic Australian properties with complete financial data:
 * 1. Brisbane CBD Apartment - Investment property with positive cash flow
 * 2. Sydney Parramatta House - Investment with renovations
 * 3. Melbourne PPOR - Owner-occupied primary residence
 * 4. Gold Coast Development - Development opportunity
 * 
 * Demo User: demo@propertywizards.com
 */

import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function seedComprehensiveData() {
  console.log("🇦🇺 Seeding Comprehensive Australian Property Portfolio...\n");
  
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log("✅ Connected to database\n");
    
    // ============================================================================
    // CREATE DEMO USER
    // ============================================================================
    console.log("👤 Creating demo user...");
    const userResult = await client.query(`
      INSERT INTO users (
        "openId", name, email, "loginMethod", role, "is_active", 
        "createdAt", "updatedAt", "lastSignedIn"
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
      ON CONFLICT ("openId") DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        "lastSignedIn" = NOW()
      RETURNING id
    `, ['demo-user-golden-master', 'Demo User', 'demo@propertywizards.com', 'email', 'user', true]);
    
    const userId = userResult.rows[0].id;
    console.log(`✓ Demo user ready (ID: ${userId})\n`);
    
    // ============================================================================
    // PROPERTY 1: BRISBANE CBD APARTMENT
    // Investment property with positive cash flow, 4.5 years old
    // ============================================================================
    console.log("🏢 Property 1: Brisbane CBD Apartment");
    const prop1Result = await client.query(`
      INSERT INTO properties (
        "userId", nickname, address, state, suburb, "propertyType",
        "ownershipStructure", "linkedEntity", "purchaseDate", "purchasePrice", 
        status, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `, [
      userId, 'Brisbane CBD Apartment', 'Unit 507, 123 Queen Street, Brisbane QLD 4000',
      'Queensland', 'Brisbane City', 'Residential', 'Trust', 'Smith Family Trust',
      '2020-06-15', 65000000, 'Actual' // $650,000
    ]);
    const prop1Id = prop1Result.rows[0].id;
    console.log(`  ✓ Created (ID: ${prop1Id})`);
    
    // Ownership
    await client.query(`
      INSERT INTO property_ownership ("propertyId", "ownerName", percentage)
      VALUES ($1, $2, $3), ($1, $4, $5)
    `, [prop1Id, 'John Smith', 5000, 'Jane Smith', 5000]);
    
    // Purchase costs
    await client.query(`
      INSERT INTO purchase_costs ("propertyId", "stampDuty", "legalFee", "inspectionFee", "otherCosts")
      VALUES ($1, $2, $3, $4, $5)
    `, [prop1Id, 2400000, 200000, 60000, 150000]); // $24k + $2k + $600 + $1.5k
    
    // Usage period
    await client.query(`
      INSERT INTO property_usage_periods ("propertyId", "startDate", "usageType")
      VALUES ($1, $2, $3)
    `, [prop1Id, '2020-07-01', 'Investment']);
    
    // Valuations
    await client.query(`
      INSERT INTO property_valuations ("propertyId", "valuationDate", value)
      VALUES ($1, $2, $3), ($1, $4, $5)
    `, [prop1Id, '2020-06-15', 65000000, '2024-12-09', 78000000]); // $650k → $780k
    
    // Loan
    await client.query(`
      INSERT INTO loans (
        "propertyId", "loanType", "lenderName", "loanPurpose", "loanStructure",
        "originalAmount", "currentAmount", "interestRate", "startDate",
        "remainingTermYears", "repaymentFrequency", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `, [prop1Id, 'PrincipalLoan', 'Commonwealth Bank', 'PropertyPurchase', 
        'PrincipalAndInterest', 52000000, 48000000, 565, '2020-06-15', 25, 'Monthly']);
    
    // Rental income
    await client.query(`
      INSERT INTO rental_income ("propertyId", "startDate", amount, frequency, "growthRate")
      VALUES ($1, $2, $3, $4, $5)
    `, [prop1Id, '2020-07-01', 65000, 'Weekly', 300]); // $650/week, 3% growth
    
    // Expenses
    const expense1Result = await client.query(`
      INSERT INTO expense_logs ("propertyId", date, "totalAmount", frequency, "growthRate")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [prop1Id, '2024-01-01', 120000, 'Monthly', 300]); // $1,200/month
    
    const expense1Id = expense1Result.rows[0].id;
    await client.query(`
      INSERT INTO expense_breakdown ("expenseLogId", category, amount)
      VALUES 
        ($1, 'Council Rates', 280000),
        ($1, 'Water Rates', 140000),
        ($1, 'Strata Fees', 600000),
        ($1, 'Property Management', 280000),
        ($1, 'Insurance', 120000),
        ($1, 'Repairs & Maintenance', 100000)
    `, [expense1Id]);
    
    // Depreciation
    await client.query(`
      INSERT INTO depreciation_schedule ("propertyId", "asAtDate", "annualAmount")
      VALUES ($1, $2, $3)
    `, [prop1Id, '2024-07-01', 950000]); // $9,500/year
    
    // Growth rate
    await client.query(`
      INSERT INTO growth_rate_periods ("propertyId", "startYear", "endYear", "growthRate")
      VALUES ($1, $2, $3, $4)
    `, [prop1Id, 2025, null, 475]); // 4.75% ongoing
    
    console.log("  ✓ Complete with loans, rental, expenses, and depreciation\n");
    
    // ============================================================================
    // PROPERTY 2: SYDNEY PARRAMATTA HOUSE
    // Investment property with renovations, higher value
    // ============================================================================
    console.log("🏡 Property 2: Sydney Parramatta House");
    const prop2Result = await client.query(`
      INSERT INTO properties (
        "userId", nickname, address, state, suburb, "propertyType",
        "ownershipStructure", "linkedEntity", "purchaseDate", "purchasePrice", 
        status, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `, [
      userId, 'Sydney Parramatta House', '45 George Street, Parramatta NSW 2150',
      'New South Wales', 'Parramatta', 'Residential', 'Company', 
      'Smith Property Holdings Pty Ltd', '2021-03-20', 125000000, 'Actual' // $1.25M
    ]);
    const prop2Id = prop2Result.rows[0].id;
    console.log(`  ✓ Created (ID: ${prop2Id})`);
    
    // Ownership
    await client.query(`
      INSERT INTO property_ownership ("propertyId", "ownerName", "percentage")
      VALUES ($1, $2, $3)
    `, [prop2Id, 'Smith Property Holdings Pty Ltd', 10000]);
    
    // Purchase costs
    await client.query(`
      INSERT INTO purchase_costs ("propertyId", "stampDuty", "legalFee", "inspectionFee", "otherCosts")
      VALUES ($1, $2, $3, $4, $5)
    `, [prop2Id, 5500000, 300000, 100000, 200000]); // $55k + $3k + $1k + $2k
    
    // Usage period
    await client.query(`
      INSERT INTO property_usage_periods ("propertyId", "startDate", "usageType")
      VALUES ($1, $2, $3)
    `, [prop2Id, '2021-04-01', 'Investment']);
    
    // Valuations
    await client.query(`
      INSERT INTO property_valuations ("propertyId", "valuationDate", value)
      VALUES ($1, $2, $3), ($1, $4, $5)
    `, [prop2Id, '2021-03-20', 125000000, '2024-12-09', 145000000]); // $1.25M → $1.45M
    
    // Loan (Interest Only)
    await client.query(`
      INSERT INTO loans (
        "propertyId", "loanType", "lenderName", "loanPurpose", "loanStructure",
        "originalAmount", "currentAmount", "interestRate", "startDate",
        "remainingTermYears", "remainingIOPeriodYears", "repaymentFrequency", 
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [prop2Id, 'PrincipalLoan', 'Westpac', 'PropertyPurchase', 'InterestOnly',
        100000000, 100000000, 595, '2021-03-20', 26, 1, 'Monthly']); // $1M @ 5.95% IO
    
    // Rental income
    await client.query(`
      INSERT INTO rental_income ("propertyId", "startDate", amount, frequency, "growthRate")
      VALUES ($1, $2, $3, $4, $5)
    `, [prop2Id, '2021-04-01', 95000, 'Weekly', 300]); // $950/week
    
    // Expenses
    const expense2Result = await client.query(`
      INSERT INTO expense_logs ("propertyId", date, "totalAmount", frequency, "growthRate")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [prop2Id, '2024-01-01', 140000, 'Monthly', 300]); // $1,400/month
    
    const expense2Id = expense2Result.rows[0].id;
    await client.query(`
      INSERT INTO expense_breakdown ("expenseLogId", category, amount)
      VALUES 
        ($1, 'Council Rates', 350000),
        ($1, 'Water Rates', 180000),
        ($1, 'Property Management', 410000),
        ($1, 'Insurance', 180000),
        ($1, 'Repairs & Maintenance', 560000)
    `, [expense2Id]);
    
    // Depreciation
    await client.query(`
      INSERT INTO depreciation_schedule ("propertyId", "asAtDate", "annualAmount")
      VALUES ($1, $2, $3)
    `, [prop2Id, '2024-07-01', 1200000]); // $12,000/year
    
    // Capital expenditure (renovation)
    await client.query(`
      INSERT INTO capital_expenditure ("propertyId", name, amount, date)
      VALUES ($1, $2, $3, $4)
    `, [prop2Id, 'Kitchen & Bathroom Renovation', 6500000, '2023-08-15']); // $65k
    
    // Growth rate
    await client.query(`
      INSERT INTO growth_rate_periods ("propertyId", "startYear", "endYear", "growthRate")
      VALUES ($1, $2, $3, $4)
    `, [prop2Id, 2025, null, 525]); // 5.25% ongoing
    
    console.log("  ✓ Complete with renovation, IO loan, and higher yield\n");
    
    // ============================================================================
    // PROPERTY 3: MELBOURNE PPOR (PRIMARY PLACE OF RESIDENCE)
    // Owner-occupied, no rental income
    // ============================================================================
    console.log("🏠 Property 3: Melbourne PPOR");
    const prop3Result = await client.query(`
      INSERT INTO properties (
        "userId", nickname, address, state, suburb, "propertyType",
        "ownershipStructure", "purchaseDate", "purchasePrice", 
        status, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `, [
      userId, 'Melbourne Home', '78 Collins Street, Melbourne VIC 3000',
      'Victoria', 'Melbourne', 'Residential', 'Individual',
      '2022-01-10', 92000000, 'Actual' // $920k
    ]);
    const prop3Id = prop3Result.rows[0].id;
    console.log(`  ✓ Created (ID: ${prop3Id})`);
    
    // Ownership (joint)
    await client.query(`
      INSERT INTO property_ownership ("propertyId", "ownerName", "percentage")
      VALUES ($1, $2, $3), ($1, $4, $5)
    `, [prop3Id, 'John Smith', 5000, 'Jane Smith', 5000]);
    
    // Purchase costs
    await client.query(`
      INSERT INTO purchase_costs ("propertyId", "stampDuty", "legalFee", "inspectionFee", "otherCosts")
      VALUES ($1, $2, $3, $4, $5)
    `, [prop3Id, 5000000, 250000, 80000, 150000]); // $50k + $2.5k + $800 + $1.5k
    
    // Usage period (owner occupied)
    await client.query(`
      INSERT INTO property_usage_periods ("propertyId", "startDate", "usageType")
      VALUES ($1, $2, $3)
    `, [prop3Id, '2022-01-10', 'PPOR']);
    
    // Valuations
    await client.query(`
      INSERT INTO property_valuations ("propertyId", "valuationDate", value)
      VALUES ($1, $2, $3), ($1, $4, $5)
    `, [prop3Id, '2022-01-10', 92000000, '2024-12-09', 103000000]); // $920k → $1.03M
    
    // Loan (P&I, owner occupied typically lower rate)
    await client.query(`
      INSERT INTO loans (
        "propertyId", "loanType", "lenderName", "loanPurpose", "loanStructure",
        "originalAmount", "currentAmount", "interestRate", "startDate",
        "remainingTermYears", "repaymentFrequency", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `, [prop3Id, 'PrincipalLoan', 'NAB', 'PropertyPurchase', 'PrincipalAndInterest',
        73600000, 68500000, 615, '2022-01-10', 27, 'Monthly']); // $736k → $685k @ 6.15%
    
    // No rental income (owner occupied)
    
    // Expenses (owner pays these)
    const expense3Result = await client.query(`
      INSERT INTO expense_logs ("propertyId", date, "totalAmount", frequency, "growthRate")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [prop3Id, '2024-01-01', 82000, 'Monthly', 300]); // $820/month
    
    const expense3Id = expense3Result.rows[0].id;
    await client.query(`
      INSERT INTO expense_breakdown ("expenseLogId", category, amount)
      VALUES 
        ($1, 'Council Rates', 320000),
        ($1, 'Water Rates', 160000),
        ($1, 'Insurance', 200000),
        ($1, 'Repairs & Maintenance', 300000)
    `, [expense3Id]);
    
    // Growth rate
    await client.query(`
      INSERT INTO growth_rate_periods ("propertyId", "startYear", "endYear", "growthRate")
      VALUES ($1, $2, $3, $4)
    `, [prop3Id, 2025, null, 450]); // 4.5% ongoing
    
    console.log("  ✓ Complete (PPOR - no rental income)\n");
    
    // ============================================================================
    // PROPERTY 4: GOLD COAST DEVELOPMENT OPPORTUNITY
    // Development site, higher loan rate, holding costs
    // ============================================================================
    console.log("🏗️  Property 4: Gold Coast Development");
    const prop4Result = await client.query(`
      INSERT INTO properties (
        "userId", nickname, address, state, suburb, "propertyType",
        "ownershipStructure", "linkedEntity", "purchaseDate", "purchasePrice", 
        status, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `, [
      userId, 'Gold Coast Development', '12 Surfers Paradise Boulevard, Surfers Paradise QLD 4217',
      'Queensland', 'Surfers Paradise', 'Residential', 'Trust', 
      'Smith Development Trust', '2023-09-05', 180000000, 'Actual' // $1.8M
    ]);
    const prop4Id = prop4Result.rows[0].id;
    console.log(`  ✓ Created (ID: ${prop4Id})`);
    
    // Ownership
    await client.query(`
      INSERT INTO property_ownership ("propertyId", "ownerName", "percentage")
      VALUES ($1, $2, $3)
    `, [prop4Id, 'Smith Development Trust', 10000]);
    
    // Purchase costs
    await client.query(`
      INSERT INTO purchase_costs ("propertyId", "stampDuty", "legalFee", "inspectionFee", "otherCosts")
      VALUES ($1, $2, $3, $4, $5)
    `, [prop4Id, 7200000, 400000, 150000, 300000]); // $72k + $4k + $1.5k + $3k
    
    // Usage period
    await client.query(`
      INSERT INTO property_usage_periods ("propertyId", "startDate", "usageType")
      VALUES ($1, $2, $3)
    `, [prop4Id, '2023-09-05', 'Investment']);
    
    // Valuations
    await client.query(`
      INSERT INTO property_valuations ("propertyId", "valuationDate", value)
      VALUES ($1, $2, $3), ($1, $4, $5)
    `, [prop4Id, '2023-09-05', 180000000, '2024-12-09', 192000000]); // $1.8M → $1.92M
    
    // Development loan (higher rate, IO)
    await client.query(`
      INSERT INTO loans (
        "propertyId", "loanType", "lenderName", "loanPurpose", "loanStructure",
        "originalAmount", "currentAmount", "interestRate", "startDate",
        "remainingTermYears", "remainingIOPeriodYears", "repaymentFrequency", 
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [prop4Id, 'PrincipalLoan', 'ANZ', 'PropertyPurchase', 'InterestOnly',
        135000000, 135000000, 725, '2023-09-05', 4, 4, 'Monthly']); // $1.35M @ 7.25%
    
    // No rental (under development)
    
    // Holding costs
    const expense4Result = await client.query(`
      INSERT INTO expense_logs ("propertyId", date, "totalAmount", frequency, "growthRate")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [prop4Id, '2024-01-01', 100000, 'Monthly', 300]); // $1,000/month
    
    const expense4Id = expense4Result.rows[0].id;
    await client.query(`
      INSERT INTO expense_breakdown ("expenseLogId", category, amount)
      VALUES 
        ($1, 'Council Rates', 480000),
        ($1, 'Water Rates', 200000),
        ($1, 'Insurance', 320000),
        ($1, 'Security & Maintenance', 200000)
    `, [expense4Id]);
    
    // Capital expenditure (development costs)
    await client.query(`
      INSERT INTO capital_expenditure ("propertyId", name, amount, date)
      VALUES ($1, $2, $3, $4)
    `, [prop4Id, 'Subdivision & Development Approval', 15000000, '2024-03-01']); // $150k
    
    // Growth rate (development area)
    await client.query(`
      INSERT INTO growth_rate_periods ("propertyId", "startYear", "endYear", "growthRate")
      VALUES ($1, $2, $3, $4)
    `, [prop4Id, 2025, null, 650]); // 6.5% ongoing
    
    console.log("  ✓ Complete (development site with holding costs)\n");
    
    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log("=".repeat(70));
    console.log("✅ COMPREHENSIVE AUSTRALIAN PORTFOLIO - SEEDING COMPLETE");
    console.log("=".repeat(70));
    console.log("\n📊 PORTFOLIO SUMMARY:\n");
    
    console.log("Property 1: Brisbane CBD Apartment");
    console.log("  • Purchase: $650,000 (2020) → Current: $780,000 (+20%)");
    console.log("  • Loan: $480,000 @ 5.65% P&I");
    console.log("  • Rental: $650/week ($33,800/year)");
    console.log("  • Expenses: $14,400/year");
    console.log("  • Depreciation: $9,500/year");
    console.log("  • Net Yield: 2.49% | Equity: $300,000\n");
    
    console.log("Property 2: Sydney Parramatta House");
    console.log("  • Purchase: $1,250,000 (2021) → Current: $1,450,000 (+16%)");
    console.log("  • Loan: $1,000,000 @ 5.95% IO");
    console.log("  • Rental: $950/week ($49,400/year)");
    console.log("  • Expenses: $16,800/year");
    console.log("  • Depreciation: $12,000/year");
    console.log("  • Renovation: $65,000 (2023)");
    console.log("  • Net Yield: 2.25% | Equity: $450,000\n");
    
    console.log("Property 3: Melbourne PPOR");
    console.log("  • Purchase: $920,000 (2022) → Current: $1,030,000 (+12%)");
    console.log("  • Loan: $685,000 @ 6.15% P&I");
    console.log("  • Owner Occupied (No rental income)");
    console.log("  • Expenses: $9,840/year");
    console.log("  • Equity: $345,000\n");
    
    console.log("Property 4: Gold Coast Development");
    console.log("  • Purchase: $1,800,000 (2023) → Current: $1,920,000 (+6.7%)");
    console.log("  • Loan: $1,350,000 @ 7.25% IO (development rate)");
    console.log("  • Development Site (No rental)");
    console.log("  • Holding Costs: $12,000/year");
    console.log("  • Development Costs: $150,000");
    console.log("  • Equity: $570,000\n");
    
    console.log("─".repeat(70));
    console.log("TOTAL PORTFOLIO VALUE: $5,180,000");
    console.log("TOTAL DEBT: $3,515,000");
    console.log("TOTAL EQUITY: $1,665,000 (32.1%)");
    console.log("ANNUAL RENTAL INCOME: $83,200");
    console.log("ANNUAL EXPENSES: $53,040");
    console.log("NET OPERATING INCOME: $30,160/year (before interest)");
    console.log("DEPRECIATION BENEFITS: $21,500/year");
    console.log("─".repeat(70));
    
    console.log("\n🎯 Demo User Credentials:");
    console.log("  Email: demo@propertywizards.com");
    console.log("  User ID: " + userId);
    console.log("\n✨ Ready to view in the application!\n");
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ Error seeding comprehensive data:");
    console.error("Message:", error.message);
    if (error.detail) console.error("Detail:", error.detail);
    if (error.stack) console.error("\nStack:", error.stack);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

seedComprehensiveData();
