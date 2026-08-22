import React, { useEffect, useState } from 'react';
import DigitalSignatureController from '../components/DigitalSignatureController';
import { useApp } from '../context/AppContext';

const PrintInvoiceDelivery = () => {
  const { invoices = [], jobOrders = [], companyBankAccounts = [], customers = [] } = useApp() || {};
  const [localData, setLocalData] = useState(null);
  const [sigConfig, setSigConfig] = useState({
    type: 'none',
    showStamp: true,
    text: 'Finance Dept',
    font: 'Playball',
    drawData: '',
    uploadData: '',
    sigColor: '#1e3a8a'
  });

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem('print_invoice_data_' + id) || localStorage.getItem('print_invoice_data');
    if (saved) {
      try {
        setLocalData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local print data:', e);
      }
    }
  }, [id]);

  // Resolve dynamically from AppContext to ensure live edited values
  const contextInvoice = invoices.find(i => String(i.id) === String(id));
  const contextJo = contextInvoice ? jobOrders.find(j => String(j.id) === String(contextInvoice.joId)) : null;
  const contextConsolidated = (contextInvoice && contextInvoice.consolidatedJOs)
    ? jobOrders.filter(j => contextInvoice.consolidatedJOs.map(String).includes(String(j.id)))
    : (contextJo ? [contextJo] : []);
  const contextBankAccount = contextInvoice ? companyBankAccounts.find(b => b.id === contextInvoice.bankAccountId) : null;

  const invoice = contextInvoice || localData?.invoice;
  const jo = contextJo || localData?.jo;
  const consolidatedJOs = (contextInvoice && contextInvoice.consolidatedJOs && contextConsolidated.length > 0)
    ? contextConsolidated
    : (localData?.consolidatedJOs || []);
  const bankAccount = contextBankAccount || (invoice?.bankAccountId ? companyBankAccounts.find(b => b.id === invoice.bankAccountId) : null) || localData?.bankAccount || (companyBankAccounts.length > 0 ? companyBankAccounts[0] : null);
  const customerName = invoice?.customerName || localData?.invoice?.customerName || jo?.customerName || '—';

  if (!invoice) return (
    <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>
      Memuat data tanda terima…
    </div>
  );

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

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
          #delivery-area {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 1.5cm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>Surat Tanda Terima Invoice — {invoice?.id}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <DigitalSignatureController onConfigChange={setSigConfig} />
          <button onClick={() => window.close()} style={{ padding: '8px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Tutup</button>
          <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>🖨 Print / Simpan PDF</button>
        </div>
      </div>

      {/* A4 Delivery Receipt */}
      <div id="delivery-area" style={{ width: '210mm', minHeight: '297mm', background: 'white', margin: '24px auto', padding: '1.5cm', boxShadow: '0 4px 30px rgba(0,0,0,0.12)', color: '#1e293b', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #1e293b', paddingBottom: '22px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <img src="/assets/logo.png" alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Ruko The Summer B1-2A, Jl. Centre Point, Teluk Tering, Batam Kota, Batam</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>SURAT TANDA TERIMA</div>
            <div style={{ marginTop: '6px', fontWeight: '800', fontSize: '0.95rem' }}>NO: {invoice?.id}/STT</div>
          </div>
        </div>

        <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px' }}>
          Telah diterima dengan baik dokumen-dokumen penagihan (Invoice) dari <strong>PT. ALPHA LOGISTICS PRAKARSA</strong> dengan detail sebagai berikut:
        </p>

        {/* Info Table */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px', marginBottom: '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <tbody>
              {[
                ['Nomor Invoice', invoice?.id],
                ['Nama Customer', customerName],
                ['Tanggal Invoice', fmtDate(invoice?.date)],
                ['Nominal Tagihan', `Rp ${parseFloat(invoice?.amount || 0).toLocaleString('id-ID')}`],
                ['Referensi JO', Array.isArray(consolidatedJOs) && consolidatedJOs.length > 0 ? consolidatedJOs.map(j => j.id).join(', ') : invoice?.joId],
                ['Status Pengantaran', (invoice?.deliveryStatus === 'delivered' ? 'SUDAH TERANTAR' : 'DALAM PROSES / BELUM TERANTAR')],
              ].map(([l, v]) => (
                <tr key={l}>
                  <td style={{ padding: '12px 0', color: '#64748b', fontWeight: '700', width: '200px' }}>{l}</td>
                  <td style={{ padding: '12px 10px', color: '#64748b', fontWeight: '700' }}>:</td>
                  <td style={{ padding: '12px 0', fontWeight: '800', color: '#1e293b' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '60px' }}>
          Demikian surat tanda terima ini dibuat untuk dipergunakan sebagaimana mestinya.
        </p>

        {/* Signature Area */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: '60px' }}>
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '700', margin: '0 0 5px 0' }}>PENGIRIM / KURIR,</p>

            {/* Interactive Signature overlay area */}
            <div style={{
              position: 'relative',
              width: '150px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '5px 0'
            }}>
              {/* Background Stamp Logo */}
              {sigConfig.showStamp && (
                <img
                  src="/assets/logo.png"
                  alt="ALP Stamp"
                  style={{
                    width: '70px',
                    height: '70px',
                    objectFit: 'contain',
                    opacity: 0.35,
                    mixBlendMode: 'multiply',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Digital Signature Overlay */}
              {sigConfig.type === 'draw' && sigConfig.drawData && (
                <img
                  src={sigConfig.drawData}
                  alt="Signature"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 2 }}
                />
              )}
              {sigConfig.type === 'type' && sigConfig.text && (
                <div style={{
                  position: 'absolute',
                  fontFamily: sigConfig.font,
                  fontSize: '1.8rem',
                  color: sigConfig.sigColor,
                  transform: 'rotate(-4deg)',
                  whiteSpace: 'nowrap',
                  zIndex: 2,
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}>
                  {sigConfig.text}
                </div>
              )}
              {sigConfig.type === 'upload' && sigConfig.uploadData && (
                <img
                  src={sigConfig.uploadData}
                  alt="Uploaded Signature"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 2 }}
                />
              )}
            </div>

            <div style={{ borderBottom: '2px solid #1e293b', width: '100%', marginBottom: '5px' }}></div>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem' }}>PT. ALPHA LOGISTICS PRAKARSA</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '80px' }}>PENERIMA / CUSTOMER,</p>
            <div style={{ borderBottom: '2px solid #1e293b', width: '100%', marginBottom: '5px' }}></div>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem' }}>{invoice?.customerName}</p>
          </div>
        </div>

        <div style={{ marginTop: '60px', borderTop: '1px dashed #ccc', paddingTop: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
          Batam, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};

export default PrintInvoiceDelivery;

