import pg from 'pg';
import { config } from 'dotenv';

config();

async function seedTiers() {
  console.log('🌱 Seeding subscription tiers to PlanetScale PostgreSQL...\n');
  
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Check if tiers already exist
    const checkResult = await client.query('SELECT COUNT(*) FROM subscription_tiers');
    const count = parseInt(checkResult.rows[0].count);
    
    if (count > 0) {
      console.log(`⏭️  Subscription tiers already exist (${count} tiers found)`);
      console.log('   Run this to see them: SELECT * FROM subscription_tiers;\n');
    } else {
      // Insert the 3 subscription tiers
      console.log('📝 Inserting subscription tiers...');
      
      await client.query(`
        INSERT INTO subscription_tiers 
        (name, "displayName", description, "maxProperties", "maxForecastYears", 
         "canUseAdvancedAnalytics", "canUseScenarioComparison", "canExportReports", 
         "canUseTaxCalculator", "priceMonthly", "priceYearly")
        VALUES
        ('basic', 'Basic', 'Perfect for getting started with investment analysis', 2, 10, false, false, false, false, 0.00, 0.00),
        ('pro', 'Pro', 'Advanced features for serious investors', 0, 30, true, true, true, true, 29.99, 299.99),
        ('admin', 'Admin', 'Full access for administrators', 0, 50, true, true, true, true, 0.00, 0.00)
      `);
      
      console.log('✅ Inserted 3 subscription tiers\n');
    }
    
    // Display the tiers
    const result = await client.query('SELECT id, name, "displayName", "maxProperties", "priceMonthly" FROM subscription_tiers ORDER BY id');
    
    console.log('📊 Subscription Tiers:');
    console.log('─'.repeat(80));
    result.rows.forEach(tier => {
      const props = tier.maxProperties === 0 ? 'Unlimited' : tier.maxProperties;
      console.log(`   ${tier.id}. ${tier.displayName.padEnd(10)} - ${props.toString().padEnd(10)} properties - $${tier.priceMonthly}/month`);
    });
    console.log('─'.repeat(80));
    
    await client.end();
    console.log('\n✅ Seeding complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTiers();
