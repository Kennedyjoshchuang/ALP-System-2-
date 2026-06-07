import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Trash2,
  AlertTriangle,
  Database,
  Users,
  Briefcase,
  FileText,
  ShieldAlert,
  X,
  CheckCircle,
  Settings,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import OTPKeys from '../components/OTPKeys';

const SystemControl = () => {
  const {
    customers, deleteCustomer,
    jobOrders, deleteJO,
    invoices, deleteInvoice,
    maintenanceMode, setMaintenanceMode,
    clearAllData,
    t, theme, language
  } = useApp();

  const isID = language === 'id';

  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', id: null, label: '' });
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyText, setVerifyText] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const { getSystemConfig } = useApp();

  const openConfirm = (type, id, label) => {
    setConfirmModal({ show: true, type, id, label });
    setVerifyStep(1);
    setVerifyText('');
    setOtpInput('');
  };

  const closeConfirm = () => {
    setConfirmModal({ show: false, type: '', id: null, label: '' });
  };

  const handleAction = async () => {
    // Step 1: Initial Confirmation
    if (verifyStep === 1) {
      setVerifyStep(2);
      return;
    }

    // Step 2: Authorize Text
    if (verifyStep === 2) {
      if (verifyText.toUpperCase() !== 'DELETE') {
        alert(isID ? 'Teks verifikasi tidak sesuai. Silakan ketik DELETE.' : 'Verification text mismatch. Please type DELETE.');
        return;
      }

      if (confirmModal.type === 'all') {
        setVerifyStep(3);
      } else {
        // Individual deletions only need step 2
        executeDeletion();
      }
      return;
    }

    // Step 3: Security Key (Only for 'all')
    if (verifyStep === 3) {
      try {
        const config = await getSystemConfig();
        if (!config || otpInput !== config.otpKey) {
          alert(isID ? 'Kunci Otorisasi Salah. Silakan periksa papan OTP di atas.' : 'Invalid Authorization Key. Please check the OTP board above.');
          return;
        }
        executeDeletion();
      } catch (err) {
        console.error("Verification failed:", err);
        alert(isID ? "Kesalahan sistem selama verifikasi. Silakan coba lagi." : "System error during verification. Please try again.");
      }
    }
  };

  const executeDeletion = () => {
    const { type, id } = confirmModal;
    if (type === 'all') {
      clearAllData().then(() => {
        alert(isID ? 'Tindakan berhasil diotorisasi dan dijalankan. Sistem akan dimuat ulang.' : 'Action successfully authorized and executed. System will refresh.');
        window.location.reload();
      });
    } else {
      if (type === 'customer') deleteCustomer(id);
      else if (type === 'jo') deleteJO(id);
      else if (type === 'invoice') deleteInvoice(id);

      alert(isID ? 'Tindakan berhasil diotorisasi dan dijalankan.' : 'Action successfully authorized and executed.');
    }

    closeConfirm();
  };

  const stats = [
    { label: isID ? 'Total Pelanggan' : 'Total Customers', value: customers.length, icon: Users, color: '#10b981' },
    { label: isID ? 'Job Order Aktif' : 'Active Job Orders', value: jobOrders.length, icon: Briefcase, color: '#d4af37' },
    { label: isID ? 'Faktur Sistem' : 'System Invoices', value: invoices.length, icon: FileText, color: '#3b82f6' },
  ];

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '15px',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <ShieldAlert size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{t('systemControl') || (isID ? 'Manajemen Sistem' : 'System Management')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{isID ? 'Penghapusan data terotorisasi dan pemeliharaan sistem.' : 'Authorized data removal and system maintenance.'}</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '30px', marginBottom: '40px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ 
            padding: '15px', 
            borderRadius: '15px', 
            background: maintenanceMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: maintenanceMode ? '#f59e0b' : '#10b981'
          }}>
            <Settings size={24} className={maintenanceMode ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text)' }}>{isID ? 'Mode Pemeliharaan' : 'Maintenance Mode'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              {maintenanceMode 
                ? (isID ? 'Sistem saat ini disembunyikan dari staf/publik.' : 'System is currently hidden from staff/public.') 
                : (isID ? 'Sistem aktif dan dapat diakses oleh semua pengguna terotorisasi.' : 'System is live and accessible to all authorized users.')}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setMaintenanceMode(!maintenanceMode)}
          className={`btn ${maintenanceMode ? 'btn-gold' : 'btn-primary'}`}
          style={{ borderRadius: '30px', padding: '10px 25px' }}
        >
          <Power size={18} />
          {maintenanceMode ? (isID ? 'NONAKTIFKAN' : 'DEACTIVATE') : (isID ? 'AKTIFKAN' : 'ACTIVATE')}
        </button>
      </div>

      <div className="grid-responsive-3" style={{ marginBottom: '40px' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '15px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text)' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '60px' }}>
        <OTPKeys />
      </div>

      <div className="glass-card" style={{ padding: '40px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h3 style={{ color: '#ef4444', marginBottom: '5px' }}>{isID ? 'Tindakan Sistem Kritis' : 'Critical System Actions'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{isID ? 'Tindakan ini bersifat permanen dan tidak dapat dibatalkan.' : 'These actions are permanent and cannot be undone.'}</p>
          </div>
          <button
            className="btn"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            onClick={() => openConfirm('all', null, 'ALL SYSTEM DATA')}
          >
            <AlertTriangle size={18} />
            {isID ? 'Atur Ulang Seluruh Sistem' : 'Reset Entire System'}
          </button>
        </div>

        <div className="grid-responsive-2" style={{ gap: '30px' }}>
          {/* Customers Section */}
          <div>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} /> {isID ? 'Database Pelanggan' : 'Customer Database'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customers.map(c => (
                <div key={c.id} style={{ padding: '15px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{c.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {c.id}</div>
                  </div>
                  <button onClick={() => openConfirm('customer', c.id, c.customerName)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {customers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>{isID ? 'Tidak ada pelanggan ditemukan.' : 'No customers found.'}</p>}
            </div>
          </div>

          {/* Jobs & Invoices Section */}
          <div>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} /> {isID ? 'Operasi & Keuangan' : 'Operations & Finance'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px' }}>{isID ? 'Job & Faktur Terbaru' : 'Recent Jobs & Invoices'}</p>
              {jobOrders.slice(0, 5).map(jo => (
                <div key={jo.id} style={{ padding: '15px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{jo.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{jo.customerName}</div>
                  </div>
                  <button onClick={() => openConfirm('jo', jo.id, jo.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {jobOrders.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>{isID ? 'Tidak ada job order ditemukan.' : 'No job orders found.'}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Step Verification Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card"
              style={{
                maxWidth: '500px',
                width: '100%',
                padding: '40px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                position: 'relative'
              }}
            >
              <button onClick={closeConfirm} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 25px',
                  color: '#ef4444'
                }}>
                  <AlertTriangle size={40} />
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#ef4444' }}>
                  {verifyStep === 1 ? (isID ? 'Hapus Permanen?' : 'Permanent Deletion?') : (isID ? 'Verifikasi Akhir' : 'Final Verification')}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                  {verifyStep === 1
                    ? (isID ? `Apakah Anda yakin ingin menghapus "${confirmModal.label}"? Tindakan ini tidak dapat dibatalkan.` : `Are you sure you want to delete "${confirmModal.label}"? This action is irreversible.`)
                    : (isID ? `Untuk mengonfirmasi, silakan ketik "DELETE" pada kotak di bawah untuk mengotorisasi penghapusan.` : `To confirm, please type "DELETE" in the box below to authorize the removal.`)}
                </p>

                {verifyStep === 2 && (
                  <div className="input-group">
                    <input
                      type="text"
                      value={verifyText}
                      onChange={e => setVerifyText(e.target.value)}
                      placeholder={isID ? "Ketik DELETE di sini..." : "Type DELETE here..."}
                      style={{
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        letterSpacing: '2px',
                        fontWeight: '700',
                        border: '2px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: '#ef4444'
                      }}
                      autoFocus
                    />
                  </div>
                )}

                {verifyStep === 3 && (
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', marginBottom: '15px' }}>{isID ? 'Masukkan Kunci Keamanan 4-Digit' : 'Enter 4-Digit Security Key'}</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      style={{
                        textAlign: 'center',
                        fontSize: '2rem',
                        letterSpacing: '15px',
                        fontWeight: '900',
                        border: '2px solid var(--secondary)',
                        background: 'rgba(212, 175, 55, 0.05)',
                        color: 'var(--secondary)'
                      }}
                      autoFocus
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={closeConfirm} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    {isID ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleAction}
                    className="btn"
                    disabled={(verifyStep === 2 && verifyText.toUpperCase() !== 'DELETE') || (verifyStep === 3 && otpInput.length !== 4)}
                    style={{
                      flex: 1,
                      background: (verifyStep === 1 || (verifyStep === 2 && verifyText.toUpperCase() === 'DELETE') || (verifyStep === 3 && otpInput.length === 4)) ? '#ef4444' : '#374151',
                      color: 'white',
                      cursor: ((verifyStep === 2 && verifyText.toUpperCase() !== 'DELETE') || (verifyStep === 3 && otpInput.length !== 4)) ? 'not-allowed' : 'pointer',
                      opacity: ((verifyStep === 2 && verifyText.toUpperCase() !== 'DELETE') || (verifyStep === 3 && otpInput.length !== 4)) ? 0.6 : 1
                    }}
                  >
                    {verifyStep === 1 ? (isID ? 'Konfirmasi Hapus' : 'Confirm Deletion') : (verifyStep === 2 ? (isID ? 'Otorisasi Teks' : 'Authorize Text') : (isID ? 'Verifikasi Kunci Keamanan' : 'Verify Security Key'))}
                    {verifyStep === 3 && <CheckCircle size={18} style={{ marginLeft: '10px' }} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemControl;

