import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { 
  Download, FileText, FileSpreadsheet, File, TrendingUp, TrendingDown, 
  Wallet, PieChart as PieIcon, BarChart3, Calendar, ArrowUpRight, 
  ArrowDownRight, Loader2, Sparkles, Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

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
    } catch (error) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      
      doc.setFillColor(15, 57, 43); 
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('VITTA', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('BUSINESS FINANCIAL REPORT', 20, 32);
      doc.text(`Generated: ${dateStr}`, 140, 32);

      doc.setTextColor(15, 57, 43);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
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

      doc.text('Expense Distribution by Group', 20, doc.lastAutoTable.finalY + 20);
      
      const expenseData = categoryBreakdown
        .filter(c => c.type === 'expense')
        .sort((a, b) => b.total - a.total)
        .map(cat => [cat.name, cat.total.toLocaleString('en-IN'), cat.count.toString()]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [['Expense Group', 'Total Amount', 'Entry Count']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [15, 57, 43] },
        styles: { fontSize: 9, cellPadding: 5 }
      });

      doc.save(`Vitta_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Professional PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const COLORS = ['#0F392B', '#C8E947', '#10B981', '#3B82F6', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'];

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-8 mb-1 last:mb-0">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="text-xs font-black text-white">₹{item.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <Loader2 className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-slate-500 font-bold animate-pulse text-sm">Analyzing financial data...</p>
      </div>
    );
  }

  const topCategories = [...categoryBreakdown]
    .filter(c => c.type === 'expense')
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Financial Intelligence</p>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            Insights & Analytics
            <Sparkles className="h-6 w-6 text-accent" />
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm text-[11px] font-black text-slate-500">
            <Calendar className="h-3 w-3" />
            ALL TIME OVERVIEW
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-12 gap-2 shadow-lg shadow-primary/20">
                <Download className="h-4 w-4" />
                Export Results
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 shadow-2xl">
              <DropdownMenuItem onClick={downloadAsPDF} className="rounded-xl py-3 cursor-pointer">
                <FileText className="h-4 w-4 mr-3 text-red-500" />
                <span className="font-bold text-sm text-slate-700">Financial PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Excel export coming soon')} className="rounded-xl py-3 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-3 text-green-500" />
                <span className="font-bold text-sm text-slate-700">Detailed Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: 'Total Realized Income', 
            val: summary?.total_income, 
            icon: TrendingUp, 
            color: 'from-emerald-500 to-teal-500', 
            bg: 'bg-emerald-50/50',
            textColor: 'text-emerald-600'
          },
          { 
            label: 'Total Expenditure', 
            val: summary?.total_expense, 
            icon: TrendingDown, 
            color: 'from-rose-500 to-orange-500', 
            bg: 'bg-rose-50/50',
            textColor: 'text-rose-600'
          },
          { 
            label: 'Current Net Position', 
            val: summary?.net_balance, 
            icon: Wallet, 
            color: 'from-primary to-slate-900', 
            bg: 'bg-primary/5',
            textColor: 'text-primary'
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden rounded-2xl border-none shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-full`} />
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-10">
                  <div className={`h-14 w-14 ${stat.bg} ${stat.textColor} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <div className={`flex items-center gap-1 ${stat.textColor} text-xs font-black bg-white/50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm`}>
                    {stat.val >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.label.includes('Position') ? 'LIFETIME' : 'TOTAL'}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                    ₹{stat.val.toLocaleString('en-IN')}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 p-8 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Growth Projection</h3>
                <p className="text-xs font-bold text-slate-400">Monthly Cash Flow Analysis</p>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <RechartsTooltip content={<CustomChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke="#10B981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Expense"
                  stroke="#EF4444" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expense Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 p-8 shadow-xl flex flex-col"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="h-12 w-12 bg-accent/10 rounded-2xl flex items-center justify-center text-primary">
              <PieIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Expense Distribution</h3>
              <p className="text-xs font-bold text-slate-400">Total Spend by Category</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown.filter(c => c.type === 'expense')}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="total"
                  >
                    {categoryBreakdown.filter(c => c.type === 'expense').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} cornerRadius={10} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {topCategories.map((cat, index) => (
                <div key={index} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || COLORS[index % COLORS.length] }} />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors uppercase tracking-wider">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">₹{cat.total.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {categoryBreakdown.filter(c => c.type === 'expense').length > 5 && (
                <div className="pt-2 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-[2px]">+{categoryBreakdown.filter(c => c.type === 'expense').length - 5} MORE CATEGORIES</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Breakdown Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0F392B] rounded-2xl p-10 text-white shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-[0.05] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="flex gap-6 items-center">
            <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-white/10">
              <Receipt className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Financial Health Executive Summary</h3>
              <p className="text-white/60 text-sm font-medium">Auto-generated performance analysis based on current transactions</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-6 rounded-2xl min-w-[180px]">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 font-mono">Surplus Ratio</p>
              <p className="text-2xl font-black text-white">
                {summary?.total_income ? ((summary.net_balance / summary.total_income) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-accent/10 border border-accent/20 backdrop-blur-sm p-6 rounded-2xl min-w-[180px]">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1 font-mono">Total Velocity</p>
              <p className="text-2xl font-black text-accent">
                {categoryBreakdown.reduce((acc, curr) => acc + curr.count, 0)} <span className="text-xs opacity-50 font-medium tracking-normal text-white">TXNS</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;