import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Upload, CreditCard, BarChart3, Tag, Wallet, Settings, LogOut, Menu, 
  PlusCircle, Info, Building2, Plus, ChevronDown, UserPlus, FileUp, FileDigit, PenLine, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import UTooltip from '@/components/UTooltip';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', testId: 'menu-dashboard' },
    { path: '/clients', icon: Building2, label: 'Clients', testId: 'menu-clients' },
    { path: '/accounts', icon: Wallet, label: 'Accounts', testId: 'menu-accounts' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions', testId: 'menu-transactions' },
    { path: '/import', icon: PlusCircle, label: 'Add Transactions', testId: 'menu-import' },
    { path: '/reports', icon: BarChart3, label: 'Reports', testId: 'menu-reports' },
    { path: '/categories', icon: Tag, label: 'Groups', testId: 'menu-categories' },
    { path: '/settings', icon: Settings, label: 'Settings', testId: 'menu-settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F2F5F3] overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 border-b border-slate-50 flex items-center px-8">
            <Link to="/dashboard" className="group flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <span className="text-white font-black text-xl leading-none transform -translate-y-[0.5px]">V</span>
              </div>
              <span className="font-heading font-black text-2xl text-slate-900 tracking-tighter">Vitta<span className="text-accent">.</span></span>
            </Link>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={item.testId}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-500 group relative ${
                    isActive
                      ? 'text-white translate-x-1 shadow-2xl overflow-hidden'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-primary z-0" 
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={`h-5 w-5 relative z-10 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary group-hover:scale-110 transition-transform'}`} />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-indicator"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-accent z-10 shadow-[0_0_10px_rgba(200,233,71,0.5)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-slate-50 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <span className="text-white font-black text-lg">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{user.email?.split('@')[0]}</p>
              </div>
            </div>
            <Button
              data-testid="logout-button"
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-rose-50 hover:text-rose-600 group transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform" />
              Logout Agent
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 lg:px-10 z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <button
            data-testid="mobile-sidebar-toggle"
            className="lg:hidden mr-4 p-2 hover:bg-slate-50 rounded-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6 text-slate-700" />
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-black text-slate-900 tracking-tight">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
            {/* Quick Actions Desktop */}
            <div className="hidden xl:flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100 mr-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/clients', { state: { openAdd: true } })}
                className="text-slate-600 hover:text-primary font-bold text-[11px] h-9 rounded-lg"
              >
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Add Client
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/accounts', { state: { openAdd: true } })}
                className="text-slate-600 hover:text-primary font-bold text-[11px] h-9 rounded-lg"
              >
                <Wallet className="h-3.5 w-3.5 mr-2" />
                Add Account
              </Button>
            </div>

            {/* Main Action Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-11 rounded-xl px-6 bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Entry
                  <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-[24px] border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-1">
                <div className="p-3 mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Methods</p>
                  <p className="text-xs text-slate-500 font-medium">Choose how to add record</p>
                </div>
                
                <DropdownMenuItem 
                  onClick={() => navigate('/import', { state: { activeTab: 'manual' } })} 
                  className="rounded-xl py-3 px-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                >
                  <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <PenLine className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900">Direct Entry</span>
                    <span className="text-[10px] text-slate-400 font-medium">Simple single transaction</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => navigate('/import', { state: { activeTab: 'csv' } })} 
                  className="rounded-xl py-3 px-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                >
                  <div className="h-8 w-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mr-3">
                    <FileUp className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900">Smart Batch</span>
                    <span className="text-[10px] text-slate-400 font-medium">CSV/Excel files supported</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => navigate('/import', { state: { activeTab: 'pdf' } })} 
                  className="rounded-xl py-3 px-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                >
                  <div className="h-8 w-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3">
                    <FileDigit className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900">Import Statement</span>
                    <span className="text-[10px] text-slate-400 font-medium">Scan banking PDFs</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-slate-100" />

                <DropdownMenuItem 
                  onClick={() => navigate('/import', { state: { activeTab: 'template' } })} 
                  className="rounded-xl py-3 px-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                >
                  <div className="h-8 w-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mr-3">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900">Use Template</span>
                    <span className="text-[10px] text-slate-400 font-medium">Official Vitta format</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;