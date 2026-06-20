require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Configuration Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your environment variables (.env file).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Helper to send supabase errors
const handleError = (res, error, context = '') => {
  console.error(`Error ${context}:`, error.message);
  let message = error.message;
  
  if (message.includes('duplicate key value violates unique constraint')) {
    if (message.includes('employee_accounts_username_key')) {
      message = 'Username sudah digunakan, silakan pilih username lain.';
    } else if (message.includes('employees_nik_key')) {
      message = 'NIK sudah terdaftar di sistem.';
    } else {
      message = 'Data sudah ada (duplikat).';
    }
    return res.status(400).json({ error: message });
  }
  
  res.status(500).json({ error: message });
};

const cleanPayload = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    cleaned[key] = val === '' ? null : val;
  }
  return cleaned;
};

// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) return handleError(res, error, 'GET customers');
  res.json(data);
});

app.post('/api/customers', async (req, res) => {
  const { id, name, phone, email, address } = req.body;
  const { error } = await supabase.from('customers').insert({ id, name, phone, email, address });
  if (error) return handleError(res, error, 'POST customers');
  res.status(201).json({ id });
});

app.delete('/api/customers/:id', async (req, res) => {
  const { error } = await supabase.from('customers').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE customers');
  res.sendStatus(204);
});

// --- PROSPECTS ---
app.get('/api/prospects', async (req, res) => {
  const { data, error } = await supabase.from('prospects').select('*');
  if (error) return handleError(res, error, 'GET prospects');
  res.json(data);
});

app.post('/api/prospects', async (req, res) => {
  const { id, name, phone, email, address, pic, notes, description, marketingName, marketingPhone, marketingEmail, companyAddress, date, status } = req.body;
  const prospect = cleanPayload({
    id, name, phone, email, address, pic, notes, description,
    marketingName, marketingPhone, marketingEmail, companyAddress, date, status
  });
  const { error } = await supabase.from('prospects').insert(prospect);
  if (error) return handleError(res, error, 'POST prospects');
  res.status(201).json({ id });
});

app.put('/api/prospects/:id', async (req, res) => {
  const updates = cleanPayload(req.body);
  const { error } = await supabase.from('prospects').update(updates).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT prospects');
  res.sendStatus(200);
});

app.delete('/api/prospects/:id', async (req, res) => {
  const { error } = await supabase.from('prospects').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE prospects');
  res.sendStatus(204);
});

// --- QUOTATIONS ---
app.get('/api/quotations', async (req, res) => {
  const { data, error } = await supabase.from('quotations').select('*');
  if (error) return handleError(res, error, 'GET quotations');
  res.json(data);
});

