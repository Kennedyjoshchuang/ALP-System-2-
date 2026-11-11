const path = require('path');
const fs = require('fs');
const { findInvoiceInSheet } = require('./services/google_sheets.cjs');
const { generateInvoicePdfBuffer } = require('./services/pdf_generator.cjs');
const { uploadInvoicePdf } = require('./services/google_drive.cjs');

// Path to persistent reminders JSON store (resilient across all Node environments)
const REMINDERS_FILE = path.join(__dirname, 'reminders_data.json');

function loadLocalReminders() {
  try {
    if (fs.existsSync(REMINDERS_FILE)) {
      const raw = fs.readFileSync(REMINDERS_FILE, 'utf8');
      return JSON.parse(raw) || [];
    }
  } catch (e) {
    console.warn('[bot_tools] Error reading reminders_data.json:', e.message);
  }
  return [];
}

function saveLocalReminders(list) {
  try {
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('[bot_tools] Error saving reminders_data.json:', e.message);
  }
}

// In-memory store for pending drafts (TTL 30 minutes)
const pendingDrafts = new Map();

function cleanExpiredDrafts() {
  const now = Date.now();
  for (const [id, draft] of pendingDrafts.entries()) {
    if (now - draft.createdAt > 30 * 60 * 1000) {
      pendingDrafts.delete(id);
    }
  }
}

setInterval(cleanExpiredDrafts, 5 * 60 * 1000);

// Helper for Roman numerals in Invoice ID
const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

async function getNextInvoiceId(supabase, projectCode = 'ALP') {
  const now = new Date();
  const year = now.getFullYear();
  const monthRoman = ROMAN_MONTHS[now.getMonth()];
  const suffix = `/${projectCode}-INV/${monthRoman}/${year}`;

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .like('id', `%/${projectCode}-INV/%/${year}`);

    if (error) throw error;

    let maxSeq = 0;
    if (data && data.length > 0) {
      for (const inv of data) {
        const parts = inv.id.split('/');
        if (parts.length >= 4) {
          const seqNum = parseInt(parts[0], 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
          }
        }
      }
    }
    const nextSeq = maxSeq + 1;
    return `${String(nextSeq).padStart(3, '0')}${suffix}`;
  } catch (err) {
    console.error('[bot_tools] Error in getNextInvoiceId:', err.message);
    return `001${suffix}`;
  }
}

function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

function sanitizeSearchTerm(term) {
  if (!term) return '';
  return term.replace(/[.,\-_]/g, '').trim().toLowerCase();
}

/**
 * 1. getShippingSchedules
 */
async function getShippingSchedules(supabase, { customerName, vesselName, status, limit = 10 }) {
  try {
    let query = supabase
      .from('job_orders')
      .select('id, customerName, instruction, vesselName, containerNo, etd, eta, shipmentStatus, date')
      .order('date', { ascending: false })
      .limit(limit * 2);

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return { found: 0, schedules: [], message: 'Tidak ditemukan jadwal pengiriman dengan kriteria tersebut.' };
    }

    const targetCustomer = sanitizeSearchTerm(customerName);
    const targetVessel = sanitizeSearchTerm(vesselName);
    const targetStatus = sanitizeSearchTerm(status);

    const filtered = data.filter(item => {
      if (targetCustomer && !sanitizeSearchTerm(item.customerName).includes(targetCustomer)) return false;
      if (targetVessel && !sanitizeSearchTerm(item.vesselName).includes(targetVessel)) return false;
      if (targetStatus && !sanitizeSearchTerm(item.shipmentStatus).includes(targetStatus)) return false;
      return true;
    }).slice(0, limit);

    const schedules = filtered.map(item => ({
      joId: item.id,
      customer: item.customerName,
      vessel: item.vesselName || 'Belum Ditentukan',
      container: Array.isArray(item.containerNo) ? item.containerNo.join(', ') : (item.containerNo || '-'),
      etd: item.etd || 'TBA',
      eta: item.eta || 'TBA',
      status: item.shipmentStatus || 'Pending',
      description: item.instruction || '-'
    }));

    return { found: schedules.length, schedules };
  } catch (err) {
    return { error: true, message: `Gagal mengambil jadwal: ${err.message}` };
  }
}

/**
 * Helper to collect all item rates for a customer from Job Orders & Invoices
 */
