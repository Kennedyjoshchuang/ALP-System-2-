const { google } = require('googleapis');
const { getGoogleAuth } = require('./google_auth.cjs');

const DEFAULT_SHEET_ID = '1QAwKwDpI3Q7PAUHt68Ua2qX5tByva2swFrKJzSQw1iQ';

// Month names in Indonesian for date formatting
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function cleanNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  // Convert Indonesian decimal comma e.g. "1,29" or "Rp1.032.000,00"
  let clean = String(str).replace(/[Rp\s.]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function parseQuantity(str) {
  if (typeof str === 'number') return str;
  if (!str) return 1;
  let clean = String(str).replace(',', '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) || num <= 0 ? 1 : num;
}

/**
 * Fetch rows from Google Sheets API, or fallback to CSV export if not yet authenticated
 */
async function fetchSheetData(spreadsheetId = DEFAULT_SHEET_ID) {
  const auth = getGoogleAuth();

  if (auth) {
    try {
      const sheets = google.sheets({ version: 'v4', auth });
      // Get the first sheet values
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:N'
      });
      if (res.data.values && res.data.values.length > 0) {
        return res.data.values;
      }
    } catch (err) {
      console.warn('[google_sheets] Sheets API failed, trying public CSV fallback:', err.message);
    }
  }

  // Fallback: Fetch public CSV export directly
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Gagal mengunduh sheet CSV (${response.status}: ${response.statusText})`);
    }
    const text = await response.text();
    return parseCsvToRows(text);
  } catch (err) {
    throw new Error(`Tidak dapat mengakses Google Sheet. Pastikan link dapat diakses atau kredensial Google telah diatur: ${err.message}`);
  }
}

/**
 * Robust CSV parser that handles multi-line fields enclosed in quotes
 */
function parseCsvToRows(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip CRLF
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Searches the Google Sheet for a matching Invoice Number (e.g. "125", "101", "101/ALP-INV/X/2026")
 */
async function findInvoiceInSheet(invoiceQuery, spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SHEET_ID)) {
  if (!invoiceQuery) {
    throw new Error('Nomor invoice wajib dicantumkan (contoh: "print invoice 125" atau "101").');
  }

  const queryClean = String(invoiceQuery).trim().toLowerCase();
  const rows = await fetchSheetData(spreadsheetId);

  // Column N (index 12) is "ALP INVOICE NO."
  const COL_INVOICE_NO = 12;

  let targetRowIndex = -1;
  let matchedInvoiceId = '';

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const invCell = row[COL_INVOICE_NO] ? String(row[COL_INVOICE_NO]).trim() : '';
    if (!invCell) continue;

    const lowerInv = invCell.toLowerCase();

    // 1. Exact match e.g. "101/alp-inv/x/2026"
    if (lowerInv === queryClean) {
      targetRowIndex = r;
      matchedInvoiceId = invCell;
      break;
    }

    // 2. Prefix match e.g. query "125" matches "125/alp-inv/ix/2026" or "125/"
    const prefixMatch = lowerInv.match(/^(\d+)[/-]/);
    if (prefixMatch && prefixMatch[1] === queryClean) {
      targetRowIndex = r;
      matchedInvoiceId = invCell;
      break;
    }

    // 3. Number starts with query e.g. "101"
    if (lowerInv.startsWith(queryClean + '/') || lowerInv.startsWith(queryClean + ' ')) {
      targetRowIndex = r;
      matchedInvoiceId = invCell;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error(`Invoice dengan nomor "${invoiceQuery}" tidak ditemukan pada Google Sheet.`);
  }

  const salesRow = rows[targetRowIndex];

  // Walk upwards to find the header / start of this Job Order block
  let joRow = salesRow;
  let joId = '';
  let vesselName = '';
  let fullDescription = '';
  let stuffingDate = '';

  for (let r = targetRowIndex; r >= Math.max(0, targetRowIndex - 25); r--) {
    const checkRow = rows[r];
    const colJo = checkRow[1] ? String(checkRow[1]).trim() : ''; // NO. ORDER (e.g. JO.2026.09052)
    const colDesc = checkRow[4] ? String(checkRow[4]).trim() : ''; // DESKRIPSI

    if (colJo.startsWith('JO.') || (colDesc && (colDesc.includes('CUSTOMER:') || colDesc.includes('CNSGNEE') || colDesc.includes('SHIPPER')))) {
      joRow = checkRow;
      joId = colJo;
      stuffingDate = checkRow[2] ? String(checkRow[2]).trim() : '';
      vesselName = checkRow[3] ? String(checkRow[3]).trim() : '';
      fullDescription = colDesc;
      break;
    }
  }

  // If fullDescription wasn't in the JO start row, check salesRow itself
  if (!fullDescription && salesRow[4]) {
    fullDescription = String(salesRow[4]).trim();
  }

  // Parse Customer Name from description block
  let customerName = 'CV. Brilliant Sukses'; // fallback
  const custMatch = fullDescription.match(/CUSTOMER\s*:\s*([^\r\n]+)/i) ||
                    fullDescription.match(/CNSGNEE\s*:\s*([^\r\n]+)/i) ||
                    fullDescription.match(/CONSIGNEE\s*:\s*([^\r\n]+)/i);

  if (custMatch && custMatch[1]) {
    customerName = custMatch[1].trim();
  }

  // Extract Route / Main Service (usually line 1 of DESKRIPSI e.g. "DOMESTIK DOOR TO DOOR JAKARTA- BATAM")
  const descLines = fullDescription.split('\n').map(l => l.trim()).filter(Boolean);
  const routeLine = descLines[0] || 'LCL Jakarta-Batam';

  // Extract BL No
  const blMatch = fullDescription.match(/BL\s*:\s*([^\r\n]+)/i);
  const blNo = blMatch ? blMatch[1].trim() : '';

  // Extract Container numbers
  const containerMatches = Array.from(fullDescription.matchAll(/\b([A-Z]{3,4}\d{6,7})\b/g), m => m[1]);
  const containers = [...new Set(containerMatches)];

  // Formatted Vessel e.g. "KM Teluk Flaminggo V.21"
  let formattedVessel = vesselName ? vesselName.trim() : '';
  if (formattedVessel && !formattedVessel.toUpperCase().startsWith('KM') && !formattedVessel.toUpperCase().startsWith('MV')) {
    formattedVessel = `KM ${formattedVessel}`;
  }
  if (formattedVessel) {
    formattedVessel = formattedVessel.replace(/\s+(\d+)$/, ' V.$1');
    formattedVessel = formattedVessel
      .toLowerCase()
      .replace(/(?:^|\s)[a-z]/g, c => c.toUpperCase())
      .replace(/\bKm\b/g, 'KM')
      .replace(/\bMv\b/g, 'MV')
      .replace(/\bv\.(\d+)/i, 'V.$1');
  }

  // Extract Cargo specifics
  let cargoDetail = '';
  if (fullDescription.toUpperCase().includes('ALFA BANGUN PERSADA') || fullDescription.toUpperCase().includes('HARAPAN SRI JAYA')) {
    cargoDetail = 'Bata Ringan';
  } else if (fullDescription.toUpperCase().includes('PLASTIK THERMAL GLOSSY') || fullDescription.toUpperCase().includes('BRILLIANT SUKSES')) {
    cargoDetail = 'Plastik Thermal Glossy';
  } else {
    for (const line of descLines) {
      if (!line.includes(':') && line !== routeLine && !line.startsWith('STUFFING') && !line.startsWith('BL') && !/^[A-Z]{3,4}\d{6,7}/.test(line)) {
        cargoDetail = line;
        break;
      }
    }
  }

  // Parse Sales, Quantity, Size
  const rawQty = salesRow[7]; // JML
  const rawSize = salesRow[8]; // SIZE
  const rawSales = salesRow[9]; // SALES

  const qty = parseQuantity(rawQty);
  const unit = (rawSize ? String(rawSize).trim() : 'CBM').toUpperCase();
  const totalAmount = cleanNumber(rawSales);
  const unitRate = qty > 0 ? Math.round(totalAmount / qty) : totalAmount;

  // Resolve Route & Cargo table labels
  let tableLine1 = routeLine;
  let tableLine2 = cargoDetail;

  if (routeLine.toUpperCase().startsWith('DOMESTIK') || routeLine.toUpperCase().startsWith('DOOR') || routeLine.toUpperCase().startsWith('PORT')) {
    tableLine1 = `Pengiriman ${cargoDetail || 'Muatan'}`;
    let routeOnly = routeLine
      .replace(/\b(?:DOMESTIK|DOMESTIC|DOOR\s*TO\s*DOOR|DOOR\s*-\s*DOOR|PORT\s*TO\s*PORT|PORT\s*-\s*PORT|LCL|FCL)\b/gi, '')
      .trim();
    if (routeOnly) {
      tableLine2 = routeOnly
        .toLowerCase()
        .replace(/(^|\s|-)([a-z])/g, (_, sep, char) => sep + char.toUpperCase());
    } else {
      tableLine2 = 'Jakarta- Batam';
    }
  } else if (routeLine.toUpperCase().startsWith('LCL')) {
    tableLine1 = routeLine;
    tableLine2 = cargoDetail;
  }

  // Invoice Date: Always use the generation date (e.g. Batam, 11 November 2026)
  const now = new Date();
  const invoiceDateStr = `Batam, ${now.getDate()} ${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()}`;

  // Build the clean invoice payload matching the template
  return {
    invoiceId: matchedInvoiceId,
    joId: joId || salesRow[1] || null,
    vesselName: formattedVessel,
    blNo,
    containers,
    customerName,
    customerAddress: 'Sungai Panas, Batam', // Will be supplemented by DB lookup if available
    date: invoiceDateStr,
    items: [
      {
        description: tableLine1,
        cargoDetail: tableLine2 || '',
        qty,
        unit,
        rate: unitRate,
        total: totalAmount
      }
    ],
    subtotal: totalAmount,
    otherExpenses: 0,
    dp: 0,
    total: totalAmount,
    raw: {
      salesRowIndex: targetRowIndex + 1,
      rawSales,
      rawQty,
      rawSize
    }
  };
}

/**
 * Searches the Google Sheet for a matching Job Order (e.g. "05003", "JO.2026.05003", or customer name)
 */
async function findJobOrderInSheet(joQuery, spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SHEET_ID)) {
  if (!joQuery) {
    throw new Error('Nomor Job Order wajib dicantumkan (contoh: "print quotation 05003" atau "JO.2026.05003").');
  }

  const queryClean = String(joQuery).trim().toLowerCase().replace(/^jo[.\s-]*/i, '');
  const rows = await fetchSheetData(spreadsheetId);

  // Column 1 is "NO. ORDER" (e.g. "JO.2026.05003")
  const COL_JO_NO = 1;

  let targetRowIndex = -1;
  let matchedJoId = '';

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const joCell = row[COL_JO_NO] ? String(row[COL_JO_NO]).trim() : '';
    if (!joCell) continue;

    const lowerJo = joCell.toLowerCase();

    // 1. Exact match e.g. "jo.2026.05003"
    if (lowerJo === queryClean || lowerJo === `jo.${queryClean}` || lowerJo === `jo.2026.${queryClean}`) {
      targetRowIndex = r;
      matchedJoId = joCell;
      break;
    }

    // 2. Suffix match e.g. query "05003" matches "JO.2026.05003"
    if (lowerJo.endsWith(queryClean) || lowerJo.endsWith('.' + queryClean)) {
      targetRowIndex = r;
      matchedJoId = joCell;
      break;
    }

    // 3. Substring match
    if (lowerJo.includes(queryClean)) {
      targetRowIndex = r;
      matchedJoId = joCell;
      break;
    }
  }

  // If not matched by JO column, try matching by Customer Name or description in column 4
  if (targetRowIndex === -1) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const desc = row[4] ? String(row[4]).toLowerCase() : '';
      if (desc.includes(queryClean)) {
        targetRowIndex = r;
        matchedJoId = row[COL_JO_NO] ? String(row[COL_JO_NO]).trim() : `JO-${queryClean}`;
        break;
      }
    }
  }

  if (targetRowIndex === -1) {
    throw new Error(`Data Job Order dengan referensi "${joQuery}" tidak ditemukan pada Google Sheet.`);
  }

  // Find start row of JO and search downwards for SALES row
  const startRow = rows[targetRowIndex];
  let joId = matchedJoId || (startRow[COL_JO_NO] ? String(startRow[COL_JO_NO]).trim() : '');
  let vesselName = startRow[3] ? String(startRow[3]).trim() : '';
  let fullDescription = startRow[4] ? String(startRow[4]).trim() : '';
  let stuffingDate = startRow[2] ? String(startRow[2]).trim() : '';

  // Look for sales amount in this row or subsequent rows of the same JO
  let salesRow = startRow;
  for (let r = targetRowIndex; r < Math.min(rows.length, targetRowIndex + 15); r++) {
    const curRow = rows[r];
    if (r > targetRowIndex && curRow[COL_JO_NO] && String(curRow[COL_JO_NO]).trim().startsWith('JO.')) {
      break;
    }
    if (curRow[4] && !fullDescription) {
      fullDescription = String(curRow[4]).trim();
    }
    const potentialSales = cleanNumber(curRow[9]);
    if (potentialSales > 0) {
      salesRow = curRow;
      break;
    }
  }

  // Extract Customer Name from description block
  let customerName = 'PT. Tanindo Sentosa'; // fallback if not parsed
  const custMatch = fullDescription.match(/CUSTOMER\s*:\s*([^\r\n]+)/i) ||
                    fullDescription.match(/CNSGNEE\s*:\s*([^\r\n]+)/i) ||
                    fullDescription.match(/CONSIGNEE\s*:\s*([^\r\n]+)/i) ||
                    fullDescription.match(/SHIPPER\s*:\s*([^\r\n]+)/i);

  if (custMatch && custMatch[1]) {
    customerName = custMatch[1].trim();
  }

  // Extract Route
  const descLines = fullDescription.split('\n').map(l => l.trim()).filter(Boolean);
  let route = 'Jakarta-Batam';
  for (const line of descLines) {
    const upper = line.toUpperCase();
    if (upper.includes('JAKARTA') && upper.includes('BATAM')) {
      const match = line.match(/(?:JAKARTA\s*[-–]\s*BATAM|BATAM\s*[-–]\s*JAKARTA)/i);
      if (match) {
        route = match[0].replace(/\s+/g, '').replace('–', '-');
      }
      break;
    } else if (line.includes('-') && !line.includes(':') && (upper.includes('SURABAYA') || upper.includes('MEDAN') || upper.includes('SINGAPORE'))) {
      route = line;
      break;
    }
  }

  // Extract Size / Container Type
  const rawQty = salesRow[7];
  const rawSize = salesRow[8];
  const rawSales = salesRow[9];

  const qty = parseQuantity(rawQty);
  let sizeStr = (rawSize ? String(rawSize).trim() : '20ft').toUpperCase();
  let containerType = 'Dry Container 20ft';

  if (sizeStr.includes('40') || sizeStr.includes('40FT') || sizeStr.includes("40'")) {
    containerType = 'Dry Container 40ft';
  } else if (sizeStr.includes('20') || sizeStr.includes('20FT') || sizeStr.includes("20'")) {
    containerType = 'Dry Container 20ft';
  } else if (sizeStr.includes('LCL') || sizeStr.includes('CBM') || sizeStr.includes('M3')) {
    containerType = 'LCL Cargo';
  } else if (sizeStr) {
    containerType = sizeStr;
  }

  const totalAmount = cleanNumber(rawSales);
  const unitRate = qty > 0 ? Math.round(totalAmount / qty) : totalAmount;

  // Formatted Route & Unit description for the Tarif table e.g. "Jakarta-Batam Dry Container 20ft"
  const tableRoute = `${route} ${containerType}`.trim();
  const subject = `Penawaran Pengiriman ${containerType} ${route}`.trim();

  // Date formatted DD/MM/YYYY
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  return {
    joId: matchedJoId || joId,
    customerName,
    route,
    containerType,
    tableRoute,
    subject,
    qty,
    unitRate,
    totalAmount,
    dateFormatted,
    stuffingDate,
    vesselName,
    fullDescription,
    raw: {
      rawSales,
      rawQty,
      rawSize
    }
  };
}

module.exports = {
  findInvoiceInSheet,
  findJobOrderInSheet,
  fetchSheetData,
  DEFAULT_SHEET_ID
};
