const { google } = require('googleapis');
const { Readable } = require('stream');
const { getGoogleAuth } = require('./google_auth.cjs');

const DEFAULT_INVOICE_FOLDER_ID = '10SDj7I0yid-FMYPlykZRdaw15v3qv4sL';
const DEFAULT_QUOTATION_FOLDER_ID = '1DguPitHNNhgPKO7_qApRBvPL3T6tJcw4';
const DEFAULT_QUOTATION_TEMPLATE_ID = '1jEPd0xnmLhpFR2vA2VQXGTBqj2ZPCyacfrPP83PBK2s';

let cachedTerms = null;
let cachedTermsTime = 0;

const DEFAULT_TEMPLATE_TERMS = [
  'Harga belum dipotong PPh23 sesuai ketentuan perpajakan yang berlaku.',
  'Harga belum termasuk biaya asuransi 0,25%.',
  'Harga belum termasuk biaya buruh.',
  'Harga sudah termasuk dokumen PPFTZ-03.',
  'Terms of payment: cash.'
];

/**
 * Reads the terms & conditions directly from the Google Doc template, with in-memory cache.
 */
async function getTemplateTerms(templateId = (process.env.GOOGLE_DRIVE_QUOTATION_TEMPLATE_ID || DEFAULT_QUOTATION_TEMPLATE_ID)) {
  const now = Date.now();
  if (cachedTerms && (now - cachedTermsTime < 10 * 60 * 1000)) {
    return cachedTerms;
  }

  const auth = getGoogleAuth();
  if (!auth) return DEFAULT_TEMPLATE_TERMS;

  try {
    const docs = google.docs({ version: 'v1', auth });
    const res = await docs.documents.get({ documentId: templateId });

    const terms = [];
    let inTerms = false;
    for (const el of res.data.body.content) {
      if (el.paragraph) {
        const text = el.paragraph.elements.map(e => e.textRun ? e.textRun.content : '').join('').trim();
        if (text.toLowerCase().includes('syarat dan ketentuan')) {
          inTerms = true;
          continue;
        }
        if (inTerms) {
          if (!text || text.toLowerCase().includes('kami berharap') || text.toLowerCase().includes('kind regards')) {
            break;
          }
          terms.push(text);
        }
      }
    }

    if (terms.length > 0) {
      cachedTerms = terms;
      cachedTermsTime = now;
      return terms;
    }
  } catch (err) {
    console.warn('[google_drive] Failed to read template terms, using default:', err.message);
  }

  return DEFAULT_TEMPLATE_TERMS;
}

function formatIDR(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

// Roman numeral to Google Drive folder month abbreviation mapping
// Strictly matches the live folder scheme: MAY 2026, JUNE 2026, JULY 2026, AUG 2026, SEPT 2026, OCT 2026, NOV 2026
const ROMAN_TO_FOLDER_MONTH = {
  'I': 'JAN',
  'II': 'FEB',
  'III': 'MAR',
  'IV': 'APR',
  'V': 'MAY',
  'VI': 'JUNE',
  'VII': 'JULY',
  'VIII': 'AUG',
  'IX': 'SEPT',
  'X': 'OCT',
  'XI': 'NOV',
  'XII': 'DEC'
};

const MONTH_INDEX_TO_FOLDER_MONTH = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE',
  'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'
];

/**
 * Determine folder name (e.g. "OCT 2026") from Invoice ID or current date
 */
function resolveFolderName(invoiceId) {
  const now = new Date();
  let monthStr = MONTH_INDEX_TO_FOLDER_MONTH[now.getMonth()];
  let yearStr = String(now.getFullYear());

  if (invoiceId) {
    const parts = invoiceId.split('/');
    if (parts.length >= 4) {
      const romanMonth = parts[2].trim().toUpperCase();
      const yr = parts[3].trim();
      if (ROMAN_TO_FOLDER_MONTH[romanMonth]) {
        monthStr = ROMAN_TO_FOLDER_MONTH[romanMonth];
      }
      if (yr && /^\d{4}$/.test(yr)) {
        yearStr = yr;
      }
    }
  }

  return `${monthStr} ${yearStr}`;
}

/**
 * Checks if month folder exists inside rootFolderId; creates it if missing.
 */
