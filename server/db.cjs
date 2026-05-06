const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'omega_trust.db'));

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
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
    status TEXT
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

module.exports = db;
