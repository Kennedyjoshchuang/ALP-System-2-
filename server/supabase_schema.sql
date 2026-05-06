-- Supabase (PostgreSQL) Schema for OTL System

-- Enable uuid-ossp extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
);

-- 2. Prospects
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
    companyAddress TEXT,
    date TEXT,
    status TEXT
);

-- 3. Prospect Drafts
CREATE TABLE IF NOT EXISTS prospect_drafts (
    id TEXT PRIMARY KEY,
    prospectId TEXT REFERENCES prospects(id) ON DELETE CASCADE,
    customerName TEXT,
    address TEXT,
    description TEXT,
    date TEXT,
    status TEXT
);

-- 4. Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    customerName TEXT,
    pic TEXT,
    generalNotes TEXT,
    date TEXT,
    status TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC,
    marketingName TEXT,
    marketingPhone TEXT,
    marketingEmail TEXT,
    validFrom TEXT,
    validTo TEXT,
    companyAddress TEXT
);

-- 5. Job Orders
CREATE TABLE IF NOT EXISTS job_orders (
    id TEXT PRIMARY KEY,
    quotationId TEXT REFERENCES quotations(id) ON DELETE SET NULL,
    customerName TEXT,
    instruction TEXT,
    status TEXT,
    quantity INTEGER,
    issueQuantity INTEGER DEFAULT 0,
    containerNo JSONB DEFAULT '[]'::jsonb,
    vehicleNo JSONB DEFAULT '[]'::jsonb,
    driverName JSONB DEFAULT '[]'::jsonb,
    activityStatus TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    costs JSONB DEFAULT '[]'::jsonb,
    quoteValidity TEXT,
    date TEXT,
    phone TEXT,
    email TEXT,
    rate NUMERIC
);

-- 6. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    joId TEXT REFERENCES job_orders(id) ON DELETE CASCADE,
    customerName TEXT,
    amount NUMERIC,
    subtotal NUMERIC,
    tax NUMERIC,
    extra_charges JSONB DEFAULT '[]'::jsonb,
    date TEXT,
    status TEXT,
    signedReceiptPhoto TEXT,
    signedInvoicePhoto TEXT,
    deliveryStatus TEXT DEFAULT 'not_sent'
);

-- 7. Receivables
CREATE TABLE IF NOT EXISTS receivables (
    id TEXT PRIMARY KEY,
    invoiceId TEXT REFERENCES invoices(id) ON DELETE CASCADE,
    customerName TEXT,
    amount NUMERIC,
    subtotal NUMERIC,
    tax NUMERIC,
    extra_charges JSONB DEFAULT '[]'::jsonb,
    balance NUMERIC,
    status TEXT,
    paymentProofPhoto TEXT
);

-- 8. Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    bankName TEXT,
    bankAccount TEXT,
    services JSONB DEFAULT '[]'::jsonb,
    assets JSONB DEFAULT '[]'::jsonb,
    date TEXT
);

-- 9. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    joId TEXT REFERENCES job_orders(id) ON DELETE CASCADE,
    customerName TEXT,
    jobInstruction TEXT,
    vendorId TEXT REFERENCES vendors(id) ON DELETE SET NULL,
    vendorName TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    grandTotal NUMERIC,
    status TEXT,
    date TEXT,
    validFrom TEXT,
    validTo TEXT,
    quoteValidity TEXT,
    vendorInvoicePhoto JSONB DEFAULT '[]'::jsonb,
    paymentProofPhoto JSONB DEFAULT '[]'::jsonb,
    tax_name TEXT,
    tax_amount NUMERIC DEFAULT 0,
    tax_proof_photo JSONB DEFAULT '[]'::jsonb,
    paidDate TEXT,
    notes TEXT
);

-- 10. System Config
CREATE TABLE IF NOT EXISTS system_config (
    id TEXT PRIMARY KEY,
    otpKey TEXT,
    otpUpdatedAt TEXT
);

-- 11. Salaries
CREATE TABLE IF NOT EXISTS salaries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    bankAccount TEXT,
    bankName TEXT,
    baseSalary NUMERIC,
    period TEXT,
    nik TEXT,
    npwp TEXT,
    taxes JSONB DEFAULT '[]'::jsonb,
    proofPhoto TEXT,
    expenseDate TEXT,
    totalToPay NUMERIC,
    date TEXT
);

-- 12. Other Expenses
CREATE TABLE IF NOT EXISTS other_expenses (
    id TEXT PRIMARY KEY,
    employeeName TEXT,
    position TEXT,
    bankAccount TEXT,
    bankName TEXT,
    amount NUMERIC,
    description TEXT,
    taxes JSONB DEFAULT '[]'::jsonb,
    proofPhoto TEXT,
    expenseDate TEXT,
    totalAfterTax NUMERIC,
    date TEXT
);

-- 13. Employees
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    nik TEXT,
    npwp TEXT,
    position TEXT,
    email TEXT,
    accountNumber TEXT,
    bankName TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Employee Accounts (System Access)
CREATE TABLE IF NOT EXISTS employee_accounts (
    id TEXT PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Company Bank Accounts
CREATE TABLE IF NOT EXISTS company_bank_accounts (
    id TEXT PRIMARY KEY,
    bankName TEXT NOT NULL,
    accountNumber TEXT NOT NULL,
    accountName TEXT NOT NULL,
    isDefault BOOLEAN DEFAULT false
);