async function getOrCreateMonthFolder(drive, rootFolderId, folderName) {
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and '${rootFolderId}' in parents and trashed = false`;

  const listRes = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id;
  }

  // Create new month folder
  const createRes = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId]
    },
    fields: 'id, name'
  });

  return createRes.data.id;
}

/**
 * Uploads a generated invoice PDF to Google Drive under the appropriate month folder
 */
async function uploadInvoicePdf(pdfBuffer, invoiceId, rootFolderId = (process.env.GOOGLE_DRIVE_INVOICE_FOLDER_ID || DEFAULT_INVOICE_FOLDER_ID)) {
  const auth = getGoogleAuth();
  if (!auth) {
    throw new Error('Kredensial Google belum dikonfigurasi di server. Silakan hubungkan akun Google (OAuth2 atau Service Account) terlebih dahulu.');
  }

  const drive = google.drive({ version: 'v3', auth });

  const folderName = resolveFolderName(invoiceId);
  const targetFolderId = await getOrCreateMonthFolder(drive, rootFolderId, folderName);

  // File naming convention: e.g. "101_ALP-INV_X_2026.pdf"
  const fileName = `${invoiceId.replace(/\//g, '_')}.pdf`;

  // Buffer to readable stream
  const bufferStream = new Readable();
  bufferStream.push(pdfBuffer);
  bufferStream.push(null);

  const fileMetadata = {
    name: fileName,
    parents: [targetFolderId]
  };

  const media = {
    mimeType: 'application/pdf',
    body: bufferStream
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink'
  });

  return {
    fileId: res.data.id,
    fileName: res.data.name,
    folderName,
    webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view?usp=sharing`,
    webContentLink: res.data.webContentLink
  };
}

/**
 * Uploads/converts HTML into a native editable Google Doc under the appropriate month folder
 */
async function uploadQuotationGoogleDoc(htmlContent, quotationId, rootFolderId = (process.env.GOOGLE_DRIVE_QUOTATION_FOLDER_ID || DEFAULT_QUOTATION_FOLDER_ID)) {
  const auth = getGoogleAuth();
  if (!auth) {
    throw new Error('Kredensial Google belum dikonfigurasi di server. Silakan hubungkan akun Google terlebih dahulu.');
  }

  const drive = google.drive({ version: 'v3', auth });

  const folderName = resolveFolderName(quotationId);
  const targetFolderId = await getOrCreateMonthFolder(drive, rootFolderId, folderName);

  // File naming: e.g. "146_ALP-QTN_X_2026"
  const fileName = `${quotationId.replace(/\//g, '_')}`;

  const bufferStream = new Readable();
  bufferStream.push(htmlContent);
  bufferStream.push(null);

  const fileMetadata = {
    name: fileName,
    mimeType: 'application/vnd.google-apps.document',
    parents: [targetFolderId]
  };

  const media = {
    mimeType: 'text/html',
    body: bufferStream
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink'
  });

  const fileId = res.data.id;
  const editUrl = `https://docs.google.com/document/d/${fileId}/edit`;

  // Grant access if needed so colleagues can edit directly
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });
  } catch (permErr) {
    // If domain restricts sharing with 'anyone', ignore and proceed
    console.warn('[google_drive] Could not set public writer permission:', permErr.message);
  }

  return {
    fileId,
    fileName,
    folderName,
    editUrl,
    webViewLink: res.data.webViewLink || editUrl
  };
}

/**
 * Creates a quotation by cloning the user's Google Doc template and replacing the placeholders in place.
 */
