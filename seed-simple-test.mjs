/**
 * Simple test to insert data into the PostgreSQL database
 * Uses direct SQL to work with the existing schema
 */

import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function seedSimpleData() {
  console.log("🌱 Seeding simple test data...\n");
  
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log("✅ Connected to database\n");
    
    // Insert test user
    console.log("👤 Creating test user...");
    const userResult = await client.query(`
      INSERT INTO users (
        "openId", name, email, "loginMethod", role, "is_active", 
        "createdAt", "updatedAt", "lastSignedIn"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("openId") DO UPDATE SET
        name = EXCLUDED.name,
        "lastSignedIn" = NOW()
      RETURNING id
    `, ['test-user-123', 'Test User', 'test@example.com', 'email', 'user', true]);
    
    const userId = userResult.rows[0].id;
    console.log(`✓ User created/updated (ID: ${userId})\n`);
    
    // Insert a test property
    console.log("🏠 Creating test property...");
    const propertyResult = await client.query(`
      INSERT INTO properties (
        "userId", nickname, address, state, suburb, "propertyType",
        "ownershipStructure", "purchaseDate", "purchasePrice", status,
        "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
      RETURNING id
    `, [
      userId,
      'Sydney Test Property',
      '123 Test Street, Sydney NSW 2000',
      'New South Wales',
      'Sydney',
      'Residential',
      'Individual',
      '2020-01-15',
      65000000, // $650,000 in cents
      'Actual'
    ]);
    
    const propertyId = propertyResult.rows[0].id;
    console.log(`✓ Property created (ID: ${propertyId})\n`);
    
    // Insert property valuation
    console.log("📊 Adding valuation...");
    await client.query(`
      INSERT INTO property_valuations (
        "propertyId", "valuationDate", value
      )
      VALUES ($1, $2, $3)
    `, [propertyId, '2020-01-15', 65000000]);
    
    await client.query(`
      INSERT INTO property_valuations (
        "propertyId", "valuationDate", value
      )
      VALUES ($1, $2, $3)
    `, [propertyId, '2024-12-09', 78000000]);
    
    console.log("✓ Valuations added\n");
    
    // Insert loan
    console.log("💰 Adding loan...");
    await client.query(`
      INSERT INTO loans (
        "propertyId", "loanType", "lenderName", "loanPurpose", "loanStructure",
        "originalAmount", "currentAmount", "interestRate", "startDate",
        "remainingTermYears", "repaymentFrequency",
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `, [
      propertyId,
      'PrincipalLoan',
      'Commonwealth Bank',
      'PropertyPurchase',
      'PrincipalAndInterest',
      52000000, // $520k
      48000000, // $480k
      565, // 5.65%
      '2020-01-15',
      25, // remaining years
      'Monthly'
    ]);
    
    console.log("✓ Loan added\n");
    
    // Insert rental income
    console.log("💵 Adding rental income...");
    await client.query(`
      INSERT INTO rental_income (
        "propertyId", "startDate", amount, frequency, "growthRate"
      )
      VALUES ($1, $2, $3, $4, $5)
    `, [propertyId, '2020-02-01', 65000, 'Weekly', 300]); // $650/week, 3% growth
    
    console.log("✓ Rental income added\n");
    
    console.log("✅ Test data seeded successfully!\n");
    console.log("Property Summary:");
    console.log("  - Purchase Price: $650,000");
    console.log("  - Current Value: $780,000");
    console.log("  - Loan: $480,000 @ 5.65%");
    console.log("  - Rental: $650/week\n");
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error seeding data:");
    console.error(error.message);
    if (error.detail) console.error("Detail:", error.detail);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

seedSimpleData();
