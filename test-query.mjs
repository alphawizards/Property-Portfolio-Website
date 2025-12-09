import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

console.log('Testing the failing query...\n');

try {
  const result = await sql`
    SELECT id, "userId", "portfolioId", "scenarioId", nickname, address, 
           state, suburb, "propertyType", "ownershipStructure", "linkedEntity",
           "purchaseDate", "purchasePrice", "saleDate", "salePrice", status,
           "createdAt", "updatedAt"
    FROM properties
    WHERE "userId" = 20 AND "scenarioId" IS NULL
    ORDER BY "createdAt" DESC
  `;
  
  console.log(`✅ Query successful - found ${result.length} properties`);
  if (result.length > 0) {
    console.log('\nFirst property:', {
      id: result[0].id,
      nickname: result[0].nickname,
      purchasePrice: result[0].purchasePrice
    });
  }
  
} catch (error) {
  console.error('❌ Query failed:', error);
} finally {
  await sql.end();
}
