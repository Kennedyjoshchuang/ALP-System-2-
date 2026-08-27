import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import DashboardHome from './components/DashboardHome';

// Lazy-loaded page components for optimal code-splitting
const Portal = lazy(() => import('./pages/Portal'));
const Login = lazy(() => import('./pages/Login'));
const Marketing = lazy(() => import('./pages/Marketing'));
const QuotationList = lazy(() => import('./pages/QuotationList'));
const AdminHub = lazy(() => import('./pages/AdminHub'));
const Executor = lazy(() => import('./pages/Executor'));
const Accounting = lazy(() => import('./pages/Accounting'));
const CostApplications = lazy(() => import('./pages/CostApplications'));
const Procurement = lazy(() => import('./pages/Procurement'));
const HRD = lazy(() => import('./pages/HRD'));
const SystemControl = lazy(() => import('./pages/SystemControl'));
const SuratJalanDetail = lazy(() => import('./pages/SuratJalanDetail'));

// Lazy-loaded print pages
const PrintQuotation = lazy(() => import('./pages/PrintQuotation'));
const PrintInvoice = lazy(() => import('./pages/PrintInvoice'));
const PrintInvoiceAttachment = lazy(() => import('./pages/PrintInvoiceAttachment'));
const PrintInvoiceReceipt = lazy(() => import('./pages/PrintInvoiceReceipt'));
const PrintInvoiceDelivery = lazy(() => import('./pages/PrintInvoiceDelivery'));
const PrintPOAttachment = lazy(() => import('./pages/PrintPOAttachment'));

const RouteLoadingFallback = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem',
    color: '#cbd5e1'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(16, 185, 129, 0.2)',
      borderTopColor: '#10b981',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children, useLayout = true }) => {
  const { user, loading } = useApp();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return useLayout ? <Layout>{children}</Layout> : children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Portal />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
          <Route path="/quotations" element={<ProtectedRoute><QuotationList /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />
          <Route path="/executor" element={<ProtectedRoute><Executor /></ProtectedRoute>} />
          <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
          <Route path="/cost-applications" element={<ProtectedRoute><CostApplications /></ProtectedRoute>} />
          <Route path="/procurement" element={<ProtectedRoute><Procurement /></ProtectedRoute>} />
          <Route path="/hrd" element={<ProtectedRoute><HRD /></ProtectedRoute>} />
          <Route path="/system-control" element={<ProtectedRoute><SystemControl /></ProtectedRoute>} />
          <Route path="/surat-jalan/:id" element={<ProtectedRoute><SuratJalanDetail /></ProtectedRoute>} />

          {/* Print Pages - No Layout */}
          <Route path="/print/quotation" element={<ProtectedRoute useLayout={false}><PrintQuotation /></ProtectedRoute>} />
          <Route path="/print/invoice" element={<ProtectedRoute useLayout={false}><PrintInvoice /></ProtectedRoute>} />
          <Route path="/print/invoice-attachment" element={<ProtectedRoute useLayout={false}><PrintInvoiceAttachment /></ProtectedRoute>} />
          <Route path="/print/invoice-receipt" element={<ProtectedRoute useLayout={false}><PrintInvoiceReceipt /></ProtectedRoute>} />
          <Route path="/print/invoice-delivery" element={<ProtectedRoute useLayout={false}><PrintInvoiceDelivery /></ProtectedRoute>} />
          <Route path="/print/po-attachment" element={<ProtectedRoute useLayout={false}><PrintPOAttachment /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(10, 15, 30, 0.95)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              fontSize: '0.9rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <MaintenanceCheck />
        <AppRoutes />
      </ConfirmProvider>
    </AppProvider>
  );
}

const MaintenanceCheck = () => {
  const { maintenanceMode, user } = useApp();
  if (maintenanceMode && user?.role !== 'owner') {
    return <MaintenanceOverlay />;
  }
  return null;
};

export default App;

