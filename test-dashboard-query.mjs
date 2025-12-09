import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();
const sql = postgres(process.env.DATABASE_URL);

try {
  // Test what getDashboard query is executing
  const userId = 20;
  const scenarioId = null;
  
  console.log('Testing query with userId:', userId, 'scenarioId:', scenarioId);
  
  const properties = await sql`
    SELECT * FROM properties 
    WHERE "userId" = ${userId} 
    AND "scenarioId" IS NULL
    ORDER BY "createdAt" DESC
  `;
  
  console.log('\n✅ Found', properties.length, 'properties');
  
  if (properties.length > 0) {
    console.log('\nFirst 3 properties:');
    properties.slice(0, 3).forEach((p, i) => {
      console.log(`${i+1}. ${p.nickname} (ID: ${p.id})`);
    });
  }
  
  // Also check if there are any properties with scenarioId not null
  const withScenario = await sql`
    SELECT COUNT(*) as count FROM properties 
    WHERE "userId" = ${userId} AND "scenarioId" IS NOT NULL
  `;
  console.log('\nProperties with scenarioId:', withScenario[0].count);
  
} catch (error) {
  console.error('Error:', error);
} finally {
  await sql.end();
}
