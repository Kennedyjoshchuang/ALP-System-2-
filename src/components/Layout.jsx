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
  const { logout, user, hasAccess, t, language, toggleLanguage, theme, toggleTheme, loading } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLaptop = windowWidth <= 1440;
  const isMobile = windowWidth <= 1024;
  const SIDEBAR_WIDTH = isLaptop ? 220 : 260;

  const menuItems = [
    { path: '/marketing', label: t('marketing'), icon: Users, moduleKey: 'marketing' },
    { path: '/admin', label: t('adminOffice'), icon: Briefcase, moduleKey: 'admin' },
    { path: '/procurement', label: t('procurement'), icon: ShoppingCart, moduleKey: 'procurement' },
    { path: '/executor', label: t('executor'), icon: PlayCircle, moduleKey: 'executor' },
    { path: '/accounting', label: t('accounting'), icon: CreditCard, moduleKey: 'accounting' },
    { path: '/cost-applications', label: language === 'id' ? 'Pengajuan Biaya' : 'Cost Applications', icon: Wallet, moduleKey: 'costApplications' },
    { path: '/hrd', label: t('hrd'), icon: UserCheck, moduleKey: 'hrd' },
    { path: '/system-control', label: t('systemControl'), icon: ShieldAlert, moduleKey: 'systemControl' },
  ].filter(item => hasAccess(item.moduleKey));

  const getCurrentTitle = () => {
    const item = menuItems.find(i => i.path === location.pathname);
    return item ? item.label : t('dashboard');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' }}>
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
        width: `${SIDEBAR_WIDTH}px`,
        margin: isLaptop ? '12px' : '20px',
        padding: isLaptop ? '25px 18px' : '40px 25px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: isLaptop ? 'calc(100vh - 24px)' : 'calc(100vh - 40px)',
        zIndex: 200,
        borderRadius: '18px',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isMobile && !isMobileMenuOpen ? `translateX(-${SIDEBAR_WIDTH + 40}px)` : 'translateX(0)'
      }}>
        <div style={{ marginBottom: isLaptop ? '25px' : '50px', textAlign: 'center', position: 'relative' }}>
          {/* Close button for mobile */}
          {isMobile && (
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
            style={{ width: isLaptop ? '55px' : '80px', marginBottom: isLaptop ? '10px' : '20px', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.3))' }} 
          />
          <h2 className="shimmer-text" style={{ fontSize: isLaptop ? '1.1rem' : '1.4rem', marginBottom: '4px', letterSpacing: '1px' }}>ALPHA LOGISTICS</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('logistikSystem')}</p>
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
                  gap: '10px',
                  padding: isLaptop ? '10px 14px' : '14px 20px',
                  marginBottom: isLaptop ? '6px' : '12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  background: isActive ? 'var(--emerald-metallic)' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 8px 16px rgba(6, 95, 70, 0.3)' : 'none',
                  border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
                }}
              >
                <Icon size={isLaptop ? 17 : 20} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
                <span style={{ fontWeight: isActive ? '600' : '400', fontSize: isLaptop ? '0.82rem' : '0.95rem' }}>{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
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
              color: 'var(--danger)', 
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)' 
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
        marginLeft: isMobile ? '0' : `${SIDEBAR_WIDTH + (isLaptop ? 24 : 40)}px`, 
        padding: isMobile ? '20px 16px' : isLaptop ? '24px 30px' : '40px 50px',
        minWidth: 0,
        transition: 'all 0.4s'
      }}>
        <header className="no-print" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: isLaptop ? '20px' : '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger Toggle */}
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="btn-icon"
                style={{ width: '38px', height: '38px' }}
              >
                <Menu size={20} />
              </button>
            )}
            
            <div>
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{ fontSize: isMobile ? '1.6rem' : isLaptop ? '1.8rem' : '2.5rem', marginBottom: '2px' }}
              >
                {getCurrentTitle()}
              </motion.h1>
              <p className="desktop-only" style={{ color: 'var(--text-muted)', fontSize: isLaptop ? '0.85rem' : '1rem' }}>{t('welcomeMessage')}</p>
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
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                background: 'var(--glass)',
                transition: 'all 0.3s'
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
                padding: '10px 15px',
                borderRadius: '100px',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                background: 'var(--glass)',
                transition: 'all 0.3s'
              }}
            >
              <Globe size={16} style={{ color: 'var(--secondary)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{language === 'en' ? 'EN' : 'ID'}</span>
            </button>

            <div className="glass-card desktop-only" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--glass)' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'var(--gold-metallic)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#030712',
                fontWeight: '700',
                fontSize: '1rem'
              }}>O</div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text)' }}>{user?.name}</p>
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

