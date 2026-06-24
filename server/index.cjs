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

// --- SECURITY & TOKEN MODULES ---
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function generateToken(payload) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(JWT_SECRET, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function verifyToken(token) {
  try {
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(JWT_SECRET, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const payload = JSON.parse(decrypted);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parsePermissions(roleStr) {
  if (!roleStr) return {};
  if (roleStr.startsWith('{')) {
    try {
      return JSON.parse(roleStr);
    } catch (e) {
      return {};
    }
  }
  switch (roleStr) {
    case 'marketing': return { marketing: 'write' };
    case 'accounting': return { accounting: 'write' };
    case 'executor': return { executor: 'write' };
    case 'admin': return { admin: 'write', procurement: 'write' };
    case 'hrd': return { hrd: 'write' };
    case 'owner': return { marketing: 'write', admin: 'write', procurement: 'write', executor: 'write', accounting: 'write', hrd: 'write', systemControl: 'write' };
    default: return {};
  }
}

// Route: Login (Public)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password diperlukan.' });
  }

  // 1. Check hardcoded/admin accounts
  const rolesMap = {
    'owner': { name: 'Owner', role: 'owner', key: 'Haiga1899.2003' },
    'marketing': { name: 'Marketing', role: 'marketing', key: 'Haiga1899.2003' },
    'admin': { name: 'Admin Office', role: 'admin', key: 'Haiga1899.2003' },
    'executor': { name: 'Executor', role: 'executor', key: 'Haiga1899.2003' },
    'accounting': { name: 'Accounting', role: 'accounting', key: 'Haiga1899.2003' }
  };

  const userMatch = rolesMap[username];
  if (userMatch && password === userMatch.key) {
    const userData = { 
      name: userMatch.name, 
      role: userMatch.role,
      permissions: parsePermissions(userMatch.role)
    };
    return res.json({
      success: true,
      token: generateToken(userData),
      user: userData
    });
  }

  // 2. Check custom employee accounts
  const { data: accounts, error: accError } = await supabase
    .from('employee_accounts')
    .select('*')
    .eq('username', username)
    .eq('password', password);

  if (accError) return handleError(res, accError, 'login db check');
  
  if (accounts && accounts.length > 0) {
    const empAccount = accounts[0];
    
    // Find employee name
    const { data: employee } = await supabase
      .from('employees')
      .select('name')
      .eq('id', empAccount.id)
      .single();

    const userData = { 
      name: employee?.name || empAccount.username, 
      role: empAccount.role,
      employeeId: empAccount.id,
      permissions: parsePermissions(empAccount.role)
    };
    return res.json({
      success: true,
      token: generateToken(userData),
      user: userData
    });
  }

  return res.status(401).json({ error: 'Username atau password salah.' });
});

// Middleware: Authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi diperlukan.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak: Format token salah.' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Akses ditolak: Token tidak valid atau kedaluwarsa.' });
  }
  req.user = payload;
  next();
};

// Privilege escalation and self-modification check helper
const validateRoleUpdate = (editor, targetId, newRoleStr) => {
  if (editor.role === 'owner') return true;

  // Cannot modify own account
  if (targetId && targetId === editor.employeeId) {
    return false;
  }

  // Cannot grant owner role
  if (newRoleStr === 'owner') {
    return false;
  }

  // Cannot grant permissions higher than the editor's
  const newPermissions = parsePermissions(newRoleStr);
  for (const [moduleKey, newLevel] of Object.entries(newPermissions)) {
    const editorLevel = editor.permissions?.[moduleKey];
    if (!editorLevel) return false;
    if (newLevel === 'write' && editorLevel !== 'write') return false;
  }

  return true;
};

// Helper for module access check
function hasModuleAccess(user, moduleKey, isWrite) {
  const perm = user.permissions?.[moduleKey];
  if (!perm) return false;
  if (isWrite) {
    return perm === 'write';
  }
  return perm === 'write' || perm === 'read';
}

