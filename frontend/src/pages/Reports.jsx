import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  Download, FileText, FileSpreadsheet, TrendingUp, TrendingDown,
  Wallet, PieChart as PieIcon, BarChart3, Loader2, Receipt, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ─── Font & Styling ─────────────────────────────────────────────────────── */
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

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316'];

/* ─── Sub-Components ────────────────────────────────────────────────────── */
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

const StatCard = ({ label, value, icon: Icon, color, delayClass }) => (
  <div className={`fade-up ${delayClass} bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color.bg}`}>
        <Icon className={`h-4 w-4 ${color.icon}`} />
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${color.badge}`}>Overall</span>
    </div>
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-[22px] font-bold text-slate-900 leading-tight">
      <span className="text-[14px] font-medium text-slate-400 mr-0.5">₹</span>
      {Number(value ?? 0).toLocaleString('en-IN')}
    </p>
  </div>
);

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

const Loader = () => (
  <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
    <Loader2 className="h-7 w-7 text-primary/30 animate-spin" />
    <p className="text-[12px] font-medium text-slate-400 font-bold uppercase tracking-widest">Analysing financials…</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Reports = () => {
  const [activeTab, setActiveTab] = useState('pnl');
  const [loading, setLoading] = useState(true);

  // P&L State
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // Balance Sheet State
  const [bsData, setBsData] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [bsLoading, setBsLoading] = useState(false);

  // Cash Flow State
  const [cfData, setCfData] = useState(null);
  const [cfDates, setCfDates] = useState({ 
    from: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0],
    to: new Date(new Date().getFullYear() + 1, 2, 31).toISOString().split('T')[0]
  });
  const [cfLoading, setCfLoading] = useState(false);

  // GST State
  const [gstData, setGstData] = useState(null);
  const [gstPeriod, setGstPeriod] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });
  const [gstLoading, setGstLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'pnl') fetchReports();
    if (activeTab === 'balance-sheet') fetchBS();
    if (activeTab === 'cash-flow') fetchCF();
    if (activeTab === 'gst') fetchGST();
  }, [activeTab]);

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

  const fetchBS = async () => {
    setBsLoading(true);
    try {
      const formattedDate = asOfDate.split('-').reverse().join('-');
      const res = await api.get(`/reports/balance-sheet?as_of_date=${formattedDate}`);
      setBsData(res.data);
    } catch { toast.error('Failed to load balance sheet'); }
    finally { setBsLoading(false); }
  };

  const fetchCF = async () => {
    setCfLoading(true);
    try {
      const df = cfDates.from.split('-').reverse().join('-');
      const dt = cfDates.to.split('-').reverse().join('-');
      const res = await api.get(`/reports/cash-flow?date_from=${df}&date_to=${dt}`);
      setCfData(res.data);
    } catch { toast.error('Failed to load cash flow statement'); }
    finally { setCfLoading(false); }
  };

  const fetchGST = async () => {
    setGstLoading(true);
    try {
      const res = await api.get(`/reports/gst-summary?month=${gstPeriod.month}&year=${gstPeriod.year}`);
      setGstData(res.data);
    } catch { toast.error('Failed to load GST summary'); }
    finally { setGstLoading(false); }
  };

  const downloadAsPDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });
      doc.setFillColor(15, 57, 43); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont('helvetica', 'bold');
      doc.text('VITTA', 20, 25);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('FINANCIAL INTELLIGENCE REPORT', 20, 32);
      doc.text(`Generated: ${dateStr}`, 140, 32);
      
      doc.setTextColor(15, 57, 43); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      
      if (activeTab === 'pnl') {
        doc.text('Profit & Loss Statement', 20, 55);
        autoTable(doc, {
          startY: 60,
          head: [['Financial Metric', 'Amount (INR)']],
          body: [
            ['Total Gross Income', summary?.total_income.toLocaleString('en-IN')],
            ['Total Business Expenses', summary?.total_expense.toLocaleString('en-IN')],
            ['Net Profit/Loss', summary?.net_balance.toLocaleString('en-IN')]
          ],
          theme: 'striped', headStyles: { fillColor: [15, 57, 43] }
        });
      } else if (activeTab === 'balance-sheet') {
        doc.text(`Balance Sheet — as of ${bsData?.as_of_date}`, 20, 55);
        autoTable(doc, {
          startY: 60, head: [['Classification', 'Account Name', 'Balance (INR)']],
          body: [
            ...bsData.assets.current_assets.bank_accounts.map(acc => ['Asset (Bank)', acc.name, acc.balance.toLocaleString('en-IN')]),
            ...bsData.liabilities.current_liabilities.credit_cards.map(acc => ['Liability (Card)', acc.name, Math.abs(acc.balance).toLocaleString('en-IN')]),
            ['Equity', 'Retained Earnings', bsData.equity.total_equity.toLocaleString('en-IN')]
          ],
          theme: 'grid', headStyles: { fillColor: [15, 57, 43] }
        });
      }
      doc.save(`Vitta_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report exported successfully');
    } catch { toast.error('Failed to generate PDF'); }
  };

  return (
    <div data-reports className="space-y-6 pb-20">
      <FontStyle />

      {/* Header */}
      <div className="fade-up fade-up-1 flex flex-col md:flex-row justify-between items-end gap-6 mb-2 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Intelligence</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Advanced Analytics & Performance Reports</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-slate-900 hover:bg-black text-white h-9 px-6 rounded-lg text-[13px] font-bold shadow-lg shadow-slate-200 flex items-center gap-2 transition-all">
              <Download className="h-3.5 w-3.5" />Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-slate-100 shadow-xl bg-white">
            <DropdownMenuItem onClick={downloadAsPDF} className="rounded-lg py-2.5 px-3 cursor-pointer text-[13px] font-bold text-slate-700 flex items-center gap-2.5 hover:bg-slate-50 transition-colors">
              <FileText className="h-4 w-4 text-rose-500" />Detailed PDF Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Excel export coming soon')} className="rounded-lg py-2.5 px-3 cursor-pointer text-[13px] font-bold text-slate-700 flex items-center gap-2.5 hover:bg-slate-50 transition-colors">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />Excel Statement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/60 p-1.5 rounded-xl h-auto flex flex-wrap max-w-lg mb-8">
          <TabsTrigger value="pnl" className="flex-1 py-2 px-4 text-[12.5px] font-extrabold rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-950 uppercase tracking-wide">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex-1 py-2 px-4 text-[12.5px] font-extrabold rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-950 uppercase tracking-wide">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex-1 py-2 px-4 text-[12.5px] font-extrabold rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-950 uppercase tracking-wide">Cash Flow</TabsTrigger>
          <TabsTrigger value="gst" className="flex-1 py-2 px-4 text-[12.5px] font-extrabold rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-950 uppercase tracking-wide">Compliance</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: P&L ── */}
        <TabsContent value="pnl" className="mt-0 focus-visible:ring-0 outline-none">
          {loading ? <Loader /> : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Earnings" value={summary?.total_income} icon={TrendingUp} delayClass="fade-up-2" color={{ bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600' }} />
                <StatCard label="Expenses" value={summary?.total_expense} icon={TrendingDown} delayClass="fade-up-3" color={{ bg: 'bg-rose-50', icon: 'text-rose-500', badge: 'bg-rose-50 text-rose-500' }} />
                <StatCard label="Net Profit" value={summary?.net_balance} icon={Wallet} delayClass="fade-up-4" color={{ bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600' }} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                  <SectionHeader icon={BarChart3} iconBg="bg-indigo-50" iconColor="text-indigo-500" title="Cash Flow Velocity" subtitle="Monthly performance trends" />
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.12} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.10} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={45} />
                        <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" dot={false} />
                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col">
                  <SectionHeader icon={PieIcon} iconBg="bg-amber-50" iconColor="text-amber-500" title="Spend Distribution" subtitle="Major cost centers" />
                  <div className="h-[200px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={categoryBreakdown.filter(c => c.type === 'expense')} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="total" strokeWidth={0}>{categoryBreakdown.filter(c => c.type === 'expense').map((e, i) => (<Cell key={i} fill={e.color || PALETTE[i % PALETTE.length]} />))}</Pie><RechartsTooltip content={<PieTooltip />} /></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 mt-4 pt-4 border-t border-slate-50 overflow-y-auto max-h-[160px]">
                    {categoryBreakdown.filter(c => c.type === 'expense').slice(0, 5).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || PALETTE[i % PALETTE.length] }} /><span className="text-[12px] font-bold text-slate-700 truncate max-w-[100px] uppercase tracking-tight">{cat.name}</span></div>
                        <span className="text-[12.5px] font-black text-slate-900 tracking-tight">₹{cat.total.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: BALANCE SHEET ── */}
        <TabsContent value="balance-sheet" className="mt-0 focus-visible:ring-0 outline-none">
          <div className="mb-6 flex flex-col md:flex-row items-end gap-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-full max-w-[240px]">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Statement Date</Label>
              <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="h-10 rounded-xl border-slate-200 focus:ring-slate-900" />
            </div>
            <Button onClick={fetchBS} disabled={bsLoading} className="bg-slate-900 hover:bg-black text-white px-6 font-black text-[12px] h-10 rounded-xl shadow-xl shadow-slate-200 uppercase tracking-wider">Generate Snapshot</Button>
          </div>
          {bsLoading ? <Loader /> : bsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100/50 flex justify-between items-center">
                  <h3 className="text-[13px] font-black text-emerald-950 uppercase tracking-tight">Assets</h3>
                  <span className="text-[16px] font-black text-emerald-600 tracking-tight">₹{bsData.assets.total_assets.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-6 space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Cash & Bank Balances</p>
                    <div className="space-y-4">
                      {[...bsData.assets.current_assets.bank_accounts, ...bsData.assets.current_assets.cash_in_hand].map((acc, i) => (
                        <div key={i} className="flex justify-between items-center"><div className="flex flex-col"><span className="text-[13px] font-black text-slate-800 tracking-tight">{acc.name}</span>{acc.bank && <span className="text-[10px] text-slate-400 font-bold uppercase">{acc.bank}</span>}</div><span className="text-[13.5px] font-black text-slate-950">₹{acc.balance.toLocaleString('en-IN')}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100/50 flex justify-between items-center"><h3 className="text-[13px] font-black text-rose-950 uppercase tracking-tight">Liabilities</h3><span className="text-[16px] font-black text-rose-600 tracking-tight">₹{bsData.liabilities.total_liabilities.toLocaleString('en-IN')}</span></div>
                  <div className="p-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Current Liabilities</p><div className="space-y-4">{bsData.liabilities.current_liabilities.credit_cards.map((acc, i) => (<div key={i} className="flex justify-between items-center"><span className="text-[13px] font-black text-slate-800 tracking-tight">{acc.name}</span><span className="text-[13.5px] font-black text-rose-500">₹{Math.abs(acc.balance).toLocaleString('en-IN')}</span></div>))}</div></div>
                </div>
                <div className="bg-slate-950 rounded-2xl p-6 text-white overflow-hidden relative"><h3 className="text-[12px] font-black text-white/50 uppercase tracking-[0.2em] mb-6 relative z-10">EQUITY & RETAINED EARNINGS</h3><div className="space-y-4 relative z-10"><div className="flex justify-between items-center"><span className="text-[13px] font-bold text-white/80">Net Position</span><span className="text-[18px] font-black text-white">₹{bsData.equity.total_equity.toLocaleString('en-IN')}</span></div></div><div className={`mt-6 pt-6 border-t border-white/10 flex items-center gap-2 ${bsData.is_balanced ? 'text-emerald-400' : 'text-amber-400'}`}>{bsData.is_balanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}<span className="text-[10px] font-black uppercase tracking-widest">{bsData.is_balanced ? 'Fiscal Alignment: Balanced' : 'Accounting Mismatch Detected'}</span></div></div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 3: CASH FLOW ── */}
        <TabsContent value="cash-flow" className="mt-0 focus-visible:ring-0 outline-none">
          <div className="mb-8 flex flex-col md:flex-row items-end gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Start Date</Label><Input type="date" value={cfDates.from} onChange={(e) => setCfDates({...cfDates, from: e.target.value})} className="h-10 rounded-xl border-slate-200" /></div>
              <div><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">End Date</Label><Input type="date" value={cfDates.to} onChange={(e) => setCfDates({...cfDates, to: e.target.value})} className="h-10 rounded-xl border-slate-200" /></div>
            </div>
            <Button onClick={fetchCF} disabled={cfLoading} className="bg-slate-900 hover:bg-black text-white px-6 font-black text-[12px] h-10 rounded-xl uppercase tracking-widest transition-all">Update Statement</Button>
          </div>
          {cfLoading ? <Loader /> : cfData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Opening Cash Balance</p><p className="text-[22px] font-black text-slate-900 tracking-tight">₹{cfData.opening_cash_balance.toLocaleString('en-IN')}</p></div>
                <div className={`p-6 rounded-2xl border shadow-sm ${cfData.net_change_in_cash >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-950' : 'bg-rose-50 border-rose-100 text-rose-900'}`}><p className="text-[10px] font-black uppercase tracking-widest mb-2">Fiscal Period Shift</p><p className="text-[22px] font-black tracking-tight">{cfData.net_change_in_cash >= 0 ? '+' : ''}₹{cfData.net_change_in_cash.toLocaleString('en-IN')}</p></div>
                <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Closing Cash Reserve</p><p className="text-[22px] font-black text-white tracking-tight">₹{cfData.closing_cash_balance.toLocaleString('en-IN')}</p></div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center"><h3 className="text-[12px] font-black text-slate-950 uppercase tracking-widest">Operating Cash Inflow/Outflow</h3><span className={`text-[12px] font-black uppercase px-3 py-1 rounded-full ${cfData.operating_activities.net_cash >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Net: ₹{cfData.operating_activities.net_cash.toLocaleString('en-IN')}</span></div>
                <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
                  {cfData.operating_activities.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1 group border-b border-dashed border-slate-100 last:border-0"><span className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{item.name}</span><span className={`text-[13px] font-black ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{item.amount >= 0 ? '+' : ''}₹{Math.abs(item.amount).toLocaleString('en-IN')}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 4: GST COMPLIANCE ── */}
        <TabsContent value="gst" className="mt-0 focus-visible:ring-0 outline-none">
          <div className="mb-8 flex flex-col md:flex-row items-end gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Reporting Month</Label>
                <Select value={gstPeriod.month.toString()} onValueChange={(val) => setGstPeriod({...gstPeriod, month: parseInt(val)})}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-xl">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()} className="text-[13px] font-bold py-2">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fiscal Year</Label>
                <Select value={gstPeriod.year.toString()} onValueChange={(val) => setGstPeriod({...gstPeriod, year: parseInt(val)})}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-xl">
                    {[2023, 2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()} className="text-[13px] font-bold py-2">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={fetchGST} disabled={gstLoading} className="bg-slate-900 hover:bg-black text-white px-8 font-black text-[12px] h-10 rounded-xl uppercase tracking-widest">Run Compliance Check</Button>
          </div>

          {gstLoading ? <Loader /> : gstData && (
            <div className="space-y-6">
              {/* Main GST Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Output Tax (Liability)</p>
                  <p className="text-[20px] font-black text-rose-600 tracking-tight">₹{gstData.gstr3b.output_tax.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Input Credit (ITC)</p>
                  <p className="text-[20px] font-black text-emerald-600 tracking-tight">₹{gstData.gstr3b.input_tax_credit.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl text-white">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Net Payable</p>
                  <p className="text-[20px] font-black text-white tracking-tight">₹{gstData.gstr3b.net_gst_payable.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Taxable Sales</p>
                  <p className="text-[20px] font-black text-indigo-900 tracking-tight">₹{gstData.gstr1.total_taxable_value.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50"><h3 className="text-[12px] font-black text-slate-950 uppercase tracking-widest">GSTR-1 Summary (Sales)</h3></div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-600">Total B2B/B2C Invoices</span><span className="text-[13px] font-black text-slate-950">{gstData.gstr1.invoice_count}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-600">Gross Taxable Value</span><span className="text-[13px] font-black text-slate-950">₹{gstData.gstr1.total_taxable_value.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-600">CGST + SGST (Integrated)</span><span className="text-[13px] font-black text-rose-500">₹{gstData.gstr1.total_gst_collected.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50"><h3 className="text-[12px] font-black text-slate-950 uppercase tracking-widest">GSTR-3B Details (Offsets)</h3></div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-600">Eligible ITC (Claimable)</span><span className="text-[13px] font-black text-emerald-600">₹{gstData.gstr3b.input_tax_credit.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-600">Total Liability</span><span className="text-[13px] font-black text-rose-500">₹{gstData.gstr3b.output_tax.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-50"><span className="text-[13px] font-black text-slate-950 uppercase">Final Tax Liability</span><span className="text-[15px] font-black text-slate-950">₹{gstData.gstr3b.net_gst_payable.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;