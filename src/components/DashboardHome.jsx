import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const DashboardHome = () => {
  const { user } = useApp();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'marketing':
      return <Navigate to="/marketing" />;
    case 'admin':
      return <Navigate to="/admin" />;
    case 'executor':
      return <Navigate to="/executor" />;
    case 'accounting':
      return <Navigate to="/accounting" />;
    default:
      return <Navigate to="/marketing" />;
  }
};

export default DashboardHome;

