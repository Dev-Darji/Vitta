import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Edit, Trash2, ChevronDown, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import ConfirmPopup from '@/components/ConfirmPopup';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterAccount, filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAccount !== 'all') params.account_id = filterAccount;
      if (filterType !== 'all') params.type = filterType;

      const [txnRes, catRes, accRes] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/categories'),
        api.get('/accounts'),
      ]);
      
      setTransactions(txnRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;

    try {
      await api.put(`/transactions/${editingTransaction.id}`, {
        category_id: editCategory || null,
      });
      toast.success('Transaction updated');
      setEditingTransaction(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  };

  const handleDeleteTransaction = (id) => {
    setTransactionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await api.delete(`/transactions/${transactionToDelete}`);
      toast.success('Transaction deleted');
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter((txn) =>
    txn.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.account_name : 'Unknown';
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return dateStr;
    const str = String(dateStr).trim();
    if (!str) return str;

    // Fast return if already DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;

    // Handle ISO/Various formats using the same logic as normalizeDate
    const match = str.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})/);
    if (match) {
      let p1 = parseInt(match[1]);
      let p2 = parseInt(match[2]);
      let p3 = parseInt(match[3]);

      if (p1 > 1000) return `${String(p3).padStart(2, '0')}-${String(p2).padStart(2, '0')}-${p1}`;
      if (p3 > 1000) {
        if (p2 > 12) return `${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}-${p3}`;
        return `${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}-${p3}`;
      }
    }
    
    return str;
  };

  const formatClientName = (fullName) => {
    if (!fullName) return 'Select Client';
    const parts = fullName.trim().split(' ');
    const firstName = parts[0];
    const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : '';
    return `${firstName}${lastInitial} Transactions`;
  };

  const currentAccount = accounts.find(a => a.id === filterAccount);

  return (
    <div data-testid="transactions-page" className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left Side: Client Dropdown */}
        <div className="flex items-center gap-2 group cursor-pointer">
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 shadow-none hover:bg-transparent">
              <div className="flex items-center gap-3">
                <h2 className="font-heading font-black text-3xl text-slate-900 tracking-tight group-hover:text-primary transition-colors">
                  {filterAccount === 'all' ? 'All Clients' : formatClientName(currentAccount?.account_name)}
                </h2>
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent align="start" className="rounded-2xl border-slate-200 shadow-2xl">
              <SelectItem value="all" className="font-bold py-3">All Clients</SelectItem>
              <Separator className="my-1 bg-slate-100" />
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} className="py-3 font-medium">
                  {account.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Side: Search & Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="search-input"
              placeholder="Search statements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-primary/20 transition-all font-medium"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm flex items-center gap-2 font-bold text-slate-700">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-6 rounded-[32px] border-slate-200 shadow-2xl space-y-6">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black tracking-[2px] uppercase text-slate-400">Transaction Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'credit', 'debit'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`py-2 text-xs font-bold rounded-xl border-2 transition-all capitalize
                        ${filterType === type 
                          ? 'bg-primary/5 border-primary text-primary' 
                          : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black tracking-[2px] uppercase text-slate-400">Date Range</p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-not-allowed opacity-60">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">Pick a date...</span>
                </div>
              </div>

              <Button onClick={() => {setFilterType('all'); setFilterAccount('all');}} variant="ghost" className="w-full text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl py-5 h-auto">
                Reset All Filters
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600">Loading...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-600">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDisplayDate(txn.date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{txn.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{getAccountName(txn.account_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                        {getCategoryName(txn.category_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        txn.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        ₹{txn.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTransaction(txn);
                              setEditCategory(txn.category_id || '');
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Transaction</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Category</Label>
                              <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={handleEditTransaction} className="w-full">
                              Update Transaction
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(txn.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmPopup
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Sure you want to delete?"
        description="This action is permanent and will remove the transaction from your ledger and update account balances."
        confirmText="Delete"
        cancelText="Discard"
      />
    </div>
  );
};

export default Transactions;
