import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/App.css';
import { UACProvider, useUAC } from '@/lib/UACContext';
import DevMode from '@/pages/DevMode';

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
import AddTransactions from '@/pages/AddTransactions';
import Transactions from '@/pages/Transactions';
import Reports from '@/pages/Reports';
import Categories from '@/pages/Categories';
import Items from '@/pages/Items';
import Accounts from '@/pages/Accounts';
import Clients from '@/pages/Clients';
import Settings from '@/pages/Settings';
import ErrorPage from '@/pages/ErrorPage';
import Invoices from '@/pages/Invoices';
import CreateInvoice from '@/pages/CreateInvoice';
import InvoiceDetail from '@/pages/InvoiceDetail';
import AuditLogs from '@/pages/AuditLogs';
import AutomationRules from '@/pages/AutomationRules';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" />;
};

const PublicRoute = () => {
  const token = localStorage.getItem('token');
  return !token ? <Outlet /> : <Navigate to="/dashboard" />;
};

const FeatureGuard = ({ feature, children }) => {
  const { isEnabled, loading } = useUAC();
  const location = useLocation();
  
  if (loading) return null; // Or a sleek loader
  
  // If the feature is disabled (specifically False in DB), redirect to dashboard
  if (!isEnabled(feature) && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/how-it-works",
    element: <HowItWorks />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/faq",
    element: <FAQ />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <AuthPage /> },
      { path: "/signup", element: <AuthPage /> },
    ]
  },
  {
    element: <PrivateRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <DashboardLayout><Outlet /></DashboardLayout>,
        children: [
          { path: "/dashboard", element: <FeatureGuard feature="dashboard"><Dashboard /></FeatureGuard> },
          { path: "/import", element: <FeatureGuard feature="transactions"><AddTransactions /></FeatureGuard> },
          { path: "/transactions", element: <FeatureGuard feature="transactions"><Transactions /></FeatureGuard> },
          { path: "/reports", element: <FeatureGuard feature="reports"><Reports /></FeatureGuard> },
          { path: "/categories", element: <Categories /> },
          { path: "/items", element: <FeatureGuard feature="invoices"><Items /></FeatureGuard> },
          { path: "/accounts", element: <FeatureGuard feature="accounts"><Accounts /></FeatureGuard> },
          { path: "/clients", element: <FeatureGuard feature="clients"><Clients /></FeatureGuard> },
          { path: "/settings", element: <FeatureGuard feature="settings"><Settings /></FeatureGuard> },
          { path: "/invoices", element: <FeatureGuard feature="invoices"><Invoices /></FeatureGuard> },
          { path: "/invoices/new", element: <FeatureGuard feature="invoices"><CreateInvoice /></FeatureGuard> },
          { path: "/invoices/:id", element: <FeatureGuard feature="invoices"><InvoiceDetail /></FeatureGuard> },
          { path: "/invoices/:id/edit", element: <FeatureGuard feature="invoices"><CreateInvoice /></FeatureGuard> },
          { path: "/audit", element: <FeatureGuard feature="audit_trail"><AuditLogs /></FeatureGuard> },
          { path: "/automation", element: <FeatureGuard feature="automation"><AutomationRules /></FeatureGuard> },
          { path: "/devmode", element: <DevMode /> },
        ]
      }
    ]
  }
]);

function App() {
  return (
    <div className="App">
      <UACProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </TooltipProvider>
      </UACProvider>
    </div>
  );
}

export default App;