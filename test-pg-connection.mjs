/**
 * Test PostgreSQL database connection
 * Tests connection to PlanetScale PostgreSQL database
 */

import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function testConnection() {
  console.log("🔌 Testing PostgreSQL database connection...\n");
  
  const dbUrl = process.env.DATABASE_URL;
  console.log("Database URL:", dbUrl ? `${dbUrl.substring(0, 40)}...` : "NOT SET");
  
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set in .env file");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    console.log("Attempting connection...");
    await client.connect();
    console.log("✅ Connected!");
    
    // Test query
    console.log("\nExecuting test query...");
    const result = await client.query("SELECT 1 + 1 AS result");
    console.log("Query result:", result.rows[0]);
    
    // Check for existing tables
    console.log("\nChecking existing tables...");
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Found ${tablesResult.rows.length} table(s)`);
    if (tablesResult.rows.length > 0) {
      console.log("Existing tables:", tablesResult.rows.map(r => r.table_name));
    } else {
      console.log("Database is empty - ready for schema creation");
    }
    
    await client.end();
    console.log("\n✅ Database connection test successful!");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("Error:", error.message);
    if (error.code) console.error("Code:", error.code);
    
    await client.end().catch(() => {});
    process.exit(1);
  }
}

testConnection();
