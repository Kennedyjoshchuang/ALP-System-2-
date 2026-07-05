-- Run this SQL in your Supabase Dashboard SQL Editor to add the consolidatedJOs column:

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "consolidatedJOs" JSONB DEFAULT '[]'::jsonb;
