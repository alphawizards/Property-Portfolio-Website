import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();
const sql = postgres(process.env.DATABASE_URL);

console.log('Fixing portfolio_goals table...\n');

try {
  // Check current schema
  const columns = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'portfolio_goals'
    ORDER BY ordinal_position
  `;
  
  console.log('Current columns:', columns.map(c => c.column_name).join(', '));
  
  // Add missing columns
  await sql`ALTER TABLE portfolio_goals ADD COLUMN IF NOT EXISTS "targetCashflow" INTEGER`;
  
  console.log('\n✅ Added targetCashflow column');
  
  // Verify
  const updated = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'portfolio_goals'
    ORDER BY ordinal_position
  `;
  
  console.log('\n✅ Updated columns:', updated.map(c => c.column_name).join(', '));
  
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  await sql.end();
}
