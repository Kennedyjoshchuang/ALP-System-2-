const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { terbilang } = require('./terbilang.cjs');

// Helper to format currency like "Rp 15.500.000"
function formatIDR(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

// Helper to format Qty with unit e.g. "11x20ft", "2x40ft", "1,29 CBM"
function formatQtyUnit(qty, unit) {
  const u = (unit || '').toString().trim().toUpperCase();
  const qStr = typeof qty === 'number' ? qty.toString().replace('.', ',') : (qty || '1');
  if (u === '20' || u === '20FT' || u === "20'" || u === '20 FT') {
    return `${qty}x20ft`;
  }
  if (u === '40' || u === '40FT' || u === "40'" || u === '40 FT' || u === '40HQ') {
    return `${qty}x40ft`;
  }
  if (u === 'M3' || u === 'CBM') {
    return `${qStr} CBM`;
  }
  return `${qStr} ${unit || ''}`.trim();
}

/**
 * Generates an A4 PDF buffer strictly matching the ALP invoice template
 */
async function generateInvoicePdfBuffer(invoiceData) {
  const kopPath = path.join(__dirname, '..', '..', 'public', 'assets', 'kop-alp.jpg');
  const sigPath = path.join(__dirname, '..', '..', 'public', 'assets', 'signature-karen.png');

  const kopBase64 = fs.existsSync(kopPath)
    ? `data:image/jpeg;base64,${fs.readFileSync(kopPath).toString('base64')}`
    : '';

  const sigBase64 = fs.existsSync(sigPath)
    ? `data:image/png;base64,${fs.readFileSync(sigPath).toString('base64')}`
    : '';

  const items = Array.isArray(invoiceData.items) && invoiceData.items.length > 0
    ? invoiceData.items
    : [
        {
          description: invoiceData.description || 'LCL Jakarta-Batam',
          cargoDetail: invoiceData.cargoDetail || '',
          qty: invoiceData.qty || 1,
          unit: invoiceData.unit || 'CBM',
          rate: invoiceData.rate || invoiceData.amount || invoiceData.subtotal || 0,
          total: invoiceData.total || invoiceData.amount || invoiceData.subtotal || 0
        }
      ];

  const subtotal = invoiceData.subtotal || invoiceData.total || 0;
  const otherExpenses = invoiceData.otherExpenses || 0;
  const dp = invoiceData.dp || 0;
  const grandTotal = invoiceData.total || (subtotal + otherExpenses - dp);
  const terbilangStr = terbilang(grandTotal, true);

  const now = new Date();
  const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const generationDateStr = `Batam, ${now.getDate()} ${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>INVOICE - ${invoiceData.invoiceId}</title>
    <style>
      @page {
        size: A4;
        margin: 12mm 15mm 15mm 15mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-family: 'Times New Roman', Times, Georgia, serif;
        color: #000;
        margin: 0;
        padding: 0;
        font-size: 13.5px;
        line-height: 1.35;
        background: #fff;
      }
      .kop-banner {
        width: 100%;
        display: block;
        margin-bottom: 8px;
      }
      .inv-title-area {
        text-align: center;
        margin: 10px 0 16px 0;
      }
      .inv-title {
        font-size: 20px;
        font-weight: bold;
        letter-spacing: 1.5px;
        text-decoration: underline;
        margin: 0;
        text-transform: uppercase;
      }
      .inv-number {
        font-size: 14px;
        font-weight: bold;
        margin-top: 4px;
      }
      .meta-area {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        font-size: 13px;
      }
      .meta-left {
        max-width: 62%;
      }
      .meta-right {
        text-align: right;
        min-width: 35%;
      }
      .meta-label {
        font-size: 13px;
        margin-bottom: 3px;
      }
      .meta-customer-name {
        font-weight: bold;
        font-size: 13.5px;
        margin-top: 2px;
      }
      .meta-customer-addr {
        color: #000;
        margin-top: 2px;
        line-height: 1.3;
      }
      /* Items Table */
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 14px;
      }
      .items-table th, .items-table td {
        border: 1px solid #000;
        padding: 7px 10px;
        text-align: center;
      }
      .items-table th {
        font-weight: bold;
        font-size: 13px;
        background: #fff;
      }
      .col-desc { width: 44%; }
      .col-qty { width: 14%; }
      .col-amount { width: 21%; }
      .col-total { width: 21%; }

      .item-main-desc {
        font-weight: normal;
      }
      .item-sub-desc {
        font-size: 13.5px;
        margin-top: 2px;
      }
      .total-row td {
        font-weight: bold;
        padding: 7px 10px;
      }
      .say-area {
        margin: 10px 0 16px 0;
        font-size: 13px;
      }
      /* Additional Notes / Description */
      .notes-header {
        font-weight: bold;
        margin: 14px 0 6px 0;
        font-size: 13.5px;
      }
      .notes-box {
        border: 1px solid #000;
        padding: 8px 12px;
        margin-bottom: 16px;
        font-size: 12.5px;
        line-height: 1.45;
      }
      /* Summary Table (Subtotal breakdown) */
      .summary-table-container {
        width: 100%;
        margin-bottom: 20px;
      }
      .summary-table {
        width: 100%;
        border-collapse: collapse;
      }
      .summary-table td {
        border: 1px solid #000;
        padding: 5px 12px;
        font-size: 13px;
      }
      .summary-label {
        font-weight: bold;
        width: 70%;
        text-align: left;
      }
      .summary-val {
        width: 30%;
        text-align: right;
        font-weight: normal;
      }
      .summary-total .summary-val {
        font-weight: bold;
      }
      /* Footer payment & signature */
      .footer-area {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 10px;
      }
      .payment-box {
        border: 1px solid #000;
        padding: 8px 12px;
        width: 48%;
        font-size: 12.5px;
        line-height: 1.4;
      }
      .payment-title {
        margin-bottom: 2px;
      }
      .payment-company {
        font-weight: normal;
      }
      .sig-area {
        width: 40%;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .sig-prepared {
        font-size: 13px;
        margin-bottom: 2px;
      }
      .sig-img {
        height: 72px;
        width: auto;
        object-fit: contain;
        margin: 2px 0;
      }
      .sig-name {
        font-size: 13px;
        font-weight: normal;
        margin-top: 2px;
      }
    </style>
  </head>
  <body>
    <!-- 1. Header Banner -->
    ${kopBase64 ? `<img src="${kopBase64}" class="kop-banner" alt="PT. Alpha Logistics Prakarsa" />` : ''}

    <!-- 2. Invoice Title & ID -->
    <div class="inv-title-area">
      <div class="inv-title">INVOICE</div>
      <div class="inv-number">${invoiceData.invoiceId || '101/ALP-INV/X/2026'}</div>
    </div>

    <!-- 3. Metadata -->
    <div class="meta-area">
      <div class="meta-left">
        <div class="meta-label">Invoice To:</div>
        <div class="meta-customer-name">${invoiceData.customerName || 'CV. Brilliant Sukses'}</div>
        <div class="meta-customer-addr">${invoiceData.customerAddress || ''}</div>
      </div>
      <div class="meta-right">
        <div>${invoiceData.date || generationDateStr}</div>
      </div>
    </div>

    <!-- 4. Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-desc">Description</th>
          <th class="col-qty">Qty.</th>
          <th class="col-amount">Amount</th>
          <th class="col-total">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td class="col-desc">
              <div class="item-main-desc">${item.description}</div>
              ${item.cargoDetail ? `<div class="item-sub-desc">${item.cargoDetail}</div>` : ''}
            </td>
            <td class="col-qty">${formatQtyUnit(item.qty, item.unit)}</td>
            <td class="col-amount">${formatIDR(item.rate)}</td>
            <td class="col-total">${formatIDR(item.total)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: center; letter-spacing: 0.5px;">TOTAL</td>
          <td class="col-total">${formatIDR(grandTotal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- 5. Say / Terbilang -->
    <div class="say-area">
      Say: <i>${terbilangStr}.</i>
    </div>

    <!-- 6. Additional Notes / Description (Header OUTSIDE, content INSIDE) -->
    <div class="notes-header">Additional Notes/Description:</div>
    <div class="notes-box">
      <div>Pemotongan PPH23 hanya bisa dilakukan pada biaya pengiriman dan pengurusan dokumen</div>
      <div>NPWP PT. Alpha Logistics Prakarsa: 1000000009477674</div>
      ${invoiceData.vesselName ? `<div><b>Vessel:</b> ${invoiceData.vesselName}</div>` : ''}
      ${invoiceData.blNo ? `<div><b>BL No:</b> ${invoiceData.blNo}</div>` : ''}
      ${invoiceData.containers && invoiceData.containers.length > 0 ? `
        <div><b>Container:</b></div>
        <div>-${invoiceData.containers.join(', ')}</div>
      ` : ''}
    </div>

    <!-- 7. Subtotal Breakdown Table -->
    <div class="summary-table-container">
      <table class="summary-table">
        <tbody>
          <tr>
            <td class="summary-label">Sub Total</td>
            <td class="summary-val">${formatIDR(subtotal)}</td>
          </tr>
          <tr>
            <td class="summary-label">Other Expenses</td>
            <td class="summary-val">${otherExpenses ? formatIDR(otherExpenses) : '0'}</td>
          </tr>
          <tr>
            <td class="summary-label">DP</td>
            <td class="summary-val">${dp ? formatIDR(dp) : '0'}</td>
          </tr>
          <tr class="summary-total">
            <td class="summary-label">TOTAL</td>
            <td class="summary-val">${formatIDR(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 8. Footer Payment Box & Karen's Signature -->
    <div class="footer-area">
      <div class="payment-box">
        <div class="payment-title">Please transfer the payment to:</div>
        <div class="payment-company">PT. Alpha Logistics Prakarsa</div>
        <div>1090055667893 (Mandiri)</div>
        <div>0618577778 (BCA)</div>
      </div>
      <div class="sig-area">
        <div class="sig-prepared">Prepared by,</div>
        ${sigBase64 ? `<img src="${sigBase64}" class="sig-img" alt="Signature" />` : '<div style="height: 55px;"></div>'}
        <div class="sig-name">Karen (Finance)</div>
      </div>
    </div>
  </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
      }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

module.exports = {
  generateInvoicePdfBuffer,
  formatIDR,
  formatQtyUnit
};
