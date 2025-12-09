import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
console.log('🔍 Testing PostgreSQL connection...');
console.log('📍 Database URL:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'NOT SET');

if (!dbUrl) {
  console.error('❌ DATABASE_URL not set in environment');
  process.exit(1);
}

try {
  const sql = postgres(dbUrl);
  
  // Test connection
  const result = await sql`SELECT 1+1 as result`;
  console.log('\n✅ Database connection successful');
  console.log('   Test query result:', result[0].result);
  
  // Check if we can query users table
  const users = await sql`SELECT COUNT(*) as count FROM users`;
  console.log('\n✅ Users table accessible');
  console.log('   Total users:', users[0].count);
  
  // Check if we can query properties table
  const properties = await sql`SELECT COUNT(*) as count FROM properties`;
  console.log('\n✅ Properties table accessible');
  console.log('   Total properties:', properties[0].count);
  
  // Get sample property data
  const sampleProps = await sql`
    SELECT id, nickname, address, "purchasePrice", status 
    FROM properties 
    LIMIT 3
  `;
  console.log('\n✅ Sample properties:');
  sampleProps.forEach(prop => {
    console.log(`   - ${prop.nickname} (${prop.address}) - $${prop.purchasePrice/100}`);
  });
  
  console.log('\n✅ PostgreSQL schema migration verified successfully!');
  
  await sql.end();
} catch (error) {
  console.error('\n❌ Database test failed:', error);
  process.exit(1);
}
