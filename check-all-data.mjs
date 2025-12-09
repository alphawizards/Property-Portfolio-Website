import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();
const sql = postgres(process.env.DATABASE_URL);

try {
  console.log('🔍 Checking ALL users and properties...\n');
  
  // Get all users
  const users = await sql`SELECT id, email, name FROM users ORDER BY id`;
  console.log(`✅ Total users: ${users.length}\n`);
  
  if (users.length > 0) {
    console.log('👥 Users:');
    users.forEach(u => console.log(`  - ID ${u.id}: ${u.email} (${u.name || 'No name'})`));
  }
  
  // Get properties per user
  console.log('\n📊 Properties per user:');
  for (const user of users.slice(0, 10)) {
    const props = await sql`SELECT COUNT(*) as count FROM properties WHERE "userId" = ${user.id}`;
    if (props[0].count > 0) {
      console.log(`  - User ${user.id} (${user.email}): ${props[0].count} properties`);
    }
  }
  
  // Get total properties
  const totalProps = await sql`SELECT COUNT(*) as count FROM properties`;
  console.log(`\n🏘️  Total properties in database: ${totalProps[0].count}`);
  
  // Get sample properties
  const sampleProps = await sql`
    SELECT id, nickname, "userId", suburb, state 
    FROM properties 
    ORDER BY "createdAt" DESC 
    LIMIT 5
  `;
  
  console.log('\n📍 Sample properties (latest 5):');
  sampleProps.forEach(p => {
    console.log(`  - ${p.nickname} (User ${p.userId}) - ${p.suburb}, ${p.state}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await sql.end();
}
