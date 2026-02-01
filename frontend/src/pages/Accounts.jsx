import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    account_name: '',
    bank_name: '',
    opening_balance: 0,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounts', newAccount);
      toast.success('Account created');
      setIsOpen(false);
      setNewAccount({ account_name: '', bank_name: '', opening_balance: 0 });
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account? This will not delete associated transactions.')) return;

    try {
      await api.delete(`/accounts/${id}`);
      toast.success('Account deleted');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div data-testid="accounts-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-heading font-bold text-2xl text-primary">Bank Accounts</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-account-button" className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Bank Account</DialogTitle>
            </DialogHeader>
            <form data-testid="account-form" onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label>Account Name</Label>
                <Input
                  data-testid="account-name-input"
                  value={newAccount.account_name}
                  onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                  required
                  placeholder="e.g., Business Checking"
                />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input
                  data-testid="bank-name-input"
                  value={newAccount.bank_name}
                  onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                  required
                  placeholder="e.g., HDFC Bank"
                />
              </div>
              <div>
                <Label>Opening Balance</Label>
                <Input
                  data-testid="opening-balance-input"
                  type="number"
                  step="0.01"
                  value={newAccount.opening_balance}
                  onChange={(e) => setNewAccount({ ...newAccount, opening_balance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <Button data-testid="create-account-submit" type="submit" className="w-full">
                Create Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-8 text-white shadow-lg"
      >
        <div className="flex items-center space-x-3 mb-2">
          <Wallet className="h-6 w-6" />
          <p className="text-white/90 text-sm">Total Balance</p>
        </div>
        <p data-testid="total-balance" className="text-4xl font-bold font-heading">₹{totalBalance.toLocaleString('en-IN')}</p>
      </motion.div>

      {/* Accounts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="text-slate-600">Loading...</div></div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Wallet className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No bank accounts yet</p>
          <Button onClick={() => setIsOpen(true)}>Add Your First Account</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-heading font-semibold text-lg text-primary mb-1">{account.account_name}</h3>
                  <p className="text-sm text-slate-600">{account.bank_name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAccount(account.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-primary">₹{account.balance.toLocaleString('en-IN')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Accounts;