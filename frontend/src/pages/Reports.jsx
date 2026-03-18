import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  Download, FileText, FileSpreadsheet, TrendingUp, TrendingDown,
  Wallet, PieChart as PieIcon, BarChart3, Loader2, Receipt, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ─── Font ─────────────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    [data-reports] { font-family: 'DM Sans', sans-serif; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    [data-reports] .fade-up { animation: fadeUp 0.3s ease both; }
    [data-reports] .fade-up-1 { animation-delay: 0.05s }
    [data-reports] .fade-up-2 { animation-delay: 0.1s }
    [data-reports] .fade-up-3 { animation-delay: 0.15s }
    [data-reports] .fade-up-4 { animation-delay: 0.2s }
    [data-reports] .fade-up-5 { animation-delay: 0.25s }
  `}</style>
);

/* ─── Palette ───────────────────────────────────────────────────────────── */
const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316'];

/* ─── Custom Tooltip ────────────────────────────────────────────────────── */
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

/* ─── Pie Tooltip ────────────────────────────────────────────────────────── */
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-100 shadow-xl rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload.color || d.payload.fill }} />
        <span className="text-[12px] font-semibold text-slate-700">{d.name || d.payload.name}</span>
      </div>
      <p className="text-[14px] font-bold text-slate-900">₹{Number(d.value).toLocaleString('en-IN')}</p>
    </div>
  );
};

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color, delayClass }) => (
  <div className={`fade-up ${delayClass} bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color.bg}`}>
        <Icon className={`h-4 w-4 ${color.icon}`} />
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${color.badge}`}>
        Overall
      </span>
    </div>
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-[22px] font-bold text-slate-900 leading-tight">
      <span className="text-[14px] font-medium text-slate-400 mr-0.5">₹</span>
      {Number(value ?? 0).toLocaleString('en-IN')}
    </p>
  </div>
);

