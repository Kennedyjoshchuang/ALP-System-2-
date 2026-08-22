-- ====================================================================
-- Migration: Convert all monetary, tax, rate, and quantity columns to NUMERIC
-- ====================================================================

-- 1. Invoices
ALTER TABLE invoices 
  ALTER COLUMN amount TYPE NUMERIC USING amount::numeric,
  ALTER COLUMN subtotal TYPE NUMERIC USING subtotal::numeric,
  ALTER COLUMN tax TYPE NUMERIC USING tax::numeric;

DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='tax_deduction') THEN
    ALTER TABLE invoices ALTER COLUMN tax_deduction TYPE NUMERIC USING tax_deduction::numeric;
  ELSE
    ALTER TABLE invoices ADD COLUMN tax_deduction NUMERIC DEFAULT 0;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='currentRate') THEN
    ALTER TABLE invoices ALTER COLUMN "currentRate" TYPE NUMERIC USING "currentRate"::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='usedRate') THEN
    ALTER TABLE invoices ALTER COLUMN "usedRate" TYPE NUMERIC USING "usedRate"::numeric;
  END IF;
END $$;

-- 2. Receivables
ALTER TABLE receivables 
  ALTER COLUMN amount TYPE NUMERIC USING amount::numeric,
  ALTER COLUMN balance TYPE NUMERIC USING balance::numeric;

DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receivables' AND column_name='subtotal') THEN
    ALTER TABLE receivables ALTER COLUMN subtotal TYPE NUMERIC USING subtotal::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receivables' AND column_name='tax') THEN
    ALTER TABLE receivables ALTER COLUMN tax TYPE NUMERIC USING tax::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receivables' AND column_name='tax_deduction') THEN
    ALTER TABLE receivables ALTER COLUMN tax_deduction TYPE NUMERIC USING tax_deduction::numeric;
  ELSE
    ALTER TABLE receivables ADD COLUMN tax_deduction NUMERIC DEFAULT 0;
  END IF;
END $$;

-- 3. Job Orders
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_orders' AND column_name='rate') THEN
    ALTER TABLE job_orders ALTER COLUMN rate TYPE NUMERIC USING rate::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_orders' AND column_name='quantity') THEN
    ALTER TABLE job_orders ALTER COLUMN quantity TYPE NUMERIC USING quantity::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_orders' AND column_name='issueQuantity') THEN
    ALTER TABLE job_orders ALTER COLUMN "issueQuantity" TYPE NUMERIC USING "issueQuantity"::numeric;
  END IF;
END $$;

-- 4. Quotations
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='total') THEN
    ALTER TABLE quotations ALTER COLUMN total TYPE NUMERIC USING total::numeric;
  END IF;
END $$;

-- 5. Purchase Orders
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='grandTotal') THEN
    ALTER TABLE purchase_orders ALTER COLUMN "grandTotal" TYPE NUMERIC USING "grandTotal"::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='tax_amount') THEN
    ALTER TABLE purchase_orders ALTER COLUMN tax_amount TYPE NUMERIC USING tax_amount::numeric;
  END IF;
END $$;

-- 6. Salaries
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salaries' AND column_name='baseSalary') THEN
    ALTER TABLE salaries ALTER COLUMN "baseSalary" TYPE NUMERIC USING "baseSalary"::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salaries' AND column_name='totalToPay') THEN
    ALTER TABLE salaries ALTER COLUMN "totalToPay" TYPE NUMERIC USING "totalToPay"::numeric;
  END IF;
END $$;

-- 7. Other Expenses
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='other_expenses' AND column_name='amount') THEN
    ALTER TABLE other_expenses ALTER COLUMN amount TYPE NUMERIC USING amount::numeric;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='other_expenses' AND column_name='totalAfterTax') THEN
    ALTER TABLE other_expenses ALTER COLUMN "totalAfterTax" TYPE NUMERIC USING "totalAfterTax"::numeric;
  END IF;
END $$;

SELECT 'Migration completed: all financial and rate columns are now NUMERIC.' AS status;
