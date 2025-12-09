import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();
const sql = postgres(process.env.DATABASE_URL);

console.log('Fixing portfolio_goals columns...\n');

try {
  // Rename targetPropertyCount to targetValue if it exists
  await sql`
    ALTER TABLE portfolio_goals 
    RENAME COLUMN "targetPropertyCount" TO "targetValue"
  `;
  
  console.log('✅ Renamed targetPropertyCount to targetValue');
  
  // Verify
  const columns = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'portfolio_goals'
    ORDER BY ordinal_position
  `;
  
  console.log('\n✅ Current columns:', columns.map(c => c.column_name).join(', '));
  
} catch (error) {
  if (error.code === '42703') {
    console.log('❌ Column targetPropertyCount does not exist');
  } else {
    console.error('❌ Error:', error.message);
  }
} finally {
  await sql.end();
}