/* ─── Section Header ────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
    </div>
    <div>
      <p className="text-[13.5px] font-semibold text-slate-900">{title}</p>
      <p className="text-[11px] text-slate-400">{subtitle}</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [summaryRes, categoryRes, trendRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/category-breakdown'),
        api.get('/reports/monthly-trend'),
      ]);
      setSummary(summaryRes.data);
      setCategoryBreakdown(categoryRes.data);
      setMonthlyTrend(trendRes.data);
    } catch { toast.error('Failed to load financial data'); }
    finally { setLoading(false); }
  };

  const downloadAsPDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });
      doc.setFillColor(15, 57, 43);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24); doc.setFont('helvetica', 'bold');
      doc.text('VITTA', 20, 25);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('BUSINESS FINANCIAL REPORT', 20, 32);
      doc.text(`Generated: ${dateStr}`, 140, 32);
      doc.setTextColor(15, 57, 43);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Profit & Loss Summary', 20, 55);
      autoTable(doc, {
        startY: 60,
        head: [['Financial Metric', 'Amount (INR)']],
        body: [
          ['Total Gross Income', summary?.total_income.toLocaleString('en-IN')],
          ['Total Business Expenses', summary?.total_expense.toLocaleString('en-IN')],
          ['Net Profit/Loss', summary?.net_balance.toLocaleString('en-IN')]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 57, 43] },
        styles: { fontSize: 10, cellPadding: 8 }
      });
      const expenseData = categoryBreakdown.filter(c => c.type === 'expense').sort((a,b) => b.total - a.total).map(cat => [cat.name, cat.total.toLocaleString('en-IN'), cat.count.toString()]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [['Expense Group', 'Total Amount', 'Entry Count']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [15, 57, 43] },
        styles: { fontSize: 9, cellPadding: 5 }
      });
      doc.save(`Vitta_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported');
    } catch { toast.error('Failed to generate PDF'); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-7 w-7 text-primary/30 animate-spin" />
        <p className="text-[12px] font-medium text-slate-400">Analysing financials…</p>
      </div>
    );
  }

  const expenseCategories = [...categoryBreakdown].filter(c => c.type === 'expense').sort((a,b) => b.total - a.total);
  const topCategories = expenseCategories.slice(0, 6);
  const totalExpense = expenseCategories.reduce((s, c) => s + c.total, 0);
  const surplusRatio = summary?.total_income ? ((summary.net_balance / summary.total_income) * 100).toFixed(1) : '0.0';
  const totalTxns = categoryBreakdown.reduce((acc, c) => acc + c.count, 0);

  /* ── Custom bar shape with rounded top ── */
  const RoundedBar = (props) => {
    const { x, y, width, height, fill } = props;
    if (!height || height <= 0) return null;
    const r = 4;
    return (
      <path
        d={`M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} L${x},${y + height} Z`}
        fill={fill}
      />
    );
  };

  return (
    <div data-reports className="space-y-6 pb-20">
      <FontStyle />

      {/* ── Page Header ── */}
      <div className="fade-up fade-up-1 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[3px] h-5 bg-slate-800 rounded-full" />
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">Financial Reports</h1>
          </div>
          <p className="text-[12px] text-slate-400 font-medium ml-[18px]">Visual analysis of income and expenditures.</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-slate-900 hover:bg-black text-white h-9 px-5 rounded-lg text-[13px] font-semibold shadow-sm flex items-center gap-2">
              <Download className="h-3.5 w-3.5" />Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl border border-slate-100 shadow-xl bg-white">
            <DropdownMenuItem onClick={downloadAsPDF} className="rounded-lg py-2 px-3 cursor-pointer text-[13px] font-medium text-slate-700 flex items-center gap-2.5 hover:bg-slate-50">
              <FileText className="h-3.5 w-3.5 text-rose-400" />PDF Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Excel export coming soon')} className="rounded-lg py-2 px-3 cursor-pointer text-[13px] font-medium text-slate-700 flex items-center gap-2.5 hover:bg-slate-50">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />Excel Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Income" value={summary?.total_income} icon={TrendingUp} delayClass="fade-up-2"
          color={{ bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600' }} />
        <StatCard label="Total Expense" value={summary?.total_expense} icon={TrendingDown} delayClass="fade-up-3"
          color={{ bg: 'bg-rose-50', icon: 'text-rose-500', badge: 'bg-rose-50 text-rose-500' }} />
        <StatCard label="Net Position" value={summary?.net_balance} icon={Wallet} delayClass="fade-up-4"
          color={{ bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600' }} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 fade-up fade-up-4">

        {/* Area Chart — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <SectionHeader
            icon={BarChart3} iconBg="bg-indigo-50" iconColor="text-indigo-500"
            title="Monthly Cash Flow" subtitle="Income vs Expense trend over time"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.10} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }}
                  tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                  width={52}
                />
                <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#gIncome)" dot={false} activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#gExpense)" dot={false} activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-emerald-500 rounded" />
              <span className="text-[11.5px] font-medium text-slate-500">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-rose-500 rounded" />
              <span className="text-[11.5px] font-medium text-slate-500">Expense</span>
            </div>
          </div>
        </div>

        {/* Pie + breakdown — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <SectionHeader
            icon={PieIcon} iconBg="bg-amber-50" iconColor="text-amber-500"
            title="Expense Distribution" subtitle="By category"
          />

          {/* Donut */}
          <div className="h-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={78}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {expenseCategories.map((entry, i) => (
                    <Cell key={i} fill={entry.color || PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category list */}
          <div className="flex-1 space-y-2.5 mt-4 pt-4 border-t border-slate-50">
            {topCategories.map((cat, i) => {
              const pct = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0;
              const color = cat.color || PALETTE[i % PALETTE.length];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[12px] font-medium text-slate-700 truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{pct}%</span>
                      <span className="text-[12px] font-semibold text-slate-900">₹{cat.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
            {expenseCategories.length > 6 && (
              <p className="text-[11px] text-slate-400 text-center pt-1">+{expenseCategories.length - 6} more categories</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bar Chart — Monthly comparison ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 fade-up fade-up-5">
        <SectionHeader
          icon={BarChart3} iconBg="bg-blue-50" iconColor="text-blue-500"
          title="Income vs Expense — Bar View" subtitle="Side-by-side monthly comparison"
        />
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} barCategoryGap="32%" barGap={4} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }}
                dy={8}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500, fontFamily: 'DM Sans' }}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                width={52}
              />
              <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-2.5 bg-emerald-500 rounded-sm" />
            <span className="text-[11.5px] font-medium text-slate-500">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2.5 bg-rose-400 rounded-sm" />
            <span className="text-[11.5px] font-medium text-slate-500">Expense</span>
          </div>
        </div>
      </div>

      {/* ── Summary Footer ── */}
      <div className="fade-up fade-up-5 bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[90px] -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-white/8 rounded-xl border border-white/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white/60" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white leading-tight">Executive Summary</p>
              <p className="text-[12px] text-white/40 mt-0.5">Auto-generated performance snapshot</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/6 border border-white/10 rounded-xl px-5 py-3.5 text-center min-w-[110px]">
              <p className="text-[9.5px] font-semibold text-white/40 uppercase tracking-wider mb-1">Surplus Ratio</p>
              <p className="text-[20px] font-bold text-white leading-none">{surplusRatio}<span className="text-[13px] font-medium text-white/50 ml-0.5">%</span></p>
            </div>
            <div className="bg-white/6 border border-white/10 rounded-xl px-5 py-3.5 text-center min-w-[110px]">
              <p className="text-[9.5px] font-semibold text-white/40 uppercase tracking-wider mb-1">Transactions</p>
              <p className="text-[20px] font-bold text-white leading-none">{totalTxns}</p>
            </div>
            <div className="bg-white/6 border border-white/10 rounded-xl px-5 py-3.5 text-center min-w-[110px]">
              <p className="text-[9.5px] font-semibold text-white/40 uppercase tracking-wider mb-1">Categories</p>
              <p className="text-[20px] font-bold text-white leading-none">{expenseCategories.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;