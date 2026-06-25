require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Configuration Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your environment variables (.env file).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const sqliteDb = new Database(path.join(__dirname, 'alp_system.db'));

const tablesToMigrate = [
  { name: 'customers', jsonCols: ['customData'] },
  { name: 'prospects', jsonCols: ['customData'] },
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
            newRow[col] = col === 'customData' ? {} : []; // Default to empty object/array for JSONB
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
