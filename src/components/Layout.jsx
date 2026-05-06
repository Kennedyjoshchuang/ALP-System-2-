import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  PlayCircle, 
  CreditCard, 
  Wallet,
  LogOut,
  ChevronRight,
  Globe,
  Sun,
  Moon,
  ShieldAlert,
  FileText,
  ShoppingCart,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const location = useLocation();
  const { logout, user, t, language, toggleLanguage, theme, toggleTheme, loading } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { path: '/marketing', label: t('marketing'), icon: Users, roles: ['owner', 'marketing'] },
    { path: '/admin', label: t('adminOffice'), icon: Briefcase, roles: ['owner', 'admin'] },
    { path: '/procurement', label: 'Procurement', icon: ShoppingCart, roles: ['owner', 'admin'] },
    { path: '/executor', label: t('executor'), icon: PlayCircle, roles: ['owner', 'executor'] },
    { path: '/accounting', label: t('accounting'), icon: CreditCard, roles: ['owner', 'accounting'] },
    { path: '/hrd', label: 'HRD', icon: UserCheck, roles: ['owner', 'hrd'] },
    { path: '/system-control', label: t('systemControl'), icon: ShieldAlert, roles: ['owner'] },
  ].filter(item => item.roles.includes(user?.role));

  const getCurrentTitle = () => {
    const item = menuItems.find(i => i.path === location.pathname);
    return item ? item.label : t('dashboard');
  };

  return (
    <div className={theme === 'light' ? 'light-theme' : ''} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' }}>
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', zIndex: 150, backdropFilter: 'blur(4px)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`glass-card no-print ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{
        width: '300px',
        margin: '20px',
        padding: '40px 25px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: 'calc(100vh - 40px)',
        zIndex: 200,
        borderRadius: '24px',
        background: theme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(3, 7, 18, 0.4)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: window.innerWidth <= 1024 && !isMobileMenuOpen ? 'translateX(-340px)' : 'translateX(0)'
      }}>
        <div style={{ marginBottom: '50px', textAlign: 'center', position: 'relative' }}>
          {/* Close button for mobile */}
          {window.innerWidth <= 1024 && (
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          )}

          <img 
            src="/assets/logo.png" 
            alt="Logo" 
            style={{ height: '50px', width: 'auto', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(34, 60, 149, 0.3))' }} 
          />
          <h2 className="shimmer-text" style={{ fontSize: '1.4rem', marginBottom: '5px', letterSpacing: '1px' }}>Alpha Logistics Prakarsa</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase' }}>{t('logistikSystem')}</p>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '14px 20px',
                  marginBottom: '12px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  background: isActive ? 'var(--emerald-metallic)' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
                  border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
                }}
              >
                <Icon size={20} style={{ opacity: isActive ? 1 : 0.6 }} />
                <span style={{ fontWeight: isActive ? '600' : '400', fontSize: '0.95rem' }}>{item.label}</span>
                {isActive && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
          <button 
            className="btn" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              color: '#ef4444', 
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.1)' 
            }}
            onClick={logout}
          >
            <LogOut size={18} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: window.innerWidth <= 1024 ? '0' : '340px', 
        padding: window.innerWidth <= 768 ? '25px 20px' : '50px 60px',
        maxWidth: '1400px',
        transition: 'all 0.4s'
      }}>
        <header className="no-print" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: window.innerWidth <= 768 ? '30px' : '50px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Hamburger Toggle */}
            {window.innerWidth <= 1024 && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="btn-icon"
                style={{ height: '60px', width: 'auto' }}
              >
                <Menu size={24} />
              </button>
            )}
            
            <div>
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{ fontSize: window.innerWidth <= 768 ? '1.8rem' : '2.5rem', marginBottom: '4px' }}
              >
                {getCurrentTitle()}
              </motion.h1>
              <p className="desktop-only" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{t('welcomeMessage')}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px', width: '42px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                background: 'var(--glass)',
                transition: 'all 0.3s',
                padding: 0
              }}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#475569' }} />}
            </button>

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 16px',
                height: '42px',
                borderRadius: '100px',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                background: 'var(--glass)',
                transition: 'all 0.3s'
              }}
            >
              <Globe size={16} style={{ color: 'var(--secondary)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{language === 'en' ? 'EN' : 'ID'}</span>
            </button>

            <div className="glass-card desktop-only" style={{ height: '42px', padding: '0 18px 0 6px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--glass)' }}>
              <div style={{ 
                height: '32px', width: '32px', 
                borderRadius: '50%', 
                background: 'var(--gold-metallic)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white',
                fontWeight: '800',
                fontSize: '0.9rem'
              }}>A</div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap' }}>{user?.name}</p>
              </div>
            </div>
          </div>
        </header>

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;







