import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, UserCircle, Globe, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [role, setRole] = useState('owner');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, t, language, toggleLanguage, theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(role, password)) {
      navigate('/dashboard');
    } else {
      setError(t('invalidKey'));
      setPassword('');
    }
  };

  const accounts = [
    { id: 'owner', name: 'Owner', access: 'All Access' },
    { id: 'marketing', name: 'Marketing', access: 'Marketing Page' },
    { id: 'admin', name: 'Admin Office', access: 'Admin Page' },
    { id: 'executor', name: 'Executor', access: 'Executor Page' },
    { id: 'accounting', name: 'Accounting', access: 'Finance & Piutang' },
  ];

  return (
    <div className={theme === 'light' ? 'light-theme' : ''} style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--text)',
      position: 'relative',
      overflow: 'hidden',
      padding: '20px'
    }}>
      {/* Floating Controls */}
      <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 100, display: 'flex', gap: '15px' }}>
        <button 
          onClick={toggleTheme}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60px', width: 'auto',
            borderRadius: '50%',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            background: 'var(--glass)',
            transition: 'all 0.3s'
          }}
        >
          {theme === 'dark' ? <Sun size={20} style={{ color: '#fbbf24' }} /> : <Moon size={20} style={{ color: '#475569' }} />}
        </button>

        <button 
          onClick={toggleLanguage}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '100px',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            background: 'var(--glass)',
            transition: 'all 0.3s'
          }}
        >
          <Globe size={18} style={{ color: 'var(--gold-metallic)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{language === 'en' ? 'ENGLISH' : 'INDONESIA'}</span>
        </button>
      </div>

      {/* Background Glow */}
      <div style={{ 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.1) 0%, transparent 70%)',
        zIndex: 1
      }}></div>

      <div className="mobile-stack" style={{ 
        display: 'flex', 
        gap: '20px', 
        maxWidth: '1000px', 
        width: '100%', 
        zIndex: 10, 
        alignItems: 'stretch',
        flexDirection: window.innerWidth <= 1024 ? 'column' : 'row'
      }}>
        
        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card" 
          style={{ 
            flex: 1,
            padding: window.innerWidth <= 768 ? '40px 25px' : '50px 40px',
            textAlign: 'center',
            border: '1px solid var(--glass-border)',
            background: 'var(--glass)'
          }}
        >
          <img 
            src="/assets/logo.png" 
            alt="ALP Logo" 
            style={{ height: '70px', width: 'auto', marginBottom: '15px', filter: 'drop-shadow(0 0 15px rgba(34, 60, 149, 0.4))' }} 
          />
          <h2 className="shimmer-text" style={{ fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem', marginBottom: '25px' }}>{t('logistikSystem')}</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label>{t('accessPortal')}</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  placeholder="Username / Department"
                  style={{ paddingLeft: '48px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
                <UserCircle size={18} color="var(--secondary)" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
              </div>
            </div>

            <div className="input-group" style={{ textAlign: 'left' }}>
              <label>{t('securityKey')}</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={t('enterKey')}
                  style={{ paddingLeft: '48px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
                <Lock size={18} color="var(--secondary)" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '10px' }}>{error}</p>}
            </div>

            <button type="submit" className="btn btn-gold" style={{ width: '100%', height: '54px', justifyContent: 'center' }}>
              <span>{t('accessPortal')}</span>
              <ArrowRight size={20} />
            </button>
          </form>
        </motion.div>

        {/* Access Info Card */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
          style={{ 
            width: window.innerWidth <= 1024 ? '100%' : '350px',
            padding: '30px 25px',
            background: 'rgba(30, 64, 175, 0.05)',
            border: '1px solid var(--border)'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--secondary)' }}>Access Directory</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {accounts.map(acc => (
              <div key={acc.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.85rem', marginBottom: '2px' }}>{acc.name}</div>
                <div style={{ color: 'var(--primary-light)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{acc.access}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '25px', paddingTop: '20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Authorized Personnel Only &bull; PT. ALPHA LOGISTICS PRAKARSA</p>
          </div>
        </motion.div>

      </div>

    </div>
  );
};

export default Login;







