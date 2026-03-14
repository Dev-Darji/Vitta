import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
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
import AddTransactions from '@/pages/AddTransactions';
import Transactions from '@/pages/Transactions';
import Reports from '@/pages/Reports';
import Categories from '@/pages/Categories';
import Accounts from '@/pages/Accounts';
import Settings from '@/pages/Settings';
import ErrorPage from '@/pages/ErrorPage';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" />;
};

const PublicRoute = () => {
  const token = localStorage.getItem('token');
  return !token ? <Outlet /> : <Navigate to="/dashboard" />;
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
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/import", element: <AddTransactions /> },
          { path: "/transactions", element: <Transactions /> },
          { path: "/reports", element: <Reports /> },
          { path: "/categories", element: <Categories /> },
          { path: "/accounts", element: <Accounts /> },
          { path: "/settings", element: <Settings /> },
        ]
      }
    ]
  }
]);

function App() {
  return (
    <div className="App">
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;