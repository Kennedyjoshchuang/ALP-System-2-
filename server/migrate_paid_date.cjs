require('dotenv').config();
const { Client } = require('pg');

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.warn('⚠️ Warning: SUPABASE_DB_URL is not set in your .env file.');
  console.warn('If you are deploying this to production, make sure to execute the following SQL in your Supabase SQL Editor:');
  console.warn('\n  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "paidDate" TEXT;');
  console.warn('  ALTER TABLE receivables ADD COLUMN IF NOT EXISTS "paidDate" TEXT;\n');
  process.exit(0);
}

const client = new Client({
  connectionString: SUPABASE_DB_URL,
});

async function migratePaidDateSchema() {
  try {
    await client.connect();
    console.log('🔌 Connected to Supabase PostgreSQL database.');

    console.log('Adding paidDate column to invoices table...');
    await client.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS "paidDate" TEXT;
    `);
    console.log('Column "paidDate" added or already exists in invoices table.');

    console.log('Adding paidDate column to receivables table...');
    await client.query(`
      ALTER TABLE receivables 
      ADD COLUMN IF NOT EXISTS "paidDate" TEXT;
    `);
    console.log('Column "paidDate" added or already exists in receivables table.');

    console.log('✨ Paid date schema migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await client.end();
  }
}

migratePaidDateSchema();
