const fs = require('fs');
const path = require('path');

function formatIDR(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

/**
 * Generates an HTML document strictly following the official PT. Alpha Logistics Prakarsa quotation template.
 * Designed for conversion to native Google Docs via Google Drive API.
 */
function generateQuotationHtml(quotationData) {
  const kopPath = path.join(__dirname, '..', '..', 'public', 'assets', 'kop-alp.jpg');
  const sigPath = path.join(__dirname, '..', '..', 'public', 'assets', 'signature-veronica.png');

  const kopBase64 = fs.existsSync(kopPath)
    ? `data:image/jpeg;base64,${fs.readFileSync(kopPath).toString('base64')}`
    : '';

  const sigBase64 = fs.existsSync(sigPath)
    ? `data:image/png;base64,${fs.readFileSync(sigPath).toString('base64')}`
    : '';

  const customerName = quotationData.customerName || 'PT. Tanindo Sentosa';
  const pic = quotationData.pic && quotationData.pic !== '-' && quotationData.pic !== 'Bapak/Ibu'
    ? quotationData.pic
    : 'Bapak/Ibu';
  const attn = quotationData.attn || `${customerName} (${pic})`;

  // Extract customer simple name for the warehouse clause (e.g. "Tanindo")
  const customerShort = customerName.replace(/^(PT|CV|UD)\.?\s+/i, '').split(' ')[0] || 'customer';

  const defaultTerms = [
    'Sudah termasuk 1 set dokumen PPFTZ-03.',
    'Sudah termasuk Biaya Asuransi Rp 100.000.000 (Seratus juta rupiah).',
    'Sudah termasuk biaya validasi untuk stripping luar.',
    'Tambahan dokumen PPFTZ-03 Rp 700.000/set.',
    `Sudah termasuk biaya buruh bongkar di gudang ${customerShort}.`,
    'Harga belum dipotong PPh23 sesuai perpajakan yang berlaku.',
    'Term of payment 30 days.'
  ];

  const terms = Array.isArray(quotationData.terms) && quotationData.terms.length > 0
    ? quotationData.terms
    : defaultTerms;

  const items = Array.isArray(quotationData.items) && quotationData.items.length > 0
    ? quotationData.items
    : [
        {
          description: quotationData.tableRoute || 'Jakarta-Batam Dry Container 20ft',
          price: quotationData.unitRate || quotationData.totalAmount || 17500000,
          priceFormatted: formatIDR(quotationData.unitRate || quotationData.totalAmount || 17500000)
        }
      ];

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QUOTATION - ${quotationData.quotationId}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm 20mm 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .kop-banner {
      width: 100%;
      max-width: 100%;
      display: block;
      margin-bottom: 18px;
    }
    table.meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11pt;
    }
    table.meta-table td {
      padding: 2px 0;
      vertical-align: top;
    }
    .salutation {
      margin: 0 0 14px 0;
      line-height: 1.3;
    }
    .intro-paragraph {
      text-align: justify;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    .section-title {
      font-weight: bold;
      margin: 0 0 6px 0;
      font-size: 11pt;
    }
    table.tarif-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11pt;
    }
    table.tarif-table th {
      border: 1px solid #000000;
      background-color: #e6e6e6;
      padding: 6px 12px;
      text-align: center;
      font-weight: bold;
    }
    table.tarif-table td {
      border: 1px solid #000000;
      padding: 8px 12px;
      text-align: center;
    }
    ul.terms-list {
      margin: 0 0 18px 20px;
      padding: 0;
      line-height: 1.4;
    }
    ul.terms-list li {
      margin-bottom: 4px;
    }
    .closing-paragraph {
      text-align: justify;
      margin: 0 0 24px 0;
      line-height: 1.4;
    }
    table.signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 11pt;
    }
    table.signature-table td {
      vertical-align: top;
      padding: 0;
    }
    .sig-image {
      height: 65px;
      display: block;
      margin: 4px 0;
    }
  </style>
</head>
<body>

  <!-- KOP SURAT HEADER -->
  ${kopBase64 ? `<img src="${kopBase64}" class="kop-banner" alt="PT. Alpha Logistics Prakarsa Letterhead" />` : ''}

  <!-- METADATA (Date, No, Subject, Attn) -->
  <table class="meta-table">
    <tr>
      <td style="width: 85px;">Date</td>
      <td style="width: 15px;">:</td>
      <td>${quotationData.date || quotationData.dateFormatted}</td>
    </tr>
    <tr>
      <td>No</td>
      <td>:</td>
      <td>${quotationData.quotationId}</td>
    </tr>
    <tr>
      <td>Subject</td>
      <td>:</td>
      <td>${quotationData.subject}</td>
    </tr>
    <tr>
      <td>Attn</td>
      <td>:</td>
      <td>${attn}</td>
    </tr>
  </table>

  <!-- SALUTATION -->
  <div class="salutation">
    <div>Kepada Yth.</div>
    <div>Bapak/Ibu,</div>
    <div>Di Tempat</div>
  </div>

  <!-- INTRO -->
  <div class="intro-paragraph">
    Terima kasih banyak atas pertanyaan dan kepercayaan Anda terhadap layanan kami. Bersama surat ini kami sampaikan penawaran harga untuk pengiriman rute ${quotationData.route || 'Jakarta-Batam'} dengan rincian sebagai berikut:
  </div>

  <!-- TARIF TABLE -->
  <div class="section-title">Tarif:</div>
  <table class="tarif-table">
    <thead>
      <tr>
        <th style="width: 60%;">Rute</th>
        <th style="width: 40%;">Harga/Unit</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.priceFormatted || formatIDR(item.price)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- TERMS AND CONDITIONS -->
  <div class="section-title">Syarat dan Ketentuan:</div>
  <ul class="terms-list">
    ${terms.map(term => `<li>${term}</li>`).join('')}
  </ul>

  <!-- CLOSING -->
  <div class="closing-paragraph">
    Kami berharap tarif yang kami sampaikan di atas dapat memenuhi kebutuhan Anda. Kami siap untuk berdiskusi lebih lanjut apabila terdapat hal-hal yang perlu disesuaikan atau jika Bapak/Ibu memerlukan informasi tambahan.
  </div>

  <!-- SIGNATURES -->
  <table class="signature-table">
    <tr>
      <td style="width: 60%;">
        <div>Kind regards,</div>
        ${sigBase64 ? `<img src="${sigBase64}" class="sig-image" alt="Veronica Signature" />` : '<div style="height: 65px;"></div>'}
        <div style="font-weight: bold;">Veronica</div>
        <div>PT. Alpha Logistics Prakarsa</div>
      </td>
      <td style="width: 40%;">
        <div>Approved by,</div>
        <div style="height: 65px;"></div>
        <div>________________________</div>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return html;
}

module.exports = {
  generateQuotationHtml,
  formatIDR
};
