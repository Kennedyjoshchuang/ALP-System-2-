import React, { createContext, useContext, useState, useEffect } from 'react';
import { HelpCircle, AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [modal, setModal] = useState(null); // { message, resolve, options }

  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      setModal({
        message,
        resolve,
        options: {
          title: options.title || 'Confirmation',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          isDanger: options.isDanger || false,
          ...options
        }
      });
    });
  };

  const handleClose = (value) => {
    if (modal) {
      modal.resolve(value);
      setModal(null);
    }
  };

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    if (!modal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {modal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => handleClose(false)}
        >
          {/* Modal Card */}
          <div 
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '30px',
              position: 'relative',
              animation: 'scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              background: 'var(--card-bg)',
              border: `1px solid ${modal.options.isDanger ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)'}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Icon in Top-Right */}
            <button
              onClick={() => handleClose(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <X size={20} />
            </button>

            {/* Header Icon + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  background: modal.options.isDanger ? 'var(--danger-bg)' : 'var(--secondary-bg)',
                  color: modal.options.isDanger ? 'var(--danger)' : 'var(--secondary)'
                }}
              >
                {modal.options.isDanger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
              </div>
              <h3 
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  background: modal.options.isDanger ? 'none' : undefined,
                  WebkitTextFillColor: modal.options.isDanger ? 'var(--danger)' : undefined,
                  color: modal.options.isDanger ? 'var(--danger)' : undefined
                }}
              >
                {modal.options.title}
              </h3>
            </div>

            {/* Message Body */}
            <p 
              style={{
                color: 'var(--text)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '30px',
                textAlign: 'left'
              }}
            >
              {modal.message}
            </p>

            {/* Actions Footer */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '10px 20px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  borderRadius: '10px'
                }}
                onClick={() => handleClose(false)}
              >
                {modal.options.cancelText}
              </button>
              <button
                className={`btn ${modal.options.isDanger ? 'btn-danger' : 'btn-gold'}`}
                style={{
                  padding: '10px 24px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}
                onClick={() => handleClose(true)}
              >
                {modal.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </ConfirmContext.Provider>
  );
};
