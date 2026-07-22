import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderDown, Loader2, CheckCircle2 } from 'lucide-react';

const ExportProgressModal = ({ isOpen, current = 0, total = 0, statusText = '', isID = false }) => {
  if (!isOpen) return null;

  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isComplete = current === total && total > 0;

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
          zIndex: 9999,
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
            maxWidth: '480px',
            padding: '35px 30px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            {isComplete ? (
              <CheckCircle2 size={32} style={{ color: '#10b981' }} />
            ) : (
              <FolderDown size={32} />
            )}
          </div>

          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text, #f8fafc)' }}>
            {isID ? 'Mengunduh Folder Penawaran' : 'Exporting Quotations Folder'}
          </h3>
          <p style={{ margin: '0 0 25px 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
            {isID ? 'Memproses dan membuat file PDF penawaran...' : 'Processing and generating quotation PDF files...'}
          </p>

          {/* Progress Percentage & Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>
                {isID ? 'Kemajuan' : 'Progress'}
              </span>
              <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>
                {percentage}%
              </span>
            </div>

            <div style={{
              width: '100%',
              height: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '100px',
              overflow: 'hidden',
              padding: '2px',
              boxSizing: 'border-box'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #f59e0b, #eab308)',
                  borderRadius: '100px',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)'
                }}
              />
            </div>
          </div>

          {/* Detailed Item Status */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left'
          }}>
            <Loader2 size={18} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text, #f8fafc)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {statusText || (isID ? 'Memproses...' : 'Processing...')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                {current} / {total} {isID ? 'Penawaran' : 'Quotations'}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportProgressModal;
