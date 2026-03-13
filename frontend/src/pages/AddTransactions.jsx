import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine, Download, FileSpreadsheet, FileText, Upload, X, CheckCircle2,
  AlertCircle, ArrowRight, Plus, Loader2, GripVertical, Info, CalendarDays, IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const headerMap = {
  Date: ["date", "transaction date", "txn date", "tran date", "posting date"],
  ValueDate: ["value date", "val date"],
  Description: ["description", "narration", "remarks", "particulars", "details", "transaction details", "transaction remarks"],
  Debit: ["debit", "withdrawal", "debit amount", "dr", "withdrawal amt", "amount out"],
  Credit: ["credit", "deposit", "credit amount", "cr", "deposit amt", "amount in"],
  Amount: ["amount", "transaction amount"],
  Balance: ["balance", "closing balance", "running balance", "available balance"],
  'Account Holder': ["account holder", "account holder name", "account name", "customer name", "name"],
  'Bank Name': ["bank", "bank name", "banking institution"],
  'Account Number': ["account number", "a/c number", "account no", "account no.", "acct number"],
  'Transaction ID': ["transaction id", "txn id", "reference id", "ref id", "utr", "utr number", "rrn"],
  'Transaction Number': ["transaction number", "txn number", "transaction no", "txn no", "transaction #"],
  'Cheque Number': ["cheque number", "cheque no", "chq no", "cheque #", "chq number"],
  Reference: ["reference", "ref no", "reference no", "reference number", "chq/ref no"],
  Branch: ["branch", "branch name"],
  Category: ["category", "transaction category"],
  Notes: ["notes", "comments", "remarks notes"]
};

// Extracted from the keys of the headerMap
const SYSTEM_FIELDS = Object.keys(headerMap);

const TAB_META = [
  { value: 'manual',   label: 'Manual Entry',           icon: PenLine },
  { value: 'template', label: 'Bulk Entry Template',     icon: Download },
  { value: 'csv',      label: 'Import CSV / Excel',      icon: FileSpreadsheet },
  { value: 'pdf',      label: 'Bank Statement (PDF)',     icon: FileText },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const result = [];
  let row = [];
  let current = '';
  let inQuotes = false;
  
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current.trim());
        current = '';
      } else if (char === '\n') {
        row.push(current.trim());
        result.push(row);
        row = [];
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  if (current || row.length > 0) {
    row.push(current.trim());
    result.push(row);
  }

  if (result.length < 1) return { headers: [], rows: [] };
  const headers = result[0];
  const rows = result.slice(1).filter(r => r.some(v => v));
  return { headers, rows };
};

const autoMapHeaders = (fileHeaders) => {
  const mapping = {};
  fileHeaders.forEach(h => {
    const lower = h.toLowerCase().trim();
    for (const [field, keywords] of Object.entries(headerMap)) {
      if (keywords.includes(lower)) { mapping[h] = field; break; }
    }
  });
  return mapping;
};

