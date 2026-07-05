import React, { useEffect, useState } from 'react';
import DigitalSignatureController from '../components/DigitalSignatureController';

const PrintInvoice = () => {
  const [data, setData] = useState(null);
  const [dueDays, setDueDays] = useState(() => parseInt(localStorage.getItem('invoice_due_days') || '14', 10));
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
    const saved = localStorage.getItem('print_invoice_data');
    if (saved) setData(JSON.parse(saved));
  }, []);

  if (!data) return (
    <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>
      Memuat data invoice…
    </div>
  );

  const { invoice, jo, consolidatedJOs, quotation, bankAccount } = data;
  const extraCharges = Array.isArray(invoice?.extra_charges) ? invoice.extra_charges : [];
  const targetJOs = Array.isArray(consolidatedJOs) && consolidatedJOs.length > 0 ? consolidatedJOs : (jo ? [jo] : []);
  const photos = targetJOs.reduce((acc, currJo) => acc.concat(Array.isArray(currJo.photos) ? currJo.photos : []), []);

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const dueDate = invoice?.date
    ? new Date(new Date(invoice.date).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;

  const grandTotal = parseFloat(invoice?.amount || invoice?.subtotal || 0);

  // Address: prefer invoice.customerAddress → quotation companyAddress → fallback
  const customerAddress = invoice?.customerAddress || quotation?.companyAddress || jo?.address || '';
  const customerPic = invoice?.customerPic || quotation?.pic || '';
  const customerPhone = invoice?.customerPhone || quotation?.phone || '';
  const customerEmail = invoice?.customerEmail || quotation?.email || '';

  const handleOpenAttachment = () => {
    window.open('/print/invoice-attachment', '_blank');
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
          #inv-area {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 1.2cm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Kembali ke Dashboard
          </button>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
          <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1e293b' }}>Invoice {invoice?.id}</span>
          <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: '800', padding: '3px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>Diterbitkan</span>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Tempo:</span>
            <input 
              type="number" 
              value={dueDays} 
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                setDueDays(val);
                localStorage.setItem('invoice_due_days', val.toString());
              }} 
              style={{ width: '45px', border: 'none', background: 'transparent', fontWeight: '800', fontSize: '0.85rem', color: '#1e293b', textAlign: 'center', padding: '2px 0' }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>hari</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <DigitalSignatureController onConfigChange={setSigConfig} />
          {(photos.length > 0 || invoice?.signedInvoicePhoto || invoice?.signedReceiptPhoto) && (
            <button
              onClick={() => window.open('/print/invoice-attachment', '_blank')}
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📎 Lampiran Foto ({(photos.length + (invoice?.signedInvoicePhoto ? 1 : 0) + (invoice?.signedReceiptPhoto ? 1 : 0))})
            </button>
          )}
          <button
            onClick={() => window.open('/print/invoice-delivery', '_blank')}
            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            🚚 Cetak Surat Jalan
          </button>
          <button
            onClick={() => window.open('/print/invoice-receipt', '_blank')}
            style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            🧾 Cetak Kwitansi
          </button>
          <button 
            onClick={() => window.print()} 
            style={{ padding: '8px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem', boxShadow: '0 4px 6px rgba(30, 41, 59, 0.2)' }}
          >
            🖨 Cetak Invoice / PDF
          </button>
        </div>
      </div>

      {/* A4 Invoice */}
      <div id="inv-area" style={{ width: '210mm', minHeight: '297mm', background: 'white', margin: '24px auto', padding: '1.2cm', boxShadow: '0 4px 30px rgba(0,0,0,0.12)', color: '#1e293b', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #1e293b', paddingBottom: '22px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <img src="/assets/logo.png" alt="Logo" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Ruko The Summer B1-2A, Jl. Centre Point, Teluk Tering, Batam Kota, Batam</p>
              <p style={{ margin: '1px 0 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Telp: +62 813-6562-2272 | alphalogisticsprakarsa@gmail.com</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#d4af37', letterSpacing: '-2px', lineHeight: 1 }}>INVOICE</div>
            <div style={{ marginTop: '6px', fontWeight: '800', fontSize: '0.95rem' }}>No: {invoice?.id}</div>
          </div>
        </div>

        {/* Bill To + Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginBottom: '36px' }}>
          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>DITAGIHKAN KEPADA:</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: '900', color: '#1e293b', lineHeight: 1.1 }}>{invoice?.customerName}</p>
            {customerAddress && <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>{customerAddress}</p>}
            {customerPic && <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Attn: {customerPic}</p>}
            {customerPhone && <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Telp: {customerPhone}</p>}
            {customerEmail && <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Email: {customerEmail}</p>}
          </div>
          <div>
            <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <tbody>
                {[
                  ['Tanggal Invoice', fmtDate(invoice?.date)],
                  ['Jatuh Tempo', fmtDate(dueDate)],
                  ['Referensi JO', invoice?.joId],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '4px 14px 4px 0', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap' }}>{label}:</td>
                    <td style={{ padding: '4px 0', fontWeight: '800', color: '#1e293b' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: 'white' }}>
              {['Deskripsi Layanan', 'Qty', 'Harga Satuan', 'Jumlah'].map((h, i) => (
                <th key={h} style={{ padding: '11px 14px', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right', width: i === 1 ? '70px' : i >= 2 ? '150px' : 'auto' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Main JO Items */}
            {targetJOs.map((targetJo, joIdx) => {
              if (Array.isArray(targetJo.items) && targetJo.items.length > 0) {
                return targetJo.items.map((item, idx) => (
                  <tr key={`jo-${targetJo.id}-item-${idx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '15px 14px' }}>
                      <div style={{ fontWeight: '800', fontSize: '1rem' }}>{item.serviceType || 'Logistics Service'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', fontWeight: '600' }}>
                        Container: {Array.isArray(item.containerNo) ? item.containerNo.join(', ') : (item.containerNo || '-')} | Vehicle: {Array.isArray(item.vehicleNo) ? item.vehicleNo.join(', ') : (item.vehicleNo || '-')}
                      </div>
                      {item.driverName && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Driver: {Array.isArray(item.driverName) ? item.driverName.join(', ') : item.driverName}</div>}
                    </td>
                    <td style={{ padding: '15px 14px', textAlign: 'center', fontWeight: '800', fontSize: '1.05rem' }}>
                      {item.quantity || 1}
                    </td>
                    <td style={{ padding: '15px 14px', textAlign: 'right', color: '#475569', fontWeight: '700' }}>
                      Rp {parseFloat(item.rate || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '15px 14px', textAlign: 'right', fontWeight: '900', fontSize: '1.1rem' }}>
                      Rp {(parseFloat(item.rate || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ));
              } else {
                const qty = targetJo.issueQuantity || targetJo.quantity || 1;
                const rate = targetJo.rate || 0;
                return (
                  <tr key={`jo-${targetJo.id || joIdx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '18px 14px' }}>
                      <div style={{ fontWeight: '800', fontSize: '1rem' }}>Freight &amp; Logistics Services</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', fontWeight: '600' }}>
                        {targetJo.instruction || targetJo.jobDescription || 'Freight Forwarding Services'}
                      </div>
                      {targetJo.containerNo && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          Container: {Array.isArray(targetJo.containerNo) ? targetJo.containerNo.join(', ') : targetJo.containerNo}{targetJo.vehicleNo ? ` | Vehicle: ${Array.isArray(targetJo.vehicleNo) ? targetJo.vehicleNo.join(', ') : targetJo.vehicleNo}` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '18px 14px', textAlign: 'center', fontWeight: '800', fontSize: '1.05rem' }}>
                      {qty}
                    </td>
                    <td style={{ padding: '18px 14px', textAlign: 'right', color: '#475569', fontWeight: '700' }}>
                      Rp {parseFloat(rate).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '18px 14px', textAlign: 'right', fontWeight: '900', fontSize: '1.1rem' }}>
                      Rp {(parseFloat(rate) * parseFloat(qty)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              }
            })}

            {/* Extra Charges */}
            {extraCharges.map((ec, i) => (
              <tr key={`ec-${i}`} style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                <td style={{ padding: '10px 14px', fontSize: '0.88rem', color: '#475569' }}>{ec.description}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>{ec.qty || 1}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>Rp {parseFloat(ec.rate || ec.amount || 0).toLocaleString('id-ID')}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700' }}>Rp {parseFloat(ec.amount || 0).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
          <div style={{ background: '#1e293b', color: 'white', padding: '18px 30px', borderRadius: '12px', textAlign: 'right', minWidth: '280px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>TOTAL TAGIHAN</div>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#d4af37', letterSpacing: '-1px' }}>
              Rp {grandTotal.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Custom Notes */}
        {invoice?.notes && (
          <div style={{ padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '20px', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Keterangan</p>
            <div style={{ fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap', fontWeight: '600', lineHeight: '1.4' }}>
              {invoice.notes}
            </div>
          </div>
        )}

        {/* Bank Info */}
        <div style={{ padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Informasi Pembayaran</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 20px', fontSize: '0.85rem' }}>
            {[
              ['Bank', bankAccount?.bankName || 'Bank Mandiri (IDR)'], 
              ['No. Rekening', bankAccount?.accountNumber || '164-00-0255502-3'], 
              ['Atas Nama', bankAccount?.accountName || 'PT. Alpha Logistics Prakarsa']
            ].map(([l, v]) => (
              <React.Fragment key={l}>
                <span style={{ color: '#64748b', fontWeight: '700' }}>{l}:</span>
                <span style={{ fontWeight: '800', color: '#1e293b' }}>{v}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Operational Details */}
        {targetJOs.some(j => j.containerNo || j.vehicleNo || j.driverName || j.activityStatus) && (
          <div style={{ padding: '12px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.65rem', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Detail Operasional</p>
            {targetJOs.map(targetJo => (
              (targetJo.containerNo || targetJo.vehicleNo || targetJo.driverName || targetJo.activityStatus) ? (
                <div key={`op-${targetJo.id}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.82rem', marginBottom: '10px', borderBottom: '1px dashed #bbf7d0', paddingBottom: '10px' }}>
                  {[['Container No.', targetJo.containerNo], ['Vehicle No.', targetJo.vehicleNo], ['Driver', targetJo.driverName], ['Status', targetJo.activityStatus]].filter(([, v]) => v).map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{l}</div>
                      <div style={{ fontWeight: '700', color: '#111827' }}>
                        {Array.isArray(v) ? v.map((val, i) => <div key={i}>{val}</div>) : v}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            ))}
          </div>
        )}

        {/* Attachment note if photos exist */}
        {photos.length > 0 && (
          <div style={{ padding: '10px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1rem' }}>📎</span>
            <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: '700' }}>
              Lampiran: {photos.length} foto dokumentasi operasional terlampir pada halaman terpisah.
            </span>
          </div>
        )}

        {/* Signature Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ maxWidth: '320px' }}>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 3px 0', fontWeight: '600' }}>* Pembayaran harap dilakukan dalam {dueDays} hari kerja sejak tanggal invoice. / Payment should be made within {dueDays} working days from the invoice date.</p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, fontWeight: '600' }}>* Dokumen ini dibuat secara otomatis dan sah tanpa tanda tangan basah. / This invoice is automatically generated and is valid without a physical signature.</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Hormat Kami,</p>

            {/* Interactive Signature overlay area */}
            <div style={{
              position: 'relative',
              width: '180px',
              height: '80px',
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
                    width: '80px',
                    height: '80px',
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
                  fontSize: '2rem',
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

            <div style={{ borderBottom: '2px solid #1e293b', width: '100%', marginBottom: '10px' }}></div>
            <p style={{ margin: 0, fontWeight: '900', fontSize: '1rem', color: '#1e293b' }}>PT. Alpha Logistics Prakarsa</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Finance Department</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;

