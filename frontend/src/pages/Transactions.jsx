import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Edit, Trash2, ChevronDown, Calendar, Download, IndianRupee, Scale, Tag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import api from '@/lib/api';
import ConfirmPopup from '@/components/ConfirmPopup';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterReference, setFilterReference] = useState('');
  const [filterParticulars, setFilterParticulars] = useState('all');
  const [filterLedger, setFilterLedger] = useState('all');
  const [filterSecondaryGroup, setFilterSecondaryGroup] = useState('all');
  const [filterReferenceNum, setFilterReferenceNum] = useState('all');
  const [filterChequeNum, setFilterChequeNum] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterAccount, filterType, filterCategory, filterDateFrom, filterDateTo, filterReference, filterParticulars, filterLedger, filterSecondaryGroup, filterReferenceNum, filterChequeNum]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAccount !== 'all') params.account_id = filterAccount;
      if (filterType !== 'all') params.type = filterType;
      if (filterCategory !== 'all') params.category_id = filterCategory;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (filterReference) params.reference = filterReference;


      const [txnRes, catRes, accRes, clRes] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/categories'),
        api.get('/accounts'),
        api.get('/clients'),
      ]);
      
      setTransactions(txnRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
      setClients(clRes.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const payload = {
        category_id: editCategory || null,
        description: editingTransaction.description,
        amount: Number(editingTransaction.amount),
        type: editingTransaction.type,
        date: editingTransaction.date,
        ledger_name: editingTransaction.ledger_name || null,
        group_name: editingTransaction.group_name || null,
        reference_number: editingTransaction.reference_number || null,
        cheque_number: editingTransaction.cheque_number || null,
        notes: editingTransaction.notes || null,
        account_id: editingTransaction.account_id,
      };

      await api.put(`/transactions/${editingTransaction.id}`, payload);
      toast.success('Transaction updated');
      setEditingTransaction(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update transaction');
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

  const filteredTransactions = transactions.filter((txn) => {
    // Search Term Filter (Particulars)
    const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type Filter
    const matchesType = filterType === 'all' || txn.type === filterType;
    
    // Category Filter
    const matchesCategory = filterCategory === 'all' || txn.category_id === filterCategory;
    
    // Reference Filter
    const matchesRef = !filterReference || 
      (txn.reference_number?.toLowerCase().includes(filterReference.toLowerCase())) ||
      (txn.cheque_number?.toLowerCase().includes(filterReference.toLowerCase()));
    
    // Date Range Filter
    let matchesDate = true;
    if (filterDateFrom || filterDateTo) {
      const yearStr = txn.date.split('-')[2];
      const monthStr = txn.date.split('-')[1];
      const dayStr = txn.date.split('-')[0];
      const txnDate = new Date(`${yearStr}-${monthStr}-${dayStr}`);
      
      if (filterDateFrom) {
        matchesDate = matchesDate && txnDate >= new Date(filterDateFrom);
      }
      if (filterDateTo) {
        matchesDate = matchesDate && txnDate <= new Date(filterDateTo);
      }
    }

    // Dynamic Filters
    const matchesParticulars = filterParticulars === 'all' || txn.description === filterParticulars;
    const matchesLedger = filterLedger === 'all' || txn.ledger_name === filterLedger;
    const matchesSecondaryGroup = filterSecondaryGroup === 'all' || txn.group_name === filterSecondaryGroup;
    const matchesReferenceNum = filterReferenceNum === 'all' || txn.reference_number === filterReferenceNum;
    const matchesChequeNum = filterChequeNum === 'all' || txn.cheque_number === filterChequeNum;

    return matchesSearch && matchesType && matchesCategory && matchesRef && matchesDate && 
           matchesParticulars && matchesLedger && matchesSecondaryGroup && matchesReferenceNum && matchesChequeNum;
  });

  // Unique values for dynamic filters
  const filterOptions = React.useMemo(() => {
    return {
      descriptions: [...new Set(transactions.map(t => t.description))].sort(),
      ledgers: [...new Set(transactions.map(t => t.ledger_name).filter(Boolean))].sort(),
      secondaryGroups: [...new Set(transactions.map(t => t.group_name).filter(Boolean))].sort(),
      references: [...new Set(transactions.map(t => t.reference_number).filter(Boolean))].sort(),
      cheques: [...new Set(transactions.map(t => t.cheque_number).filter(Boolean))].sort(),
      activeCategories: [...new Set(transactions.map(t => t.category_id).filter(Boolean))],
    };
  }, [transactions]);

  // Calculate Running Balance for Ledger view
  const transactionsWithBalance = React.useMemo(() => {
    if (filterAccount === 'all') return filteredTransactions;
    
    // Sort ASC to calculate correct running balance
    const sortedAsc = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date.split('-').reverse().join('-'));
      const dateB = new Date(b.date.split('-').reverse().join('-'));
      if (dateA - dateB !== 0) return dateA - dateB;
      // Opening balance always first
      if (a.type === 'opening') return -1;
      if (b.type === 'opening') return 1;
      return 0;
    });

    let runningBalance = 0;
    const withBalance = sortedAsc.map(txn => {
      if (txn.type === 'opening' || txn.type === 'credit') {
        runningBalance += txn.amount;
      } else {
        runningBalance -= txn.amount;
      }
      return { ...txn, runningBalance };
    });

    // Return in DESC order for display
    return withBalance.reverse();
  }, [filteredTransactions, filterAccount]);

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Unassigned';
  };

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.account_name : 'Unknown';
  };

  const getClientNameForAccount = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return '';
    const client = clients.find(c => c.id === account.client_id);
    return client ? client.name : '';
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

  const formatClientName = (fullName, clientId) => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) return `${client.name} — ${fullName}`;
    }
    if (!fullName) return 'Select Client';
    const parts = fullName.trim().split(' ');
    const firstName = parts[0];
    const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : '';
    return `${firstName}${lastInitial} Transactions`;
  };

  const currentAccount = accounts.find(a => a.id === filterAccount);

  return (
    <div data-testid="transactions-page" className="space-y-10 pb-20">
      {/* ─── Premium Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-2 w-10 bg-gradient-to-r from-primary to-primary/40 rounded-full" />
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Grade Ledger</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            Audit Ledger <Scale className="h-9 w-9 text-primary animate-pulse-subtle" />
          </h1>
          <p className="text-slate-500 font-medium tracking-tight text-lg max-w-xl">
            {filterAccount === 'all' 
              ? 'Omnichannel verification of organizational liquidity across all nodes.' 
              : `Deep-dive analysis for ${currentAccount?.account_name} — balancing capital flow.`}
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Omni Search Field */}
          <div className="flex-1 md:w-80 group">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Omni Search (Narration, ID...)" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 pl-12 rounded-[20px] border-slate-200 bg-white shadow-sm focus-visible:ring-primary/10 transition-all font-bold text-sm"
                />
             </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button className="h-14 px-8 rounded-[20px] bg-slate-900 border-none text-white font-black text-[11px] uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-900/10 transition-all flex items-center gap-4 group">
                <Filter className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
                Refine Dataset
                {(filterAccount !== 'all' || filterType !== 'all' || filterCategory !== 'all') && (
                  <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[480px] p-10 rounded-[40px] border-none shadow-3xl bg-white/95 backdrop-blur-xl space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-2xl tracking-tighter">Refinement Vectors</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Cross-section the ledger by any dimension</p>
                </div>
                <div className="h-14 w-14 bg-primary/5 text-primary rounded-[22px] flex items-center justify-center">
                  <Filter className="h-7 w-7" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Account</Label>
                  <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-xs h-14 shadow-inner">
                      <SelectValue placeholder="Unified Ledger" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="all" className="rounded-lg font-bold">Unified (All Sources)</SelectItem>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id} className="rounded-lg font-bold">{acc.account_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Flow Direction</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-xs h-14 shadow-inner">
                      <SelectValue placeholder="Bidirectional" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="all" className="rounded-lg font-bold">Bidirectional</SelectItem>
                      <SelectItem value="debit" className="rounded-lg font-bold text-rose-600">Expenditure (-)</SelectItem>
                      <SelectItem value="credit" className="rounded-lg font-bold text-emerald-600">Revenue (+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5 col-span-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Categorical Group</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-xs h-14 shadow-inner">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[350px]">
                      <SelectItem value="all" className="rounded-lg font-bold">Global View</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-lg font-bold">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5 col-span-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lifecycle Window</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      type="date" 
                      value={filterDateFrom} 
                      onChange={e => setFilterDateFrom(e.target.value)}
                      className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-xs"
                    />
                    <Input 
                      type="date" 
                      value={filterDateTo} 
                      onChange={e => setFilterDateTo(e.target.value)}
                      className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <Button 
                  onClick={() => {
                    setFilterType('all'); 
                    setFilterAccount('all'); 
                    setFilterCategory('all');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setSearchTerm('');
                    setFilterParticulars('all');
                    setFilterLedger('all');
                    setFilterSecondaryGroup('all');
                    setFilterReferenceNum('all');
                    setFilterChequeNum('all');
                  }} 
                  variant="ghost" 
                  className="w-full text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[22px] h-16 transition-all"
                >
                  Reset Scientific Parameters
                </Button>
                
                <Button 
                  onClick={() => {
                    try {
                      const doc = new jsPDF();
                      const accountName = filterAccount === 'all' ? 'Unified Ledger' : getAccountName(filterAccount);
                      const dateStr = new Date().toLocaleDateString('en-IN');
                      
                      doc.setFillColor(15, 57, 43);
                      doc.rect(0, 0, 210, 35, 'F');
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(24);
                      doc.text('Vitta Financial Master-Log', 20, 22);
                      
                      doc.setFontSize(10);
                      doc.text(`Source Node: ${accountName}`, 130, 16);
                      doc.text(`Generation Date: ${dateStr}`, 130, 24);

                      const tableData = transactionsWithBalance.map(txn => [
                        formatDisplayDate(txn.date),
                        txn.description,
                        txn.type === 'debit' ? txn.amount.toLocaleString('en-IN') : '—',
                        (txn.type === 'credit' || txn.type === 'opening') ? txn.amount.toLocaleString('en-IN') : '—',
                        txn.runningBalance !== undefined ? txn.runningBalance.toLocaleString('en-IN') : '-'
                      ]);

                      autoTable(doc, {
                        startY: 45,
                        head: [['Lifecycle', 'Particulars', 'Debit (Out)', 'Credit (In)', 'Liquidity Level']],
                        body: tableData,
                        theme: 'grid',
                        headStyles: { fillColor: [15, 57, 43], fontSize: 9, cellPadding: 6, fontStyle: 'bold' },
                        bodyStyles: { fontSize: 8.5, cellPadding: 5 },
                        alternateRowStyles: { fillColor: [250, 251, 253] }
                      });

                      doc.save(`Vitta_Ledger_Export_${new Date().toISOString().split('T')[0]}.pdf`);
                      toast.success('Premium Ledger Exported Successfully');
                    } catch (e) {
                      toast.error('PDF Engine Interrupted');
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-black text-white rounded-[22px] h-16 font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-4 group"
                >
                  <Download className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
                  Generate Audit Report
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ─── Ledger Data Grid ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-6">
             <div className="h-16 w-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
             <div className="text-center">
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Synchronizing Transactions</p>
                <p className="text-xs font-bold text-slate-400 mt-2 italic">Connecting to secure financial nodes...</p>
             </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-48 gap-8">
            <div className="h-28 w-28 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border-4 border-white shadow-inner">
               <Scale className="h-12 w-12" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zero Vector Matches</h3>
              <p className="text-slate-500 font-medium max-w-[280px] mx-auto leading-relaxed">The applied intelligence filters returned an empty dataset. Try adjusting your parameters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-10 py-7 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Lifecycle</th>
                  <th className="px-10 py-7 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Details & Verification</th>
                  <th className="px-10 py-7 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Grouping</th>
                  <th className="px-10 py-7 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Debit (-)</th>
                  <th className="px-10 py-7 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Credit (+)</th>
                  {filterAccount !== 'all' && (
                    <th className="px-10 py-7 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Liquidity</th>
                  )}
                  <th className="px-10 py-7 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Mod</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactionsWithBalance.map((txn, idx) => (
                  <tr key={txn.id} className={`${txn.type === 'opening' ? 'bg-primary/[0.03]' : ''} hover:bg-slate-50/80 transition-all duration-500 group relative`}>
                    <td className="px-10 py-8 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                         <div className="flex flex-col">
                            <span className="text-[14px] font-black text-slate-900 tracking-tight">{formatDisplayDate(txn.date).split('-')[0]}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{formatDisplayDate(txn.date).split('-').slice(1).join(' ')}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col group/item">
                        <div className="flex items-center gap-3">
                           <span className={`text-[17px] font-black ${txn.type === 'opening' ? 'text-primary' : 'text-slate-900'} leading-none tracking-tight`}>
                             {txn.description}
                           </span>
                           {txn.type === 'opening' && (
                             <span className="text-[9px] bg-primary text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20">Genesis</span>
                           )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4">
                           {txn.ledger_name && (
                             <span className="text-[12px] text-slate-500 font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                                <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                {txn.ledger_name}
                             </span>
                           )}
                           {(txn.reference_number || txn.cheque_number) && (
                             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 group-hover:bg-white transition-all">
                               Audit ID: {txn.reference_number || txn.cheque_number}
                             </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-2.5">
                        <span className="flex items-center gap-3">
                          <div className="h-6 w-6 bg-primary/5 text-primary rounded-lg flex items-center justify-center scale-90">
                              <Tag className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{getCategoryName(txn.category_id)}</span>
                        </span>
                        {txn.group_name && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-9">
                            {txn.group_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 whitespace-nowrap text-right">
                       <span className={`text-[17px] font-black ${txn.type === 'debit' ? 'text-rose-600' : 'text-slate-200'}`}>
                         {txn.type === 'debit' ? `₹${txn.amount.toLocaleString('en-IN')}` : '—'}
                       </span>
                    </td>
                    <td className="px-10 py-8 whitespace-nowrap text-right">
                       <span className={`text-[17px] font-black ${(txn.type === 'credit' || txn.type === 'opening') ? 'text-emerald-600' : 'text-slate-200'}`}>
                         {(txn.type === 'credit' || txn.type === 'opening') ? `₹${txn.amount.toLocaleString('en-IN')}` : '—'}
                       </span>
                    </td>
                    {filterAccount !== 'all' && (
                      <td className="px-10 py-8 whitespace-nowrap text-right border-l border-slate-50/50">
                        <div className="text-[16px] font-black text-slate-900 tracking-tight">₹{txn.runningBalance?.toLocaleString('en-IN')}</div>
                        <div className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mt-1 italic">Verified Node</div>
                      </td>
                    )}
                    <td className="px-10 py-8 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        {txn.type !== 'opening' ? (
                          <>
                            <Dialog>
                               <DialogTrigger asChild>
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-11 w-11 rounded-2xl hover:bg-white hover:text-primary text-slate-300 shadow-sm hover:shadow-md transition-all"
                                   onClick={() => {
                                     setEditingTransaction(txn);
                                     setEditCategory(txn.category_id || '');
                                   }}
                                 >
                                    <Edit className="h-4.5 w-4.5" />
                                 </Button>
                               </DialogTrigger>
                               <DialogContent className="max-w-3xl bg-white rounded-[50px] p-0 overflow-hidden border-none shadow-3xl">
                                <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                                  <div className="relative z-10">
                                    <DialogHeader>
                                      <DialogTitle className="text-4xl font-black tracking-tightest flex items-center gap-5 text-white">
                                        <div className="h-14 w-14 bg-white/10 rounded-[24px] flex items-center justify-center">
                                          <Edit className="h-7 w-7 text-primary" />
                                        </div>
                                        Edit Ledger Node
                                      </DialogTitle>
                                      <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em] mt-6 flex items-center gap-3">
                                         <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                         Transaction Hash: {txn.id.slice(0, 8)}...
                                      </p>
                                    </DialogHeader>
                                  </div>
                                </div>

                                {editingTransaction && (
                                  <div className="p-12 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar-premium">
                                    <div className="grid grid-cols-2 gap-10">
                                      <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Narration / Particulars</Label>
                                        <Input
                                          value={editingTransaction.description}
                                          onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                                          className="h-16 rounded-2xl border-slate-100 font-black text-base bg-slate-50/50 shadow-inner px-6"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Primary Classification</Label>
                                        <Select value={editCategory} onValueChange={setEditCategory}>
                                          <SelectTrigger className="h-16 rounded-2xl border-slate-100 font-black text-base bg-slate-50/50 shadow-inner px-6">
                                            <SelectValue placeholder="System Category" />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-3xl border-none shadow-3xl p-2">
                                            {categories.map(cat => (
                                              <SelectItem key={cat.id} value={cat.id} className="rounded-xl font-bold py-3">
                                                {cat.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                      <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Local Amount (INR)</Label>
                                        <div className="relative">
                                          <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">₹</div>
                                          <Input
                                            type="number"
                                            value={editingTransaction.amount}
                                            onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
                                            className="h-16 pl-14 rounded-2xl border-slate-100 font-black text-base bg-slate-50/50 shadow-inner"
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Registry Date</Label>
                                        <Input
                                          type="date"
                                          value={editingTransaction.date}
                                          onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                          className="h-16 rounded-2xl border-slate-100 font-black text-base bg-slate-50/50 shadow-inner px-6"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Internal Forensic Notes</Label>
                                      <textarea
                                        value={editingTransaction.notes || ''}
                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                                        className="w-full min-h-[150px] p-8 bg-slate-50/50 border border-slate-100 rounded-[32px] font-bold text-base focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-inner leading-relaxed"
                                        placeholder="Enter secure audit trail commentary..."
                                      />
                                    </div>
                                  </div>
                                )}

                                <DialogFooter className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
                                  <Button
                                    variant="ghost"
                                    onClick={() => setEditingTransaction(null)}
                                    className="rounded-2xl px-10 h-14 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white"
                                  >
                                    Cancel Changes
                                  </Button>
                                  <Button
                                    onClick={handleEditTransaction}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-[22px] px-12 h-14 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                                  >
                                    Commit Modifications
                                  </Button>
                                </DialogFooter>
                               </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTransaction(txn.id)}
                              className="h-11 w-11 rounded-2xl text-rose-300 hover:text-rose-600 hover:bg-rose-50 hover:shadow-inner transition-all"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </>
                        ) : (
                          <div className="pr-6 py-2">
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm cursor-not-allowed">Locked Node</span>
                          </div>
                        )}
                      </div>
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
        title="Authorize Liquidation?"
        description="Proceeding will permanently purge this ledger node from the system database. This action is immutable."
        confirmText="Confirm Purge"
        cancelText="Abort Operation"
      />
    </div>
  );
};

export default Transactions;
