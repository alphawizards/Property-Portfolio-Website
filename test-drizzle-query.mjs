import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, isNull, desc } from "drizzle-orm";
import * as schema from "./drizzle/schema-postgres.ts";
import dotenv from 'dotenv';

dotenv.config();

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

try {
  console.log('Testing Drizzle ORM query...\n');
  
  const userId = 20;
  const conditions = [eq(schema.properties.userId, userId)];
  conditions.push(isNull(schema.properties.scenarioId));
  
  const properties = await db
    .select()
    .from(schema.properties)
    .where(and(...conditions))
    .orderBy(desc(schema.properties.createdAt));
  
  console.log('✅ Found', properties.length, 'properties via Drizzle');
  
  if (properties.length > 0) {
    console.log('\nFirst 3:');
    properties.slice(0, 3).forEach((p, i) => {
      console.log(`${i+1}. ${p.nickname} (ID: ${p.id})`);
    });
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
} finally {
  await client.end();
}
