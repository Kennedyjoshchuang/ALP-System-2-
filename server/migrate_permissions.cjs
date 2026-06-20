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

async function migratePermissions() {
  try {
    await client.connect();
    console.log('Connected to Supabase database.');

    // 1. Add permissions column
    console.log('Adding permissions column to employee_accounts...');
    await client.query(`
      ALTER TABLE employee_accounts 
      ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('Column added or already exists.');

    // 2. Migrate existing accounts based on legacy role
    console.log('Migrating legacy roles to permissions...');
    
    const migrationQueries = [
      { role: 'marketing', perms: '{"marketing": "write"}' },
      { role: 'accounting', perms: '{"accounting": "write"}' },
      { role: 'executor', perms: '{"executor": "write"}' },
      { role: 'admin', perms: '{"admin": "write", "procurement": "write"}' },
      { role: 'hrd', perms: '{"hrd": "write"}' },
      { role: 'staff', perms: '{}' }
    ];

    for (const mq of migrationQueries) {
      const res = await client.query(`
        UPDATE employee_accounts 
        SET permissions = $1::jsonb 
        WHERE role = $2 AND (permissions IS NULL OR permissions = '{}'::jsonb);
      `, [mq.perms, mq.role]);
      console.log(`Updated ${res.rowCount} account(s) for legacy role '${mq.role}'.`);
    }

    console.log('✨ Permissions migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.end();
  }
}

migratePermissions();
