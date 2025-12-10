/**
 * Quick database connection test
 * Tests if we can connect to PlanetScale and execute a simple query
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function testConnection() {
  console.log("🔌 Testing database connection...\n");
  
  const dbUrl = process.env.DATABASE_URL;
  console.log("Database URL:", dbUrl ? `${dbUrl.substring(0, 30)}...` : "NOT SET");
  
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set in .env file");
    process.exit(1);
  }

  try {
    // Create connection
    console.log("Attempting connection...");
    const connection = await mysql.createConnection(dbUrl);
    
    // Test query
    console.log("Executing test query...");
    const [result] = await connection.execute("SELECT 1 + 1 AS result");
    console.log("✅ Query result:", result);
    
    // Check if we can see tables
    console.log("\nChecking existing tables...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("Tables found:", tables.length);
    if (tables.length > 0) {
      console.log("Existing tables:", tables);
    } else {
      console.log("No tables yet - database is empty");
    }
    
    await connection.end();
    console.log("\n✅ Database connection successful!");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    process.exit(1);
  }
}

testConnection();
