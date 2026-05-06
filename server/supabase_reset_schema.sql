-- ============================================================
-- OTL System - Complete Supabase Schema Reset
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS other_expenses CASCADE;
DROP TABLE IF EXISTS salaries CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS receivables CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS job_orders CASCADE;
DROP TABLE IF EXISTS prospect_drafts CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Recreate all tables with correct TEXT primary keys

CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
);

CREATE TABLE prospects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    pic TEXT,
    notes TEXT,
    description TEXT,
    "marketingName" TEXT,
    "marketingPhone" TEXT,
    "marketingEmail" TEXT,
    "companyAddress" TEXT,
    date TEXT,
    status TEXT
);

CREATE TABLE prospect_drafts (
    id TEXT PRIMARY KEY,
    "prospectId" TEXT REFERENCES prospects(id) ON DELETE CASCADE,
    "customerName" TEXT,
    address TEXT,
    description TEXT,
    date TEXT,
    status TEXT
);

CREATE TABLE quotations (
    id TEXT PRIMARY KEY,
    "customerId" TEXT,
    "customerName" TEXT,
    pic TEXT,
    "generalNotes" TEXT,
    date TEXT,
    status TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC,
    "marketingName" TEXT,
    "marketingPhone" TEXT,
    "marketingEmail" TEXT,
    "validFrom" TEXT,
    "validTo" TEXT,
    "companyAddress" TEXT
);

CREATE TABLE job_orders (
    id TEXT PRIMARY KEY,
    "quotationId" TEXT REFERENCES quotations(id) ON DELETE SET NULL,
    "customerName" TEXT,
    instruction TEXT,
    status TEXT,
    quantity INTEGER,
    "issueQuantity" INTEGER DEFAULT 0,
    "containerNo" TEXT,
    "vehicleNo" TEXT,
    "driverName" TEXT,
    "activityStatus" TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    costs JSONB DEFAULT '[]'::jsonb,
    "quoteValidity" TEXT,
    date TEXT,
    phone TEXT,
    email TEXT,
    rate NUMERIC
);

CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    "joId" TEXT REFERENCES job_orders(id) ON DELETE CASCADE,
    "customerName" TEXT,
    amount NUMERIC,
    subtotal NUMERIC,
    tax NUMERIC,
    extra_charges JSONB DEFAULT '[]'::jsonb,
    date TEXT,
    status TEXT
);

CREATE TABLE receivables (
    id TEXT PRIMARY KEY,
    "invoiceId" TEXT REFERENCES invoices(id) ON DELETE CASCADE,
    "customerName" TEXT,
    amount NUMERIC,
    subtotal NUMERIC,
    tax NUMERIC,
    extra_charges JSONB DEFAULT '[]'::jsonb,
    balance NUMERIC,
    status TEXT
);

CREATE TABLE vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    services JSONB DEFAULT '[]'::jsonb,
    assets JSONB DEFAULT '[]'::jsonb,
    date TEXT
);

CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY,
    "joId" TEXT REFERENCES job_orders(id) ON DELETE CASCADE,
    "customerName" TEXT,
    "jobInstruction" TEXT,
    "vendorId" TEXT,
    "vendorName" TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    "grandTotal" NUMERIC,
    status TEXT,
    date TEXT,
    "validFrom" TEXT,
    "validTo" TEXT,
    "quoteValidity" TEXT,
    "vendorInvoicePhoto" JSONB DEFAULT '[]'::jsonb,
    "paymentProofPhoto" JSONB DEFAULT '[]'::jsonb,
    "paidDate" TEXT,
    notes TEXT
);

CREATE TABLE system_config (
    id TEXT PRIMARY KEY,
    "otpKey" TEXT,
    "otpUpdatedAt" TEXT
);

CREATE TABLE salaries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "baseSalary" NUMERIC,
    period TEXT,
    nik TEXT,
    npwp TEXT,
    taxes JSONB DEFAULT '[]'::jsonb,
    "proofPhoto" TEXT,
    "expenseDate" TEXT,
    "totalToPay" NUMERIC,
    date TEXT
);

CREATE TABLE other_expenses (
    id TEXT PRIMARY KEY,
    "employeeName" TEXT,
    position TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    amount NUMERIC,
    description TEXT,
    taxes JSONB DEFAULT '[]'::jsonb,
    "proofPhoto" TEXT,
    "expenseDate" TEXT,
    "totalAfterTax" NUMERIC,
    date TEXT
);

-- Done!
SELECT 'Schema created successfully!' as result;
