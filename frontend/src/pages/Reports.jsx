import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import api from '@/lib/api';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
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
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPDF = () => {
    try {
      let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #0F392B; border-bottom: 3px solid #C8E947; padding-bottom: 10px; }
    h2 { color: #0F392B; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #0F392B; color: white; }
    .summary-box { background: #f8f9fa; padding: 20px; margin: 10px 0; border-radius: 8px; }
    .positive { color: #10B981; }
    .negative { color: #EF4444; }
  </style>
</head>
<body>
  <h1>Vitta Financial Report</h1>
  <p>Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  
  <h2>Profit & Loss Summary</h2>
  <div class="summary-box">
    <p><strong>Total Income:</strong> ₹${summary?.total_income.toLocaleString('en-IN')}</p>
    <p><strong>Total Expense:</strong> ₹${summary?.total_expense.toLocaleString('en-IN')}</p>
    <p><strong>Net Profit/Loss:</strong> <span class="${summary?.net_balance >= 0 ? 'positive' : 'negative'}">₹${summary?.net_balance.toLocaleString('en-IN')}</span></p>
  </div>
  
  <h2>Expense Breakdown by Category</h2>
  <table>
    <thead>
      <tr><th>Category</th><th>Amount</th><th>Transactions</th></tr>
    </thead>
    <tbody>
      ${categoryBreakdown.filter(c => c.type === 'expense').map(cat => `
        <tr>
          <td>${cat.name}</td>
          <td>₹${cat.total.toLocaleString('en-IN')}</td>
          <td>${cat.count}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Monthly Trend</h2>
  <table>
    <thead>
      <tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr>
    </thead>
    <tbody>
      ${monthlyTrend.map(month => `
        <tr>
          <td>${month.month}</td>
          <td class="positive">₹${month.income.toLocaleString('en-IN')}</td>
          <td class="negative">₹${month.expense.toLocaleString('en-IN')}</td>
          <td class="${(month.income - month.expense) >= 0 ? 'positive' : 'negative'}">₹${(month.income - month.expense).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Vitta_Financial_Report_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF report downloaded! Open the HTML file and print to PDF.');
    } catch (error) {
      toast.error('Failed to download PDF report');
    }
  };

  const downloadAsExcel = () => {
    try {
      let csvContent = 'VITTA FINANCIAL REPORT\n';
      csvContent += `Generated on: ${new Date().toLocaleDateString('en-IN')}\n\n`;
      
      csvContent += 'PROFIT & LOSS SUMMARY\n';
      csvContent += 'Metric,Amount\n';
      csvContent += `Total Income,${summary?.total_income}\n`;
      csvContent += `Total Expense,${summary?.total_expense}\n`;
      csvContent += `Net Profit/Loss,${summary?.net_balance}\n\n`;
      
      csvContent += 'EXPENSE BREAKDOWN BY CATEGORY\n';
      csvContent += 'Category,Amount,Transactions\n';
      categoryBreakdown.filter(c => c.type === 'expense').forEach(cat => {
        csvContent += `${cat.name},${cat.total},${cat.count}\n`;
      });
      
      csvContent += '\nMONTHLY TREND\n';
      csvContent += 'Month,Income,Expense,Net\n';
      monthlyTrend.forEach(month => {
        csvContent += `${month.month},${month.income},${month.expense},${(month.income - month.expense)}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Vitta_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download Excel report');
    }
  };

  const downloadAsCSV = () => {
    try {
      let csvContent = 'Category,Amount,Transaction Count,Type\n';
      
      categoryBreakdown.forEach(cat => {
        csvContent += `${cat.name},${cat.total},${cat.count},${cat.type}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Vitta_Category_Breakdown_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('CSV report downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download CSV report');
    }
  };

  const COLORS = ['#0F392B', '#C8E947', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];

  if (loading) {
    return <div data-testid="reports-loading" className="flex items-center justify-center h-full"><div className="text-slate-600">Loading...</div></div>;
  }

  return (
    <div data-testid="reports-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-heading font-bold text-2xl text-primary">Financial Reports</h2>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid="download-report-button" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={downloadAsPDF} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              <span>Download as PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadAsExcel} className="cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              <span>Download as Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadAsCSV} className="cursor-pointer">
              <File className="h-4 w-4 mr-2 text-blue-600" />
              <span>Download as CSV</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profit & Loss */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="font-heading font-semibold text-lg text-primary mb-6">Profit & Loss Summary</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600">₹{summary?.total_income.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 mb-1">Total Expense</p>
            <p className="text-2xl font-bold text-red-600">₹{summary?.total_expense.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-primary mb-1">Net Profit/Loss</p>
            <p className={`text-2xl font-bold ${summary?.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{summary?.net_balance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="font-heading font-semibold text-lg text-primary mb-6">Expense Breakdown by Category</h3>
        {categoryBreakdown.filter(c => c.type === 'expense').length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown.filter(c => c.type === 'expense')}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {categoryBreakdown.filter(c => c.type === 'expense').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {categoryBreakdown.filter(c => c.type === 'expense').map((cat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color || COLORS[index % COLORS.length] }} />
                    <span className="font-medium text-slate-900">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">₹{cat.total.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">No expense data available</div>
        )}
      </motion.div>

      {/* Monthly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="font-heading font-semibold text-lg text-primary mb-6">Monthly Income vs Expense</h3>
        {monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" />
              <Bar dataKey="expense" fill="#EF4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-slate-500">No monthly data available</div>
        )}
      </motion.div>
    </div>
  );
};

export default Reports;