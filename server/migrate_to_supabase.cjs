const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');

// Supabase Credentials (verified working sb_* format keys)
const SUPABASE_URL = 'https://yuddakkcoxllxfnaikus.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZii6Inl1ZGRha2tjb3hsbHhmbmFpa3VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU3NTA0NiwiZXhwIjoyMDYyMTUxMDQ2fQ.HhvmpcTwzMSyf4WKJoXyweXaZLIBNC8TRD_x18aCKMw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const sqliteDb = new Database(path.join(__dirname, 'omega_trust.db'));

const tablesToMigrate = [
  { name: 'customers' },
  { name: 'prospects' },
  { name: 'prospect_drafts' },
  { name: 'quotations', jsonCols: ['items'] },
  { name: 'job_orders', jsonCols: ['photos', 'costs'] },
  { name: 'invoices', jsonCols: ['extra_charges'] },
  { name: 'receivables', jsonCols: ['extra_charges'] },
  { name: 'vendors', jsonCols: ['services', 'assets'] },
  { name: 'purchase_orders', jsonCols: ['items', 'vendorInvoicePhoto', 'paymentProofPhoto'] },
  { name: 'system_config' },
  { name: 'salaries', jsonCols: ['taxes'] },
  { name: 'other_expenses', jsonCols: ['taxes'] },
  { name: 'employees' },
  { name: 'employee_accounts' },
  { name: 'company_bank_accounts' }
];

async function migrate() {
  console.log('🚀 Starting migration to Supabase...');

  for (const table of tablesToMigrate) {
    console.log(`\nTable: ${table.name}`);
    const rows = sqliteDb.prepare(`SELECT * FROM ${table.name}`).all();
    
    if (rows.length === 0) {
      console.log(`- No data found in ${table.name}, skipping.`);
      continue;
    }

    // Process rows to handle JSONB columns
    const processedRows = rows.map(row => {
      const newRow = { ...row };
      if (table.jsonCols) {
        for (const col of table.jsonCols) {
          if (newRow[col]) {
            try {
              newRow[col] = JSON.parse(newRow[col]);
            } catch (e) {
              console.warn(`  ! Failed to parse JSON for ${table.name}.${col}:`, e.message);
              // If it's already an object or null, leave it
            }
          } else {
            newRow[col] = []; // Default to empty array for JSONB
          }
        }
      }
      return newRow;
    });

    console.log(`- Uploading ${processedRows.length} rows...`);
    
    // Upload in batches of 100 to avoid request size limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < processedRows.length; i += BATCH_SIZE) {
      const batch = processedRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(table.name).upsert(batch);
      
      if (error) {
        console.error(`  ❌ Error migrating ${table.name} (Batch ${i}):`, error.message);
        console.error('  Batch data sample:', JSON.stringify(batch[0], null, 2));
      } else {
        console.log(`  ✅ Batch ${i} migrated.`);
      }
    }
  }

  console.log('\n✨ Migration finished!');
}

migrate().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
