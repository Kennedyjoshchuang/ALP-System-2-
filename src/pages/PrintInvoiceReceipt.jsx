import React, { useEffect, useState } from 'react';
import DigitalSignatureController from '../components/DigitalSignatureController';

const PrintInvoiceReceipt = () => {
  const [data, setData] = useState(null);
  const [sigConfig, setSigConfig] = useState({
    type: 'none',
    showStamp: true,
    text: 'Finance Dept',
    font: 'Playball',
    drawData: '',
    uploadData: '',
    sigColor: '#1e3a8a'
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    let savedData = null;
    if (id) {
      savedData = localStorage.getItem('print_invoice_data_' + id);
    }
    if (!savedData) {
      savedData = localStorage.getItem('print_invoice_data');
    }
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  if (!data) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Receipt Draft...</div>;

  const { invoice, bankAccount } = data;
  const totalAmount = parseFloat(invoice?.amount || 0);

  return (
    <div className="print-receipt-container" style={{ 
      width: '210mm', 
      minHeight: '297mm', 
      padding: '20mm', 
      margin: 'auto', 
      background: 'white', 
      color: 'black', 
      fontFamily: 'Inter, system-ui, sans-serif' 
    }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .no-print { display: none; }
          .print-receipt-container { margin: 0; border: none; box-shadow: none; width: 100% !important; }
        }
        @page { size: A4; margin: 0; }
        .receipt-card {
          border: 2px solid #000;
          padding: 30px;
          margin-bottom: 40px;
          position: relative;
          background: #fff;
        }
        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-title {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .receipt-row {
          display: flex;
          margin-bottom: 15px;
          font-size: 14px;
        }
        .receipt-label {
          width: 180px;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 12px;
        }
        .receipt-value {
          flex: 1;
          border-bottom: 1px dotted #000;
          padding-bottom: 2px;
        }
        .amount-box {
          border: 3px solid #000;
          padding: 15px 25px;
          font-size: 22px;
          font-weight: 900;
          display: inline-block;
          margin-top: 20px;
          background: #f8fafc;
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <DigitalSignatureController onConfigChange={setSigConfig} />
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Print Receipt</button>
        <button onClick={() => window.close()} style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer' }}>Close</button>
      </div>

      <div className="receipt-card">
        <div className="receipt-header">
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <img src="/assets/logo.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Premium Logistics & Transportation Solutions</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="receipt-title">KWITANSI / RECEIPT</div>
            <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '5px' }}>NO: {invoice?.id}/REC/{new Date().getFullYear()}</div>
          </div>
        </div>

        <div className="receipt-row">
          <div className="receipt-label">Telah Terima Dari</div>
          <div className="receipt-value" style={{ fontWeight: '800', fontSize: '16px' }}>{invoice?.customerName}</div>
        </div>

        <div className="receipt-row">
          <div className="receipt-label">Uang Sejumlah</div>
          <div className="receipt-value" style={{ fontStyle: 'italic', background: '#f8fafc', padding: '10px', border: '1px solid #e2e8f0' }}>
             # {totalAmount.toLocaleString('id-ID')} IDR #
          </div>
        </div>

        <div className="receipt-row" style={{ marginTop: '20px' }}>
          <div className="receipt-label">Untuk Pembayaran</div>
          <div className="receipt-value">
            Pembayaran Invoice No: {invoice?.id} - Jasa Logistik & Transportasi
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
          <div>
            <div className="amount-box">
              RP. {totalAmount.toLocaleString('id-ID')} ,-
            </div>
            {bankAccount && (
              <div style={{ marginTop: '15px', fontSize: '0.75rem', color: '#475569' }}>
                <strong>Via:</strong> {bankAccount.bankName} - {bankAccount.accountNo}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', margin: '0 0 5px 0' }}>Batam, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

            {/* Interactive Signature overlay area */}
            <div style={{
              position: 'relative',
              width: '180px',
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

            <div style={{ borderBottom: '1px solid #000', width: '100%', marginBottom: '5px' }}></div>
            <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>CASHIER / FINANCE</p>
          </div>
        </div>
      </div>

      {/* Copy for archive */}
      <div style={{ borderTop: '2px dashed #e2e8f0', margin: '40px 0' }}></div>
      
      <div className="receipt-card" style={{ opacity: 0.7 }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>ARCHIVE COPY</div>
        <div className="receipt-header">
          <div>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="receipt-title" style={{ fontSize: '18px' }}>KWITANSI / RECEIPT</div>
            <div style={{ fontSize: '10px' }}>NO: {invoice?.id}/REC/{new Date().getFullYear()}</div>
          </div>
        </div>

        <div className="receipt-row">
          <div className="receipt-label">Terima Dari</div>
          <div className="receipt-value">{invoice?.customerName}</div>
        </div>

        <div className="receipt-row">
          <div className="receipt-label">Untuk</div>
          <div className="receipt-value">Inv {invoice?.id}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
          <div className="amount-box" style={{ fontSize: '16px', padding: '10px 15px' }}>
            RP. {totalAmount.toLocaleString('id-ID')}
          </div>
          <div style={{ textAlign: 'center', width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '10px', margin: '0 0 3px 0' }}>Batam, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

            {/* Interactive Signature overlay area */}
            <div style={{
              position: 'relative',
              width: '130px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '3px 0'
            }}>
              {/* Background Stamp Logo */}
              {sigConfig.showStamp && (
                <img
                  src="/assets/logo.png"
                  alt="ALP Stamp"
                  style={{
                    width: '50px',
                    height: '50px',
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
                  fontSize: '1.4rem',
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

            <div style={{ borderBottom: '1px solid #000', width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoiceReceipt;

