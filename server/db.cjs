const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'alp_system.db'));

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    customData TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS prospects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    pic TEXT,
    notes TEXT,
    description TEXT,
    marketingName TEXT,
    marketingPhone TEXT,
    marketingEmail TEXT,
    date TEXT,
    status TEXT,
    customData TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS prospect_drafts (
    id TEXT PRIMARY KEY,
    prospectId TEXT,
    customerName TEXT,
    address TEXT,
    description TEXT,
    date TEXT,
    status TEXT,
    FOREIGN KEY(prospectId) REFERENCES prospects(id)
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    customerName TEXT,
    pic TEXT,
    generalNotes TEXT,
    date TEXT,
    status TEXT,
    items TEXT, -- JSON string
    total REAL,
    marketingName TEXT,
    marketingPhone TEXT,
    marketingEmail TEXT,
    validFrom TEXT,
    validTo TEXT
  );

  CREATE TABLE IF NOT EXISTS job_orders (
    id TEXT PRIMARY KEY,
    quotationId TEXT,
    customerName TEXT,
    instruction TEXT,
    status TEXT,
    quantity INTEGER,
    issueQuantity INTEGER,
    containerNo TEXT,
    vehicleNo TEXT,
    driverName TEXT,
    activityStatus TEXT,
    photos TEXT, -- JSON string (base64 array)
    costs TEXT,  -- JSON string: [{vendorId, vendorName, serviceDescription, price, qty, total}]
    quoteValidity TEXT,
    date TEXT,
    items TEXT DEFAULT '[]',
    extra_charges TEXT DEFAULT '[]',
    FOREIGN KEY(quotationId) REFERENCES quotations(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    joId TEXT,
    customerName TEXT,
    amount REAL,
    subtotal REAL,
    tax REAL,
    date TEXT,
    status TEXT,
    notes TEXT,
    paidDate TEXT,
    FOREIGN KEY(joId) REFERENCES job_orders(id)
  );

  CREATE TABLE IF NOT EXISTS receivables (
    id TEXT PRIMARY KEY,
    invoiceId TEXT,
    customerName TEXT,
    amount REAL,
    subtotal REAL,
    tax REAL,
    balance REAL,
    status TEXT,
    paidDate TEXT,
    FOREIGN KEY(invoiceId) REFERENCES invoices(id)
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    bankName TEXT,
    bankAccount TEXT,
    services TEXT, -- JSON: [{description, price}]
    assets TEXT,   -- JSON: [string]
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    joId TEXT NOT NULL,
    customerName TEXT,
    jobInstruction TEXT,
    vendorId TEXT,
    vendorName TEXT,
    items TEXT,   -- JSON: [{serviceDescription, unitPrice, qty, total}]
    grandTotal REAL,
    status TEXT,  -- 'draft' | 'issued'
    date TEXT,
    validFrom TEXT,
    validTo TEXT,
    quoteValidity TEXT,
    vendorInvoicePhoto TEXT,
    paymentProofPhoto TEXT,
    paidDate TEXT,
    FOREIGN KEY(joId) REFERENCES job_orders(id)
  );

  CREATE TABLE IF NOT EXISTS system_config (
    id TEXT PRIMARY KEY,
    otpKey TEXT,
    otpUpdatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS salaries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    bankAccount TEXT,
    bankName TEXT,
    baseSalary REAL,
    period TEXT,
    nik TEXT,
    npwp TEXT,
    taxes TEXT, -- JSON string
    proofPhoto TEXT,
    expenseDate TEXT,
    totalToPay REAL,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS other_expenses (
    id TEXT PRIMARY KEY,
    employeeName TEXT,
    position TEXT,
    bankAccount TEXT,
    bankName TEXT,
    amount REAL,
    description TEXT,
    taxes TEXT, -- JSON string
    proofPhoto TEXT,
    expenseDate TEXT,
    totalAfterTax REAL,
    date TEXT
  );
`);

console.log('Database initialized successfully.');

// Run migrations for missing columns
try {
  db.prepare('ALTER TABLE quotations ADD COLUMN validFrom TEXT').run();
  console.log('Added validFrom to quotations');
} catch (e) { /* column likely exists */ }

try {
  db.prepare('ALTER TABLE quotations ADD COLUMN validTo TEXT').run();
  console.log('Added validTo to quotations');
} catch (e) { /* column likely exists */ }

try {
  db.prepare('ALTER TABLE job_orders ADD COLUMN dispatchedAt TEXT').run();
  console.log('Added dispatchedAt to job_orders');
} catch (e) { /* column likely exists */ }

try {
  db.prepare('ALTER TABLE job_orders ADD COLUMN completedAt TEXT').run();
  console.log('Added completedAt to job_orders');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE customers ADD COLUMN customData TEXT DEFAULT '{}'").run();
  console.log('Added customData to customers');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE prospects ADD COLUMN customData TEXT DEFAULT '{}'").run();
  console.log('Added customData to prospects');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN shipmentStatus TEXT").run();
  console.log('Added shipmentStatus to job_orders');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN etd TEXT").run();
  console.log('Added etd to job_orders');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN eta TEXT").run();
  console.log('Added eta to job_orders');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN vesselName TEXT").run();
  console.log('Added vesselName to job_orders');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN items TEXT DEFAULT '[]'").run();
  console.log('Added items to job_orders in SQLite');
  
  // Data migration: parse existing job_orders to populate items if empty
  const jos = db.prepare("SELECT id, instruction, quantity, issueQuantity, items FROM job_orders").all();
  const updateStmt = db.prepare("UPDATE job_orders SET items = ? WHERE id = ?");
  for (const jo of jos) {
    let parsedItems = [];
    try {
      if (jo.items) parsedItems = JSON.parse(jo.items);
    } catch (e) {}
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      const itemsArray = [{
        description: jo.instruction || 'Freight Forwarding Services',
        rate: 0,
        quantity: jo.quantity || 1,
        issueQuantity: jo.issueQuantity || 0,
        status: 'pending'
      }];
      updateStmt.run(JSON.stringify(itemsArray), jo.id);
    }
  }
  console.log('Migrated existing SQLite job_orders to include items');
} catch (e) { console.log('Items column already exists or migration failed: ' + e.message); }

try {
  db.prepare("ALTER TABLE invoices ADD COLUMN paidDate TEXT").run();
  console.log('Added paidDate to invoices');
} catch (e) { /* column likely exists */ }

try {
  db.prepare("ALTER TABLE receivables ADD COLUMN paidDate TEXT").run();
  console.log('Added paidDate to receivables');
} catch (e) { /* column likely exists */ }

module.exports = db;
