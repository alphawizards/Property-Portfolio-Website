/**
 * Migration script: Assign existing properties to default portfolios
 * 
 * This script creates a default portfolio for each user and assigns
 * all their existing properties to that portfolio.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq, isNull } from 'drizzle-orm';
import { mysqlTable, int, varchar, text, mysqlEnum, timestamp, datetime } from 'drizzle-orm/mysql-core';

// Define tables inline to avoid TypeScript import issues
const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["Normal", "Trust", "Company"]).default("Normal").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  portfolioId: int("portfolioId"),
  nickname: varchar("nickname", { length: 255 }).notNull(),
  address: text("address").notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  suburb: varchar("suburb", { length: 255 }).notNull(),
  propertyType: mysqlEnum("propertyType", ["Residential", "Commercial", "Industrial", "Land"]).default("Residential").notNull(),
  ownershipStructure: mysqlEnum("ownershipStructure", ["Trust", "Individual", "Company", "Partnership"]).notNull(),
  linkedEntity: varchar("linkedEntity", { length: 255 }),
  purchaseDate: datetime("purchaseDate").notNull(),
  purchasePrice: int("purchasePrice").notNull(),
  saleDate: datetime("saleDate"),
  salePrice: int("salePrice"),
  status: mysqlEnum("status", ["Actual", "Projected"]).default("Actual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function migrateToPortfolios() {
  console.log('🚀 Starting portfolio migration...\n');

  // Create database connection
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 1. Find all properties without a portfolio
    const orphanedProperties = await db
      .select()
      .from(properties)
      .where(isNull(properties.portfolioId));

    console.log(`📊 Found ${orphanedProperties.length} properties without portfolios\n`);

    if (orphanedProperties.length === 0) {
      console.log('✅ No migration needed - all properties already have portfolios');
      return;
    }

    // 2. Group properties by userId
    const propertiesByUser = orphanedProperties.reduce((acc, prop) => {
      if (!acc[prop.userId]) {
        acc[prop.userId] = [];
      }
      acc[prop.userId].push(prop);
      return acc;
    }, {});

    const userIds = Object.keys(propertiesByUser);
    console.log(`👥 Found ${userIds.length} users with properties to migrate\n`);

    // 3. For each user, create a default portfolio and assign properties
    for (const userId of userIds) {
      const userProperties = propertiesByUser[userId];
      
      console.log(`Processing user ${userId} with ${userProperties.length} properties...`);

      // Create default portfolio
      const [newPortfolio] = await db.insert(portfolios).values({
        userId: parseInt(userId),
        name: 'My Portfolio',
        type: 'Normal',
        description: 'Default portfolio created during migration',
      });

      const portfolioId = newPortfolio.insertId;
      console.log(`  ✓ Created portfolio ${portfolioId}: "My Portfolio"`);

      // Assign all user's properties to this portfolio
      for (const prop of userProperties) {
        await db
          .update(properties)
          .set({ portfolioId })
          .where(eq(properties.id, prop.id));
      }

      console.log(`  ✓ Assigned ${userProperties.length} properties to portfolio\n`);
    }

    console.log('✅ Migration completed successfully!');
    console.log(`\nSummary:`);
    console.log(`  - Created ${userIds.length} default portfolios`);
    console.log(`  - Migrated ${orphanedProperties.length} properties`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
migrateToPortfolios()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
