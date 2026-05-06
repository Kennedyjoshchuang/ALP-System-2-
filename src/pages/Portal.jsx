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
    <div className={theme === 'light' ? 'light-theme' : ''} style={{
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
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: window.innerWidth <= 768 ? '80%' : '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(29, 49, 130, 0.2) 0%, transparent 70%)',
        zIndex: 0,
        borderRadius: '50%'
      }} />

      {/* Top Bar */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: window.innerWidth <= 768 ? '20px' : '30px 50px',
        gap: '20px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/assets/logo.png" alt="Logo" style={{ height: '35px' }} />
          <div style={{ height: '30px', width: '1px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px' }}>PT. Alpha Logistics Prakarsa</span>
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
          <button onClick={toggleTheme} className="btn-icon" style={{ height: '60px', width: 'auto' }}>
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
          <h1 className="shimmer-text" style={{ 
            fontSize: window.innerWidth <= 768 ? '2.5rem' : '4.5rem', 
            marginBottom: '15px', 
            lineHeight: 1.1 
          }}>
            {language === 'en' ? 'ACCESS PORTAL' : 'AKSES PORTAL'}
          </h1>
          <p style={{ 
            fontSize: window.innerWidth <= 768 ? '0.9rem' : '1.2rem', 
            color: 'var(--text-muted)', 
            marginBottom: '40px', 
            maxWidth: '500px',
            margin: '0 auto 40px',
            fontWeight: '300',
            letterSpacing: window.innerWidth <= 768 ? '1px' : '2px'
          }}>
            {language === 'en' 
              ? 'INTEGRATED LOGISTICS COMMAND CENTER' 
              : 'PUSAT KOMANDO LOGISTIK TERINTEGRASI'}
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button 
              onClick={handleEnter}
              className="btn btn-accent" 
              style={{ 
                padding: window.innerWidth <= 768 ? '15px 35px' : '18px 45px', 
                fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem', 
                borderRadius: '100px',
                boxShadow: '0 0 30px rgba(227, 6, 19, 0.3)'
              }}
            >
              <span>{language === 'en' ? 'ENTER SYSTEM' : 'MASUK SISTEM'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>

        {/* System Stats / Indicators */}
        <div style={{ 
          marginTop: window.innerWidth <= 768 ? '50px' : '80px', 
          display: 'flex', 
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          gap: window.innerWidth <= 768 ? '15px' : '40px',
          padding: '20px 30px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.02)',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ height: '60px', width: 'auto', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
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







