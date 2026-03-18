import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Upload, CreditCard, BarChart3, Tag, Wallet, Settings, LogOut, Menu,
  PlusCircle, Building2, Plus, UserPlus, FileUp, PenLine
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "./ui/tooltip";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/* ─── Font ─────────────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    [data-layout] { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

/* ─── Nav Items ─────────────────────────────────────────────────────────── */
const menuItems = [
  { path: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',        testId: 'menu-dashboard' },
  { path: '/clients',      icon: Building2,       label: 'Clients',          testId: 'menu-clients' },
  { path: '/accounts',     icon: Wallet,           label: 'Accounts',         testId: 'menu-accounts' },
  { path: '/transactions', icon: CreditCard,       label: 'Transactions',     testId: 'menu-transactions' },
  { path: '/import',       icon: PlusCircle,       label: 'Add Transactions', testId: 'menu-import' },
  { path: '/reports',      icon: BarChart3,        label: 'Reports',          testId: 'menu-reports' },
  { path: '/categories',   icon: Tag,              label: 'Groups',           testId: 'menu-categories' },
  { path: '/settings',     icon: Settings,         label: 'Settings',         testId: 'menu-settings' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const DashboardLayout = ({ children }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const currentPage = menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div data-layout className="flex h-screen bg-slate-50 overflow-hidden">
      <FontStyle />

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-60
        bg-white border-r border-slate-100
        flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="h-14 border-b border-slate-100 flex items-center px-5 flex-shrink-0">
          <Link to="/dashboard" className="group flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-bold text-[15px] leading-none">V</span>
            </div>
            <span className="text-[17px] font-bold text-slate-900 tracking-tight">
              Vitta<span className="text-primary">.</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={item.testId}
                onClick={() => setSidebarOpen(false)}
                className={`
                  relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium
                  transition-colors duration-150 group
                  ${isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                {/* Animated background for active */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-bg"
                    className="absolute inset-0 bg-primary rounded-lg z-0"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <item.icon className={`h-4 w-4 flex-shrink-0 relative z-10 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user.name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center justify-center gap-2 h-9 rounded-lg text-[12.5px] font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 lg:px-7 z-30 sticky top-0 flex-shrink-0">

          {/* Mobile menu toggle */}
          <button
            data-testid="mobile-sidebar-toggle"
            className="lg:hidden mr-3 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>

          {/* Page title */}
          <p className="text-[15px] font-semibold text-slate-900">{currentPage}</p>

          {/* Right: quick actions */}
          <div className="ml-auto flex items-center gap-1">
            <TooltipProvider delayDuration={0}>

              {/* Add Client */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate('/clients', { state: { openAdd: true } })}
                    className="hidden xl:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] font-medium bg-slate-900 text-white border-none px-2.5 py-1.5">
                  Add Client
                </TooltipContent>
              </Tooltip>

              {/* Add Account */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate('/accounts', { state: { openAdd: true } })}
                    className="hidden xl:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Wallet className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] font-medium bg-slate-900 text-white border-none px-2.5 py-1.5">
                  Add Account
                </TooltipContent>
              </Tooltip>

              {/* Add Transaction dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-primary text-white text-[12.5px] font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-[11px] font-medium bg-slate-900 text-white border-none px-2.5 py-1.5">
                    Add Transaction
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border border-slate-100 shadow-xl bg-white z-[100]">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Add Transaction</p>
                  </div>

                  <DropdownMenuItem
                    onClick={() => navigate('/import', { state: { activeTab: 'manual' } })}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <PenLine className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Manual Entry</p>
                      <p className="text-[11px] text-slate-400">Type a single transaction</p>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/import', { state: { activeTab: 'csv' } })}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <FileUp className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">CSV / Excel</p>
                      <p className="text-[11px] text-slate-400">Import from spreadsheet</p>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/import', { state: { activeTab: 'pdf' } })}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Upload className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">PDF Statement</p>
                      <p className="text-[11px] text-slate-400">Parse from bank PDF</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </TooltipProvider>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;