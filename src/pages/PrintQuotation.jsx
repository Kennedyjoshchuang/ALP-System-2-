import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import DigitalSignatureController from '../components/DigitalSignatureController';

const PrintQuotation = () => {
  const [data, setData] = useState(null);
  const { t } = useApp() || { t: (k) => k };
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
    const savedData = localStorage.getItem('print_quotation_data');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  if (!data) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Quotation Data...</div>;

  // Formatting helpers
  const formattedDate = data.date ? (() => {
    const d = new Date(data.date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  })() : '';

  const subject = data.subject || `Quotation untuk Inquiry Pengiriman ${data.items?.[0]?.description ? data.items[0].description.split('\n')[0] : 'Cargo'}`;

  const renderDescription = (desc) => {
    if (!desc) return null;
    // Split by newlines, dashes, or custom bullet points to extract lines
    const lines = desc.split(/\r?\n| - | • /).map(l => l.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
    if (lines.length <= 1) {
      return <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1e293b' }}>{desc}</div>;
    }
    return (
      <div style={{ paddingRight: '15px' }}>
        <div style={{ fontWeight: '700', fontSize: '0.98rem', color: '#0f172a', marginBottom: '8px' }}>{lines[0]}</div>
        <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
          {lines.slice(1).map((line, i) => (
            <li key={i} style={{ fontSize: '0.9rem', color: '#475569', margin: '4px 0', lineHeight: '1.4' }}>{line}</li>
          ))}
        </ul>
      </div>
    );
  };

  const getTerms = () => {
    if (data.generalNotes && data.generalNotes.trim()) {
      return data.generalNotes.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
    }
    return [
      "Harga belum termasuk PPh23",
      "Harga belum termasuk biaya asuransi 0.2% dari total nilai barang.",
      "Harga belum termasuk buruh apabila diperlukan.",
      "Harga berlaku hingga 15 Mei 2026 dikarenakan harga BBM sedang fluktuatif.",
      "Syarat pembayaran: cash."
    ];
  };

  return (
    <div className="print-page-wrapper bg-light" style={{ minHeight: '100vh', padding: '20px 0', backgroundColor: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { 
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
          color: #1e293b;
        }
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            background-color: #ffffff !important;
          }
          .print-page-wrapper { 
            padding: 0 !important; 
            background: none !important;
            background-color: #ffffff !important;
          }
          #quotation-print-area { 
            width: 210mm !important; 
            min-height: 297mm !important; 
            padding: 1.5cm 1.5cm 1.5cm 1.5cm !important; 
            box-shadow: none !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print toolbar - hidden when printing */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center',
        padding: '15px 30px', background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <DigitalSignatureController onConfigChange={setSigConfig} />
        <button onClick={() => window.close()} style={{ height: '40px', padding: '0 20px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Close
        </button>
        <button onClick={() => window.print()} style={{ height: '40px', padding: '0 20px', fontSize: '0.9rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          🖨️ Print / Save PDF
        </button>
      </div>
      
      <div
        id="quotation-print-area"
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: 'white',
          margin: '0 auto',
          padding: '1.5cm',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        {/* Header Section (Kop Surat) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '3px solid #0f172a', paddingBottom: '18px', marginBottom: '28px' }}>
          <img src="/assets/logo.png" alt="Logo" style={{ width: '105px', height: '105px', objectFit: 'contain' }} />
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              margin: 0, 
              fontFamily: "'Playfair Display', Georgia, serif", 
              fontWeight: '700', 
              fontSize: '2.15rem', 
              color: '#15803d', 
              letterSpacing: '0.5px',
              lineHeight: '1.2'
            }}>
              PT. ALPHA LOGISTICS PRAKARSA
            </h1>
            <div style={{ 
              fontSize: '0.98rem', 
              lineHeight: '1.5', 
              marginTop: '6px', 
              fontWeight: '700', 
              color: '#475569'
            }}>
              Jl. Duyung Kavling III Batu Ampar, Batam – Kepulauan Riau – Indonesia
            </div>
          </div>
        </div>

        {/* Letter Metadata and Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '70px 10px 1fr', gap: '6px 4px', fontSize: '0.92rem', marginBottom: '25px', color: '#1e293b' }}>
          <div>Date</div><div>:</div><div>{formattedDate}</div>
          <div>No</div><div>:</div><div>{data.id || '-'}</div>
          <div>Subject</div><div>:</div><div style={{ fontWeight: '700' }}>{subject}</div>
          <div>Attn</div><div>:</div><div style={{ fontWeight: '600' }}>{data.pic || 'Ibu Anissa'}</div>
        </div>

        {/* Recipient block */}
        <div style={{ fontSize: '0.92rem', marginBottom: '25px', lineHeight: '1.6', color: '#1e293b' }}>
          <div>Kepada Yth.</div>
          <div style={{ fontWeight: '700', fontSize: '0.98rem', marginTop: '2px' }}>{data.pic || 'Ibu Anissa'}</div>
          <div style={{ fontWeight: '600', color: '#475569' }}>{data.customerName}</div>
          {data.address && data.address !== 'Alamat tidak tersedia' && (
            <div style={{ color: '#475569', fontSize: '0.9rem' }}>{data.address}</div>
          )}
          <div style={{ fontWeight: '500', marginTop: '2px' }}>Di Tempat</div>
        </div>

        {/* Opening Statement */}
        <p style={{ fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 20px 0', textAlign: 'justify', color: '#1e293b' }}>
          Terima kasih banyak atas pertanyaan dan kepercayaan Anda terhadap layanan kami. Bersama surat ini kami sampaikan penawaran harga untuk inquiry shipment, dengan rincian sebagai berikut:
        </p>

        {/* Tarif Section */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tarif:</h4>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #94a3b8' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '1px solid #cbd5e1' }}>RUTE</th>
                <th style={{ padding: '12px 15px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', width: '220px' }}>
                  HARGA/UNIT {data.items?.[0]?.unit ? data.items[0].unit.toUpperCase() : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < data.items.length - 1 ? '1px solid #cbd5e1' : 'none' }}>
                    <td style={{ padding: '15px', verticalAlign: 'top', borderRight: '1px solid #cbd5e1' }}>
                      {renderDescription(item.description)}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '750', fontSize: '1.05rem', color: '#0f172a' }}>
                      Rp {parseFloat(item.rate || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No services listed for this quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Terms and Conditions */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '850', color: '#0f172a' }}>Terms and Conditions:</h4>
          <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
            {getTerms().map((term, i) => (
              <li key={i} style={{ fontSize: '0.88rem', color: '#334155', margin: '4px 0', lineHeight: '1.4' }}>{term}</li>
            ))}
          </ul>
        </div>

        {/* Closing Statement */}
        <p style={{ fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 25px 0', textAlign: 'justify', color: '#1e293b' }}>
          Kami berharap tarif yang kami sampaikan di atas dapat memenuhi kebutuhan Anda. Kami siap untuk berdiskusi lebih lanjut apabila terdapat hal-hal yang perlu disesuaikan atau jika Anda memerlukan informasi tambahan.
        </p>

        {/* Signature Area */}
        <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.92rem', fontWeight: '600', color: '#1e293b' }}>Kind regards,</p>
          
          <div style={{ position: 'relative', display: 'inline-block', minWidth: '220px' }}>
            {/* Fixed-height signature zone so layout never collapses when stamp is hidden */}
            <div style={{ position: 'relative', width: '85px', height: '95px' }}>
              {/* Stamp Logo / Default Signature scribble */}
              {(sigConfig.showStamp || sigConfig.type === 'none') && (
                <img
                  src="/assets/logo.png"
                  alt="Signature Background"
                  style={{
                    width: '85px',
                    height: '85px',
                    objectFit: 'contain',
                    display: 'block',
                    opacity: sigConfig.type === 'none' ? 1.0 : 0.35,
                    mixBlendMode: 'multiply',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Custom overlay signature */}
              {sigConfig.type === 'draw' && sigConfig.drawData && (
                <img
                  src={sigConfig.drawData}
                  alt="Signature"
                  style={{ position: 'absolute', top: 0, left: 0, width: '85px', height: '85px', objectFit: 'contain', zIndex: 2 }}
                />
              )}
              {sigConfig.type === 'type' && sigConfig.text && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '5px',
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
                  style={{ position: 'absolute', top: 0, left: 0, width: '85px', height: '85px', objectFit: 'contain', zIndex: 2 }}
                />
              )}
            </div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                fontWeight: '800',
                fontSize: '0.98rem',
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                display: 'inline-block',
                paddingBottom: '2px',
                marginBottom: '4px'
              }}>
                {data.marketingName || 'Heri'}
              </div>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                PT. Alpha Logistics Prakarsa
              </div>
            </div>
          </div>
        </div>

        {/* Automatically Generated Note */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '8px',
          marginTop: '25px',
          fontSize: '0.72rem',
          color: '#94a3b8',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          * Dokumen ini dibuat secara otomatis dan sah tanpa tanda tangan basah. / This quotation is automatically generated and is valid without a physical signature.
        </div>
      </div>
    </div>
  );
};

export default PrintQuotation;