async function collectExecutedRates(supabase, customerName, serviceDescription) {
  const records = [];
  const targetCustomer = sanitizeSearchTerm(customerName);
  const targetDesc = serviceDescription ? serviceDescription.toLowerCase() : null;

  // 1. Fetch from Invoices
  try {
    const { data: invoices } = await supabase.from('invoices').select('id, customerName, items, amount, date');

    if (invoices) {
      for (const inv of invoices) {
        if (targetCustomer && !sanitizeSearchTerm(inv.customerName).includes(targetCustomer)) {
          continue;
        }

        let items = inv.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { items = []; }
        }
        if (Array.isArray(items)) {
          for (const item of items) {
            const desc = item.description || 'Pengiriman';
            const rate = parseFloat(item.rate || item.price || item.amount || 0);
            if (targetDesc && !desc.toLowerCase().includes(targetDesc)) {
              continue;
            }
            if (rate > 0) {
              records.push({
                source: 'Invoice',
                refId: inv.id,
                customer: inv.customerName,
                description: desc,
                rate,
                qty: item.qty || item.quantity || 1,
                date: inv.date
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[bot_tools] Failed to collect rates from invoices:', e.message);
  }

  // 2. Fetch from Job Orders
  try {
    const { data: jos } = await supabase.from('job_orders').select('id, customerName, items, date');

    if (jos) {
      for (const jo of jos) {
        if (targetCustomer && !sanitizeSearchTerm(jo.customerName).includes(targetCustomer)) {
          continue;
        }

        let items = jo.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { items = []; }
        }
        if (Array.isArray(items)) {
          for (const item of items) {
            const desc = item.description || jo.instruction || 'Freight Service';
            const rate = parseFloat(item.rate || 0);
            if (targetDesc && !desc.toLowerCase().includes(targetDesc)) {
              continue;
            }
            if (rate > 0) {
              records.push({
                source: 'Job Order',
                refId: jo.id,
                customer: jo.customerName,
                description: desc,
                rate,
                qty: item.quantity || 1,
                date: jo.date
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[bot_tools] Failed to collect rates from job orders:', e.message);
  }

  // Sort by date descending
  records.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return records;
}

/**
 * 2. getCustomerRates
 */
async function getCustomerRates(supabase, { customerName, serviceDescription, limit = 5 }) {
  try {
    const records = await collectExecutedRates(supabase, customerName, serviceDescription);
    if (records.length === 0) {
      return { found: 0, rates: [], message: `Tidak ditemukan riwayat rate transaksi untuk customer "${customerName || 'all'}".` };
    }

    const sliced = records.slice(0, limit).map(r => ({
      customer: r.customer,
      refId: r.refId,
      source: r.source,
      description: r.description,
      rate: r.rate,
      rateFormatted: formatIDR(r.rate),
      qty: r.qty,
      date: r.date ? new Date(r.date).toLocaleDateString('id-ID') : '-'
    }));

    return { found: records.length, latestRates: sliced };
  } catch (err) {
    return { error: true, message: `Gagal mengambil rate customer: ${err.message}` };
  }
}

/**
 * 3. getHistoricalMinMaxRates
 */
async function getHistoricalMinMaxRates(supabase, { customerName, serviceDescription }) {
  try {
    const records = await collectExecutedRates(supabase, customerName, serviceDescription);
    if (records.length === 0) {
      return { found: 0, message: `Tidak ditemukan riwayat rate untuk customer "${customerName}".` };
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let minRecord = null;
    let maxRecord = null;

    for (const r of records) {
      sum += r.rate;
      if (r.rate < min) {
        min = r.rate;
        minRecord = r;
      }
      if (r.rate > max) {
        max = r.rate;
        maxRecord = r;
      }
    }

    const avg = sum / records.length;
    const latest = records[0];

    return {
      customerName: latest.customer,
      totalTransactions: records.length,
      lowestRate: {
        rate: min,
        rateFormatted: formatIDR(min),
        description: minRecord.description,
        ref: minRecord.refId,
        date: minRecord.date ? new Date(minRecord.date).toLocaleDateString('id-ID') : '-'
      },
      highestRate: {
        rate: max,
        rateFormatted: formatIDR(max),
        description: maxRecord.description,
        ref: maxRecord.refId,
        date: maxRecord.date ? new Date(maxRecord.date).toLocaleDateString('id-ID') : '-'
      },
      averageRate: {
        rate: Math.round(avg),
        rateFormatted: formatIDR(avg)
      },
      latestRate: {
        rate: latest.rate,
        rateFormatted: formatIDR(latest.rate),
        description: latest.description,
        ref: latest.refId,
        date: latest.date ? new Date(latest.date).toLocaleDateString('id-ID') : '-'
      }
    };
  } catch (err) {
    return { error: true, message: `Gagal menghitung min/max rate: ${err.message}` };
  }
}

/**
 * 4. getExpectedSales
 */
async function getExpectedSales(supabase, { customerName }) {
  try {
    let query = supabase.from('quotations').select('id, customerName, total, status, date, validFrom, validTo');
    const { data: quotes, error } = await query;
    if (error) throw error;

    if (!quotes || quotes.length === 0) {
      return { expectedSales: 0, activeContractsCount: 0, message: `Tidak ada quotation atau kontrak aktif untuk customer "${customerName || 'all'}".` };
    }

    const targetCustomer = sanitizeSearchTerm(customerName);
    const active = quotes.filter(q => {
      if (targetCustomer && !sanitizeSearchTerm(q.customerName).includes(targetCustomer)) return false;
      return q.status === 'approved' || q.status === 'pending';
    });

    const totalExpected = active.reduce((acc, q) => acc + (parseFloat(q.total) || 0), 0);

    return {
      customerName: customerName || 'Semua Customer',
      activeContractsCount: active.length,
      totalExpectedSales: totalExpected,
      totalExpectedSalesFormatted: formatIDR(totalExpected),
      contracts: active.map(q => ({
        id: q.id,
        customer: q.customerName,
        totalFormatted: formatIDR(q.total),
        status: q.status,
        validUntil: q.validTo || 'N/A'
      }))
    };
  } catch (err) {
    return { error: true, message: `Gagal mengambil data expected sales: ${err.message}` };
  }
}

/**
 * 5. draftQuotation
 */
async function draftQuotation(supabase, { customerName, items, notes, pic, marketingName, marketingPhone, validDays = 30 }) {
  try {
    if (!customerName) return { error: true, message: 'Nama customer wajib diisi untuk membuat quotation.' };
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { error: true, message: 'Daftar item / rincian muatan wajib disertakan.' };
    }

    let calculatedTotal = 0;
    const formattedItems = items.map((item, index) => {
      const qty = parseFloat(item.qty || item.quantity || 1);
      const price = parseFloat(item.price || item.rate || 0);
      const itemTotal = qty * price;
      calculatedTotal += itemTotal;
      return {
        id: String(index + 1),
        description: item.description || 'Freight Service',
        qty,
        unitPrice: price,
        total: itemTotal
      };
    });

    const now = new Date();
    const validFrom = now.toISOString().slice(0, 10);
    const validToDate = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);
    const validTo = validToDate.toISOString().slice(0, 10);

    const draftId = `DRAFT-Q-${Date.now().toString().slice(-4)}`;
    const draftData = {
      type: 'quotation',
      draftId,
      customerName,
      pic: pic || '-',
      items: formattedItems,
      total: calculatedTotal,
      generalNotes: notes || '',
      marketingName: marketingName || 'Chatbot Operations',
      marketingPhone: marketingPhone || '',
      validFrom,
      validTo,
      date: validFrom,
      status: 'pending',
      createdAt: Date.now()
    };

    pendingDrafts.set(draftId, draftData);

    const itemsSummary = formattedItems.map(i => `• ${i.description} (${i.qty}x @ ${formatIDR(i.unitPrice)}) = *${formatIDR(i.total)}*`).join('\n');

    const preview = `📋 *DRAFT QUOTATION (${draftId})*\n\n` +
      `*Customer:* ${customerName}\n` +
      `*PIC:* ${draftData.pic}\n` +
      `*Masa Berlaku:* ${validFrom} s/d ${validTo}\n\n` +
      `*Rincian Item:*\n${itemsSummary}\n\n` +
      `*Total Biaya:* ${formatIDR(calculatedTotal)}\n` +
      (notes ? `*Catatan:* ${notes}\n\n` : '\n') +
      `Ketik *Konfirmasi ${draftId}* untuk menerbitkan quotation, atau ketik *Batal ${draftId}* untuk membatalkan.`;

    return { draftId, preview, data: draftData };
  } catch (err) {
    return { error: true, message: `Gagal membuat draft quotation: ${err.message}` };
  }
}

/**
 * 6. draftInvoice
 */
async function draftInvoice(supabase, { customerName, items, joId, notes, taxRate = 0 }) {
  try {
    if (!customerName) return { error: true, message: 'Nama customer wajib diisi untuk membuat invoice.' };
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { error: true, message: 'Daftar item invoice wajib diisi.' };
    }

    let subtotal = 0;
    const formattedItems = items.map((item) => {
      const qty = parseFloat(item.qty || item.quantity || 1);
      const rate = parseFloat(item.rate || item.price || item.amount || 0);
      const amount = qty * rate;
      subtotal += amount;
      return {
        description: item.description || 'Freight Service',
        qty,
        rate,
        amount
      };
    });

    const tax = subtotal * (taxRate || 0);
    const amount = subtotal + tax;
    const today = new Date().toISOString().slice(0, 10);
    const draftId = `DRAFT-INV-${Date.now().toString().slice(-4)}`;

    const draftData = {
      type: 'invoice',
      draftId,
      customerName,
      joId: joId || null,
      subtotal,
      tax,
      amount,
      items: formattedItems,
      date: today,
      status: 'pending',
      notes: notes || null,
      createdAt: Date.now()
    };

    pendingDrafts.set(draftId, draftData);

    const itemsSummary = formattedItems.map(i => `• ${i.description} (${i.qty}x @ ${formatIDR(i.rate)}) = *${formatIDR(i.amount)}*`).join('\n');

    const preview = `🧾 *DRAFT INVOICE (${draftId})*\n\n` +
      `*Customer:* ${customerName}\n` +
      (joId ? `*Job Order Ref:* ${joId}\n` : '') +
      `*Tanggal:* ${today}\n\n` +
      `*Rincian:*\n${itemsSummary}\n\n` +
      `*Subtotal:* ${formatIDR(subtotal)}\n` +
      `*Pajak:* ${formatIDR(tax)}\n` +
      `*Grand Total:* *${formatIDR(amount)}*\n\n` +
      `Ketik *Konfirmasi ${draftId}* untuk menerbitkan invoice, atau ketik *Batal ${draftId}* untuk membatalkan.`;

    return { draftId, preview, data: draftData };
  } catch (err) {
    return { error: true, message: `Gagal membuat draft invoice: ${err.message}` };
  }
}

/**
 * 6b. printInvoiceFromSheet
 * Fetches invoice row from Google Sheets, formats preview, and creates draft for confirmation
 */
async function printInvoiceFromSheet(supabase, { invoiceNumber }) {
  try {
    if (!invoiceNumber) {
      return { error: true, message: 'Nomor invoice wajib dicantumkan (contoh: "print invoice 125" atau "101").' };
    }

    const sheetData = await findInvoiceInSheet(invoiceNumber);

    // Try to enrich customer address & name from database if available
    try {
      const { data: custData } = await supabase
        .from('customers')
        .select('name, address')
        .ilike('name', `%${sheetData.customerName}%`)
        .limit(1);

      if (custData && custData.length > 0) {
        if (custData[0].name) {
          sheetData.customerName = custData[0].name;
        }
        if (custData[0].address) {
          sheetData.customerAddress = custData[0].address;
        }
      }
    } catch (e) {
      // ignore
    }

    const draftId = `DRAFT-INV-${Date.now().toString().slice(-4)}`;
    const draftData = {
      type: 'sheet_invoice',
      draftId,
      ...sheetData,
      createdAt: Date.now()
    };

    pendingDrafts.set(draftId, draftData);

    const itemsSummary = sheetData.items.map(i =>
      `• *${i.description}*${i.cargoDetail ? ` (${i.cargoDetail})` : ''}\n  Kuantitas: ${i.qty.toLocaleString('id-ID')} ${i.unit} @ ${formatIDR(i.rate)} = *${formatIDR(i.total)}*`
    ).join('\n');

    const preview = `🧾 *PREVIEW INVOICE DARI GOOGLE SHEET (${draftId})*\n\n` +
      `*No. Invoice:* ${sheetData.invoiceId}\n` +
      `*Customer:* ${sheetData.customerName}\n` +
      `*Alamat:* ${sheetData.customerAddress}\n` +
      (sheetData.vesselName ? `*Kapal:* ${sheetData.vesselName}\n` : '') +
      (sheetData.joId ? `*Referensi JO:* ${sheetData.joId}\n` : '') +
      `*Tanggal:* ${sheetData.date}\n\n` +
      `*Rincian Item:*\n${itemsSummary}\n\n` +
      `*Sub Total:* ${formatIDR(sheetData.subtotal)}\n` +
      `*Total Tagihan:* *${formatIDR(sheetData.total)}*\n\n` +
      `Ketik *Konfirmasi ${draftId}* untuk mencetak PDF resmi dan mengunggah ke Google Drive, atau ketik *Batal ${draftId}* untuk membatalkan.`;

    return { draftId, preview, data: draftData };
  } catch (err) {
    return { error: true, message: `Gagal mengambil data invoice dari Google Sheet: ${err.message}` };
  }
}

/**
 * 7. confirmDraft
 */
async function confirmDraft(supabase, { draftId, action = 'confirm' }) {
  try {
    let targetDraft = null;
    let actualDraftId = draftId;

    if (!draftId) {
      const entries = Array.from(pendingDrafts.entries());
      if (entries.length > 0) {
        entries.sort((a, b) => b[1].createdAt - a[1].createdAt);
        [actualDraftId, targetDraft] = entries[0];
      }
    } else {
      targetDraft = pendingDrafts.get(draftId) || pendingDrafts.get(draftId.toUpperCase());
      if (targetDraft) actualDraftId = targetDraft.draftId;
    }

    if (!targetDraft) {
      return { error: true, message: `Draft dengan ID "${actualDraftId || 'terbaru'}" tidak ditemukan atau sudah kadaluarsa (30 menit).` };
    }

    if (action.toLowerCase() === 'cancel' || action.toLowerCase() === 'batal') {
      pendingDrafts.delete(actualDraftId);
      return { success: true, message: `❌ Draft ${actualDraftId} telah dibatalkan.` };
    }

    if (targetDraft.type === 'quotation') {
      const now = new Date();
      const quoId = `QUO-${now.getFullYear().toString().slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(100 + Math.random() * 900)}`;

      const insertPayload = {
        id: quoId,
        customerId: targetDraft.customerId || null,
        customerName: targetDraft.customerName,
        pic: targetDraft.pic,
        generalNotes: targetDraft.generalNotes,
        date: targetDraft.date,
        status: 'pending',
        items: targetDraft.items,
        total: targetDraft.total,
        marketingName: targetDraft.marketingName,
        marketingPhone: targetDraft.marketingPhone,
        marketingEmail: targetDraft.marketingEmail || '',
        validFrom: targetDraft.validFrom,
        validTo: targetDraft.validTo
      };

      const { error } = await supabase.from('quotations').insert(insertPayload);
      if (error) throw error;

      pendingDrafts.delete(actualDraftId);
      return {
        success: true,
        type: 'quotation',
        id: quoId,
        message: `✅ *Quotation Berhasil Diterbitkan!*\nNo. Quotation: *${quoId}*\nCustomer: ${targetDraft.customerName}\nTotal: ${formatIDR(targetDraft.total)}`
      };
    }

    if (targetDraft.type === 'invoice') {
      const officialInvId = await getNextInvoiceId(supabase, 'ALP');

      const insertPayload = {
        id: officialInvId,
        joId: targetDraft.joId || null,
        customerName: targetDraft.customerName,
        amount: targetDraft.amount,
        subtotal: targetDraft.subtotal,
        tax: targetDraft.tax,
        date: targetDraft.date,
        status: 'pending',
        notes: targetDraft.notes,
        items: targetDraft.items
      };

      const { error } = await supabase.from('invoices').insert(insertPayload);
      if (error) throw error;

      pendingDrafts.delete(actualDraftId);
      return {
        success: true,
        type: 'invoice',
        id: officialInvId,
        message: `✅ *Invoice Berhasil Diterbitkan!*\nNo. Invoice: *${officialInvId}*\nCustomer: ${targetDraft.customerName}\nTotal: ${formatIDR(targetDraft.amount)}`
      };
    }

    if (targetDraft.type === 'sheet_invoice') {
      let pdfBuffer = null;
      let driveResult = null;
      let driveUrl = null;
      let driveError = null;

      // 1. Generate PDF buffer strictly matching ALP template
      try {
        pdfBuffer = await generateInvoicePdfBuffer(targetDraft);
      } catch (pdfErr) {
        console.error('[bot_tools] Error generating PDF:', pdfErr.message);
        return { error: true, message: `Gagal membuat PDF invoice: ${pdfErr.message}` };
      }

      // 2. Upload to Google Drive under the designated [MONTH] [YEAR] folder
      try {
        driveResult = await uploadInvoicePdf(pdfBuffer, targetDraft.invoiceId);
        driveUrl = driveResult.webViewLink;
      } catch (dErr) {
        console.warn('[bot_tools] Google Drive upload failed:', dErr.message);
        driveError = dErr.message;
      }

      // 3. Upsert to Supabase invoices table
      try {
        await supabase.from('invoices').upsert({
          id: targetDraft.invoiceId,
          joId: targetDraft.joId || null,
          customerName: targetDraft.customerName,
          amount: targetDraft.total,
          subtotal: targetDraft.subtotal,
          tax: 0,
          date: targetDraft.date,
          status: 'issued',
          notes: driveUrl ? `Google Drive: ${driveUrl}` : (driveError ? `Drive Error: ${driveError}` : null),
          items: targetDraft.items
        });
      } catch (dbErr) {
        console.warn('[bot_tools] Failed to upsert into Supabase invoices:', dbErr.message);
      }

      pendingDrafts.delete(actualDraftId);

      const fileName = `${targetDraft.invoiceId.replace(/\//g, '_')}.pdf`;
      const successMsg = `✅ *Invoice Berhasil Dicetak!*\n` +
        `• No. Invoice: *${targetDraft.invoiceId}*\n` +
        `• Customer: *${targetDraft.customerName}*\n` +
        `• Total: *${formatIDR(targetDraft.total)}*\n` +
        (driveUrl ? `• Google Drive: ${driveUrl}\n` : (driveError ? `⚠️ _Google Drive belum terhubung (${driveError})_\n` : '')) +
        `\n_File PDF resmi terlampir di bawah._`;

      return {
        success: true,
        type: 'sheet_invoice',
        id: targetDraft.invoiceId,
        driveUrl,
        pdfBuffer,
        fileName,
        message: successMsg
      };
    }

    return { error: true, message: 'Tipe draft tidak dikenal.' };
  } catch (err) {
    return { error: true, message: `Gagal memproses konfirmasi draft: ${err.message}` };
  }
}

/**
 * 8. createReminder
 */
async function createReminder(supabase, { chatId, creatorPhone, message, remindAt }) {
  try {
    if (!message) return { error: true, message: 'Pesan pengingat tidak boleh kosong.' };
    if (!remindAt) return { error: true, message: 'Waktu pengingat harus disertakan.' };

    const targetDate = new Date(remindAt);
    if (isNaN(targetDate.getTime())) {
      return { error: true, message: 'Format tanggal/waktu pengingat tidak valid.' };
    }

    const id = `REM-${Date.now().toString().slice(-6)}`;
    const isoDate = targetDate.toISOString();

    try {
      await supabase.from('reminders').insert({
        id,
        chat_id: chatId,
        creator_phone: creatorPhone || null,
        message,
        remind_at: isoDate,
        status: 'pending'
      });
    } catch (e) {}

    const list = loadLocalReminders();
    list.push({
      id,
      chat_id: chatId,
      creator_phone: creatorPhone || '',
      message,
      remind_at: isoDate,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    saveLocalReminders(list);

    const formattedTime = targetDate.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    return {
      success: true,
      id,
      message: `⏰ *Pengingat Berhasil Disetel!*\n\n*Pesan:* ${message}\n*Waktu:* ${formattedTime} WIB\n*ID:* ${id}`
    };
  } catch (err) {
    return { error: true, message: `Gagal menyimpan pengingat: ${err.message}` };
  }
}

/**
 * 9. getDueReminders
 */
async function getDueReminders(supabase) {
  const due = [];
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('remind_at', now);
    if (!error && data) {
      due.push(...data);
    }
  } catch (e) {}

  const list = loadLocalReminders();
  for (const item of list) {
    if (item.status === 'pending' && item.remind_at <= now) {
      if (!due.some(d => d.id === item.id)) {
        due.push(item);
      }
    }
  }

  return due;
}

/**
 * 10. markReminderSent
 */
async function markReminderSent(supabase, reminderId) {
  try {
    await supabase.from('reminders').update({ status: 'sent' }).eq('id', reminderId);
  } catch (e) {}

  const list = loadLocalReminders();
  const found = list.find(r => r.id === reminderId);
  if (found) {
    found.status = 'sent';
    saveLocalReminders(list);
  }
}

module.exports = {
  getShippingSchedules,
  getCustomerRates,
  getHistoricalMinMaxRates,
  getExpectedSales,
  draftQuotation,
  draftInvoice,
  printInvoiceFromSheet,
  confirmDraft,
  createReminder,
  getDueReminders,
  markReminderSent,
  formatIDR
};