// Middleware: Authorization and security checks
const authorize = (req, res, next) => {
  if (req.user.role === 'owner') {
    return next();
  }

  const method = req.method;
  const path = req.path.replace(/^\/api/, '').toLowerCase();
  const isWrite = ['POST', 'PUT', 'DELETE'].includes(method);

  // 1. Prevent self-modification of employees or employee-accounts on POST/PUT/DELETE
  if (isWrite) {
    if (path.startsWith('/employee-accounts') || path.startsWith('/employees')) {
      const parts = path.split('/');
      const targetId = parts[2];
      if (targetId && targetId === req.user.employeeId) {
        return res.status(403).json({ error: 'Akses ditolak: Anda tidak diperbolehkan mengubah akun Anda sendiri.' });
      }
    }
  }

  // 2. Prevent privilege escalation when creating/modifying employee accounts
  if (isWrite && path.startsWith('/employee-accounts')) {
    const parts = path.split('/');
    const targetId = parts[2];
    const newRole = req.body.role;
    if (newRole && !validateRoleUpdate(req.user, targetId, newRole)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak dapat memberikan hak akses yang melebihi wewenang Anda.' });
    }
  }

  // 3. Standard route checks
  let moduleKey = null;

  if (path.startsWith('/customers') || path.startsWith('/prospects') || path.startsWith('/quotations')) {
    moduleKey = 'marketing';
  } else if (path.startsWith('/vendors')) {
    moduleKey = 'procurement';
  } else if (path.startsWith('/invoices') || path.startsWith('/receivables') || path.startsWith('/salaries') || path.startsWith('/other-expenses') || path.startsWith('/company-bank-accounts')) {
    moduleKey = 'accounting';
  } else if (path.startsWith('/employees') || path.startsWith('/employee-accounts')) {
    moduleKey = 'hrd';
  } else if (path.startsWith('/system')) {
    moduleKey = 'systemControl';
  } else if (path.startsWith('/purchase-orders')) {
    const hasAdmin = hasModuleAccess(req.user, 'admin', isWrite);
    const hasAccounting = hasModuleAccess(req.user, 'accounting', isWrite);
    if (hasAdmin || hasAccounting) {
      return next();
    }
    return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini.' });
  } else if (path.startsWith('/job-orders')) {
    const hasAdmin = hasModuleAccess(req.user, 'admin', isWrite);
    const hasExecutor = hasModuleAccess(req.user, 'executor', isWrite);
    if (hasAdmin || hasExecutor) {
      return next();
    }
    return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini.' });
  }

  if (moduleKey) {
    if (hasModuleAccess(req.user, moduleKey, isWrite)) {
      return next();
    }
  }

  return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini.' });
};

// Protect all /api endpoints except /api/login
app.use((req, res, next) => {
  if (req.path === '/api/login') return next();
  if (!req.path.startsWith('/api')) return next();
  authenticate(req, res, next);
});

app.use((req, res, next) => {
  if (req.path === '/api/login') return next();
  if (!req.path.startsWith('/api')) return next();
  authorize(req, res, next);
});

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
  const { id, name, phone, email, address, customData } = req.body;
  const { error } = await supabase.from('customers').insert({ id, name, phone, email, address, customData: customData || {} });
  if (error) return handleError(res, error, 'POST customers');
  res.status(201).json({ id });
});

app.put('/api/customers/:id', async (req, res) => {
  const { name, phone, email, address, customData } = req.body;
  const { error } = await supabase.from('customers').update({ name, phone, email, address, customData: customData || {} }).eq('id', req.params.id);
  if (error) return handleError(res, error, 'PUT customers');
  res.sendStatus(204);
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
  const { id, name, phone, email, address, pic, notes, description, marketingName, marketingPhone, marketingEmail, companyAddress, date, status, customData } = req.body;
  const prospect = cleanPayload({
    id, name, phone, email, address, pic, notes, description,
    marketingName, marketingPhone, marketingEmail, companyAddress, date, status,
    customData: customData || {}
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
    const id = 'JO-' + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
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

app.post('/api/job-orders/bulk', async (req, res) => {
  try {
    const jobOrders = req.body;
    if (!Array.isArray(jobOrders)) {
      return res.status(400).json({ error: 'Body must be an array' });
    }
    const insertedJOs = [];
    const date = new Date().toISOString().split('T')[0];
    for (const jo of jobOrders) {
      const id = 'JO-' + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const { quotationId, customerName, jobDescription, phone, email, rate, quantity, quoteValidity } = jo;
      const { error } = await supabase.from('job_orders').insert({
        id, quotationId, customerName, instruction: jobDescription,
        status: 'pending', quantity, issueQuantity: 0,
        phone, email, rate, quoteValidity, date,
        photos: [], costs: [],
        containerNo: [], vehicleNo: [], driverName: []
      });
      if (error) throw error;
      insertedJOs.push({
        id, quotationId, customerName, instruction: jobDescription,
        status: 'pending', quantity, issueQuantity: 0,
        phone, email, rate, quoteValidity, date,
        photos: [], costs: [],
        containerNo: [], vehicleNo: [], driverName: [],
        jobDescription
      });
    }
    res.status(201).json(insertedJOs);
  } catch (err) {
    console.error('Bulk Create JO Error:', err);
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
  const { data, error } = await supabase.from('employee_accounts').select('id, username, role');
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
