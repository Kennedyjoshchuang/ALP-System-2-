import React, { useEffect, useState } from 'react';

const PrintInvoiceAttachment = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('print_invoice_data');
    if (saved) setData(JSON.parse(saved));
  }, []);

  if (!data) return (
    <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>
      Memuat data lampiran…
    </div>
  );

  const { invoice, jo, consolidatedJOs } = data;
  const targetJOs = Array.isArray(consolidatedJOs) && consolidatedJOs.length > 0 ? consolidatedJOs : (jo ? [jo] : []);
  const operationalPhotos = targetJOs.reduce((acc, currJo) => acc.concat(Array.isArray(currJo.photos) ? currJo.photos : []), []);
  
  const docs = [
    { src: invoice?.signedInvoicePhoto, label: 'SIGNED INVOICE' },
    { src: invoice?.signedReceiptPhoto, label: 'SIGNED STT (SURAT JALAN)' }
  ];

  // Payment Proofs
  const getPhotos = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      if (val.startsWith('[') || val.startsWith('{')) {
        try { return JSON.parse(val); } catch(e) { return [val]; }
      }
      return [val];
    }
    return [];
  };

  const paymentPhotos = getPhotos(invoice?.paymentProofPhoto);
  paymentPhotos.forEach((p, idx) => {
    if (p) docs.push({ src: p, label: paymentPhotos.length > 1 ? `BUKTI BAYAR (PAYMENT PROOF) ${idx + 1}` : 'BUKTI BAYAR (PAYMENT PROOF)' });
  });

  // Tax Proofs
  const taxPhotos = getPhotos(invoice?.tax_deduction_proof);
  taxPhotos.forEach((p, idx) => {
    if (p) docs.push({ src: p, label: taxPhotos.length > 1 ? `BUKTI POTONG PAJAK (TAX PROOF) ${idx + 1}` : 'BUKTI POTONG PAJAK (TAX PROOF)' });
  });

  const allPhotos = docs.filter(d => d.src);
  operationalPhotos.forEach(p => {
    if (p && !allPhotos.find(ap => ap.src === p)) {
      allPhotos.push({ src: p, label: 'DOKUMENTASI OPERASIONAL' });
    }
  });

  if (allPhotos.length === 0) return (
    <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#94a3b8' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📷</div>
      <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>Tidak ada foto dokumentasi untuk invoice ini.</p>
    </div>
  );

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f1f5f9; margin: 0; }
        @page { size: A4; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page-container {
            width: 210mm !important;
            height: 297mm !important;
            padding: 1.2cm !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .photo-container {
            flex: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>
            Lampiran Dokumentasi — {invoice?.id}
          </span>
          <span style={{ background: '#eff6ff', color: '#3b82f6', fontSize: '0.7rem', fontWeight: '800', padding: '2px 10px', borderRadius: '20px' }}>
            {allPhotos.length} FOTO (1 FOTO/HALAMAN)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.close()} style={{ padding: '8px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
            Tutup
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
            🖨 Print / Simpan PDF
          </button>
        </div>
      </div>

      {/* Multiple A4 Attachment Pages - One per photo */}
      {allPhotos.map((p, i) => (
        <div 
          key={i} 
          className="page-container"
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            background: 'white', 
            margin: '24px auto', 
            padding: '1.2cm', 
            boxShadow: '0 4px 30px rgba(0,0,0,0.12)', 
            color: '#1e293b', 
            display: 'flex', 
            flexDirection: 'column', 
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1e293b', paddingBottom: '18px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img src="/assets/logo.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#1e293b' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.label} — FOTO {i + 1}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>Invoice: {invoice?.id}</div>
            </div>
          </div>

          {/* Attachment Meta */}
          <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
              {[
                ['No. Invoice', invoice?.id],
                ['Ref. Job Order', invoice?.joId],
                ['Customer', invoice?.customerName],
                ['Tanggal', fmtDate(invoice?.date)],
                ['Container No.', jo?.containerNo || '—'],
                ['Vehicle No.', jo?.vehicleNo || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1px' }}>{l}</div>
                  <div style={{ fontWeight: '700', color: '#1e293b' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Large Photo Container */}
          <div className="photo-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '10px' }}>
            <img
              src={p.src}
              alt={`Foto ${i + 1}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>

          {/* Footer */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontWeight: '600' }}>
              Halaman {i + 1} dari {allPhotos.length} — Dokumen lampiran resmi.
            </p>
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ borderBottom: '1px solid #1e293b', width: '100%', marginBottom: '6px' }}></div>
              <p style={{ margin: 0, fontWeight: '800', fontSize: '0.8rem', color: '#1e293b' }}>Divisi Operasional</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PrintInvoiceAttachment;
