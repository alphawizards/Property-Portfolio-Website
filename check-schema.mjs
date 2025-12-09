import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

try {
  const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'properties' 
    ORDER BY ordinal_position
  `;
  
  console.log('📋 Actual properties table schema:\n');
  columns.forEach(col => {
    console.log(`  ${col.column_name} (${col.data_type})`);
  });
  
} catch (error) {
  console.error('Error:', error);
} finally {
  await sql.end();
}
