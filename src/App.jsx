import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Marketing from './pages/Marketing';
import QuotationList from './pages/QuotationList';
import AdminHub from './pages/AdminHub';
import Executor from './pages/Executor';
import Accounting from './pages/Accounting';
import Procurement from './pages/Procurement';
import SystemControl from './pages/SystemControl';
import HRD from './pages/HRD';
import Login from './pages/Login';
import DashboardHome from './components/DashboardHome';
import SuratJalanDetail from './pages/SuratJalanDetail';
import PrintQuotation from './pages/PrintQuotation';
import PrintInvoice from './pages/PrintInvoice';
import PrintInvoiceAttachment from './pages/PrintInvoiceAttachment';
import PrintInvoiceReceipt from './pages/PrintInvoiceReceipt';
import PrintInvoiceDelivery from './pages/PrintInvoiceDelivery';
import PrintPOAttachment from './pages/PrintPOAttachment';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import Portal from './pages/Portal';

const ProtectedRoute = ({ children, useLayout = true }) => {
  const { user, loading } = useApp();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return useLayout ? <Layout>{children}</Layout> : children;
};

const AppRoutes = () => {
  return (
    <Router>
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
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
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

