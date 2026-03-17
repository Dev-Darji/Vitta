import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, Upload, 
  PlusCircle, LayoutDashboard, CreditCard, Users, History,
  ArrowRight, Globe, Sparkles, Building2, ChevronRight,
  PieChart as PieIcon, BarChart3, Receipt,
  PenLine,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
    transaction_count: 0,
  });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, trendRes, accountsRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/monthly-trend'),
        api.get('/accounts'),
      ]);
      
      setSummary(summaryRes.data);
      setMonthlyTrend(trendRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Preparing Intelligence...</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Gross Revenue',
      value: `₹${summary.total_income.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'green',
      trend: '+12.5%',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      label: 'Business Expenses',
      value: `₹${summary.total_expense.toLocaleString('en-IN')}`,
      icon: TrendingDown,
      color: 'red',
      trend: '+4.2%',
      gradient: 'from-rose-500/10 to-orange-500/10',
      iconBg: 'bg-rose-50 text-rose-600'
    },
    {
      label: 'Net Positioning',
      value: `₹${summary.net_balance.toLocaleString('en-IN')}`,
      icon: Wallet,
      color: 'blue',
      trend: 'Optimized',
      gradient: 'from-blue-500/10 to-indigo-500/10',
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      label: 'Ledger Records',
      value: summary.transaction_count,
      icon: History,
      color: 'primary',
      trend: 'Live',
      gradient: 'from-primary/10 to-accent/10',
      iconBg: 'bg-primary/10 text-primary'
    }
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Online</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Financial Briefroom <Sparkles className="h-6 w-6 text-accent fill-accent" />
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Real-time intelligence for your business architecture.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block mr-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Balance</p>
            <p className="text-xl font-black text-slate-900 leading-none">
              ₹{accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString('en-IN')}
            </p>
          </div>
          <Button onClick={() => navigate('/transactions')} variant="outline" className="rounded-2xl h-14 px-6 border-slate-200 font-bold hover:bg-slate-50 transition-all border-2">
            Full Ledger <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className={`relative group bg-white rounded-[32px] p-8 border-2 border-slate-50 hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-2xl overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl`} />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 ${stat.iconBg} rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 px-3 py-1 bg-slate-50 rounded-full">{stat.trend}</span>
              </div>
              <p className="text-sm font-bold text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Visualization */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="lg:col-span-8 bg-white rounded-[40px] p-10 border-2 border-slate-50 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Revenue vs Expense Curve
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Monthly Financial Projection</p>
            </div>
            <div className="flex items-center gap-6 p-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 px-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Input</span>
              </div>
              <div className="flex items-center gap-2 px-3 border-l border-slate-200">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Burn</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dx={-10}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                    padding: '20px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Banking Integration Panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="lg:col-span-4 flex flex-col gap-6"
        >
          <div className="bg-slate-900 text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden flex-1">
             <Globe className="absolute -top-10 -right-10 h-40 w-40 text-white/5" />
             <div className="relative z-10 flex flex-col h-full">
               <div className="mb-6">
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Connected Entities</p>
                 <h3 className="text-2xl font-black tracking-tight leading-tight italic">Portfolio Velocity</h3>
               </div>
               
               <div className="flex-1 space-y-4">
                 {accounts.slice(0, 4).map((acc, i) => (
                   <div key={acc.id} className="group p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer">
                     <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-white leading-none mb-1">{acc.account_name}</p>
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{acc.bank_name}</p>
                         </div>
                       </div>
                       <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
                     </div>
                   </div>
                 ))}
                 
                 {accounts.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                     <p className="text-white/40 text-sm font-medium mb-6">No accounts detected in the current cloud.</p>
                     <Button onClick={() => navigate('/accounts')} className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl">Initialize First Account</Button>
                   </div>
                 )}
               </div>

               <Button 
                onClick={() => navigate('/accounts')}
                variant="ghost" 
                className="mt-6 w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[11px] border-none"
               >
                 View All Assets
               </Button>
             </div>
          </div>
          
          <div className="bg-primary text-white p-8 rounded-[40px] relative overflow-hidden group">
            <Sparkles className="absolute bottom-4 right-4 h-20 w-20 text-white/10 rotate-12 group-hover:scale-125 transition-transform duration-700" />
            <h4 className="text-lg font-black tracking-tight mb-2">Growth Analytics</h4>
            <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">Automated insights are available for your monthly closing report.</p>
            <Button onClick={() => navigate('/reports')} className="bg-white text-primary hover:bg-white/90 font-black rounded-xl h-12 shadow-2xl">
              Access Intelligence
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Audit Log / Recent Action Preview */}
      <div className="bg-white rounded-[40px] border-2 border-slate-50 p-10 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent Control Actions
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Direct from the Vitta Ledger Engine</p>
            </div>
            <Button onClick={() => navigate('/import')} className="bg-slate-900 hover:bg-black text-white rounded-2xl h-12 px-6 font-bold shadow-xl shadow-slate-200">
               Post New Entry
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-10 bg-slate-50/50 rounded-[32px] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
               <div className="h-16 w-16 bg-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <PenLine className="h-8 w-8" />
               </div>
               <h4 className="text-lg font-black text-slate-900 mb-2">Instant Record</h4>
               <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">Manually authorize a single transaction in seconds.</p>
               <Button onClick={() => navigate('/import', { state: { activeTab: 'manual' } })} variant="outline" className="rounded-xl font-bold h-10 border-slate-200">Execute</Button>
            </div>

            <div className="p-10 bg-slate-50/50 rounded-[32px] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
               <div className="h-16 w-16 bg-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <FileSpreadsheet className="h-8 w-8" />
               </div>
               <h4 className="text-lg font-black text-slate-900 mb-2">Mass Processing</h4>
               <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">Sync hundreds of records via secure CSV architecture.</p>
               <Button onClick={() => navigate('/import', { state: { activeTab: 'csv' } })} variant="outline" className="rounded-xl font-bold h-10 border-slate-200">Execute</Button>
            </div>

            <div className="p-10 bg-slate-50/50 rounded-[32px] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
               <div className="h-16 w-16 bg-orange-100/50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Receipt className="h-8 w-8" />
               </div>
               <h4 className="text-lg font-black text-slate-900 mb-2">Deep Statement Scan</h4>
               <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">Convert complex banking PDFs into verified ledger data.</p>
               <Button onClick={() => navigate('/import', { state: { activeTab: 'pdf' } })} variant="outline" className="rounded-xl font-bold h-10 border-slate-200">Execute</Button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;