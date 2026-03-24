import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight,
  PlusCircle, LayoutDashboard, CreditCard, History,
  ArrowRight, Building2, ChevronRight,
  PieChart as PieIcon, BarChart3, Receipt,
  PenLine, FileSpreadsheet, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';

/* ─── Font ─────────────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    [data-dashboard] { font-family: 'DM Sans', sans-serif; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    [data-dashboard] .anim { animation: fadeUp 0.28s ease both; }
    [data-dashboard] .anim-1 { animation-delay: 0.04s }
    [data-dashboard] .anim-2 { animation-delay: 0.08s }
    [data-dashboard] .anim-3 { animation-delay: 0.12s }
    [data-dashboard] .anim-4 { animation-delay: 0.16s }
    [data-dashboard] .anim-5 { animation-delay: 0.20s }
    [data-dashboard] .anim-6 { animation-delay: 0.24s }
  `}</style>
);

/* ─── Palette ───────────────────────────────────────────────────────────── */
const INCOME_COLOR  = '#10b981';
const EXPENSE_COLOR = '#f43f5e';
const PIE_PALETTE   = ['#6366f1','#10b981','#f59e0b','#f43f5e','#3b82f6','#8b5cf6'];

/* ─── Chart Tooltip ─────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 shadow-xl rounded-xl px-4 py-3 min-w-[160px]">
      {label && <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">{label}</p>}
      {payload.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-5 mb-1 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[12px] font-medium text-slate-600">{item.name}</span>
          </div>
          <span className="text-[12px] font-bold text-slate-900">₹{Number(item.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Section Header ────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-[13.5px] font-semibold text-slate-900 leading-tight">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_balance: 0, transaction_count: 0 });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, trendRes, accountsRes, breakdownRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/monthly-trend'),
        api.get('/accounts'),
        api.get('/reports/category-breakdown'),
      ]);
      setSummary(summaryRes.data);
      setMonthlyTrend(trendRes.data);
      setAccounts(accountsRes.data);
      setCategoryBreakdown(breakdownRes.data);
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-7 w-7 text-primary/30 animate-spin" />
        <p className="text-[12px] font-medium text-slate-400">Loading dashboard…</p>
      </div>
    );
  }

  const totalPortfolio = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const stats = [
    { label: 'Total Income',   value: summary.total_income,   icon: TrendingUp,   badge: 'Income',  badgeColor: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', path: '/transactions' },
    { label: 'Total Expense',  value: summary.total_expense,  icon: TrendingDown,  badge: 'Expense', badgeColor: 'bg-rose-50 text-rose-500',      iconBg: 'bg-rose-50',    iconColor: 'text-rose-500', path: '/transactions' },
    { label: 'Net Balance',    value: summary.net_balance,    icon: Wallet,        badge: summary.net_balance >= 0 ? 'Profit' : 'Deficit', badgeColor: summary.net_balance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', path: '/reports' },
    { label: 'Transactions',   value: summary.transaction_count ?? 0, icon: Receipt, badge: 'All time', badgeColor: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', isCount: true, path: '/transactions' },
  ];

  /* Process category breakdown for Expense Mix */
  const expenseBreakdown = categoryBreakdown
    .filter(cat => cat.type === 'expense')
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const morphologyData = expenseBreakdown.length > 0 
    ? expenseBreakdown.map(cat => ({ name: cat.name, value: cat.total, color: cat.color }))
    : [
        { name: 'No Expenses', value: 1, color: '#f1f5f9' }
      ];

  return (
    <div data-dashboard className="space-y-6 pb-24">
      <FontStyle />

      {/* ── Page Header ── */}
      <div className="anim anim-1 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[3px] h-5 bg-slate-800 rounded-full" />
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">Dashboard</h1>
          </div>
          <p className="text-[12px] text-slate-400 font-medium ml-[18px]">Financial overview across all accounts.</p>
        </div>

        {/* Portfolio pill */}
        <div className="flex items-center gap-4 bg-white pl-5 pr-2 py-2 rounded-xl border border-slate-100 shadow-sm">
          <div>
            <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Portfolio Value</p>
            <p className="text-[18px] font-bold text-slate-900 leading-tight">
              <span className="text-[13px] font-medium text-slate-400 mr-0.5">₹</span>
              {totalPortfolio.toLocaleString('en-IN')}
            </p>
          </div>
          <Button onClick={() => navigate('/transactions')} className="bg-slate-900 hover:bg-black text-white h-9 px-5 rounded-lg text-[13px] font-semibold shadow-sm">
            View Ledger
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => stat.path && navigate(stat.path)}
            className={`anim anim-${i + 2} bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5 hover:shadow-md hover:border-slate-200 transition-all ${stat.path ? 'cursor-pointer active:scale-[0.98]' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            {stat.isCount ? (
              <p className="text-[22px] font-bold text-slate-900 leading-tight">{Number(stat.value).toLocaleString('en-IN')}</p>
            ) : (
              <p className="text-[22px] font-bold text-slate-900 leading-tight">
                <span className="text-[14px] font-medium text-slate-400 mr-0.5">₹</span>
                {Number(stat.value).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ── Left: Charts ── */}
        <div className="xl:col-span-8 space-y-5">

          {/* Area Chart */}
          <div className="anim anim-3 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <SectionHeader
              icon={BarChart3} iconBg="bg-indigo-50" iconColor="text-indigo-500"
              title="Monthly Cash Flow" subtitle="Income vs Expense over time"
              action={
                <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                    <span className="text-[11px] font-medium text-slate-500">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-rose-500 rounded" />
                    <span className="text-[11px] font-medium text-slate-500">Expense</span>
                  </div>
                </div>
              }
            />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={INCOME_COLOR}  stopOpacity={0.12} />
                      <stop offset="95%" stopColor={INCOME_COLOR}  stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={EXPENSE_COLOR} stopOpacity={0.10} />
                      <stop offset="95%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} dy={8}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }} />
                  <YAxis axisLine={false} tickLine={false} width={52}
                    tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                  <Area type="monotone" name="Income"  dataKey="income"  stroke={INCOME_COLOR}  strokeWidth={2.5} fill="url(#dIncome)"  dot={false} activeDot={{ r: 4, fill: INCOME_COLOR,  strokeWidth: 0 }} />
                  <Area type="monotone" name="Expense" dataKey="expense" stroke={EXPENSE_COLOR} strokeWidth={2.5} fill="url(#dExpense)" dot={false} activeDot={{ r: 4, fill: EXPENSE_COLOR, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar + Pie row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Bar chart */}
            <div className="anim anim-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <SectionHeader
                icon={BarChart3} iconBg="bg-slate-100" iconColor="text-slate-600"
                title="Last 6 Months" subtitle="Income vs Expense"
              />
              <div className="h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend.slice(-6)} barCategoryGap="30%" barGap={3} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} dy={6}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }} />
                    <YAxis axisLine={false} tickLine={false} width={44}
                      tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar name="Income"  dataKey="income"  fill={INCOME_COLOR}  radius={[4,4,0,0]} maxBarSize={22} />
                    <Bar name="Expense" dataKey="expense" fill={EXPENSE_COLOR} radius={[4,4,0,0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart */}
            <div className="anim anim-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <SectionHeader
                icon={PieIcon} iconBg="bg-amber-50" iconColor="text-amber-500"
                title="Expense Mix" subtitle="Category breakdown"
              />
              <div className="flex items-center gap-4">
                <div className="h-[190px] flex-shrink-0" style={{ width: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={morphologyData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {morphologyData.map((item, i) => (
                          <Cell key={i} fill={item.color || PIE_PALETTE[i % PIE_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5">
                  {morphologyData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || PIE_PALETTE[i % PIE_PALETTE.length] }} />
                        <span className="text-[11.5px] font-medium text-slate-600 truncate">{item.name}</span>
                      </div>
                      <span className="text-[11.5px] font-semibold text-slate-800 flex-shrink-0">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="xl:col-span-4 space-y-5">

          {/* Accounts panel */}
          <div className="anim anim-4 bg-slate-900 rounded-xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Connected Accounts</p>
                  <p className="text-[16px] font-bold text-white leading-tight">Bank Ledgers</p>
                </div>
                <div className="h-8 w-8 bg-white/8 rounded-lg border border-white/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white/50" />
                </div>
              </div>

              <div className="space-y-2">
                {accounts.length > 0 ? accounts.slice(0, 5).map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => navigate('/accounts')}
                    className="flex items-center justify-between px-3 py-2.5 bg-white/6 hover:bg-white/10 rounded-lg border border-white/[0.06] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-primary/80 transition-colors">
                        <Building2 className="h-3.5 w-3.5 text-white/60 group-hover:text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-white leading-tight truncate">{acc.account_name}</p>
                        <p className="text-[10px] text-white/30 font-medium">{acc.bank_name || '—'}</p>
                      </div>
                    </div>
                    <p className="text-[12.5px] font-bold text-white flex-shrink-0 ml-2">
                      ₹{(acc.balance || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                )) : (
                  <div className="py-8 text-center border border-dashed border-white/10 rounded-lg">
                    <p className="text-[12px] font-medium text-white/30">No accounts yet</p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => navigate('/accounts')}
                className="mt-5 w-full h-9 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-[13px] font-semibold shadow-sm transition-all"
              >
                View All Accounts
              </Button>
            </div>
          </div>

          {/* Reports CTA */}
          <div
            className="anim anim-5 bg-[#10b981] text-white p-5 rounded-xl relative overflow-hidden cursor-pointer hover:bg-[#0da271] transition-colors group"
            onClick={() => navigate('/reports')}
          >
            <Receipt className="absolute bottom-4 right-4 h-12 w-12 text-white/15 -rotate-12 group-hover:scale-110 transition-transform duration-300" />
            <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">Analytics</p>
            <h4 className="text-[16px] font-bold text-white mb-1 leading-tight">Financial Reports</h4>
            <p className="text-[12px] text-white/70 font-medium mb-4 leading-relaxed max-w-[200px]">
              View income trends, expense breakdowns and export statements.
            </p>
            <Button onClick={(e) => { e.stopPropagation(); navigate('/reports'); }}
              className="bg-slate-900 text-white hover:bg-black text-[12.5px] font-semibold px-5 h-8 rounded-lg shadow-sm border-none">
              Open Reports
            </Button>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="anim anim-6 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <LayoutDashboard className="h-4 w-4 text-slate-400" />
              <p className="text-[14px] font-semibold text-slate-900">Add Transactions</p>
            </div>
            <p className="text-[12px] text-slate-400 ml-6">Choose how you want to enter data.</p>
          </div>
          <Button onClick={() => navigate('/import')} className="bg-slate-900 hover:bg-black text-white h-9 px-5 rounded-lg text-[13px] font-semibold shadow-sm">
            Add Transaction
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Manual Entry',    desc: 'Type in a single transaction directly.',   icon: PenLine,       iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',   tab: 'manual' },
            { label: 'CSV / Excel',     desc: 'Import from spreadsheet or bank export.',  icon: FileSpreadsheet, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',tab: 'csv' },
            { label: 'PDF Statement',   desc: 'Parse transactions from a bank PDF.',       icon: Receipt,       iconBg: 'bg-orange-50',  iconColor: 'text-orange-500', tab: 'pdf' },
          ].map((action, i) => (
            <div
              key={i}
              onClick={() => navigate('/import', { state: { activeTab: action.tab } })}
              className="flex items-center gap-4 p-4 bg-slate-50/60 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className={`h-10 w-10 flex-shrink-0 ${action.iconBg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <action.icon className={`h-4.5 w-4.5 ${action.iconColor}`} style={{ height: '18px', width: '18px' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-slate-900 leading-tight">{action.label}</p>
                <p className="text-[11.5px] text-slate-400 font-medium mt-0.5 leading-snug">{action.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0 ml-auto group-hover:text-slate-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;