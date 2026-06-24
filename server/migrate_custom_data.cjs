require('dotenv').config();
const { Client } = require('pg');

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error('❌ Configuration Error: SUPABASE_DB_URL must be set in your environment variables (.env file).');
  process.exit(1);
}

const client = new Client({
  connectionString: SUPABASE_DB_URL,
});

async function migrateCustomDataSchema() {
  try {
    await client.connect();
    console.log('🔌 Connected to Supabase PostgreSQL database.');

    // 1. Add customData to customers table
    console.log('Adding customData JSONB column to customers table...');
    await client.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS "customData" JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('Column "customData" added or already exists in customers table.');

    // 2. Add customData to prospects table
    console.log('Adding customData JSONB column to prospects table...');
    await client.query(`
      ALTER TABLE prospects 
      ADD COLUMN IF NOT EXISTS "customData" JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('Column "customData" added or already exists in prospects table.');

    console.log('✨ Custom data schema migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await client.end();
  }
}

migrateCustomDataSchema();
