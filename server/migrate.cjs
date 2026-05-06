const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'omega_trust.db'));

try {
  console.log('🚀 Starting Database Migration...');
  
  // --- PROSPECTS TABLE ---
  try {
    db.exec("ALTER TABLE prospects ADD COLUMN pic TEXT;");
    console.log('✅ Added "pic" column to prospects table.');
  } catch (e) { console.log('ℹ️ "pic" column in prospects already exists.'); }

  try {
    db.exec("ALTER TABLE prospects ADD COLUMN notes TEXT;");
    console.log('✅ Added "notes" column to prospects table.');
  } catch (e) { console.log('ℹ️ "notes" column in prospects already exists.'); }


  // --- QUOTATIONS TABLE ---
  try {
    db.exec("ALTER TABLE quotations ADD COLUMN pic TEXT;");
    console.log('✅ Added "pic" column to quotations table.');
  } catch (e) { console.log('ℹ️ "pic" column in quotations already exists.'); }

  try {
    db.exec("ALTER TABLE quotations ADD COLUMN generalNotes TEXT;");
    console.log('✅ Added "generalNotes" column to quotations table.');
  } catch (e) { console.log('ℹ️ "generalNotes" column in quotations already exists.'); }

  console.log('🎉 Migration finished successfully!');
} catch (err) {
  console.error('❌ Migration failed:', err);
} finally {
  db.close();
}
