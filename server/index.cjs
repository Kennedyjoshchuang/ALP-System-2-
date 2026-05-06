require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yuddakkcoxllxfnaikus.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZGRha2tjb3hsbHhmbmFpa3VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA4ODY4MSwiZXhwIjoyMDkzNjY0NjgxfQ.HhvmpcTwzMSyf4WKJoXyweXaZLlBNC8TRD_x18aCKMw';

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

// Mapping helper to handle Postgres lowercase vs Frontend camelCase
// Only remap columns that are actually different between DB and frontend
const mapToCamel = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(mapToCamel);
  
  const mapped = {};
  // Map DB column names → JS camelCase property names
  const mapping = {
    // job_orders: instruction → jobDescription (frontend uses jobDescription)
    'instruction': 'jobDescription',
    // Lowercase variants of camelCase columns (Postgres folds unquoted to lowercase)
    'customerid': 'customerId',
    'customername': 'customerName',
    'generalnotes': 'generalNotes',
    'marketingname': 'marketingName',
    'marketingphone': 'marketingPhone',
    'marketingemail': 'marketingEmail',
    'validfrom': 'validFrom',
    'validto': 'validTo',
    'companyaddress': 'companyAddress',
    'quotationid': 'quotationId',
    'jobdescription': 'jobDescription',
    'issuequantity': 'issueQuantity',
    'containerno': 'containerNo',
    'vehicleno': 'vehicleNo',
    'drivername': 'driverName',
    'activitystatus': 'activityStatus',
    'quotenvalidity': 'quoteValidity',
    'quotevalidity': 'quoteValidity',
    'joid': 'joId',
    'signedreceiptphoto': 'signedReceiptPhoto',
    'signedinvoicephoto': 'signedInvoicePhoto',
    'deliverystatus': 'deliveryStatus',
    'invoiceid': 'invoiceId',
    'paymentproofphoto': 'paymentProofPhoto',
    'bankname': 'bankName',
    'bankaccount': 'bankAccount',
    'grandtotal': 'grandTotal',
    'vendorid': 'vendorId',
    'vendorname': 'vendorName',
    'jobinstruction': 'jobInstruction',
    'vendorinvoicephoto': 'vendorInvoicePhoto',
    'paiddate': 'paidDate',
    'basesalary': 'baseSalary',
    'expensedate': 'expenseDate',
    'totaltopay': 'totalToPay',
    'employeename': 'employeeName',
    'totalaftertax': 'totalAfterTax',
    'accountnumber': 'accountNumber',
    'accountname': 'accountName',
    'otpkey': 'otpKey',
    'otpupdatedat': 'otpUpdatedAt',
    'isdefault': 'isDefault',
    'created_at': 'created_at'
  };

  Object.keys(obj).forEach(key => {
    const newKey = mapping[key] !== undefined ? mapping[key] : (mapping[key.toLowerCase()] !== undefined ? mapping[key.toLowerCase()] : key);
    mapped[newKey] = obj[key];
  });
  return mapped;
};

const mapToDb = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const mapped = {};
  // Map JS camelCase → DB column names
  // For columns that PostgreSQL created with camelCase (they stay camelCase)
  // For columns that are lowercase in DB, we map camelCase → lowercase
  const mapping = {
    // job_orders special: jobDescription → instruction column
    'jobDescription': 'instruction',
    // purchase_orders: jobInstruction stays as jobInstruction in DB? No - it's stored as jobinstruction
    // Actually schema has jobInstruction in camelCase so Supabase keeps it
    // Fields that ARE lowercase in PostgreSQL (unquoted CREATE TABLE)
    'customerId': 'customerid',
    'customerName': 'customername',
    'generalNotes': 'generalnotes',
    'marketingName': 'marketingname',
    'marketingPhone': 'marketingphone',
    'marketingEmail': 'marketingemail',
    'validFrom': 'validfrom',
    'validTo': 'validto',
    'companyAddress': 'companyaddress',
    'quotationId': 'quotationid',
    'issueQuantity': 'issuequantity',
    'containerNo': 'containerno',
    'vehicleNo': 'vehicleno',
    'driverName': 'drivername',
    'activityStatus': 'activitystatus',
    'quoteValidity': 'quotevalidity',
    'joId': 'joid',
    'signedReceiptPhoto': 'signedreceiptphoto',
    'signedInvoicePhoto': 'signedinvoicephoto',
    'deliveryStatus': 'deliverystatus',
    'invoiceId': 'invoiceid',
    'paymentProofPhoto': 'paymentproofphoto',
    'bankName': 'bankname',
    'bankAccount': 'bankaccount',
    'grandTotal': 'grandtotal',
    'vendorId': 'vendorid',
    'vendorName': 'vendorname',
    'jobInstruction': 'jobinstruction',
    'vendorInvoicePhoto': 'vendorinvoicephoto',
    'paidDate': 'paiddate',
    'baseSalary': 'basesalary',
    'expenseDate': 'expensedate',
    'totalToPay': 'totaltopay',
    'employeeName': 'employeename',
    'totalAfterTax': 'totalaftertax',
    'accountNumber': 'accountnumber',
    'accountName': 'accountname',
    'otpKey': 'otpkey',
    'otpUpdatedAt': 'otpupdatedat',
    'isDefault': 'isdefault'
  };

  Object.keys(obj).forEach(key => {
    const newKey = mapping[key] !== undefined ? mapping[key] : key;
    mapped[newKey] = obj[key];
  });
  return mapped;
};

// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) return handleError(res, error, 'GET customers');
  res.json(mapToCamel(data));
});

app.post('/api/customers', async (req, res) => {
  const data = mapToDb(req.body);
  const { error } = await supabase.from('customers').insert(data);
  if (error) return handleError(res, error, 'POST customers');
  res.status(201).json(mapToCamel(data));
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
  res.json(mapToCamel(data));
});

app.post('/api/prospects', async (req, res) => {
  const data = mapToDb(req.body);
  const { error } = await supabase.from('prospects').insert(data);
  if (error) return handleError(res, error, 'POST prospects');
  res.status(201).json(mapToCamel(data));
});

app.put('/api/prospects/:id', async (req, res) => {
  const { error } = await supabase.from('prospects').update(mapToDb(req.body)).eq('id', req.params.id);
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
  res.json(mapToCamel(data));
});

app.post('/api/quotations', async (req, res) => {
  try {
    const data = mapToDb(req.body);
    const { error } = await supabase.from('quotations').insert(data);
    if (error) return handleError(res, error, 'POST quotations');
    res.status(201).json(mapToCamel(data));
  } catch (err) {
    console.error('Create Quotation Error:', err);
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
  res.json(mapToCamel(data));
});

app.post('/api/job-orders', async (req, res) => {
  try {
    const { quotationId, customerName, jobDescription, phone, email, rate, quantity, quoteValidity } = req.body;
    const id = req.body.id || 'JO-' + Date.now();
    const date = new Date().toISOString().split('T')[0];
    const data = mapToDb({
      id, quotationId, customerName, jobDescription,
      status: 'pending', quantity, issueQuantity: 0,
      phone, email, rate, quoteValidity, date,
      photos: [], costs: [],
      containerNo: [], vehicleNo: [], driverName: []
    });
    const { error } = await supabase.from('job_orders').insert(data);
    if (error) return handleError(res, error, 'POST job_orders');
    res.status(201).json(mapToCamel(data));
  } catch (err) {
    console.error('Create JO Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/job-orders/:id', async (req, res) => {
  const { error } = await supabase.from('job_orders').update(mapToDb(req.body)).eq('id', req.params.id);
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
  res.json(mapToCamel(data));
});

app.post('/api/invoices', async (req, res) => {
  const { id, joId, customerName, amount, subtotal, tax, extra_charges, date, status } = req.body;
  
  try {
    // 1. Create Invoice using mapToDb for consistent casing
    const invoiceData = mapToDb({
      id, joId, customerName,
      amount: parseFloat(amount) || 0,
      subtotal: parseFloat(subtotal) || 0,
      tax: parseFloat(tax) || 0,
      extra_charges: extra_charges || [],
      date, status,
      signedReceiptPhoto: req.body.signedReceiptPhoto || null,
      signedInvoicePhoto: req.body.signedInvoicePhoto || null,
      deliveryStatus: req.body.deliveryStatus || 'not_sent'
    });

    console.log(`[POST /invoices] Inserting ${id} with keys: ${Object.keys(invoiceData).join(', ')}`);
    const { error: invErr } = await supabase.from('invoices').insert(invoiceData);
    if (invErr) {
      console.error(`[POST /invoices] Failed for ${id}:`, invErr.code, invErr.message);
      return handleError(res, invErr, 'POST invoices');
    }

    console.log(`[POST /invoices] Invoice saved. Creating receivable...`);

    // 2. Create Receivable
    const recData = mapToDb({
      id, invoiceId: id, customerName,
      amount: parseFloat(amount) || 0,
      subtotal: parseFloat(subtotal) || 0,
      tax: parseFloat(tax) || 0,
      extra_charges: extra_charges || [],
      balance: parseFloat(amount) || 0,
      status: 'unpaid'
    });

    const { error: recErr } = await supabase.from('receivables').insert(recData);
    if (recErr) {
      console.error(`[POST /invoices] Receivable failed for ${id}:`, recErr.message);
    }

    // 3. Update Job Order status to 'invoiced'
    const { error: joErr } = await supabase.from('job_orders').update({ status: 'invoiced' }).eq('id', joId);
    if (joErr) {
      console.error(`[POST /invoices] JO Update error for ${joId}:`, joErr.message);
    }

    console.log(`[POST /invoices] Complete for ${id}`);
    res.status(201).json({ id });
  } catch (err) {
    console.error('Invoice issuance exception:', err);
    res.status(500).json({ error: 'Internal server error during invoice issuance' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  const { error } = await supabase.from('invoices').update(mapToDb(req.body)).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT invoices');

  // Sync receivables
  const { amount } = req.body;
  await supabase.from('receivables').update(mapToDb({ ...req.body, balance: amount || 0 })).eq('id', req.params.id);
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

app.put('/api/invoices/:id', async (req, res) => {
  const updates = req.body;
  const { error } = await supabase.from('invoices').update(updates).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT invoices');
  res.sendStatus(200);
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
  res.json(mapToCamel(data));
});

// --- VENDORS ---
app.get('/api/vendors', async (req, res) => {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) return handleError(res, error, 'GET vendors');
  res.json(mapToCamel(data));
});

app.post('/api/vendors', async (req, res) => {
  const data = mapToDb(req.body);
  const { error } = await supabase.from('vendors').insert(data);
  if (error) return handleError(res, error, 'POST vendors');
  res.status(201).json(mapToCamel(data));
});

app.put('/api/vendors/:id', async (req, res) => {
  const { error } = await supabase.from('vendors').update(mapToDb(req.body)).eq('id', req.params.id);
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
  res.json(mapToCamel(data));
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const id = req.body.id || 'PO-' + Date.now();
    const date = new Date().toISOString().split('T')[0];
    const poData = mapToDb({ 
      ...req.body, 
      id, 
      date,
      vendorInvoicePhoto: [],
      paymentProofPhoto: []
    });
    
    const { error } = await supabase.from('purchase_orders').insert(poData);
    if (error) return handleError(res, error, 'POST purchase_orders');
    
    res.status(201).json(mapToCamel(poData));
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
    const { error } = await supabase.from('purchase_orders').update(mapToDb(req.body)).eq('id', req.params.id);
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
  res.json(mapToCamel(data));
});

app.post('/api/salaries', async (req, res) => {
  const data = mapToDb(req.body);
  const { error } = await supabase.from('salaries').insert(data);
  if (error) return handleError(res, error, 'POST salaries');
  res.status(201).json(mapToCamel(data));
});

app.put('/api/salaries/:id', async (req, res) => {
  const { error } = await supabase.from('salaries').update(mapToDb(req.body)).eq('id', req.params.id);
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
  res.json(mapToCamel(data));
});

app.post('/api/other-expenses', async (req, res) => {
  const data = mapToDb(req.body);
  const { error } = await supabase.from('other_expenses').insert(data);
  if (error) return handleError(res, error, 'POST other_expenses');
  res.status(201).json(mapToCamel(data));
});

app.put('/api/other-expenses/:id', async (req, res) => {
  const { error } = await supabase.from('other_expenses').update(mapToDb(req.body)).eq('id', req.params.id);
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
  const { error } = await supabase.from('system_config').upsert({ ...mapToDb(req.body), id: 'global_config' });
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
  res.json(mapToCamel(data));
});

app.post('/api/employees', async (req, res) => {
  try {
    const { id, name, address, phone, nik, npwp, position, email, accountNumber, bankName } = req.body;
    const employee = {
      id, name, address: address || null, phone: phone || null,
      nik: nik || null, npwp: npwp || null, position: position || null,
      email: email || null,
      accountnumber: accountNumber || null,
      bankname: bankName || null
    };
    const { error } = await supabase.from('employees').insert(employee);
    if (error) return handleError(res, error, 'POST employees');
    res.status(201).json({ id });
  } catch (err) {
    console.error('POST /employees error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, address, phone, nik, npwp, position, email, accountNumber, bankName } = req.body;
    const updates = {
      name, address: address || null, phone: phone || null,
      nik: nik || null, npwp: npwp || null, position: position || null,
      email: email || null,
      accountnumber: accountNumber || null,
      bankname: bankName || null
    };
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
  res.json(mapToCamel(data));
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
  res.json(mapToCamel(data));
});

app.post('/api/company-bank-accounts', async (req, res) => {
  const { id, bankName, accountNumber, accountName, isDefault } = req.body;
  const account = { id, bankname: bankName, accountnumber: accountNumber, accountname: accountName, isdefault: isDefault };
  const { error } = await supabase.from('company_bank_accounts').upsert(account);
  if (error) return handleError(res, error, 'POST company-bank-accounts');
  res.status(200).json({ id: account.id });
});

app.delete('/api/company-bank-accounts/:id', async (req, res) => {
  const { error } = await supabase.from('company_bank_accounts').delete().eq('id', req.params.id);
  if (error) return handleError(res, error, 'DELETE company-bank-accounts');
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (Supabase backend)`);
});
