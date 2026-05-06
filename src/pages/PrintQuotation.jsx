import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

const PrintQuotation = () => {
  const [data, setData] = useState(null);
  const { t } = useApp() || { t: (k) => k };

  useEffect(() => {
    const savedData = localStorage.getItem('print_quotation_data');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  if (!data) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Quotation Data...</div>;

  return (
    <div className="print-page-wrapper bg-slate" style={{ minHeight: '100vh', padding: '20px 0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          .print-page-wrapper { padding: 0 !important; }
          #quotation-print-area { 
            width: 210mm !important; 
            min-height: 297mm !important; 
            padding: 1cm !important; 
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print toolbar - hidden when printing */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'flex-end', gap: '15px',
        padding: '15px 30px', background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button onClick={() => window.close()} style={{ height: '45px', padding: '0 30px', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}>
          Close
        </button>
        <button onClick={() => window.print()} style={{ height: '45px', padding: '0 30px', fontSize: '1rem', background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🖨️ Print
        </button>
      </div>
      
      <div
        id="quotation-print-area"
        className="quotation-modal-content"
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: 'white',
          margin: '0 auto',
          padding: '1cm',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          color: '#1e293b',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '25px', marginBottom: '45px' }}>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <img src="/assets/logo.png" alt="Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontWeight: '950', fontSize: '1.6rem', color: '#0f172a', letterSpacing: '-0.5px' }}>PT. Alpha Logistics Prakarsa</h1>
              <h4 style={{ margin: '2px 0 0 0', fontWeight: '800', fontSize: '0.95rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>LOGISTICS & FREIGHT FORWARDING</h4>
              <div className="text-slate" style={{ fontSize: '0.75rem', lineHeight: '1.4', marginTop: '5px', maxWidth: '300px', fontWeight: '500' }}>
                {data.companyAddress || "Green Sedayu Bizpark DM 11 No. 51, Kalideres, Jakarta Barat"}
              </div>
            </div>
          </div>
          <div className="bg-slate" style={{ padding: '18px 30px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'right', minWidth: '240px' }}>
            <p style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NO. {data.id}</p>
            <p className="text-slate" style={{ margin: '4px 0 0 0', fontWeight: '700', fontSize: '0.9rem' }}>
              {new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', marginBottom: '70px' }}>
          {/* Customer Details */}
          <div style={{ borderLeft: '4px solid #1e40af', paddingLeft: '30px' }}>
            <h5 className="text-slate" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', marginBottom: '18px', letterSpacing: '1.5px' }}>CUSTOMER DETAILS</h5>
            <h3 className="text-gold" style={{ margin: '0 0 10px 0', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: '1.1' }}>{data.customerName}</h3>
            <p className="text-green" style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '800' }}>Attn: {data.pic || 'Purchasing Department'}</p>
            <p className="text-slate" style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600' }}>{data.address || 'Batam'}</p>
          </div>

          {/* Marketing Details */}
          <div style={{ textAlign: 'right' }}>
            <h5 className="text-slate" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', marginBottom: '18px', letterSpacing: '1.5px' }}>MARKETING PERSON</h5>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: '900', color: '#0f172a' }}>{data.marketingName || 'OTL Logistics Team'}</h4>
            <p className="text-slate" style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>{data.marketingEmail || 'marketing@otllogistics.co.id'}</p>
            <p className="text-slate" style={{ margin: '4px 0 25px 0', fontWeight: '700', fontSize: '1rem' }}>+62 21 5000 8000</p>
            <div style={{ borderTop: '1px solid #e2e8f0', display: 'inline-block', paddingTop: '12px' }}>
              <span className="text-slate" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px', marginRight: '12px' }}>VALIDITY PERIOD:</span>
              <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '0.95rem' }}>{data.validTo || '-'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '50px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0f172a' }}>
                <th className="text-slate" style={{ padding: '15px 0', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1px' }}>DESCRIPTION</th>
                <th className="text-slate" style={{ padding: '15px 0', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', width: '140px', letterSpacing: '1px' }}>UNIT RATE</th>
                <th className="text-slate" style={{ padding: '15px 0', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', width: '100px', letterSpacing: '1px' }}>QTY</th>
                <th className="text-slate" style={{ padding: '15px 0', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', width: '160px', letterSpacing: '1px' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px 0' }}>
                      <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>{item.description}</div>
                      <div className="text-slate" style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>Premium Logistics & Freight Services</div>
                    </td>
                    <td className="text-slate" style={{ padding: '20px 0', textAlign: 'center', fontWeight: '700', fontSize: '1.05rem' }}>
                      IDR {parseFloat(item.rate).toLocaleString()}
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'center', color: '#0f172a' }}>
                      <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>{item.quantity}</div>
                      <div className="text-slate" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '800' }}>{item.unit || 'Unit'}</div>
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'right', fontWeight: '950', fontSize: '1.2rem', color: '#0f172a' }}>
                      IDR {(Number(item.rate || 0) * Number(item.quantity || 1)).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-slate" style={{ padding: '50px 0', textAlign: 'center', fontStyle: 'italic', fontSize: '1.1rem' }}>
                    No services listed for this quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Grand Total Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '35px', marginTop: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <h3 className="text-gold" style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px' }}>GRAND TOTAL</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 className="text-gold" style={{ margin: 0, fontSize: '3.8rem', fontWeight: '950', letterSpacing: '-2px' }}>
                IDR {Number(data.rate || 0).toLocaleString()}
              </h2>
            </div>
          </div>

          {data.generalNotes && (
            <div style={{ padding: '25px 0', marginTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
              <h5 className="text-slate" style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.95rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Notes & Terms:</h5>
              <p className="text-slate" style={{ margin: 0, fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontWeight: '500' }}>{data.generalNotes}</p>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div style={{ marginTop: 'auto', paddingTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ maxWidth: '400px' }}>
            <p className="text-slate" style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0 0 6px 0' }}>* Pricing is inclusive of standard handling fees.</p>
            <p className="text-slate" style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>* Validity is subject to space availability.</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '300px' }}>
            <p style={{ fontWeight: '900', fontSize: '1rem', color: '#0f172a', textTransform: 'uppercase', marginBottom: '80px', letterSpacing: '1.5px' }}>AUTHORIZED SIGNATURE</p>
            <div style={{ borderBottom: '2.5px solid #0f172a', width: '250px', margin: '0 auto 15px auto' }}></div>
            <p style={{ margin: 0, fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>Management</p>
            <p className="text-slate" style={{ margin: 0, fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PT. Alpha Logistics Prakarsa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintQuotation;








