const { google } = require('googleapis');
const { Readable } = require('stream');
const { getGoogleAuth } = require('./google_auth.cjs');

const DEFAULT_INVOICE_FOLDER_ID = '10SDj7I0yid-FMYPlykZRdaw15v3qv4sL';

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

module.exports = {
  uploadInvoicePdf,
  resolveFolderName,
  getOrCreateMonthFolder,
  DEFAULT_INVOICE_FOLDER_ID
};
