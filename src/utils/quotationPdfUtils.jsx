import React from 'react';
import { createRoot } from 'react-dom/client';
import toast from 'react-hot-toast';

export const exportQuotationsFolder = async (quotations, companyOptions = {}, onProgress) => {
  if (!quotations || quotations.length === 0) {
    toast.error("Tidak ada penawaran untuk di-download.");
    return;
  }

  // Dynamically load heavy engines only when user triggers bulk PDF export
  const [html2pdfModule, { default: JSZip }, { default: PrintQuotation }] = await Promise.all([
    import('html2pdf.js'),
    import('jszip'),
    import('../pages/PrintQuotation')
  ]);
  const html2pdf = html2pdfModule.default || html2pdfModule;

  const { systemName = "ALP" } = companyOptions;
  const zip = new JSZip();
  const folderName = `Quotations_${systemName}_${new Date().toISOString().split('T')[0]}`;
  const folder = zip.folder(folderName);

  // Offscreen container for rendering PrintQuotation component
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '210mm';
  container.style.zIndex = '-9999';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    const total = quotations.length;
    for (let i = 0; i < total; i++) {
      const quote = quotations[i];
      if (onProgress) {
        onProgress(i + 1, total, `Memproses ${quote.id || i + 1} (${i + 1}/${total})...`);
      }

      // Prepare exact printData format matching handleDownload
      const printData = {
        ...quote,
        address: quote.address || 'Alamat tidak tersedia',
        description: quote.jobDescription || '',
        rate: quote.total || quote.rate || 0,
        isOfficial: true
      };

      // Render the actual PrintQuotation React component
      await new Promise((resolve) => {
        root.render(<PrintQuotation initialData={printData} hideToolbar={true} />);
        setTimeout(resolve, 100);
      });

      // Wait for fonts and all img elements to complete loading/decoding
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const images = Array.from(container.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
          return new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
        })
      );

      // Short buffer for layout stability
      await new Promise((resolve) => setTimeout(resolve, 150));

      const printArea = container.querySelector('#quotation-print-area') || container.firstElementChild;

      const opt = {
        margin: 0,
        filename: `${quote.id || 'Quotation'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['tr', 'p', 'h4', 'h3', 'ul', 'ol', 'table', '.avoid-break']
        }
      };

      const pdfBlob = await html2pdf().set(opt).from(printArea).output('blob');

      const safeId = (quote.id || `quote_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeCustomer = (quote.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeId}_${safeCustomer}.pdf`;

      folder.file(fileName, pdfBlob);
    }

    if (onProgress) {
      onProgress(quotations.length, quotations.length, "Membuat file ZIP...");
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success(`Berhasil mengunduh ${quotations.length} penawaran sebagai folder ZIP!`);
  } catch (error) {
    console.error("Error generating quotations folder ZIP:", error);
    toast.error("Gagal mengunduh folder penawaran: " + (error.message || error));
  } finally {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
