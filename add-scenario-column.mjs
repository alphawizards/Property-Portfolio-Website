import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

console.log('Adding scenarioId column to properties table...\n');

try {
  await sql`
    ALTER TABLE properties 
    ADD COLUMN IF NOT EXISTS "scenarioId" INTEGER
  `;
  
  console.log('✅ Successfully added scenarioId column');
  
  // Verify it was added
  const columns = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'scenarioId'
  `;
  
  if (columns.length > 0) {
    console.log('✅ Verified: scenarioId column now exists');
  }
  
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  await sql.end();
}
