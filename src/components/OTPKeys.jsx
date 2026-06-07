import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCcw, Copy, ShieldCheck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const OTP_INTERVAL = 60; // seconds

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const OTPKeys = () => {
  const { updateSystemConfig, t } = useApp();
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_INTERVAL);
  const [copied, setCopied] = useState(false);

  const refreshOTP = useCallback(async () => {
    const newOtp = generateOTP();
    setOtp(newOtp);
    setTimeLeft(OTP_INTERVAL);

    try {
      await updateSystemConfig({
        otpKey: newOtp,
        otpUpdatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to sync OTP to server:', err);
    }
  }, [updateSystemConfig]);

  // Initialize on mount
  useEffect(() => {
    refreshOTP();
  }, [refreshOTP]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          refreshOTP();
          return OTP_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshOTP]);

  const handleCopy = () => {
    navigator.clipboard.writeText(otp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // SVG circle progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / OTP_INTERVAL) * circumference;
  const strokeColor = timeLeft > 15 ? '#10b981' : timeLeft > 5 ? '#d4af37' : '#ef4444';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <div style={{ 
          width: '45px', 
          height: '45px', 
          borderRadius: '12px', 
          background: 'rgba(212, 175, 55, 0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#d4af37',
          border: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Authorization Keys</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rolling codes for secure transaction authorization.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{
          textAlign: 'center',
          padding: '40px 30px',
          background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(6, 95, 70, 0.05) 100%)',
          border: '1px solid var(--glass-border)',
        }}
      >
        {/* Countdown Ring */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
            />
            <motion.circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', color: strokeColor, lineHeight: 1 }}>
              {timeLeft}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>seconds</span>
          </div>
        </div>

        {/* OTP Code Display */}
        <div style={{ marginBottom: '35px' }}>
          <p style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
            Current System Key
          </p>
          <div style={{
            display: 'inline-flex',
            gap: '12px',
            justifyContent: 'center',
          }}>
            {otp.split('').map((digit, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  width: '60px',
                  height: '75px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `2px solid ${strokeColor}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: strokeColor,
                  boxShadow: `0 8px 30px ${strokeColor}15`,
                  textShadow: `0 0 20px ${strokeColor}44`,
                  fontFamily: 'monospace',
                }}
              >
                {digit}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={handleCopy}
            className="btn"
            style={{ 
              minWidth: '160px', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'var(--text)',
              border: '1px solid var(--border)' 
            }}
          >
            <Copy size={18} />
            {copied ? 'Copied' : 'Copy Key'}
          </button>
          <button
            onClick={refreshOTP}
            className="btn btn-primary"
            style={{ minWidth: '160px' }}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>

        <div style={{
          marginTop: '35px',
          padding: '20px',
          borderRadius: '15px',
          background: 'rgba(212, 175, 55, 0.05)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          display: 'flex',
          gap: '15px',
          textAlign: 'left'
        }}>
          <div style={{ color: '#d4af37' }}><Clock size={20} /></div>
          <div>
            <strong>Security Protocol:</strong> This rolling key is required to authorize critical accounting edits and data deletions. Share only via secure channels.
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPKeys;

