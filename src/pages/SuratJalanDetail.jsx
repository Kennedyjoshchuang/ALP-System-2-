import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FileText, Printer, X, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const SuratJalanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { jobOrders } = useApp();
  
  const jo = jobOrders.find(item => item.id === id);

  useEffect(() => {
    // If it's a direct print request (optional: check query params)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('print') === 'true') {
      setTimeout(() => window.print(), 1000);
    }
  }, []);

  if (!jo) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#323639', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Job Order Not Found</h2>
          <button onClick={() => navigate('/executor')} className="btn" style={{ marginTop: '20px', background: 'var(--secondary)', color: 'black' }}>Back to Executor</button>
        </div>
      </div>
    );
  }

  const handlePrint = () => window.print();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#323639', zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw', overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <div className="no-print" style={{ 
        background: '#202124', padding: '10px 40px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)', zIndex: 100000
      }}>
        <div style={{ color: 'white', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/executor')} style={{ background: 'none', border: 'none', color: '#8ab4f8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowLeft size={18} /> Kembali
          </button>
          <div style={{ width: '1px', height: '20px', background: '#5f6368', margin: '0 10px' }}></div>
          <FileText size={18} color="var(--secondary)" />
          <span style={{ fontSize: '0.9rem' }}>Surat Jalan: {jo.id}</span>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={handlePrint} 
            style={{ 
              height: '34px', background: '#8ab4f8', color: '#202124', 
              border: 'none', padding: '0 25px', borderRadius: '4px', 
              cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Printer size={16} /> Print Document
          </button>
          <button 
            onClick={() => navigate('/executor')} 
            style={{ 
              height: '34px', background: 'transparent', color: '#e8eaed', 
              border: '1px solid #5f6368', padding: '0 20px', borderRadius: '4px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.85rem'
            }}
          >
            <X size={16} /> Tutup
          </button>
        </div>
      </div>

      {/* Document Workspace */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="quotation-modal-content"
          style={{
            width: '100%', maxWidth: '210mm',
            padding: '50px 60px', borderRadius: '2px', position: 'relative',
            background: 'white', boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
            color: '#1e293b', transformOrigin: 'center center',
            display: 'flex', flexDirection: 'column',
            fontSize: '0.9rem'
          }}
        >
          <div id="surat-jalan-document" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #065f46', paddingBottom: '20px', marginBottom: '25px' }}>
              <div>
                <h2 style={{ color: '#065f46', margin: 0, fontWeight: '800', fontSize: '1.8rem', background: 'none', WebkitTextFillColor: 'initial' }}>PT. ALPHA LOGISTICS PRAKARSA</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '5px 0 0 0' }}>Logistik & Freight Forwarding System</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Jl. Raya Freight No. 88, Jakarta Utara</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ color: '#d4af37', fontSize: '2.2rem', margin: 0, fontWeight: '900', letterSpacing: '1px', background: 'none', WebkitTextFillColor: 'initial' }}>SURAT JALAN</h1>
                <p style={{ fontWeight: '700', margin: '5px 0 0 0', fontSize: '1.1rem', color: '#1e293b' }}>{jo.id}</p>
                <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Tanggal: {jo.date}</p>
              </div>
            </div>

            {/* Body Info */}
            <div className="grid-responsive-2" style={{ marginBottom: '30px' }}>
              <div>
                <h4 style={{ color: '#065f46', marginBottom: '12px', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Tujuan Pengiriman</h4>
                <p style={{ fontWeight: '800', fontSize: '1.3rem', margin: '0 0 8px 0', color: '#1e293b' }}>{jo.customerName}</p>
                <p style={{ margin: 0, color: '#475569', lineHeight: '1.5', fontSize: '0.95rem' }}>{jo.address || 'Alamat sesuai Database'}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#065f46', marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>Informasi Kendaraan</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No. Container:</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{jo.containerNo || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No. Kendaraan:</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{jo.vehicleNo || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Driver:</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{jo.driverName || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Pengiriman */}
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ color: '#065f46', marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Detail Pengiriman</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '12px 15px', border: '1px solid #e2e8f0', color: '#065f46' }}>Deskripsi Pekerjaan / Barang</th>
                    <th style={{ padding: '12px 15px', border: '1px solid #e2e8f0', color: '#065f46', width: '100px', textAlign: 'center' }}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '20px 15px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: '600', marginBottom: '10px', color: '#1e293b' }}>{jo.jobDescription}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Status Operasional: {jo.activityStatus || 'In Progress'}</div>
                    </td>
                    <td style={{ padding: '20px 15px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', fontSize: '1.1rem', verticalAlign: 'top', color: '#1e293b' }}>
                      {jo.quantity || 1}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tanda Tangan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', marginTop: 'auto', textAlign: 'center', color: '#1e293b' }}>
              <div>
                <p style={{ fontSize: '0.85rem', marginBottom: '70px', fontWeight: '600' }}>Penerima / Customer,</p>
                <div style={{ borderBottom: '1.5px solid #1e293b', width: '80%', margin: '0 auto' }}></div>
                <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#64748b' }}>( Nama Jelas & Stempel )</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', marginBottom: '70px', fontWeight: '600' }}>Sopir / Driver,</p>
                <div style={{ borderBottom: '1.5px solid #1e293b', width: '80%', margin: '0 auto' }}></div>
                <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#64748b' }}>( Tanda Tangan )</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', marginBottom: '70px', fontWeight: '600' }}>Petugas Lapangan,</p>
                <div style={{ borderBottom: '1.5px solid #1e293b', width: '80%', margin: '0 auto' }}></div>
                <p style={{ fontSize: '0.8rem', marginTop: '5px', fontWeight: '700' }}>PT. ALPHA LOGISTICS PRAKARSA</p>
              </div>
            </div>

            {/* Footer Note */}
            <div style={{ marginTop: '40px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontStyle: 'italic', textAlign: 'center' }}>
                * Surat Jalan ini adalah dokumen resmi pengiriman barang PT. Alpha Logistics Prakarsa. Mohon diperiksa kembali kelengkapan barang saat diterima.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuratJalanDetail;