const downloadTemplate = () => {
  const headers = 'Date,Description,Debit,Credit,Balance';
  const sample1 = '2026-01-15,Office Rent Payment,25000,,475000';
  const sample2 = '2026-01-16,Client Invoice Payment,,150000,625000';
  const sample3 = '2026-01-17,Electricity Bill,3500,,621500';
  const csv = [headers, sample1, sample2, sample3].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vitta_transaction_template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Drop Zone Component (defined OUTSIDE main component) ────────────────────
const DropZone = ({ accept, onFile, file, label, sublabel, loading }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300
        ${dragOver
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : file
            ? 'border-green-300 bg-green-50/50'
            : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-200
        ${file ? 'bg-green-100' : 'bg-primary/10'}`}>
        {loading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : file ? (
          <FileText className="h-8 w-8 text-green-600" />
        ) : (
          <Upload className="h-8 w-8 text-primary" />
        )}
      </div>
      {file ? (
        <div>
          <p className="font-semibold text-slate-900 mb-1">{file.name}</p>
          <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      ) : (
        <div>
          <p className="font-semibold text-slate-800 mb-1">{label}</p>
          <p className="text-sm text-slate-500">{sublabel}</p>
        </div>
      )}
      {dragOver && (
        <div className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center">
          <p className="font-semibold text-primary text-lg">Drop file here</p>
        </div>
      )}
    </div>
  );
};

// ─── Preview Table Component (defined OUTSIDE main component) ────────────────
const PreviewTable = ({ headers, rows, maxRows = 10 }) => {
  const display = rows.slice(0, maxRows);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10">#</th>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {display.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">{ri + 1}</td>
              {headers.map((_, ci) => (
                <td key={ci} className="px-4 py-3 text-slate-700 whitespace-nowrap">{row[ci] || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div className="px-4 py-3 bg-slate-50 text-center text-sm text-slate-500 border-t border-slate-200">
          Showing {maxRows} of {rows.length} rows
        </div>
      )}
    </div>
  );
};

// ─── Column Mapping Modal (defined OUTSIDE main component) ───────────────────
const ColumnMappingModal = ({ open, onClose, fileHeaders, mapping, setMapping, customFields, setCustomFields, onConfirm }) => {
  const [newFieldName, setNewFieldName] = useState('');
  const allFields = [...SYSTEM_FIELDS, ...customFields];

  const addCustomField = () => {
    const name = newFieldName.trim();
    if (!name) return;
    if (allFields.includes(name)) { toast.error('Field already exists'); return; }
    setCustomFields(prev => [...prev, name]);
    setNewFieldName('');
    toast.success(`Added field: ${name}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Map Your Columns
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">Match each column from your file to a system field</p>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <div className="grid grid-cols-[1fr,40px,1fr] items-center gap-2 px-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your File Column</p>
            <div />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Map to Field</p>
          </div>

          {fileHeaders.map((header, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="grid grid-cols-[1fr,40px,1fr] items-center gap-2 p-2 rounded-lg bg-slate-50/80 hover:bg-slate-100 transition-colors"
            >
              <div className="font-medium text-sm text-slate-800 truncate px-3 py-2 bg-white rounded-md border border-slate-200">
                {header}
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <Select
                value={mapping[header] || 'skip'}
                onValueChange={(val) => setMapping(prev => ({ ...prev, [header]: val === 'skip' ? undefined : val }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Skip this column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">
                    <span className="text-slate-400">— Skip —</span>
                  </SelectItem>
                  {allFields.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add New Field</p>
          <div className="flex gap-2">
            <Input
              value={newFieldName}
              onChange={e => setNewFieldName(e.target.value)}
              placeholder="e.g. Category, Tags, Notes..."
              className="flex-1 text-sm"
              onKeyDown={e => e.key === 'Enter' && addCustomField()}
            />
            <Button size="sm" variant="outline" onClick={addCustomField} className="shrink-0">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} className="bg-primary hover:bg-primary/90 text-white">
            Confirm Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const AddTransactions = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [categories, setCategories] = useState([]);

  // Manual Entry State
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'debit',
    amount: '',
    category_id: '',
  });
  const [manualCustomFields, setManualCustomFields] = useState([]); // Array of { key: '', value: '' }
  const [manualErrors, setManualErrors] = useState({});
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvMapping, setCsvMapping] = useState({});
  const [csvCustomFields, setCsvCustomFields] = useState([]);
  const [csvMappingOpen, setCsvMappingOpen] = useState(false);
  const [csvStep, setCsvStep] = useState('upload');
  const [csvImporting, setCsvImporting] = useState(false);

  // Template Import State
  const [templateFile, setTemplateFile] = useState(null);
  const [templateParsing, setTemplateParsing] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [templateStep, setTemplateStep] = useState('download');
  const [templateImporting, setTemplateImporting] = useState(false);

  // PDF Import State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfStep, setPdfStep] = useState('upload');

  // Recent manual transactions
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories'),
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      if (accRes.data.length > 0) setSelectedAccount(accRes.data[0].id);
    } catch {
      toast.error('Failed to load data');
    }
  };

  // ──── Manual Entry logic ────
  const validateManual = () => {
    const errs = {};
    if (!manualForm.date) errs.date = 'Date is required';
    if (!manualForm.description.trim()) errs.description = 'Description is required';
    if (!manualForm.amount) errs.amount = 'Amount is required';
    if (manualForm.amount && isNaN(Number(manualForm.amount))) errs.amount = 'Invalid number';
    if (Number(manualForm.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!selectedAccount) errs.account = 'Select a bank account';
    setManualErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!validateManual()) return;
    setManualSubmitting(true);
    try {
      const payload = {
        account_id: selectedAccount,
        date: manualForm.date,
        description: manualForm.description.trim(),
        amount: Number(manualForm.amount),
        type: manualForm.type,
        category_id: manualForm.category_id || null,
        metadata: manualCustomFields.reduce((acc, curr) => {
          if (curr.key && curr.value) acc[curr.key] = curr.value;
          return acc;
        }, {})
      };
      const res = await api.post('/transactions', payload);
      toast.success('Transaction added successfully!');
      setRecentTransactions(prev => [res.data, ...prev].slice(0, 5));
      setManualForm({
        date: new Date().toISOString().split('T')[0],
        description: '', type: 'debit', amount: '', category_id: '',
      });
      setManualCustomFields([]);
      setManualErrors({});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add transaction');
    } finally {
      setManualSubmitting(false);
    }
  };

  const clearManualForm = () => {
    setManualForm({
      date: new Date().toISOString().split('T')[0],
      description: '', type: 'debit', amount: '', category_id: '',
    });
    setManualCustomFields([]);
    setManualErrors({});
  };

  // ──── Template logic ────
  const handleTemplateFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) { toast.error('Please upload a CSV or Excel file'); return; }
    setTemplateFile(file);
    if (ext !== 'csv') {
      // For Excel files, we can't easily parse on frontend without a library,
      // so we'll just skip the preview and let them import directly.
      setTemplateStep('preview-excel');
      return;
    }
    setTemplateParsing(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.rows.length === 0) { toast.error('No data rows found'); setTemplateParsing(false); return; }
      setTemplateData(parsed);
      setTemplateStep('preview');
    } catch (err) { 
      console.error(err);
      toast.error('Failed to parse CSV file'); 
    } finally { setTemplateParsing(false); }
  };

  const handleTemplateImport = async () => {
    if (!templateData || !selectedAccount) return;
    setTemplateImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', templateFile);
      const res = await api.post(`/import/csv?account_id=${selectedAccount}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setTemplateStep('done');
    } catch (err) { toast.error(err.response?.data?.detail || 'Import failed'); }
    finally { setTemplateImporting(false); }
  };

  const resetTemplate = () => { setTemplateFile(null); setTemplateData(null); setTemplateStep('download'); };

  // ──── CSV logic ────
  const handleCsvFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) { toast.error('Please upload a CSV or Excel file'); return; }
    setCsvFile(file);
    if (ext !== 'csv') {
      setCsvStep('preview-excel');
      return;
    }
    setCsvParsing(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.rows.length === 0) { toast.error('No data rows found'); setCsvParsing(false); return; }
      setCsvData(parsed);
      const autoMap = autoMapHeaders(parsed.headers);
      setCsvMapping(autoMap);
      const mapped = Object.values(autoMap);
      if (mapped.includes('Date') && mapped.includes('Description')) {
        setCsvStep('preview');
        toast.success('Columns auto-detected!');
      } else {
        setCsvMappingOpen(true);
      }
    } catch { toast.error('Failed to parse file'); }
    finally { setCsvParsing(false); }
  };

  const getMappedPreviewData = () => {
    if (!csvData) return { headers: [], rows: [] };
    const mappedHeaders = csvData.headers.map(h => csvMapping[h] || h);
    return { headers: mappedHeaders, rows: csvData.rows };
  };

  const handleCsvImport = async () => {
    if (!csvFile || !selectedAccount) return;
    setCsvImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await api.post(`/import/csv?account_id=${selectedAccount}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setCsvStep('done');
    } catch (err) { toast.error(err.response?.data?.detail || 'Import failed'); }
    finally { setCsvImporting(false); }
  };

  const resetCsv = () => { setCsvFile(null); setCsvData(null); setCsvMapping({}); setCsvCustomFields([]); setCsvStep('upload'); };

  // ──── PDF logic ────
  const handlePdfFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) { toast.error('Please upload a PDF file'); return; }
    setPdfFile(file);
  };

  const handlePdfImport = async () => {
    if (!pdfFile || !selectedAccount) return;
    setPdfImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      const res = await api.post(`/import/csv?account_id=${selectedAccount}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setPdfStep('done');
    } catch (err) { toast.error(err.response?.data?.detail || 'PDF parsing failed'); }
    finally { setPdfImporting(false); }
  };

  const resetPdf = () => { setPdfFile(null); setPdfStep('upload'); };

  // ──── Shared account selector JSX ────
  const renderAccountSelector = () => (
    <div className="mb-6">
      <Label className="text-sm font-medium text-slate-700 mb-2 block">Select Bank Account</Label>
      {accounts.length > 0 ? (
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="max-w-md" data-testid="account-select">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.account_name} — {acc.bank_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">No bank accounts found</p>
            <p className="text-sm text-amber-700">Please add a bank account from the Accounts page first.</p>
          </div>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // ─── RENDER ────────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div data-testid="add-transactions-page" className="max-w-5xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <h2 className="font-heading font-bold text-2xl text-primary mb-1">Add Transactions</h2>
        <p className="text-slate-500 text-sm">Add or import transactions using multiple methods</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-slate-200/50 backdrop-blur-sm p-1.5 rounded-2xl mb-8 border border-slate-200/60">
            {TAB_META.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all z-10
                    data-[state=active]:text-primary data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=active]:bg-transparent"
                >
                  <tab.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-pill"
                      className="absolute inset-0 bg-white rounded-xl -z-10 border border-slate-100"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-10"
            >
              {/* Manual Entry */}
              <TabsContent value="manual" className="mt-0 focus-visible:ring-0 outline-none">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="h-10 w-1 rounded-full bg-primary mb-0" />
                    <h3 className="text-xl font-bold text-slate-800">New Transaction</h3>
                  </div>
                  {renderAccountSelector()}

                <form onSubmit={handleManualSubmit} className="bg-slate-50/50 p-6 sm:p-8 rounded-2xl border border-slate-100 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Date */}
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Date</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input
                          type="date"
                          value={manualForm.date}
                          onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))}
                          className={`pl-10 bg-white ${manualErrors.date ? 'border-red-400 focus:ring-red-400' : ''}`}
                        />
                      </div>
                      {manualErrors.date && <p className="text-xs text-red-500 mt-1">{manualErrors.date}</p>}
                    </div>

                    {/* Category */}
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                        Category <span className="text-slate-400 font-normal">(optional)</span>
                      </Label>
                      <Select
                        value={manualForm.category_id || 'none'}
                        onValueChange={val => setManualForm(p => ({ ...p, category_id: val === 'none' ? '' : val }))}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-slate-400">— None —</span>
                          </SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</Label>
                    <Input
                      placeholder="e.g. Office rent payment, Client invoice..."
                      value={manualForm.description}
                      onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                      className={`bg-white ${manualErrors.description ? 'border-red-400' : ''}`}
                    />
                    {manualErrors.description && <p className="text-xs text-red-500 mt-1">{manualErrors.description}</p>}
                  </div>

                  {/* Type & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Transaction Type</Label>
                      <Select
                        value={manualForm.type}
                        onValueChange={val => setManualForm(p => ({ ...p, type: val }))}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debit">Money Out (Debit)</SelectItem>
                          <SelectItem value="credit">Money In (Credit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                        Amount <span className="text-slate-400 font-normal">(₹)</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IndianRupee className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={manualForm.amount}
                          onChange={e => setManualForm(p => ({ ...p, amount: e.target.value }))}
                          className={`pl-9 bg-white ${manualErrors.amount ? 'border-red-400' : ''}`}
                        />
                      </div>
                      {manualErrors.amount && <p className="text-xs text-red-500 mt-1">{manualErrors.amount}</p>}
                    </div>
                  </div>

                  {/* Custom / Additional Fields */}
                  {manualCustomFields.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-700">Additional Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {manualCustomFields.map((field, index) => (
                          <div key={index} className="flex flex-col gap-1.5 p-3 bg-white rounded-xl border border-slate-100 relative group">
                            <Input
                              placeholder="Field Name (e.g. Reference)"
                              value={field.key} 
                              onChange={(e) => {
                                const newFields = [...manualCustomFields];
                                newFields[index].key = e.target.value;
                                setManualCustomFields(newFields);
                              }}
                              className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-transparent border-0 border-b border-transparent placeholder:normal-case p-0 h-6 focus-visible:ring-0 focus-visible:border-primary"
                            />
                            <Input
                              placeholder="Value..."
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...manualCustomFields];
                                newFields[index].value = e.target.value;
                                setManualCustomFields(newFields);
                              }}
                              className="bg-transparent border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                            />
                            <button 
                              type="button" 
                              onClick={() => setManualCustomFields(prev => prev.filter((_, i) => i !== index))}
                              className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/60 mt-6">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={manualSubmitting || !selectedAccount}
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-5 text-sm font-semibold rounded-xl"
                      >
                        {manualSubmitting ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Add Transaction</>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={clearManualForm} className="rounded-xl py-5 bg-white">
                        Clear Form
                      </Button>
                    </div>

                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-primary font-medium hover:bg-primary/10 rounded-xl"
                      onClick={() => setManualCustomFields(prev => [...prev, { key: '', value: '' }])}
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Add Custom Field
                    </Button>
                  </div>
                </form>

                {/* Recent Transactions */}
                <AnimatePresence>
                  {recentTransactions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 pt-6 border-t border-slate-200"
                    >
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Recently Added
                      </h4>
                      <div className="space-y-2">
                        {recentTransactions.map((txn, idx) => (
                          <motion.div
                            key={txn.id || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-3 bg-green-50/60 rounded-lg border border-green-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 font-mono">{txn.date}</span>
                              <span className="text-sm text-slate-800">{txn.description}</span>
                            </div>
                            <span className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {txn.type === 'credit' ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN')}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

              {/* Bulk Entry Template */}
              <TabsContent value="template" className="mt-0 focus-visible:ring-0 outline-none">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="h-10 w-1 rounded-full bg-primary mb-0" />
                    <h3 className="text-xl font-bold text-slate-800">Bulk Template Upload</h3>
                  </div>
                  {renderAccountSelector()}

                {/* Step 1: Download Template */}
                <div className="p-5 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl border border-primary/10">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">Step 1: Download Template</h4>
                      <p className="text-sm text-slate-500 mb-3">
                        Download the template, add your transactions in Excel, and upload the file to import them.
                      </p>
                      <Button onClick={downloadTemplate} variant="outline" className="rounded-xl">
                        <Download className="h-4 w-4 mr-2" /> Download Excel Template
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Upload filled template */}
                {templateStep === 'download' && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Step 2: Upload Filled Template</h4>
                    <DropZone
                      accept=".csv,.xls,.xlsx"
                      onFile={handleTemplateFile}
                      file={templateFile}
                      loading={templateParsing}
                      label="Drop your filled template here"
                      sublabel="CSV, XLS, or XLSX files"
                    />
                  </div>
                )}

                {/* Step 3: Preview */}
                {templateStep === 'preview' && templateData && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">Preview ({templateData.rows.length} transactions)</h4>
                      <Button variant="ghost" size="sm" onClick={resetTemplate}>
                        <X className="h-4 w-4 mr-1" /> Reset
                      </Button>
                    </div>
                    <PreviewTable headers={templateData.headers} rows={templateData.rows} />
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={handleTemplateImport}
                        disabled={templateImporting}
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-5 rounded-xl"
                      >
                        {templateImporting ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                        ) : (
                          <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Import</>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetTemplate} className="rounded-xl py-5">Cancel</Button>
                    </div>
                  </motion.div>
                )}

                {/* Excel Preview (Direct Import) */}
                {templateStep === 'preview-excel' && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <FileText className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
                    <h4 className="font-semibold text-slate-900 mb-1">Excel File Ready</h4>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                      Excel files cannot be previewed on the dashboard, but you can import them directly. We recommend using the CSV format for mapping and previewing.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={handleTemplateImport} disabled={templateImporting} className="bg-primary hover:bg-primary/90 py-5 px-8">
                        {templateImporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : "Import Excel File Now"}
                      </Button>
                      <Button variant="outline" onClick={resetTemplate}>Choose Another</Button>
                    </div>
                  </motion.div>
                )}

                {/* Done */}
                {templateStep === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-green-800 text-lg mb-1">Import Successful!</p>
                    <p className="text-sm text-green-600 mb-4">Your transactions have been imported.</p>
                    <Button variant="outline" onClick={resetTemplate} className="rounded-xl">Import More</Button>
                  </motion.div>
                )}
              </div>
            </TabsContent>

              {/* Import CSV / Excel */}
              <TabsContent value="csv" className="mt-0 focus-visible:ring-0 outline-none">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="h-10 w-1 rounded-full bg-primary mb-0" />
                    <h3 className="text-xl font-bold text-slate-800">Import CSV & Excel</h3>
                  </div>
                  {renderAccountSelector()}

                {csvStep === 'upload' && (
                  <>
                    <DropZone
                      accept=".csv,.xls,.xlsx"
                      onFile={handleCsvFile}
                      file={csvFile}
                      loading={csvParsing}
                      label="Drag & drop your CSV or Excel file"
                      sublabel="CSV, XLS, or XLSX files supported"
                    />
                    <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-xl flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Smart Column Detection</p>
                        <p>We'll automatically detect your columns. If we can't match them, you'll be able to map them manually.</p>
                      </div>
                    </div>
                  </>
                )}

                {csvStep === 'preview' && csvData && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">
                        Import Preview ({csvData.rows.length} transactions)
                      </h4>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setCsvMappingOpen(true)}>
                          <GripVertical className="h-4 w-4 mr-1" /> Edit Mapping
                        </Button>
                        <Button variant="ghost" size="sm" onClick={resetCsv}>
                          <X className="h-4 w-4 mr-1" /> Reset
                        </Button>
                      </div>
                    </div>

                    {/* Column mapping pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {csvData.headers.map((h, i) => {
                        const mapped = csvMapping[h];
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                              ${mapped
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                          >
                            {h}
                            {mapped && <><ArrowRight className="h-3 w-3" />{mapped}</>}
                          </span>
                        );
                      })}
                    </div>

                    <PreviewTable headers={getMappedPreviewData().headers} rows={getMappedPreviewData().rows} />

                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={handleCsvImport}
                        disabled={csvImporting}
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-5 rounded-xl"
                      >
                        {csvImporting ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                        ) : (
                          <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Import</>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetCsv} className="rounded-xl py-5">Cancel</Button>
                    </div>
                  </motion.div>
                )}

                {/* Excel Preview Fallback */}
                {csvStep === 'preview-excel' && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <FileSpreadsheet className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
                    <h4 className="font-semibold text-slate-900 mb-1">Spreadsheet Ready</h4>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                      Direct preview for Excel is coming soon. You can import the file directly now, or convert it to CSV to map your columns manually.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={handleCsvImport} disabled={csvImporting} className="bg-primary hover:bg-primary/90 py-5 px-8">
                        {csvImporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : "Import Spreadsheet Now"}
                      </Button>
                      <Button variant="outline" onClick={resetCsv}>Choose Another</Button>
                    </div>
                  </motion.div>
                )}

                {csvStep === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-green-800 text-lg mb-1">Import Successful!</p>
                    <p className="text-sm text-green-600 mb-4">Your transactions have been imported.</p>
                    <Button variant="outline" onClick={resetCsv} className="rounded-xl">Import More</Button>
                  </motion.div>
                )}

                {/* Column Mapping Modal */}
                <ColumnMappingModal
                  open={csvMappingOpen}
                  onClose={() => setCsvMappingOpen(false)}
                  fileHeaders={csvData?.headers || []}
                  mapping={csvMapping}
                  setMapping={setCsvMapping}
                  customFields={csvCustomFields}
                  setCustomFields={setCsvCustomFields}
                  onConfirm={() => { setCsvMappingOpen(false); setCsvStep('preview'); }}
                />
              </div>
            </TabsContent>

              {/* Bank Statement (PDF) */}
              <TabsContent value="pdf" className="mt-0 focus-visible:ring-0 outline-none">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="h-10 w-1 rounded-full bg-primary mb-0" />
                    <h3 className="text-xl font-bold text-slate-800">PDF Bank Statement</h3>
                  </div>
                  {renderAccountSelector()}

                {pdfStep === 'upload' && (
                  <>
                    <DropZone
                      accept=".pdf"
                      onFile={handlePdfFile}
                      file={pdfFile}
                      loading={pdfParsing}
                      label="Drop your bank statement PDF"
                      sublabel="Text-based PDF files only"
                    />

                    {pdfFile && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                        <Button
                          onClick={handlePdfImport}
                          disabled={pdfImporting || !selectedAccount}
                          className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-semibold rounded-xl"
                        >
                          {pdfImporting ? (
                            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Parsing & Importing...</>
                          ) : (
                            <><Upload className="h-5 w-5 mr-2" /> Parse & Import Transactions</>
                          )}
                        </Button>
                      </motion.div>
                    )}

                    <div className="p-4 bg-amber-50/80 border border-amber-100 rounded-xl flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Tips for Best Results</p>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                          <li>Use text-based PDF statements (not scanned images)</li>
                          <li>Works best with standard bank statement layouts</li>
                          <li>Ensure the statement has a clear transaction table</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {pdfStep === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-green-800 text-lg mb-1">Import Successful!</p>
                    <p className="text-sm text-green-600 mb-4">Transactions extracted from PDF and imported.</p>
                    <Button variant="outline" onClick={resetPdf} className="rounded-xl">Import Another Statement</Button>
                  </motion.div>
                )}
              </div>
            </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AddTransactions;
