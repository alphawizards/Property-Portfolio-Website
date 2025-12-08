import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

async function testConnection() {
  console.log('🔌 Testing PlanetScale connection...\n');
  
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to PlanetScale successfully!\n');
    
    // Check existing tables
    console.log('📋 Checking existing tables...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables:`, tables.map(t => Object.values(t)[0]));
    console.log('');
    
    // Run migration
    console.log('🚀 Running subscription system migration...');
    const migrationSQL = readFileSync('./drizzle/0003_subscription_system.sql', 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
          console.log('⏭️  Skipped (already exists):', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ Error:', err.message);
        }
      }
    }
    
    console.log('\n🎉 Migration complete!');
    
    // Verify tables
    console.log('\n📊 Verifying subscription tables...');
    const [tiers] = await connection.query('SELECT * FROM subscription_tiers');
    console.log(`✅ subscription_tiers: ${tiers.length} rows`);
    tiers.forEach(tier => {
      console.log(`   - ${tier.name}: ${tier.displayName} (${tier.maxProperties} properties, $${tier.priceMonthly}/mo)`);
    });
    
    await connection.end();
    console.log('\n✅ All done!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
