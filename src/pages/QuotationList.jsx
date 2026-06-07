import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  CheckCircle,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { ButtonWithLoading } from '../components/ButtonWithLoading';

const QuotationList = () => {
  const { 
    quotations, 
    approveQuotation, 
    deleteQuotation, 
    user, 
    t 
  } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDraft, setSelectedDraft] = useState(null);

  const filteredQuotations = quotations
    .filter(q => 
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.pic && q.pic.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.id.localeCompare(a.id));

  const handleDownload = (quote) => {
    const printData = {
      ...quote,
      address: quote.address || 'Alamat tidak tersedia',
      description: quote.jobDescription || '',
      rate: quote.total || quote.rate || 0,
      isOfficial: true
    };
    localStorage.setItem('print_quotation_data', JSON.stringify(printData));
    window.open('/print/quotation', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="quotation-list-container" style={{ display: 'grid', gap: '25px' }}>
      
      {/* Draft Modal for Viewing */}
      <AnimatePresence>
        {selectedDraft && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)',
            zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: '40px 20px', overflowY: 'auto', backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              id="quotation-print-area"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="quotation-modal-content"
              style={{ 
                width: '210mm',
                minHeight: '297mm',
                background: 'white',
                margin: '0 auto',
                padding: '1cm',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                color: '#000'
              }}
            >
              <div className="no-print" style={{ 
                position: 'sticky', top: '0', right: '0', 
                display: 'flex', justifyContent: 'flex-end', gap: '15px', 
                padding: '20px', background: 'rgba(255,255,255,0.9)', 
                backdropFilter: 'blur(10px)', zIndex: 10,
                borderBottom: '1px solid #e2e8f0', marginBottom: '20mm'
              }}>
                <button onClick={handlePrint} className="btn btn-primary" style={{ height: '45px', padding: '0 30px', fontSize: '1rem' }}>
                  <Download size={20} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedDraft(null)} className="btn" style={{ height: '45px', padding: '0 30px', fontSize: '1rem', background: '#f1f5f9', color: '#64748b', border: 'none' }}>
                  Close
                </button>
              </div>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <img src="/assets/logo.png" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                    <div>
                      <h3 style={{ margin: 0, fontWeight: '950', fontSize: '1.4rem', color: '#0f172a', letterSpacing: '-0.5px' }}>PT. OMEGA TRUST LOGISTIK</h3>
                      <h4 style={{ margin: '1px 0 0 0', fontWeight: '800', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logistics & Freight Forwarding</h4>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: '1.2', marginTop: '3px', maxWidth: '250px' }}>
                        Green Sedayu Bizpark DM 11 No. 51, Kalideres, Jakarta Barat<br />
                        Tel: +62 21 2252 2333 | Email: info@omegatrust.co.id
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '15px 25px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'right', minWidth: '220px' }}>
                    <p style={{ margin: 0, fontWeight: '800', fontSize: '1rem', color: '#0f172a', textTransform: 'uppercase' }}>NO. {selectedDraft.id}</p>
                    <p style={{ margin: 0, color: '#64748b', fontWeight: '700', fontSize: '0.85rem' }}>
                      {new Date(selectedDraft.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {/* Customer & Marketing Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '60px' }}>
                  <div style={{ borderLeft: '4px solid #065f46', paddingLeft: '25px' }}>
                    <h5 style={{ textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '800', marginBottom: '15px', letterSpacing: '1px' }}>Customer Details</h5>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: '900', color: '#b45309', letterSpacing: '-0.5px' }}>{selectedDraft.customerName}</h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: '800', color: '#065f46' }}>Attn: {selectedDraft.pic || 'Purchasing Department'}</p>
                    <p style={{ margin: 0, fontSize: '1.1rem', color: '#475569', fontWeight: '600' }}>{selectedDraft.address || 'Batam'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h5 style={{ textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '800', marginBottom: '15px', letterSpacing: '1px' }}>Marketing Person</h5>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.6rem', fontWeight: '900', color: '#0f172a' }}>{selectedDraft.marketingName || 'Omega Trust Team'}</h4>
                    <p style={{ margin: 0, color: '#475569', fontWeight: '700', fontSize: '1rem' }}>{selectedDraft.marketingEmail || 'marketing@omegatrust.com'}</p>
                    <p style={{ margin: '3px 0 20px 0', color: '#475569', fontWeight: '700', fontSize: '1rem' }}>+62 21 5000 8000</p>
                    <div style={{ borderTop: '1px solid #e2e8f0', display: 'inline-block', paddingTop: '10px' }}>
                      <span style={{ textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', marginRight: '10px' }}>Validity Period:</span>
                      <span style={{ color: '#0f172a', fontWeight: '900' }}>{selectedDraft.validTo || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ flex: 1 }}>
                  <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #0f172a' }}>
                        <th style={{ padding: '15px 0', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '800', color: '#64748b' }}>Description</th>
                        <th style={{ padding: '15px 0', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '800', color: '#64748b', width: '120px' }}>Unit Rate</th>
                        <th style={{ padding: '15px 0', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '800', color: '#64748b', width: '100px' }}>Qty</th>
                        <th style={{ padding: '15px 0', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '800', color: '#64748b', width: '150px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDraft.items && selectedDraft.items.length > 0 ? (
                        selectedDraft.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '15px 0' }}>
                              <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>{item.description}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', fontWeight: '600' }}>Premium Logistics & Freight Services</div>
                            </td>
                            <td style={{ padding: '15px 0', textAlign: 'center', fontWeight: '700', fontSize: '1rem', color: '#475569' }}>
                              IDR {parseFloat(item.rate).toLocaleString()}
                            </td>
                            <td style={{ padding: '15px 0', textAlign: 'center', color: '#0f172a' }}>
                              <div style={{ fontWeight: '900', fontSize: '1rem' }}>{item.quantity}</div>
                              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '800', color: '#94a3b8' }}>{item.unit || 'Unit'}</div>
                            </td>
                            <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>
                              IDR {(Number(item.rate || 0) * Number(item.quantity || 1)).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ padding: '40px 0' }}>
                            <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#0f172a' }}>{selectedDraft.description || 'Service Description'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px', fontWeight: '600' }}>Premium Logistics & Freight Services</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table></div>

                  {/* Grand Total Section */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '30px', marginTop: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: '800', color: '#b45309' }}>Grand Total</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h2 style={{ margin: 0, fontSize: '3.2rem', fontWeight: '950', color: '#b45309', letterSpacing: '-1px' }}>
                        IDR {Number(selectedDraft.rate || 0).toLocaleString()}
                      </h2>
                    </div>
                  </div>

                  {selectedDraft.generalNotes && (
                    <div style={{ padding: '25px 0', marginTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.95rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Notes & Terms:</h5>
                      <p style={{ margin: 0, fontSize: '1rem', whiteSpace: 'pre-wrap', color: '#475569', lineHeight: '1.6', fontWeight: '500' }}>{selectedDraft.generalNotes}</p>
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}></div>
                </div>

                {/* Footer Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', padding: '60px 0 0 0', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ maxWidth: '350px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: '700' }}>* Pricing is inclusive of standard handling fees.</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, fontWeight: '700' }}>* Validity is subject to space availability.</p>
                  </div>
                  <div style={{ textAlign: 'center', width: '250px' }}>
                    <p style={{ margin: '0 0 80px 0', fontSize: '0.9rem', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Authorized Signature</p>
                    <div style={{ borderBottom: '2px solid #0f172a', marginBottom: '12px' }}></div>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>{selectedDraft.marketingName || 'Management'}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>PT. OMEGA TRUST</p>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
        className="no-print glass-card" 
        style={{ padding: '25px', overflowX: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FileText size={20} style={{ color: 'var(--gold-metallic)' }} />
            Quotation List
          </h4>
          <div style={{ position: 'relative', width: '300px' }}>
            <input 
              type="text" 
              placeholder="Search quotations..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ padding: '10px 15px 10px 45px', borderRadius: '100px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', width: '100%' }} 
            />
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gold-metallic)' }}>
              <th style={{ padding: '15px' }}>Quotation #</th>
              <th style={{ padding: '15px' }}>Date</th>
              <th style={{ padding: '15px' }}>Company</th>
              <th style={{ padding: '15px' }}>PIC</th>
              <th style={{ padding: '15px' }}>Amount</th>
              <th style={{ padding: '15px' }}>Status</th>
              <th style={{ padding: '15px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.map(quote => (
              <tr key={quote.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                <td style={{ padding: '15px', fontWeight: '700', color: 'var(--secondary)' }}>{quote.id}</td>
                <td style={{ padding: '15px', fontSize: '0.85rem' }}>{quote.date}</td>
                <td style={{ padding: '15px', fontWeight: '600' }}>{quote.customerName}</td>
                <td style={{ padding: '15px' }}>{quote.pic || '-'}</td>
                <td style={{ padding: '15px', fontWeight: '700' }}>Rp {quote.total?.toLocaleString() || quote.rate?.toLocaleString()}</td>
                <td style={{ padding: '15px' }}>
                  <span className={`badge badge-${quote.status}`} style={{ fontSize: '0.7rem' }}>{t(quote.status)}</span>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon" onClick={() => handleDownload(quote)}>
                      <Download size={16} />
                    </button>
                    {quote.status === 'pending' && (
                      <ButtonWithLoading className="btn-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }} onClick={() => approveQuotation(quote.id)}>
                        <CheckCircle size={16} />
                      </ButtonWithLoading>
                    )}
                    {user?.role === 'owner' && (
                      <ButtonWithLoading 
                        className="btn-icon" 
                        style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} 
                        onClick={async () => { 
                          if(window.confirm(`Hapus penawaran ${quote.id} untuk ${quote.customerName} secara permanen? Semua data Job Order dan Invoice terkait juga akan dihapus.`)) {
                            await deleteQuotation(quote.id);
                          }
                        }}
                        title="Hapus Penawaran"
                      >
                        <Trash2 size={16} />
                      </ButtonWithLoading>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </motion.div>
    </div>
  );
};

export default QuotationList;

