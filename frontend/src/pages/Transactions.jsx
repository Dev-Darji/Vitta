import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Scale,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ConfirmPopup from '../components/ConfirmPopup';

/* ─────────────────────────────────────────────
   Inline global font import (DM Sans)
───────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

    [data-txn-root] {
      font-family: 'DM Sans', sans-serif;
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    [data-txn-root] tbody tr {
      animation: fadeSlideIn 0.18s ease both;
    }
    [data-txn-root] tbody tr:nth-child(1)  { animation-delay: 0.02s }
    [data-txn-root] tbody tr:nth-child(2)  { animation-delay: 0.04s }
    [data-txn-root] tbody tr:nth-child(3)  { animation-delay: 0.06s }
    [data-txn-root] tbody tr:nth-child(4)  { animation-delay: 0.08s }
    [data-txn-root] tbody tr:nth-child(5)  { animation-delay: 0.10s }
    [data-txn-root] tbody tr:nth-child(6)  { animation-delay: 0.12s }
    [data-txn-root] tbody tr:nth-child(n+7){ animation-delay: 0.14s }

    [data-txn-root] .stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px -4px rgba(0,0,0,0.08);
    }
    [data-txn-root] .stat-card {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
  `}</style>
);

/* ─── Stat Card ─── */
const StatCard = ({ label, value, colorClass, prefix = '₹' }) => (
  <div className="stat-card bg-white rounded-xl border border-slate-100 px-5 py-3.5 min-w-[148px]">
    <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-1.5">{label}</p>
    <p className={`text-[18px] font-bold leading-none tracking-tight ${colorClass}`}>
      <span className="text-[13px] font-medium opacity-60 mr-0.5">{prefix}</span>
      {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </p>
  </div>
);

/* ─── Filter Select ─── */
const FilterSelect = ({ value, onValueChange, placeholder, children, width = 'w-44' }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={`${width} h-9 rounded-lg border-slate-200 bg-white text-[13px] font-medium text-slate-700 shadow-none focus:ring-1 focus:ring-slate-300`}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1.5">
      {children}
    </SelectContent>
  </Select>
);

/* ─── Column Header ─── */
const TH = ({ children, align = 'left', className = '' }) => (
  <th className={`px-4 py-3 text-${align} text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 ${className}`}>
    {children}
  </th>
);

/* ══════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════ */
const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txnsRes, accsRes, catsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/accounts'),
        api.get('/categories'),
      ]);
      setTransactions(txnsRes.data);
      setAccounts(accsRes.data);
      setCategories(catsRes.data);
    } catch {
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (id) => accounts.find(a => a.id === id)?.account_name ?? 'Unknown';
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name ?? 'Uncategorized';

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length <= 2) {
        let [day, month, year] = parts;
        const monthMap = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
        if (!isNaN(month)) month = parseInt(month) - 1;
        else month = monthMap[month.toLowerCase().substring(0,3)];
        const d = new Date(year, month, day);
        if (!isNaN(d)) return d;
      }
    }
    return new Date(dateStr);
  };

  const formatDisplayDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g,'-');
  };

  const handleEditTransaction = async () => {
    try {
      await api.put(`/transactions/${editingTransaction.id}`, { ...editingTransaction, category_id: editCategory });
      toast.success('Transaction updated successfully');
      setEditingTransaction(null);
      fetchData();
    } catch { toast.error('Failed to update transaction'); }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/transactions/${transactionToDelete}`);
      toast.success('Transaction deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleteConfirmOpen(false); setTransactionToDelete(null); }
  };

  /* ── Filtering ── */
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          txn.ledger_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount  = filterAccount === 'all' || txn.account_id === filterAccount;
    const matchesType     = filterType === 'all' ||
                            (filterType === 'debit' && txn.type === 'debit') ||
                            (filterType === 'credit' && (txn.type === 'credit' || txn.type === 'opening'));
    const matchesCategory = filterCategory === 'all' || txn.category_id === filterCategory;
    const txnDate  = parseDate(txn.date);
    const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
    const toDate   = filterDateTo   ? new Date(filterDateTo)   : null;
    if (fromDate) fromDate.setHours(0,0,0,0);
    if (toDate)   toDate.setHours(23,59,59,999);
    return matchesSearch && matchesAccount && matchesType && matchesCategory &&
           (!fromDate || txnDate >= fromDate) && (!toDate || txnDate <= toDate);
  });

  const transactionsWithBalance = [...filteredTransactions]
    .sort((a,b) => parseDate(a.date) - parseDate(b.date))
    .reduce((acc, txn, idx) => {
      const prev = idx === 0 ? 0 : acc[idx-1].runningBalance;
      const amt  = txn.amount || 0;
      const bal  = (txn.type === 'credit' || txn.type === 'opening') ? prev + amt : prev - amt;
      acc.push({ ...txn, runningBalance: bal });
      return acc;
    }, []);

  const displayTransactions = [...transactionsWithBalance].sort((a,b) => {
    return sortOrder === 'desc'
      ? parseDate(b.date) - parseDate(a.date)
      : parseDate(a.date) - parseDate(b.date);
  });

  const totalInflow  = transactionsWithBalance.reduce((s,t) => (t.type==='credit'||t.type==='opening' ? s+t.amount : s), 0);
  const totalOutflow = transactionsWithBalance.reduce((s,t) => (t.type==='debit' ? s+t.amount : s), 0);
  const netBalance   = totalInflow - totalOutflow;
  const currentAccount = accounts.find(a => a.id === filterAccount);
  const hasFilters = searchTerm || filterAccount !== 'all' || filterType !== 'all' || filterDateFrom || filterDateTo;

  /* ── PDF Export ── */
  const exportPDF = () => {
    const doc = new jsPDF();
    const title = filterAccount === 'all' ? 'All Accounts' : getAccountName(filterAccount);
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.text(`${title} — Transaction Statement`, 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica','normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 23);
    autoTable(doc, {
      startY: 28,
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [15,23,42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248,250,252] },
      head: [['Date','Particulars','Ledger','Ref','Debit','Credit','Balance']],
      body: displayTransactions.map(t => [
        formatDisplayDate(t.date),
        t.description,
        t.ledger_name || '',
        t.reference_number || t.cheque_number || '',
        t.type === 'debit' ? `₹${t.amount?.toLocaleString('en-IN')}` : '',
        (t.type==='credit'||t.type==='opening') ? `₹${t.amount?.toLocaleString('en-IN')}` : '',
        `₹${t.runningBalance?.toLocaleString('en-IN')}`,
      ]),
    });
    doc.save('transactions.pdf');
  };

  /* ────────────────── RENDER ────────────────── */
  return (
    <TooltipProvider delayDuration={0}>
      <FontStyle />
      <div data-txn-root className="space-y-6 pb-24 px-1">

        {/* ══ PAGE HEADER ══ */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-5 pt-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-[3px] h-5 bg-slate-800 rounded-full" />
              <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">
                Transactions
              </h1>
            </div>
            <p className="text-[12px] text-slate-400 font-medium ml-[18px] tracking-wide">
              {filterAccount === 'all'
                ? `${filteredTransactions.length} records across all accounts`
                : `${filteredTransactions.length} records · ${currentAccount?.account_name}`}
            </p>
          </div>

          {/* ── Summary Cards ── */}
          <div className="flex items-center gap-2.5">
            <StatCard label="Total Inflow"  value={totalInflow}  colorClass="text-emerald-600" />
            <StatCard label="Total Outflow" value={totalOutflow} colorClass="text-rose-500" />
            <StatCard
              label="Net Balance"
              value={Math.abs(netBalance)}
              colorClass={netBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}
              prefix={netBalance >= 0 ? '₹' : '-₹'}
            />
          </div>
        </div>

        {/* ══ FILTER BAR ══ */}
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm flex flex-col lg:flex-row items-center gap-3 justify-between">
          {/* Left filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <FilterSelect value={filterAccount} onValueChange={setFilterAccount} placeholder="All Accounts" width="w-48">
              <SelectItem value="all" className="text-[13px]">All Accounts</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id} className="text-[13px]">{acc.account_name}</SelectItem>
              ))}
            </FilterSelect>

            <FilterSelect value={filterType} onValueChange={setFilterType} placeholder="All Types" width="w-36">
              <SelectItem value="all"    className="text-[13px]">All Types</SelectItem>
              <SelectItem value="credit" className="text-[13px] text-emerald-600 font-medium">Credit</SelectItem>
              <SelectItem value="debit"  className="text-[13px] text-rose-500 font-medium">Debit</SelectItem>
            </FilterSelect>

            {/* Date range */}
            <div className="flex items-center gap-1.5 h-9 bg-slate-50 border border-slate-200 rounded-lg px-3">
              <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="bg-transparent border-none outline-none text-[12px] font-medium text-slate-600 w-28"
              />
              <span className="text-slate-300 text-sm">–</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="bg-transparent border-none outline-none text-[12px] font-medium text-slate-600 w-28"
              />
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setFilterAccount('all'); setFilterType('all');
                  setFilterCategory('all'); setFilterDateFrom('');
                  setFilterDateTo(''); setSearchTerm('');
                }}
                className="text-[12px] font-medium text-rose-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Right: search + actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search transactions…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-9 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300"
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[11px] font-medium">
                Sort {sortOrder === 'desc' ? 'Oldest first' : 'Newest first'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={exportPDF}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[11px] font-medium">Export PDF</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => navigate('/import')}
                  className="h-9 w-9 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[11px] font-medium">Add Transaction</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ══ TABLE ══ */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <div className="h-8 w-8 border-[3px] border-slate-200 border-t-slate-700 rounded-full animate-spin" />
              <p className="text-[13px] font-medium text-slate-400">Loading transactions…</p>
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <Scale className="h-9 w-9 text-slate-200" />
              <div className="text-center">
                <p className="text-[15px] font-semibold text-slate-700">No transactions found</p>
                <p className="text-[13px] text-slate-400 mt-1">Try adjusting your filters or search query</p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto max-h-[620px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="border-b border-slate-100">
                    <TH>Date</TH>
                    <TH>Particulars</TH>
                    <TH>Ledger</TH>
                    <TH>Ref / Chq</TH>
                    <TH>Category</TH>
                    <TH align="right">Debit</TH>
                    <TH align="right">Credit</TH>
                    <TH align="right">Balance</TH>
                    <TH align="right" className="w-20">Actions</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayTransactions.map((txn) => {
                    const isDebit   = txn.type === 'debit';
                    const isCredit  = txn.type === 'credit' || txn.type === 'opening';
                    const isOpening = txn.type === 'opening';

                    return (
                      <tr
                        key={txn.id}
                        className="group hover:bg-slate-50/70 transition-colors duration-100"
                      >
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[12px] font-medium text-slate-500">
                            {formatDisplayDate(txn.date)}
                          </span>
                        </td>

                        {/* Particulars */}
                        <td className="px-4 py-3 max-w-[240px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13.5px] font-semibold text-slate-800 leading-snug truncate">
                              {txn.description}
                            </span>
                            {txn.notes && (
                              <span className="text-[11px] text-slate-400 font-normal truncate">
                                {txn.notes}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Ledger */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {txn.ledger_name ? (
                            <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-md tracking-wide">
                              {txn.ledger_name}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[12px]">—</span>
                          )}
                        </td>

                        {/* Ref */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[11.5px] text-slate-400">
                            {txn.reference_number || txn.cheque_number || '—'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className="inline-block border border-slate-200 text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-md">
                            {getCategoryName(txn.category_id)}
                          </span>
                        </td>

                        {/* Debit */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isDebit && (
                            <span className="text-[13.5px] font-semibold text-rose-500">
                              ₹{txn.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>

                        {/* Credit */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isCredit && (
                            <span className="text-[13.5px] font-semibold text-emerald-600">
                              ₹{txn.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>

                        {/* Balance */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-[13.5px] font-semibold text-slate-700">
                            ₹{txn.runningBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center gap-1">
                            {!isOpening ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => { setEditingTransaction(txn); setEditCategory(txn.category_id || ''); }}
                                      className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-[11px] font-medium">Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => { setTransactionToDelete(txn.id); setDeleteConfirmOpen(true); }}
                                      className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-[11px] font-medium">Delete</TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-7 w-7 flex items-center justify-center text-slate-200">
                                    <Scale className="h-3.5 w-3.5" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-[11px] font-medium">Opening Balance</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* ── Footer totals row ── */}
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {displayTransactions.length} transactions
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-bold text-rose-500">
                        ₹{totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-bold text-emerald-600">
                        ₹{totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[13px] font-bold ${netBalance >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>
                        ₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ══ DELETE CONFIRM ══ */}
        <ConfirmPopup
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Transaction"
          description="Are you sure you want to delete this transaction? This action cannot be undone."
        />

        {/* ══ EDIT DIALOG ══ */}
        <Dialog open={!!editingTransaction} onOpenChange={open => !open && setEditingTransaction(null)}>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border border-slate-100 shadow-2xl bg-white">
            <div className="border-b border-slate-100 px-7 py-5">
              <DialogHeader>
                <DialogTitle className="text-[17px] font-bold text-slate-900 tracking-tight">
                  Edit Transaction
                </DialogTitle>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  ID · {editingTransaction?.id?.slice(0, 12)}…
                </p>
              </DialogHeader>
            </div>

            {editingTransaction && (
              <div className="px-7 py-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Particulars</Label>
                    <Input
                      value={editingTransaction.description}
                      onChange={e => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="text-[13px]">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ledger</Label>
                    <Input
                      value={editingTransaction.ledger_name || ''}
                      onChange={e => setEditingTransaction({ ...editingTransaction, ledger_name: e.target.value })}
                      placeholder="e.g. Cash, HDFC"
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</Label>
                    <Input
                      type="date"
                      value={editingTransaction.date}
                      onChange={e => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</Label>
                    <Input
                      type="number"
                      value={editingTransaction.amount}
                      onChange={e => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ref No.</Label>
                    <Input
                      value={editingTransaction.reference_number || ''}
                      onChange={e => setEditingTransaction({ ...editingTransaction, reference_number: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chq No.</Label>
                    <Input
                      value={editingTransaction.cheque_number || ''}
                      onChange={e => setEditingTransaction({ ...editingTransaction, cheque_number: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notes</Label>
                  <Input
                    value={editingTransaction.notes || ''}
                    onChange={e => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                    placeholder="Additional context…"
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="px-7 py-4 border-t border-slate-100 bg-slate-50/60 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setEditingTransaction(null)}
                className="h-9 px-5 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTransaction}
                className="h-9 px-6 text-[13px] font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
};

export default Transactions;