app.post('/api/quotations', async (req, res) => {
  try {
    const { id, customerId, customerName, pic, generalNotes, date, status, items, total, marketingName, marketingPhone, marketingEmail, validFrom, validTo, companyAddress } = req.body;
    const { error } = await supabase.from('quotations').insert({
      id, customerId, customerName, pic, generalNotes, date, status,
      items: items || [], total, marketingName, marketingPhone, marketingEmail,
      validFrom, validTo, companyAddress
    });
    if (error) return handleError(res, error, 'POST quotations');
    res.status(201).json({ id });
  } catch (err) {
    console.error('Create Quotation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/quotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pic, generalNotes, items, total, marketingName, marketingPhone, marketingEmail, validFrom, validTo, companyAddress } = req.body;
    const { error } = await supabase.from('quotations').update({
      pic, generalNotes, items: items || [], total, marketingName, marketingPhone, marketingEmail,
      validFrom, validTo, companyAddress
    }).eq('id', id);
    if (error) return handleError(res, error, 'PUT quotations');
    res.sendStatus(200);
  } catch (err) {
    console.error('Update Quotation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/quotations/:id/approve', async (req, res) => {
  const { error } = await supabase.from('quotations').update({ status: 'approved' }).eq('id', req.params.id);
  if (error) return handleError(res, error, 'approve quotation');
  res.sendStatus(200);
});

app.put('/api/quotations/:id/unapprove', async (req, res) => {
  const { error } = await supabase.from('quotations').update({ status: 'pending' }).eq('id', req.params.id);
  if (error) return handleError(res, error, 'unapprove quotation');
  res.sendStatus(200);
});

app.delete('/api/quotations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get related job orders
    const { data: jos } = await supabase.from('job_orders').select('id').eq('quotationId', id);
    for (const jo of (jos || [])) {
      // Get invoices for this JO
      const { data: invs } = await supabase.from('invoices').select('id').eq('joId', jo.id);
      for (const inv of (invs || [])) {
        await supabase.from('receivables').delete().eq('invoiceId', inv.id);
        await supabase.from('invoices').delete().eq('id', inv.id);
      }
      await supabase.from('purchase_orders').delete().eq('joId', jo.id);
      await supabase.from('job_orders').delete().eq('id', jo.id);
    }
    await supabase.from('prospect_drafts').delete().eq('prospectId', id);
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) return handleError(res, error, 'DELETE quotation');
    res.sendStatus(204);
  } catch (error) {
    console.error('Failed to delete quotation cascade:', error);
    res.status(500).json({ error: 'Failed to delete quotation and its related data', message: error.message });
  }
});

// --- JOB ORDERS ---
app.get('/api/job-orders', async (req, res) => {
  const { data, error } = await supabase.from('job_orders').select('*');
  if (error) return handleError(res, error, 'GET job_orders');
  res.json(data);
});

app.post('/api/job-orders', async (req, res) => {
  try {
    const { quotationId, customerName, jobDescription, phone, email, rate, quantity, quoteValidity } = req.body;
    const id = 'JO-' + Date.now();
    const date = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('job_orders').insert({
      id, quotationId, customerName, instruction: jobDescription,
      status: 'pending', quantity, issueQuantity: 0,
      phone, email, rate, quoteValidity, date,
      photos: [], costs: [],
      containerNo: [], vehicleNo: [], driverName: []
    });
    if (error) return handleError(res, error, 'POST job_orders');
    res.status(201).json({ id });
  } catch (err) {
    console.error('Create JO Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/job-orders/:id', async (req, res) => {
  const updates = req.body;
  const { error } = await supabase.from('job_orders').update(updates).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT job_orders');
  res.sendStatus(200);
});

app.delete('/api/job-orders/:id', async (req, res) => {
  const { error } = await supabase.from('job_orders').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE job_orders');
  res.sendStatus(204);
});

// --- INVOICES ---
app.get('/api/invoices', async (req, res) => {
  const { data, error } = await supabase.from('invoices').select('*');
  if (error) return handleError(res, error, 'GET invoices');
  res.json(data);
});

app.post('/api/invoices', async (req, res) => {
  const { id, joId, customerName, amount, subtotal, tax, extra_charges, date, status } = req.body;
  
  try {
    // 1. Create Invoice — try with all columns, fallback if schema is old
    const invoiceData = {
      id, joId, customerName,
      amount: parseFloat(amount) || 0,
      subtotal: parseFloat(subtotal) || 0,
      tax: parseFloat(tax) || 0,
      extra_charges: extra_charges || [],
      date, status,
      signedReceiptPhoto: req.body.signedReceiptPhoto || null,
      signedInvoicePhoto: req.body.signedInvoicePhoto || null,
      deliveryStatus: req.body.deliveryStatus || 'not_sent'
    };

    console.log(`[POST /invoices] Attempting insert for ${id} with keys: ${Object.keys(invoiceData).join(', ')}`);
    let { error: invErr } = await supabase.from('invoices').insert(invoiceData);
    
    // Catch schema mismatch (missing columns)
    if (invErr && (
      invErr.message.toLowerCase().includes('column') || 
      invErr.message.toLowerCase().includes('schema cache') || 
      invErr.code === '42703' || 
      invErr.code === 'PGRST204'
    )) {
      console.warn(`[POST /invoices] Schema mismatch for ${id} (Code: ${invErr.code}). Retrying without tracking columns...`);
      const { signedReceiptPhoto, signedInvoicePhoto, deliveryStatus, ...legacyData } = invoiceData;
      console.log(`[POST /invoices] Retrying with keys: ${Object.keys(legacyData).join(', ')}`);
      const { error: retryErr } = await supabase.from('invoices').insert(legacyData);
      invErr = retryErr;

      // Secondary fallback if still failing (e.g. missing subtotal/tax)
      if (invErr && (invErr.message.toLowerCase().includes('column') || invErr.code === 'PGRST204')) {
        console.warn(`[POST /invoices] Secondary schema mismatch. Retrying with bare minimum...`);
        const bareData = { id, joId, customerName, amount: invoiceData.amount, date: invoiceData.date, status: invoiceData.status };
        const { error: bareErr } = await supabase.from('invoices').insert(bareData);
        invErr = bareErr;
      }
    }

    if (invErr) {
      console.error(`[POST /invoices] Final failure for ${id}:`, invErr.code, invErr.message);
      return handleError(res, invErr, 'POST invoices (Final)');
    }

    console.log(`[POST /invoices] Success for ${id}. Creating receivable...`);

    // 2. Create Receivable
    const recData = {
      id, invoiceId: id, customerName,
      amount: parseFloat(amount) || 0,
      subtotal: parseFloat(subtotal) || 0,
      tax: parseFloat(tax) || 0,
      extra_charges: extra_charges || [],
      balance: parseFloat(amount) || 0,
      status: 'unpaid'
    };

    let { error: recErr } = await supabase.from('receivables').insert(recData);
    
    if (recErr && (
      recErr.message.toLowerCase().includes('column') || 
      recErr.message.toLowerCase().includes('schema cache') || 
      recErr.code === '42703' || 
      recErr.code === 'PGRST204'
    )) {
      console.warn(`[POST /invoices] Receivable schema mismatch for ${id}. Retrying with bare minimum...`);
      const bareRecData = { id, invoiceId: id, customerName, amount: recData.amount, balance: recData.balance, status: 'unpaid' };
      const { error: retryRecErr } = await supabase.from('receivables').insert(bareRecData);
      recErr = retryRecErr;
    }

    if (recErr) {
      console.error(`[POST /invoices] Final receivable failure for ${id}:`, recErr.message);
      // We don't fail the whole request but log it
    }

    // 3. Update Job Order status to 'invoiced'
    const { error: joErr } = await supabase.from('job_orders').update({ status: 'invoiced' }).eq('id', joId);
    if (joErr) {
      console.error(`[POST /invoices] JO Update error for ${joId}:`, joErr.message);
    }

    console.log(`[POST /invoices] Everything complete for ${id}`);
    res.status(201).json({ id });
  } catch (err) {
    console.error('Invoice issuance exception:', err);
    res.status(500).json({ error: 'Internal server error during invoice issuance' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  const updates = req.body;
  const { error } = await supabase.from('invoices').update(updates).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT invoices');

  // Sync receivables
  const { amount, ...recUpdates } = updates;
  await supabase.from('receivables').update({ ...recUpdates, balance: amount || 0 }).eq('id', req.params.id);
  res.sendStatus(200);
});

app.put('/api/invoices/:id/settle', async (req, res) => {
  const { paymentProofPhoto, taxesDeducted, taxDeductionProof } = req.body;
  
  // Calculate total tax from the array
  const taxesArr = Array.isArray(taxesDeducted) ? taxesDeducted : [];
  const totalTax = taxesArr.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const taxesJson = JSON.stringify(taxesArr);
  
  try {
    // 1. Update Invoice status
    const { error: invErr } = await supabase.from('invoices').update({ 
      status: 'paid',
      tax_deduction: totalTax,
      taxes_deducted: taxesJson,
      tax_deduction_proof: taxDeductionProof
    }).eq('id', req.params.id);
    
    if (invErr) {
      console.warn(`[SETTLE] Invoice update failed for ${req.params.id}: ${invErr.message}`);
      // Fallback if taxes_deducted column is missing
      if (invErr.message.includes('column') || invErr.code === '42703') {
        await supabase.from('invoices').update({ 
          status: 'paid', 
          tax_deduction: totalTax 
        }).eq('id', req.params.id);
      }
    }
    
    // 2. Update Receivable status and add proof photo + tax info
    const { error: recErr } = await supabase.from('receivables').update({ 
      status: 'paid', 
      balance: 0,
      paymentProofPhoto,
      tax_deduction: totalTax,
      taxes_deducted: taxesJson,
      tax_deduction_proof: taxDeductionProof
    }).eq('invoiceId', req.params.id);
    
    if (recErr) {
      console.warn(`[SETTLE] Receivable update failed for ${req.params.id}: ${recErr.message}`);
      if (recErr.message.includes('column') || recErr.code === '42703') {
        await supabase.from('receivables').update({ 
          status: 'paid', 
          balance: 0,
          paymentProofPhoto,
          tax_deduction: totalTax
        }).eq('invoiceId', req.params.id);
      }
    }
    
    res.sendStatus(200);
  } catch (err) {
    console.error('Settle Invoice Exception:', err);
    res.status(500).json({ error: 'Internal server error during settlement' });
  }
});


app.delete('/api/invoices/:id', async (req, res) => {
  await supabase.from('receivables').delete().eq('invoiceId', req.params.id);
  const { error } = await supabase.from('invoices').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE invoices');
  res.sendStatus(204);
});

// --- RECEIVABLES ---
app.get('/api/receivables', async (req, res) => {
  const { data, error } = await supabase.from('receivables').select('*');
  if (error) return handleError(res, error, 'GET receivables');
  res.json(data);
});

// --- VENDORS ---
app.get('/api/vendors', async (req, res) => {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) return handleError(res, error, 'GET vendors');
  res.json(data);
});

app.post('/api/vendors', async (req, res) => {
  const { id, name, phone, email, address, bankName, bankAccount, services, assets, date } = req.body;
  const { error } = await supabase.from('vendors').insert({
    id, name, phone, email, address, bankName, bankAccount,
    services: services || [], assets: assets || [], date
  });
  if (error) return handleError(res, error, 'POST vendors');
  res.status(201).json({ id });
});

app.put('/api/vendors/:id', async (req, res) => {
  const { name, phone, email, address, bankName, bankAccount, services, assets } = req.body;
  const { error } = await supabase.from('vendors').update({
    name, phone, email, address, bankName, bankAccount,
    services: services || [], assets: assets || []
  }).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT vendors');
  res.sendStatus(200);
});

app.delete('/api/vendors/:id', async (req, res) => {
  const { error } = await supabase.from('vendors').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE vendors');
  res.sendStatus(204);
});

// --- PURCHASE ORDERS ---
app.get('/api/purchase-orders', async (req, res) => {
  const { data, error } = await supabase.from('purchase_orders').select('*').order('date', { ascending: false });
  if (error) return handleError(res, error, 'GET purchase_orders');
  res.json(data);
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { joId, customerName, jobInstruction, vendorId, vendorName, items, grandTotal, status, validFrom, validTo, quoteValidity, notes } = req.body;
    const id = 'PO-' + Date.now();
    const date = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('purchase_orders').insert({
      id, joId, customerName, jobInstruction, vendorId, vendorName,
      items: items || [], grandTotal, status: status || 'draft',
      validFrom, validTo, quoteValidity, date, notes,
      vendorInvoicePhoto: [], paymentProofPhoto: []
    });
    if (error) return handleError(res, error, 'POST purchase_orders');
    const fullPO = { id, joId, customerName, jobInstruction, vendorId, vendorName, items, grandTotal, status: status || 'draft', validFrom, validTo, quoteValidity, date, notes };
    res.status(201).json(fullPO);
  } catch (err) {
    console.error('Create PO Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/purchase-orders/:id/issue', async (req, res) => {
  const { error } = await supabase.from('purchase_orders').update({ status: 'issued' }).eq('id', req.params.id);
  if (error) return handleError(res, error, 'issue purchase_order');
  res.sendStatus(200);
});

app.put('/api/purchase-orders/:id', async (req, res) => {
  try {
    const updates = req.body;
    const { error } = await supabase.from('purchase_orders').update(updates).eq('id', req.params.id);
    if (error) return handleError(res, error, 'PUT purchase_orders');
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchase-orders/:id', async (req, res) => {
  const { error } = await supabase.from('purchase_orders').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE purchase_orders');
  res.sendStatus(204);
});

// --- SALARIES ---
app.get('/api/salaries', async (req, res) => {
  const { data, error } = await supabase.from('salaries').select('*');
  if (error) return handleError(res, error, 'GET salaries');
  res.json(data);
});

app.post('/api/salaries', async (req, res) => {
  const { id, name, position, bankAccount, bankName, baseSalary, period, nik, npwp, taxes, proofPhoto, expenseDate, totalToPay, date } = req.body;
  const { error } = await supabase.from('salaries').insert({
    id, name, position, bankAccount, bankName, baseSalary, period,
    nik, npwp, taxes: taxes || [], proofPhoto, expenseDate, totalToPay, date
  });
  if (error) return handleError(res, error, 'POST salaries');
  res.status(201).json({ id });
});

app.put('/api/salaries/:id', async (req, res) => {
  const updates = req.body;
  const { error } = await supabase.from('salaries').update(updates).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT salaries');
  res.sendStatus(200);
});

app.delete('/api/salaries/:id', async (req, res) => {
  const { error } = await supabase.from('salaries').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE salaries');
  res.sendStatus(204);
});

// --- OTHER EXPENSES ---
app.get('/api/other-expenses', async (req, res) => {
  const { data, error } = await supabase.from('other_expenses').select('*');
  if (error) return handleError(res, error, 'GET other_expenses');
  res.json(data);
});

app.post('/api/other-expenses', async (req, res) => {
  const { id, employeeName, position, bankAccount, bankName, amount, description, taxes, proofPhoto, expenseDate, totalAfterTax, date } = req.body;
  const { error } = await supabase.from('other_expenses').insert({
    id, employeeName, position, bankAccount, bankName, amount,
    description, taxes: taxes || [], proofPhoto, expenseDate, totalAfterTax, date
  });
  if (error) return handleError(res, error, 'POST other_expenses');
  res.status(201).json({ id });
});

app.put('/api/other-expenses/:id', async (req, res) => {
  const updates = req.body;
  const { error } = await supabase.from('other_expenses').update(updates).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT other_expenses');
  res.sendStatus(200);
});

app.delete('/api/other-expenses/:id', async (req, res) => {
  const { error } = await supabase.from('other_expenses').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE other_expenses');
  res.sendStatus(204);
});

// --- SYSTEM CONFIG ---
app.get('/api/system/config', async (req, res) => {
  try {
    const { data, error } = await supabase.from('system_config').select('*').eq('id', 'global_config').single();
    if (error && error.code !== 'PGRST116') return handleError(res, error, 'GET system_config');
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/config', async (req, res) => {
  const { otpKey, otpUpdatedAt } = req.body;
  const { error } = await supabase.from('system_config').upsert({ id: 'global_config', otpKey, otpUpdatedAt });
  if (error) return handleError(res, error, 'POST system_config');
  res.sendStatus(200);
});

app.post('/api/system/clear', async (req, res) => {
  await supabase.from('other_expenses').delete().neq('id', '');
  await supabase.from('salaries').delete().neq('id', '');
  await supabase.from('receivables').delete().neq('id', '');
  await supabase.from('invoices').delete().neq('id', '');
  await supabase.from('purchase_orders').delete().neq('id', '');
  await supabase.from('job_orders').delete().neq('id', '');
  await supabase.from('prospect_drafts').delete().neq('id', '');
  await supabase.from('quotations').delete().neq('id', '');
  await supabase.from('prospects').delete().neq('id', '');
  await supabase.from('customers').delete().neq('id', '');
  await supabase.from('employees').delete().neq('id', '');
  await supabase.from('company_bank_accounts').delete().neq('id', '');
  res.sendStatus(200);
});

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) return handleError(res, error, 'GET employees');
  res.json(data);
});

app.post('/api/employees', async (req, res) => {
  try {
    const { id, name, position, phone, email, nik, npwp, bankName, accountNumber, bankAccount, address, baseSalary, accountName } = req.body;
    // Explicitly build the employee object to avoid PostgREST schema cache issues
    const employee = { id, name, position, phone, email, nik: nik || null, npwp: npwp || null, bankName: bankName || null, address: address || null };
    if (accountNumber !== undefined) employee.accountNumber = accountNumber;
    if (bankAccount !== undefined) employee.bankAccount = bankAccount;
    if (baseSalary !== undefined) employee.baseSalary = baseSalary;
    if (accountName !== undefined) employee.accountName = accountName;
    const { error } = await supabase.from('employees').insert(employee);
    if (error) {
      // Fallback: if schema cache error, retry with only safe columns
      if (error.code === 'PGRST204' || (error.message && error.message.includes('schema cache'))) {
        console.warn('[POST /employees] Schema cache error, retrying with minimal fields...');
        const safeEmployee = { id, name, position, phone, email, nik: nik || null, npwp: npwp || null, address: address || null };
        if (bankName) safeEmployee.bankName = bankName;
        const { error: retryErr } = await supabase.from('employees').insert(safeEmployee);
        if (retryErr) return handleError(res, retryErr, 'POST employees (retry)');
        return res.status(201).json({ id });
      }
      return handleError(res, error, 'POST employees');
    }
    res.status(201).json({ id: employee.id });
  } catch (err) {
    console.error('POST /employees error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, position, phone, email, nik, npwp, bankName, accountNumber, bankAccount, address, baseSalary, accountName } = req.body;
    const updates = { name, position, phone, email };
    if (nik !== undefined) updates.nik = nik;
    if (npwp !== undefined) updates.npwp = npwp;
    if (bankName !== undefined) updates.bankName = bankName;
    if (address !== undefined) updates.address = address;
    if (accountNumber !== undefined) updates.accountNumber = accountNumber;
    if (bankAccount !== undefined) updates.bankAccount = bankAccount;
    if (baseSalary !== undefined) updates.baseSalary = baseSalary;
    if (accountName !== undefined) updates.accountName = accountName;
    const { error } = await supabase.from('employees').update(updates).eq('id', req.params.id);
    if (error) return handleError(res, error, 'PUT employees');
    res.sendStatus(200);
  } catch (err) {
    console.error('PUT /employees error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { error } = await supabase.from('employees').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE employees');
  res.sendStatus(204);
});

// --- EMPLOYEE ACCOUNTS ---
app.get('/api/employee-accounts', async (req, res) => {
  const { data, error } = await supabase.from('employee_accounts').select('*');
  if (error) return handleError(res, error, 'GET employee-accounts');
  res.json(data);
});

app.post('/api/employee-accounts', async (req, res) => {
  const account = req.body;
  const { error } = await supabase.from('employee_accounts').insert(account);
  if (error) return handleError(res, error, 'POST employee-accounts');
  res.status(201).json({ id: account.id });
});

app.put('/api/employee-accounts/:id', async (req, res) => {
  const updates = req.body;
  const { error } = await supabase.from('employee_accounts').update(updates).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT employee-accounts');
  res.sendStatus(200);
});

app.delete('/api/employee-accounts/:id', async (req, res) => {
  const { error } = await supabase.from('employee_accounts').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE employee-accounts');
  res.sendStatus(204);
});

// --- COMPANY BANK ACCOUNTS ---
app.get('/api/company-bank-accounts', async (req, res) => {
  const { data, error } = await supabase.from('company_bank_accounts').select('*');
  if (error) return handleError(res, error, 'GET company-bank-accounts');
  res.json(data);
});

app.post('/api/company-bank-accounts', async (req, res) => {
  const account = req.body;
  const { error } = await supabase.from('company_bank_accounts').upsert(account);
  if (error) return handleError(res, error, 'POST company-bank-accounts');
  res.status(200).json({ id: account.id });
});

app.delete('/api/company-bank-accounts/:id', async (req, res) => {
  const { error } = await supabase.from('company_bank_accounts').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE company-bank-accounts');
  res.sendStatus(204);
});

// Serve frontend static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (Supabase backend)`);
});
