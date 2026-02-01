import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';

// Public Pages
import Landing from '@/pages/Landing';
import HowItWorks from '@/pages/HowItWorks';
import Pricing from '@/pages/Pricing';
import FAQ from '@/pages/FAQ';
import Contact from '@/pages/Contact';
import AuthPage from '@/pages/Auth';

// Private Pages
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import ImportStatement from '@/pages/ImportStatement';
import Transactions from '@/pages/Transactions';
import Reports from '@/pages/Reports';
import Categories from '@/pages/Categories';
import Accounts from '@/pages/Accounts';
import Settings from '@/pages/Settings';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><AuthPage /></PublicRoute>} />
          
          {/* Private Routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><DashboardLayout><ImportStatement /></DashboardLayout></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><DashboardLayout><Transactions /></DashboardLayout></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><DashboardLayout><Reports /></DashboardLayout></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><DashboardLayout><Categories /></DashboardLayout></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute><DashboardLayout><Accounts /></DashboardLayout></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><DashboardLayout><Settings /></DashboardLayout></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;