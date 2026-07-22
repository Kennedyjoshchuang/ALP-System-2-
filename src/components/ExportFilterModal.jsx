import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderDown, Clock, CheckCircle2, FileText, X } from 'lucide-react';

const ExportFilterModal = ({ isOpen, onClose, onConfirm, quotations = [], isID = false }) => {
  if (!isOpen) return null;

  const [selectedFilter, setSelectedFilter] = useState('all');

  const allCount = quotations.length;
  const pendingCount = quotations.filter(q => q.status === 'pending').length;
  const approvedCount = quotations.filter(q => q.status === 'approved').length;

  const getFilteredList = () => {
    if (selectedFilter === 'pending') return quotations.filter(q => q.status === 'pending');
    if (selectedFilter === 'approved') return quotations.filter(q => q.status === 'approved');
    return quotations;
  };

  const selectedCount = getFilteredList().length;

  const handleStartExport = () => {
    const listToExport = getFilteredList();
    onConfirm(listToExport, selectedFilter);
    onClose();
  };

  const options = [
    {
      id: 'all',
      title: isID ? 'Semua Penawaran' : 'All Quotations',
      desc: isID ? 'Unduh seluruh penawaran yang ada' : 'Download all created quotations',
      count: allCount,
      icon: <FileText size={20} style={{ color: '#3b82f6' }} />,
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      badgeColor: '#60a5fa'
    },
    {
      id: 'pending',
      title: isID ? 'Hanya Pending' : 'Pending Only',
      desc: isID ? 'Ekstrak penawaran yang menunggu approval' : 'Extract quotations waiting for approval',
      count: pendingCount,
      icon: <Clock size={20} style={{ color: '#f59e0b' }} />,
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeColor: '#fbbf24'
    },
    {
      id: 'approved',
      title: isID ? 'Hanya Disetujui (Approved)' : 'Approved Only',
      desc: isID ? 'Ekstrak penawaran yang telah di-approve' : 'Extract approved active quotations',
      count: approvedCount,
      icon: <CheckCircle2 size={20} style={{ color: '#10b981' }} />,
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: '520px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          {/* Header Icon & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b'
            }}>
              <FolderDown size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text, #f8fafc)' }}>
                {isID ? 'Pilih Penawaran untuk Diunduh' : 'Select Quotations to Export'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                {isID ? 'Pilih kategori penawaran yang ingin dimasukkan ke folder ZIP' : 'Choose quotation status category to include in ZIP folder'}
              </p>
            </div>
          </div>

          {/* Filter Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
            {options.map((opt) => {
              const isSelected = selectedFilter === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedFilter(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {opt.icon}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: isSelected ? '#f59e0b' : 'var(--text, #f8fafc)' }}>
                        {opt.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                        {opt.desc}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: opt.badgeBg,
                    color: opt.badgeColor
                  }}>
                    {opt.count} {isID ? 'Item' : 'Items'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text, #f8fafc)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isID ? 'Batal' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleStartExport}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                background: selectedCount > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedCount > 0 ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FolderDown size={18} />
              {selectedCount > 0
                ? (isID ? `Unduh ${selectedCount} Penawaran (.zip)` : `Download ${selectedCount} Quotation(s) (.zip)`)
                : (isID ? 'Tidak Ada Penawaran' : 'No Quotations Available')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportFilterModal;
