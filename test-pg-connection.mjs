import pg from 'pg';
import { config } from 'dotenv';

config();

const connectionString = process.env.DATABASE_URL;

console.log('🔌 Testing PlanetScale PostgreSQL connection...\n');
console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@'));

const client = new pg.Client({ connectionString });

client.connect()
  .then(() => {
    console.log('✅ Connected successfully!');
    return client.query('SELECT version()');
  })
  .then(result => {
    console.log('Database version:', result.rows[0].version);
    return client.end();
  })
  .then(() => {
    console.log('✅ Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  });
