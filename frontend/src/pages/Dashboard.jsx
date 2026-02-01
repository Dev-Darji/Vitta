import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
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

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (loading) {
    return (
      <div data-testid="dashboard-loading" className="flex items-center justify-center h-full">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Income</p>
              <h3 data-testid="total-income" className="text-2xl font-bold text-primary">
                ₹{summary.total_income.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Expense</p>
              <h3 data-testid="total-expense" className="text-2xl font-bold text-red-600">
                ₹{summary.total_expense.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Net Balance</p>
              <h3 data-testid="net-balance" className="text-2xl font-bold text-primary">
                ₹{summary.net_balance.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Transactions</p>
              <h3 data-testid="transaction-count" className="text-2xl font-bold text-primary">
                {summary.transaction_count}
              </h3>
            </div>
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-heading font-semibold text-lg text-primary mb-4">Monthly Trend</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </motion.div>

        {/* Bank Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg text-primary">Bank Accounts</h3>
            <Link to="/accounts">
              <Button size="sm" variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {accounts.length > 0 ? (
              accounts.slice(0, 5).map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{account.account_name}</p>
                    <p className="text-xs text-slate-500">{account.bank_name}</p>
                  </div>
                  <p className="font-semibold text-primary">₹{account.balance.toLocaleString('en-IN')}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="mb-4">No bank accounts yet</p>
                <Link to="/accounts">
                  <Button size="sm">Add Account</Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="font-heading font-semibold text-lg text-primary mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/import">
            <Button data-testid="quick-import-button" className="bg-primary hover:bg-primary/90 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Import Statement
            </Button>
          </Link>
          <Link to="/transactions">
            <Button variant="outline">View Transactions</Button>
          </Link>
          <Link to="/reports">
            <Button variant="outline">Generate Reports</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;