async function createQuotationFromTemplate(
  quotationData,
  templateId = (process.env.GOOGLE_DRIVE_QUOTATION_TEMPLATE_ID || DEFAULT_QUOTATION_TEMPLATE_ID),
  rootFolderId = (process.env.GOOGLE_DRIVE_QUOTATION_FOLDER_ID || DEFAULT_QUOTATION_FOLDER_ID)
) {
  const auth = getGoogleAuth();
  if (!auth) {
    throw new Error('Kredensial Google belum dikonfigurasi di server. Silakan hubungkan akun Google terlebih dahulu.');
  }

  const drive = google.drive({ version: 'v3', auth });
  const docs = google.docs({ version: 'v1', auth });

  const folderName = resolveFolderName(quotationData.quotationId);
  const targetFolderId = await getOrCreateMonthFolder(drive, rootFolderId, folderName);

  // File naming: e.g. "146_ALP-QTN_X_2026"
  const fileName = `${quotationData.quotationId.replace(/\//g, '_')}`;

  // 1. Copy the template document to the target month/year folder
  const copyRes = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: fileName,
      parents: [targetFolderId]
    },
    fields: 'id, name, webViewLink'
  });

  const fileId = copyRes.data.id;
  const editUrl = `https://docs.google.com/document/d/${fileId}/edit`;

  const dateStr = quotationData.date || quotationData.dateFormatted || '';
  const priceFormatted = formatIDR(quotationData.unitRate || quotationData.totalAmount || 0);
  const routeStr = quotationData.route || 'Jakarta-Batam';
  const tableRouteStr = quotationData.tableRoute || `${routeStr} Dry Container 20ft`;
  const subjectStr = quotationData.subject || `Penawaran Pengiriman ${tableRouteStr}`;
  const attnStr = quotationData.attn || `${quotationData.customerName || 'Customer'} (${quotationData.pic || 'Bapak/Ibu'})`;

  // 2. Prepare replacement requests for Google Docs API
  const requests = [
    // Support named placeholders if added to template
    { replaceAllText: { containsText: { text: '{{DATE}}', matchCase: false }, replaceText: dateStr } },
    { replaceAllText: { containsText: { text: '{{NO}}', matchCase: false }, replaceText: quotationData.quotationId } },
    { replaceAllText: { containsText: { text: '{{SUBJECT}}', matchCase: false }, replaceText: subjectStr } },
    { replaceAllText: { containsText: { text: '{{ATTN}}', matchCase: false }, replaceText: attnStr } },
    { replaceAllText: { containsText: { text: '{{ROUTE}}', matchCase: false }, replaceText: tableRouteStr } },
    { replaceAllText: { containsText: { text: '{{PRICE}}', matchCase: false }, replaceText: priceFormatted } },

    // Exact structural replacements matching the template
    { replaceAllText: { containsText: { text: 'Date\t: ', matchCase: true }, replaceText: `Date\t: ${dateStr}` } },
    { replaceAllText: { containsText: { text: 'No\t: ', matchCase: true }, replaceText: `No\t: ${quotationData.quotationId}` } },
    { replaceAllText: { containsText: { text: 'Subject\t: ', matchCase: true }, replaceText: `Subject\t: ${subjectStr}` } },
    { replaceAllText: { containsText: { text: 'Attn\t: ', matchCase: true }, replaceText: `Attn\t: ${attnStr}` } },
    { replaceAllText: { containsText: { text: 'penawaran harga untuk -, dengan', matchCase: true }, replaceText: `penawaran harga untuk pengiriman rute ${routeStr}, dengan` } },
    { replaceAllText: { containsText: { text: 'Rp -', matchCase: true }, replaceText: priceFormatted } },
    { replaceAllText: { containsText: { text: '-\n', matchCase: true }, replaceText: `${tableRouteStr}\n` } }
  ];

  try {
    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: { requests }
    });
  } catch (docsErr) {
    console.warn('[google_drive] batchUpdate via Docs API failed, trying HTML replacement fallback:', docsErr.message);

    // Fallback: Export HTML, replace, and update file
    try {
      const exportRes = await drive.files.export({
        fileId: templateId,
        mimeType: 'text/html'
      });
      let html = exportRes.data;
      html = html.replace(/Date(&nbsp;|\s)*:\s*<\/span>/, `Date        : ${dateStr}</span>`);
      html = html.replace(/No(&nbsp;|\s)*:\s*<\/span>/, `No        : ${quotationData.quotationId}</span>`);
      html = html.replace(/Subject(&nbsp;|\s)*:\s*<\/span>/, `Subject        : ${subjectStr}</span>`);
      html = html.replace(/Attn(&nbsp;|\s)*:\s*<\/span>/, `Attn        : ${attnStr}</span>`);
      html = html.replace('penawaran harga untuk -, dengan', `penawaran harga untuk pengiriman rute ${routeStr}, dengan`);
      html = html.replace(/(<td[^>]*><p[^>]*><span[^>]*>)-(<\/span><\/p><\/td>\s*<td[^>]*><p[^>]*><span[^>]*>Rp -<\/span>)/, (match, p1, p2) => {
        return p1 + tableRouteStr + p2.replace('Rp -', priceFormatted);
      });

      const bufferStream = new Readable();
      bufferStream.push(html);
      bufferStream.push(null);

      await drive.files.update({
        fileId,
        media: {
          mimeType: 'text/html',
          body: bufferStream
        }
      });
    } catch (fbErr) {
      console.error('[google_drive] HTML replacement fallback also failed:', fbErr.message);
    }
  }

  // 3. Grant edit permission so staff can open and edit immediately
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });
  } catch (permErr) {
    console.warn('[google_drive] Could not set public writer permission:', permErr.message);
  }

  return {
    fileId,
    fileName,
    folderName,
    editUrl,
    webViewLink: copyRes.data.webViewLink || editUrl
  };
}

module.exports = {
  uploadInvoicePdf,
  uploadQuotationGoogleDoc,
  createQuotationFromTemplate,
  getTemplateTerms,
  resolveFolderName,
  getOrCreateMonthFolder,
  DEFAULT_INVOICE_FOLDER_ID,
  DEFAULT_QUOTATION_FOLDER_ID,
  DEFAULT_QUOTATION_TEMPLATE_ID
};
