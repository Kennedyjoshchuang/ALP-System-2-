import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Globe, Sun, Moon, Clock, Monitor } from 'lucide-react';

const Portal = () => {
  const { t, language, toggleLanguage, theme, toggleTheme, user } = useApp();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEnter = () => {
    navigate('/login');
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      color: 'var(--text)',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Background Animated Elements */}
      <div className="portal-bg-element" />

      {/* Top Bar */}
      <div className="portal-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/assets/logo.png" alt="Logo" style={{ height: '35px' }} />
          <div style={{ height: '30px', width: '1px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px' }}>PT. ALPHA LOGISTICS PRAKARSA</span>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logistics Management</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="glass-card" style={{ padding: '6px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} color="var(--secondary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <button onClick={toggleTheme} className="btn-icon" style={{ width: '36px', height: '36px' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={toggleLanguage} className="btn-icon" style={{ width: 'auto', height: '36px', padding: '0 12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <Globe size={14} style={{ marginRight: '6px' }} /> {language === 'en' ? 'EN' : 'ID'}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        zIndex: 10,
        padding: '20px',
        minHeight: '60vh'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="shimmer-text portal-h1">
            {language === 'en' ? 'ACCESS PORTAL' : 'AKSES PORTAL'}
          </h1>
          <p className="portal-p">
            {language === 'en' 
              ? 'INTEGRATED LOGISTICS COMMAND CENTER' 
              : 'PUSAT KOMANDO LOGISTIK TERINTEGRASI'}
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button 
              onClick={handleEnter}
              className="btn btn-accent portal-btn" 
            >
              <span>{language === 'en' ? 'ENTER SYSTEM' : 'MASUK SISTEM'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>

        {/* System Stats / Indicators */}
        <div className="portal-stats">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status: Online</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={14} color="var(--secondary)" />
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>V2.1.7 Revision</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={14} color="var(--secondary)" />
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Secured Gateway</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px',
        textAlign: 'center',
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        zIndex: 10,
        letterSpacing: '1px'
      }}>
        © {new Date().getFullYear()} PT. ALPHA LOGISTICS PRAKARSA.
      </div>
    </div>
  );
};

export default Portal;
