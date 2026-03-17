import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine, Download, FileSpreadsheet, FileText, Upload, X, CheckCircle2,
  AlertCircle, ArrowRight, Plus, Loader2, GripVertical, Info, CalendarDays, IndianRupee, Tag,
  Scale, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import { useBlocker, useNavigate, useLocation } from 'react-router-dom';
import ConfirmPopup from '@/components/ConfirmPopup';

// ─── Constants ───────────────────────────────────────────────────────────────
const headerMap = {
  Date: ["date", "transaction date", "txn date", "tran date", "posting date", "date of transaction"],
  ValueDate: ["value date", "val date", "value_date"],
  Particulars: ["particulars", "description", "narration", "remarks", "details", "transaction details", "transaction remarks", "memo"],
  Debit: ["debit", "withdrawal", "debit amount", "dr", "withdrawal amt", "amount out", "dr amount", "dr_amount"],
  Credit: ["credit", "deposit", "credit amount", "cr", "deposit amt", "amount in", "cr amount", "cr_amount"],
  Amount: ["amount", "transaction amount", "txn amount", "total amount"],
  Balance: ["balance", "closing balance", "running balance", "available balance", "total balance"],
  'Ledger Name': ["ledger name", "ledger", "account", "account name"],
  'Account Holder Name': ["account holder name", "account holder", "customer name", "beneficiary name", "name"],
  'Bank Name': ["bank", "bank name", "banking institution", "bank_name", "bank_name_"],
  'Account Number': ["account number", "a/c number", "account no", "account no.", "acct number", "account_number"],
  'Transaction ID': ["transaction id", "txn id", "reference id", "ref id", "utr", "utr number", "rrn", "trans id", "transaction_id"],
  'Transaction Number': ["transaction number", "txn number", "transaction no", "txn no", "transaction #", "transaction_no"],
  'Cheque Number': ["cheque number", "cheque no", "chq no", "cheque #", "chq number", "cheque_no"],
  Reference: ["reference", "ref no", "reference no", "reference number", "chq/ref no", "reference_no"],
  Branch: ["branch", "branch name", "branch_name"],
  Group: ["group", "category", "transaction category", "category_name"],
  Notes: ["notes", "comments", "remarks notes"]
};

const METADATA_SUGGESTIONS = [
  { label: 'Reference ID', key: 'Reference ID' },
  { label: 'Payment Mode', key: 'Mode' },
  { label: 'Bill/Invoce #', key: 'Bill No' },
  { label: 'Merchant', key: 'Merchant' },
];

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
  const rows = result.slice(1).filter(r => r.some(v => v)).map(row => {
    const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date'));
    if (dateIdx !== -1 && row[dateIdx]) {
      row[dateIdx] = normalizeDate(row[dateIdx]);
    }
    return row;
  });
  return { headers, rows };
};

const parseExcel = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonData.length === 0) return { headers: [], rows: [] };
    const headers = jsonData[0].map(h => String(h || ''));
    const rows = jsonData.slice(1).filter(r => r && r.length > 0 && r.some(v => v !== null && v !== '')).map(row => {
      // Find date column index
      const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date'));
      if (dateIdx !== -1 && row[dateIdx]) {
        // If it's a number (Excel date), convert it
        if (typeof row[dateIdx] === 'number') {
          const date = new Date((row[dateIdx] - 25569) * 86400 * 1000);
          const d = String(date.getDate()).padStart(2, '0');
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const y = date.getFullYear();
          row[dateIdx] = `${d}-${m}-${y}`;
        } else {
          row[dateIdx] = normalizeDate(String(row[dateIdx]));
        }
      }
      return row;
    });
    return { headers, rows };
  } catch (err) {
    console.error('Excel parse error:', err);
    throw new Error('Failed to parse Excel file');
  }
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return dateStr;
  const str = String(dateStr).trim();
  if (!str) return str;

  // Handle Excel numeric date (if passed as string/number)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const val = parseFloat(str);
    const date = new Date((val - 25569) * 86400 * 1000);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }

  // Regex to match dates with any common separator (/, -, .)
  // Supports YYYY-MM-DD, DD-MM-YYYY, MM-DD-YYYY
  const match = str.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/);
  if (match) {
    let p1 = parseInt(match[1]);
    let p2 = parseInt(match[2]);
    let p3 = parseInt(match[3]);

    // Format: YYYY-MM-DD
    if (p1 > 1000) {
      return `${String(p3).padStart(2, '0')}-${String(p2).padStart(2, '0')}-${p1}`;
    }
    // Format: DD-MM-YYYY or MM-DD-YYYY
    if (p3 > 1000) {
      // Ambiguity check: if p2 > 12, it must be the day (MM-DD-YYYY)
      if (p2 > 12) {
        return `${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}-${p3}`;
      }
      // Otherwise, assume it's already DD-MM-YYYY (or if it's 01-01, both work)
      return `${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}-${p3}`;
    }
  }

  return str;
};

const autoMapHeaders = (fileHeaders) => {
  const mapping = {};
  fileHeaders.forEach(h => {
    // Normalize header: lowercase, Replace underscores/dots/dashes with space, trim, remove double spaces
    const normalized = String(h || '').toLowerCase().trim()
      .replace(/[._-]/g, ' ')
      .replace(/\s+/g, ' ');

    for (const [field, keywords] of Object.entries(headerMap)) {
      // Check for exact match or if normalized string is in keywords
      const foundMatch = keywords.some(k => k === normalized) || field.toLowerCase() === normalized;
      if (foundMatch) { 
        mapping[h] = field; 
        break; 
      }
    }
  });
  return mapping;
};

const downloadTemplate = () => {
  const headers = 'Date,Particulars,Debit,Credit,Group,Ledger Name';
  const sample1 = '2026-01-15,Office Rent Payment,25000,,Office Rent,HDFC Rent Account';
  const sample2 = '2026-01-16,Client Invoice Payment,,150000,Sales,SBI Current Account';
  const sample3 = '2026-01-17,Electricity Bill,3500,,Utilities,HDFC Expense Account';
  const csv = [headers, sample1, sample2, sample3].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'vitta_transaction_template.csv');
  document.body.appendChild(a);
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
            <div className="flex items-center justify-center gap-2 mb-1">
              <p className="font-semibold text-slate-900">{file.name}</p>
              {file.isGhost && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Recovered</span>
              )}
            </div>
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
const PreviewTable = ({ headers, rows, mapping = {}, maxRows = 12 }) => {
  const display = rows.slice(0, maxRows);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 w-12">#</th>
              {headers.map((h, i) => {
                const isMapped = mapping && mapping[h];
                return (
                  <th key={i} className="px-4 py-3 text-left border-r border-slate-100 last:border-0 group">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                        {h}
                      </span>
                      {isMapped && (
                        <span className="text-[9px] font-bold text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-2 w-2" /> {mapping[h]}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {display.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-4 py-3 text-slate-400 font-mono text-xs border-r border-slate-100 bg-slate-50/30 group-hover:bg-slate-100/50 transition-colors text-center">{ri + 1}</td>
                {headers.map((_, ci) => (
                  <td key={ci} className="px-4 py-3 text-slate-700 whitespace-nowrap border-r border-slate-100 last:border-0">
                    <span className="font-medium text-slate-600">{row[ci] || '—'}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <div className="px-6 py-4 bg-slate-50/50 text-center border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500">
            Previewing first {maxRows} of <span className="text-primary">{rows.length}</span> transactions
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Column Mapping Modal (defined OUTSIDE main component) ───────────────────
const ColumnMappingModal = ({ open, onClose, fileHeaders, mapping, setMapping, customFields, setCustomFields, onConfirm }) => {
  const [newFieldName, setNewFieldName] = useState('');
  const allFields = [...SYSTEM_FIELDS, ...customFields];

  // Identify all fields that are currently mapped
  const mappedValues = Object.values(mapping).filter(Boolean);

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
                  {allFields.map(f => {
                    const isAlreadyUsed = mappedValues.includes(f) && mapping[header] !== f;
                    if (isAlreadyUsed) return null;
                    return <SelectItem key={f} value={f}>{f}</SelectItem>;
                  })}
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
              placeholder="e.g. Group, Tags, Notes..."
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
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'manual');
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [categories, setCategories] = useState([]);
  const dateInputRef = useRef(null);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Manual Entry State
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'debit',
    amount: '',
    category_id: '',
    ledger_name: '',
    group_name: '',
    reference_number: '',
    cheque_number: '',
    notes: '',
    balance: '',
  });
  const [manualCustomFields, setManualCustomFields] = useState([]); // Array of { key: '', value: '' }
  const [manualErrors, setManualErrors] = useState({});
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Mismatch Popup State
  const [mismatchData, setMismatchData] = useState(null);
  const [mismatchConfirming, setMismatchConfirming] = useState(false);

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

  // Ghost File meta for session recovery
  const [csvFileMeta, setCsvFileMeta] = useState(null);
  const [templateFileMeta, setTemplateFileMeta] = useState(null);

  // Persistence Key
  const PERSIST_KEY = 'vitta_add_txn_state';

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(PERSIST_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.activeTab) setActiveTab(data.activeTab);
        if (data.manualForm) setManualForm(data.manualForm);
        if (data.manualCustomFields) setManualCustomFields(data.manualCustomFields);
        if (data.csvStep) setCsvStep(data.csvStep);
        if (data.csvData) setCsvData(data.csvData);
        if (data.csvMapping) setCsvMapping(data.csvMapping);
        if (data.csvCustomFields) setCsvCustomFields(data.csvCustomFields);
        if (data.templateStep) setTemplateStep(data.templateStep);
        if (data.templateData) setTemplateData(data.templateData);
        if (data.csvFileMeta) setCsvFileMeta(data.csvFileMeta);
        if (data.templateFileMeta) setTemplateFileMeta(data.templateFileMeta);
        if (data.pdfStep) setPdfStep(data.pdfStep);
      } catch (err) {
        console.error('Failed to load persisted state:', err);
      }
    }
  }, []);

  // Save state to localStorage on any change
  useEffect(() => {
    const state = {
      activeTab,
      manualForm,
      manualCustomFields,
      csvStep,
      csvData,
      csvMapping,
      csvCustomFields,
      templateStep,
      templateData,
      csvFileMeta,
      templateFileMeta,
      pdfStep,
    };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  }, [activeTab, manualForm, manualCustomFields, csvStep, csvData, csvMapping, csvCustomFields, templateStep, templateData, csvFileMeta, templateFileMeta, pdfStep]);

  // Handle Manual Balance Auto-calculation
  useEffect(() => {
    if (selectedAccount && activeTab === 'manual') {
      const account = accounts.find(a => a.id === selectedAccount);
      if (account) {
        const amount = Number(manualForm.amount) || 0;
        const newBalance = account.balance + (manualForm.type === 'credit' ? amount : -amount);
        setManualForm(prev => ({ ...prev, balance: newBalance.toFixed(2) }));
      }
    }
  }, [selectedAccount, manualForm.amount, manualForm.type, accounts, activeTab]);

  const isDirty = useCallback(() => {
    const initialManual = {
      date: new Date().toISOString().split('T')[0],
      description: '',
      type: 'debit',
      amount: '',
      category_id: '',
      balance: '',
    };
    
    const manualDirty = 
      manualForm.description !== '' || 
      manualForm.amount !== '' || 
      manualForm.category_id !== '' || 
      manualCustomFields.length > 0;
    const csvDirty = csvStep !== 'upload' || csvFile !== null;
    const templateDirty = templateStep !== 'download' || templateFile !== null;
    const pdfDirty = pdfFile !== null;

    return manualDirty || csvDirty || templateDirty || pdfDirty;
  }, [manualForm, manualCustomFields, csvStep, csvFile, templateStep, templateFile, pdfFile]);

  // Route protection
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty() && currentLocation.pathname !== nextLocation.pathname
  );

  // Tab change protection
  const [pendingTab, setPendingTab] = useState(null);
  const handleTabChange = (val) => {
    if (isDirty()) {
      setPendingTab(val);
    } else {
      setActiveTab(val);
    }
  };

  const confirmDiscard = () => {
    // Clear state
    localStorage.removeItem(PERSIST_KEY);
    
    // Reset all states
    setCsvFile(null);
    setCsvData(null);
    setCsvMapping({});
    setCsvStep('upload');
    setCsvFileMeta(null);
    
    setTemplateFile(null);
    setTemplateData(null);
    setTemplateStep('download');
    setTemplateFileMeta(null);
    
    
    setPdfFile(null);
    setPdfStep('upload');
    
    setManualForm({
      date: new Date().toISOString().split('T')[0],
      description: '', type: 'debit', amount: '', category_id: '', balance: '',
    });
    setManualCustomFields([]);
    
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelDiscard = () => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setPendingTab(null);
  };



  // Recent manual transactions
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [accRes, catRes, clRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories'),
        api.get('/clients'),
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      setClients(clRes.data);
      if (accRes.data.length > 0) setSelectedAccount(accRes.data[0].id);
    } catch {
      toast.error('Failed to load data');
    }
  };

  // ──── Manual Entry logic ────
  const validateManual = () => {
    const errs = {};
    if (!manualForm.date) errs.date = 'Date is required';
    if (!manualForm.description.trim()) errs.description = 'Particulars are required';
    if (!manualForm.amount) errs.amount = 'Amount is required';
    if (manualForm.amount && isNaN(Number(manualForm.amount))) errs.amount = 'Invalid number';
    if (Number(manualForm.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!selectedAccount) errs.account = 'Select a bank account';
    setManualErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleManualSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
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
        ledger_name: manualForm.ledger_name || null,
        group_name: manualForm.group_name || null,
        reference_number: manualForm.reference_number || null,
        cheque_number: manualForm.cheque_number || null,
        notes: manualForm.notes || null,
        metadata: manualCustomFields.reduce((acc, curr) => {
          if (curr.key && curr.value) acc[curr.key] = curr.value;
          return acc;
        }, {})
      };

      // If we are forcing balance, we might need a backend update for account balance too
      if (force && manualForm.balance !== null && manualForm.balance !== '') {
        await api.put(`/accounts/${selectedAccount}`, { balance: Number(manualForm.balance) });
      }
      const res = await api.post('/transactions', payload);
      
      setAccounts(prev => prev.map(acc => 
        acc.id === selectedAccount ? { 
          ...acc, 
          balance: acc.balance + (manualForm.type === 'credit' ? Number(manualForm.amount) : -Number(manualForm.amount)) 
        } : acc
      ));

      toast.success('Transaction added successfully!');
      setRecentTransactions(prev => [res.data, ...prev].slice(0, 5));
      setManualForm({
        date: new Date().toISOString().split('T')[0],
        description: '', type: 'debit', amount: '', category_id: '',
        ledger_name: '', group_name: '', reference_number: '', cheque_number: '',
        notes: '', balance: '',
      });
      setManualCustomFields([]);
      setManualErrors({});
      setMismatchData(null);
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
      ledger_name: '', group_name: '', reference_number: '', cheque_number: '',
      notes: '', balance: '',
    });
    setManualCustomFields([]);
    setManualErrors({});
  };

  // ──── Template logic ────
  const handleTemplateFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) { toast.error('Please upload a CSV or Excel file'); return; }
    setTemplateFile(file);
    setTemplateFileMeta({ name: file.name, size: file.size });
    setTemplateParsing(true);
    try {
      let parsed;
      if (ext === 'csv') {
        const text = await file.text();
        parsed = parseCSV(text);
      } else {
        parsed = await parseExcel(file);
      }
      
      if (!parsed || !parsed.rows || parsed.rows.length === 0) { 
        toast.error('No data rows found in the file'); 
        setTemplateParsing(false); 
        return; 
      }
      setTemplateData(parsed);
      setTemplateStep('preview');
      toast.success('File loaded successfully');
    } catch (err) { 
      console.error(err);
      toast.error('Failed to parse file'); 
    } finally { setTemplateParsing(false); }
  };

  const handleTemplateImport = async (force = false) => {
    if (!selectedAccount) return;
    if (!templateFile) {
      toast.error('Session restored from refresh. Please re-upload the file to proceed with the import.', {
        duration: 5000,
        icon: <Info className="h-4 w-4 text-blue-500" />
      });
      setTemplateStep('download');
      return;
    }
    setTemplateImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', templateFile);
      const url = `/import/csv?account_id=${selectedAccount}${force ? '&force_balance=true' : ''}`;
      const res = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setTemplateStep('done');
      fetchData();
    } catch (err) { 
      if (err.response?.status === 409) {
        setMismatchData({
          ...err.response.data,
          source: 'template'
        });
      } else {
        toast.error(err.response?.data?.detail || 'Import failed'); 
      }
    }
    finally { setTemplateImporting(false); }
  };

  const resetTemplate = () => { 
    setTemplateFile(null); 
    setTemplateData(null); 
    setTemplateStep('download'); 
    setTemplateFileMeta(null);
  };

  // ──── CSV logic ────
  const handleCsvFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) { toast.error('Please upload a CSV or Excel file'); return; }
    setCsvFile(file);
    setCsvFileMeta({ name: file.name, size: file.size });
    setCsvParsing(true);
    try {
      let parsed;
      if (ext === 'csv') {
        const text = await file.text();
        parsed = parseCSV(text);
      } else {
        parsed = await parseExcel(file);
      }
      
      if (!parsed || !parsed.rows || parsed.rows.length === 0) { 
        toast.error('No valid data rows found in this file'); 
        setCsvParsing(false); 
        return; 
      }
      
      setCsvData(parsed);
      const autoMap = autoMapHeaders(parsed.headers);
      setCsvMapping(autoMap);
      
      // Always move to preview step so the user can see their data
      setCsvStep('preview');
      
      const mapped = Object.values(autoMap);
      const mandatoryFields = ['Date', 'Particulars'];
      const hasMandatory = mandatoryFields.every(field => mapped.includes(field));

      if (hasMandatory) {
        toast.success('Columns auto-detected and matched!');
      } else {
        toast.info('Please finish mapping your columns');
        setCsvMappingOpen(true);
      }
    } catch (err) { 
      console.error(err);
      toast.error('Error parsing file. Please check the format.'); 
    }
    finally { setCsvParsing(false); }
  };

  const getMappedPreviewData = () => {
    if (!csvData) return { headers: [], rows: [] };
    const mappedHeaders = csvData.headers.map(h => csvMapping[h] || h);
    return { headers: mappedHeaders, rows: csvData.rows };
  };

  const handleCsvImport = async (force = false) => {
    if (!selectedAccount) return;
    if (!csvFile) {
      toast.error('Session restored from refresh. Please re-upload the file to finalize the import.', {
        duration: 5000,
        icon: <Info className="h-4 w-4 text-blue-500" />
      });
      setCsvStep('upload');
      return;
    }

    // Balance Verification Logic for CSV
    if (!force) {
      const balanceCol = Object.keys(csvMapping).find(h => csvMapping[h] === 'Balance');
      if (balanceCol && csvData.rows.length > 0) {
        const lastRow = csvData.rows[csvData.rows.length - 1];
        const balanceIdx = csvData.headers.indexOf(balanceCol);
        const providedFinalBalance = Number(lastRow[balanceIdx]);

        if (!isNaN(providedFinalBalance)) {
          const account = accounts.find(a => a.id === selectedAccount);
          let delta = 0;
          
          // Calculate net change from the entire file
          csvData.rows.forEach(row => {
             // Find Debit/Credit/Amount columns
             let amt = 0;
             Object.entries(csvMapping).forEach(([header, mappedField]) => {
                const idx = csvData.headers.indexOf(header);
                const val = Number(row[idx]) || 0;
                if (mappedField === 'Debit') amt -= val;
                else if (mappedField === 'Credit') amt += val;
                else if (mappedField === 'Amount') {
                   // This is trickier if type isn't known, but usuallystatements have separate Dr/Cr
                }
             });
             delta += amt;
          });

          const expectedFinal = account.balance + delta;
          if (Math.abs(expectedFinal - providedFinalBalance) > 0.01) {
            setMismatchData({
              source: 'csv',
              calculated: expectedFinal,
              provided: providedFinalBalance,
            });
            return;
          }
        }
      }
    }

    setCsvImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const url = `/import/csv?account_id=${selectedAccount}${force ? '&force_balance=true' : ''}`;
      const res = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setCsvStep('done');
      fetchData(); // Refresh account balances
    } catch (err) { 
      if (err.response?.status === 409) {
        setMismatchData({
          ...err.response.data,
          source: 'csv'
        });
      } else {
        toast.error(err.response?.data?.detail || 'Import failed'); 
      }
    }
    finally { setCsvImporting(false); }
  };

  const resetCsv = () => { 
    setCsvFile(null); 
    setCsvData(null); 
    setCsvMapping({}); 
    setCsvCustomFields([]); 
    setCsvStep('upload'); 
    setCsvFileMeta(null);
  };

  // ──── PDF logic ────
  const handlePdfFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) { toast.error('Please upload a PDF file'); return; }
    setPdfFile(file);
  };

  const handlePdfImport = async (force = false) => {
    if (!pdfFile || !selectedAccount) return;
    setPdfImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      const url = `/import/csv?account_id=${selectedAccount}${force ? '&force_balance=true' : ''}`;
      const res = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setPdfStep('done');
      fetchData();
    } catch (err) { 
      if (err.response?.status === 409) {
        setMismatchData({
          ...err.response.data,
          source: 'pdf'
        });
      } else {
        toast.error(err.response?.data?.detail || 'PDF parsing failed'); 
      }
    }
    finally { setPdfImporting(false); }
  };

  const resetPdf = () => { setPdfFile(null); setPdfStep('upload'); };

  // ──── Shared account selector JSX ────
  const renderAccountSelector = () => (
    <div className="mb-6">
      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Select Bank Account</Label>
      {accounts.length > 0 ? (
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="max-w-md" data-testid="account-select">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(acc => {
              const client = clients.find(c => c.id === acc.client_id);
              return (
                <SelectItem key={acc.id} value={acc.id}>
                  {client ? <span className="font-bold text-primary mr-1">{client.name} —</span> : ''} {acc.account_name} <span className="text-slate-400 text-[10px] ml-1">({acc.bank_name})</span>
                </SelectItem>
              );
            })}
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
      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-10"
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
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Date</Label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => dateInputRef.current?.showPicker?.()}
                            className="absolute inset-y-0 left-0 pl-3 flex items-center z-10 hover:text-primary transition-colors"
                          >
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                          </button>
                          <Input
                            type="date"
                            ref={dateInputRef}
                            value={manualForm.date}
                            onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))}
                            onClick={() => dateInputRef.current?.showPicker?.()}
                            className={`pl-10 bg-white hide-calendar-icon cursor-pointer ${manualErrors.date ? 'border-red-400 focus:ring-red-400' : ''}`}
                          />
                        </div>
                        {manualErrors.date && <p className="text-xs text-red-500 mt-1">{manualErrors.date}</p>}
                      </div>

                      {/* Group */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Group <span className="text-slate-400 font-normal">(optional)</span>
                        </Label>
                        <Select
                          value={manualForm.category_id || 'none'}
                          onValueChange={val => setManualForm(p => ({ ...p, category_id: val === 'none' ? '' : val }))}
                        >
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select group" />
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

                    {/* Particulars */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Particulars</Label>
                      <Input
                        placeholder="e.g. Office rent payment, Client invoice..."
                        value={manualForm.description}
                        onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                        className={`bg-white placeholder:text-slate-400 ${manualErrors.description ? 'border-red-400' : ''}`}
                      />
                      {manualErrors.description && <p className="text-xs text-red-500 mt-1">{manualErrors.description}</p>}
                    </div>

                    {/* Type & Amount */}
                    {/* Amount and Type Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Type</Label>
                        <div className="flex gap-4 p-1.5 bg-white rounded-xl border-2 border-slate-100 h-16">
                          <button
                            type="button"
                            onClick={() => setManualForm({ ...manualForm, type: 'debit' })}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500
                              ${manualForm.type === 'debit' 
                                ? 'bg-red-50 text-red-600 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                          >
                            <Scale className="h-4 w-4" /> Debit (Out)
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualForm({ ...manualForm, type: 'credit' })}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500
                              ${manualForm.type === 'credit' 
                                ? 'bg-green-50 text-green-600 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                          >
                            <Plus className="h-4 w-4" /> Credit (In)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Transaction Amount</Label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-2 bg-white rounded-xl shadow-sm group-focus-within:bg-primary group-focus-within:text-white transition-all duration-300">
                            <IndianRupee className="h-4 w-4" />
                          </div>
                          <Input
                            data-testid="amount-input"
                            type="number"
                            placeholder="0.00"
                            value={manualForm.amount}
                            onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                            onWheel={(e) => e.target.blur()} 
                            required
                            className="h-16 pl-16 text-xl font-black text-slate-950 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary/10 hover:border-slate-200 transition-all placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Accounting Details: Ledger & Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Ledger Name</Label>
                        <Input
                          placeholder="e.g. Salary, Rent, Sales"
                          value={manualForm.ledger_name}
                          onChange={(e) => setManualForm({ ...manualForm, ledger_name: e.target.value })}
                          className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary/10 font-bold placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Group (Secondary Category)</Label>
                        <Input
                          placeholder="e.g. Direct Expenses, Income"
                          value={manualForm.group_name}
                          onChange={(e) => setManualForm({ ...manualForm, group_name: e.target.value })}
                          className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary/10 font-bold placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Reference Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Reference Number</Label>
                        <Input
                          placeholder="TXN123456789"
                          value={manualForm.reference_number}
                          onChange={(e) => setManualForm({ ...manualForm, reference_number: e.target.value })}
                          className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary/10 font-bold text-slate-600 uppercase tracking-tight placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Cheque / Chq Number</Label>
                        <Input
                          placeholder="000123"
                          value={manualForm.cheque_number}
                          onChange={(e) => setManualForm({ ...manualForm, cheque_number: e.target.value })}
                          className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary/10 font-bold text-slate-600 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Notes / Particulars Description */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Transaction Notes (Internal)</Label>
                      <textarea
                        placeholder="Any additional details if description (particulars) is not enough..."
                        value={manualForm.notes}
                        onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                        className="w-full h-24 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/20 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Balance Auto-calculated Section */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Closing Balance
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Scale className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input
                          type="number"
                          placeholder="Calculating..."
                          value={manualForm.balance}
                          onWheel={(e) => e.target.blur()}
                          readOnly
                          className="pl-9 bg-slate-50 border-slate-200 text-slate-500 font-semibold cursor-not-allowed h-12 rounded-xl placeholder:text-slate-400"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        Auto-calculated next balance
                      </p>
                    </div>

                    {/* Custom / Additional Fields */}
                    <div className="space-y-4 pt-6 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setManualCustomFields(prev => [...prev, { key: '', value: '' }])}
                          className="flex items-center gap-2 group/add-header"
                        >
                          <div className="p-1.5 bg-primary/10 rounded-lg group-hover/add-header:bg-primary transition-all duration-300">
                            <Plus className="h-4 w-4 text-primary group-hover/add-header:text-white transition-colors" />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-800 group-hover/add-header:text-primary transition-colors">Additional Details</h4>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                          {manualCustomFields.map((field, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 10 }}
                              className="group relative flex flex-col sm:flex-row gap-4 p-5 bg-slate-50/50 hover:bg-white rounded-2xl border-2 border-slate-100 hover:border-primary/20 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                            >
                              <div className="flex-1 space-y-1.5 min-w-0">
                                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Field Name</Label>
                                <Input
                                  value={field.key}
                                  onChange={(e) => {
                                    const newFields = [...manualCustomFields];
                                    newFields[index].key = e.target.value;
                                    setManualCustomFields(newFields);
                                  }}
                                  className="h-10 bg-white border-slate-100 rounded-xl px-3 text-xs font-bold"
                                />
                              </div>
                              <div className="flex-1 space-y-1.5 min-w-0">
                                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Value</Label>
                                <Input
                                  value={field.value}
                                  onChange={(e) => {
                                    const newFields = [...manualCustomFields];
                                    newFields[index].value = e.target.value;
                                    setManualCustomFields(newFields);
                                  }}
                                  className="h-10 bg-white border-slate-100 rounded-xl px-3 text-xs font-bold"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setManualCustomFields(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 h-6 w-6 bg-white text-slate-300 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm border border-slate-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

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
                                <span className="text-xs text-slate-500 font-mono">{normalizeDate(txn.date)}</span>
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

                  <AnimatePresence mode="wait">
                    {/* Step 1 & 2: Download & Upload (Shown if not in preview or done) */}
                    {(templateStep === 'download' || templateStep === 'upload') && (
                      <motion.div
                        key="upload-section"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-8"
                      >
                        {/* Step 1: Download Template */}
                        <div className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-[32px] border-2 border-primary/10 shadow-sm">
                          <div className="flex items-start gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/5 border border-primary/10">
                              <Download className="h-7 w-7 text-primary" />
                            </div>
                            <div className="flex-1 pt-1">
                              <h4 className="text-lg font-bold text-slate-900 mb-1">Step 1: Download Official Template</h4>
                              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                                Get our recommended format to ensure zero errors during import. Add your transaction details in Excel and come back here to upload.
                              </p>
                              <Button onClick={downloadTemplate} variant="outline" className="rounded-xl px-6 py-5 border-primary/20 hover:bg-primary/5 text-primary font-bold">
                                <Download className="h-4 w-4 mr-2" /> Download CSV Template
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Step 2: Upload filled template */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">2</div>
                            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Upload Filled File</h4>
                          </div>
                          <DropZone
                            accept=".csv,.xls,.xlsx"
                            onFile={handleTemplateFile}
                            file={templateFile}
                            loading={templateParsing}
                            label="Drop your filled template here"
                            sublabel="We support CSV, Excel (XLS, XLSX)"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Premium Preview */}
                    {templateStep === 'preview' && templateData && (
                      <motion.div
                        key="preview-section"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-900 leading-tight">Review Transactions</h4>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{templateData.rows.length} records detected</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={resetTemplate} className="text-slate-400 hover:text-red-500 font-bold tracking-wider">
                            <X className="h-4 w-4 mr-1" /> CANCEL IMPORT
                          </Button>
                        </div>
                        
                        <PreviewTable headers={templateData.headers} rows={templateData.rows} />
                        
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                          <Button
                            onClick={handleTemplateImport}
                            disabled={templateImporting}
                            className="bg-primary hover:bg-primary/90 text-white px-10 py-6 rounded-2xl text-base font-bold shadow-xl shadow-primary/20"
                          >
                            {templateImporting ? (
                              <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Finalizing Import...</>
                            ) : (
                              <><CheckCircle2 className="h-5 w-5 mr-3" /> Confirm Import</>
                            )}
                          </Button>
                          <Button variant="outline" onClick={resetTemplate} className="rounded-2xl py-6 px-8 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                            Discard
                          </Button>
                        </div>
                      </motion.div>
                    )}



                    {/* Completion State */}
                    {templateStep === 'done' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-16 bg-green-50/50 border-2 border-dashed border-green-200 rounded-[40px] text-center"
                      >
                        <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200">
                          <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Transactions Imported!</h3>
                        <p className="text-green-700/80 font-medium mb-10">All records have been successfully added to the ledger.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
                          <Button onClick={() => navigate('/transactions')} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-10 py-6 rounded-2xl font-bold h-auto shadow-xl transition-all hover:scale-105 active:scale-95">
                            <ArrowRight className="h-5 w-5 mr-2" /> View Transactions
                          </Button>
                          <Button onClick={resetTemplate} variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-600 px-10 py-6 rounded-2xl font-bold h-auto hover:bg-slate-50">
                            Import More
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>

              {/* Import CSV / Excel */}
              <TabsContent value="csv" className="mt-0 focus-visible:ring-0 outline-none">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="h-10 w-1 rounded-full bg-primary mb-0" />
                    <h3 className="text-xl font-bold text-slate-800">Universal CSV & Excel Import</h3>
                  </div>
                  {renderAccountSelector()}

                  <AnimatePresence mode="wait">
                    {csvStep === 'upload' && (
                      <motion.div
                        key="csv-upload"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                      >
                        <DropZone
                          accept=".csv,.xls,.xlsx"
                          onFile={handleCsvFile}
                          file={csvFile || (csvFileMeta ? { name: csvFileMeta.name, size: csvFileMeta.size, isGhost: true } : null)}
                          loading={csvParsing}
                          label="Upload your bank statement or ledger"
                          sublabel="Auto-maps headers for Date, Particulars, and Amount"
                        />
                        <div className="p-6 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-[32px] flex items-start gap-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                            <Info className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="text-sm">
                            <p className="font-black text-blue-900 uppercase tracking-widest text-[10px] mb-1">Smart Engine Active</p>
                            <p className="text-blue-800/70 leading-relaxed font-medium">
                              Our engine will automatically detect and match columns for your statement. You can refine the mapping in the next step.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {csvStep === 'preview' && csvData && (
                      <motion.div
                        key="csv-preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                              <FileSpreadsheet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-slate-900 leading-tight">Validate Transactions</h4>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{csvData.rows.length} entries to be posted</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCsvMappingOpen(true)} className="rounded-xl border-slate-200 font-bold hover:bg-primary hover:text-white hover:border-primary transition-all px-4">
                              <GripVertical className="h-4 w-4 mr-2" /> Edit Mapping
                            </Button>
                            <Button variant="ghost" size="sm" onClick={resetCsv} className="text-slate-400 hover:text-red-500 font-black text-[10px] tracking-widest px-4">
                              <X className="h-4 w-4 mr-1" /> CANCEL
                            </Button>
                          </div>
                        </div>

                        {/* Column mapping pills */}
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          {csvData.headers.map((h, i) => {
                            const mapped = csvMapping[h];
                            return (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest
                                  ${mapped
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white text-slate-400 border border-slate-200 shadow-sm'}`}
                              >
                                {h.toUpperCase()}
                                {mapped && <><ArrowRight className="h-3 w-3 opacity-50" />{mapped.toUpperCase()}</>}
                              </span>
                            );
                          })}
                        </div>

                        <PreviewTable headers={csvData.headers} rows={csvData.rows} mapping={csvMapping} />

                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                          <Button
                            onClick={handleCsvImport}
                            disabled={csvImporting || !selectedAccount}
                            className={`bg-primary hover:bg-primary/90 text-white px-10 py-6 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 ${!selectedAccount ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                          >
                            {csvImporting ? (
                              <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Posting Records...</>
                            ) : (
                              <><CheckCircle2 className="h-5 w-5 mr-3" /> Finalize & Import</>
                            )}
                          </Button>
                          {!selectedAccount && (
                            <p className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Select a bank account first
                            </p>
                          )}
                          <Button variant="outline" onClick={resetCsv} className="rounded-2xl py-6 px-8 border-slate-200 text-slate-500 font-bold">Discard</Button>
                        </div>
                      </motion.div>
                    )}



                    {csvStep === 'done' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-16 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-[40px] text-center"
                      >
                        <div className="h-24 w-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
                          <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Ledger Updated!</h3>
                        <p className="text-blue-700/80 font-medium mb-10">Your CSV data has been successfully processed and posted.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
                          <Button onClick={() => navigate('/transactions')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-2xl font-bold h-auto shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95">
                            <ArrowRight className="h-5 w-5 mr-2" /> View Transactions
                          </Button>
                          <Button onClick={resetCsv} variant="outline" className="w-full sm:w-auto border-blue-100 text-blue-700 px-10 py-6 rounded-2xl font-bold h-auto hover:bg-blue-50">
                            Finish
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                    <p className="text-sm text-green-600 mb-6">Transactions extracted from PDF and imported.</p>
                    <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
                      <Button onClick={() => navigate('/transactions')} className="bg-green-600 hover:bg-green-700 text-white py-5 rounded-xl font-bold shadow-lg shadow-green-100">
                        View in Transactions
                      </Button>
                      <Button variant="outline" onClick={resetPdf} className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/50">
                        Import Another Statement
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Discard Changes Popups */}
      <ConfirmPopup 
        open={blocker.state === "blocked" || !!pendingTab}
        onClose={cancelDiscard}
        onConfirm={confirmDiscard}
        title="Discard Changes?"
        description="You have an active operation in progress. If you leave now, your session data and previews will be lost."
      />
      {/* Balance Mismatch Popup */}
      <Dialog open={!!mismatchData} onOpenChange={(val) => !val && setMismatchData(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 rounded-[40px] bg-white shadow-2xl">
          <div className="p-10">
            <div className="h-20 w-20 bg-amber-50 rounded-[32px] flex items-center justify-center border-2 border-amber-100 shadow-xl shadow-amber-50/50 mb-8 mx-auto">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            
            <DialogHeader className="text-center space-y-4 mb-10">
              <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">
                Balance Mismatch!
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed px-4">
                The balance in your record doesn't match the calculated ledger balance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mb-10">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Calculated Balance</span>
                <span className="text-slate-900 font-black text-lg">₹{mismatchData?.calculated?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-center h-4 relative">
                <div className="absolute inset-x-0 h-[2px] bg-slate-100" />
                <div className="relative bg-white px-4 text-[10px] font-black text-amber-500 uppercase tracking-[4px]">VS</div>
              </div>
              <div className="flex items-center justify-between p-5 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-amber-700 font-bold uppercase tracking-widest text-[11px]">Provided Balance</span>
                <span className="text-amber-900 font-black text-lg">₹{mismatchData?.provided?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-center text-slate-400 text-sm font-medium mb-10 px-6">
              Would you like to force update your account balance to <span className="text-slate-900 font-bold">₹{mismatchData?.provided?.toLocaleString('en-IN')}</span> and continue?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setMismatchData(null)}
                className="py-6 rounded-2xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all h-auto"
              >
                Discard
              </Button>
              <Button
                disabled={mismatchConfirming}
                onClick={async () => {
                   setMismatchConfirming(true);
                   try {
                     if (mismatchData.source === 'manual') {
                       await handleManualSubmit(null, true);
                     } else if (mismatchData.source === 'csv') {
                       await handleCsvImport(true);
                     } else if (mismatchData.source === 'template') {
                       await handleTemplateImport(true);
                     } else if (mismatchData.source === 'pdf') {
                       await handlePdfImport(true);
                     }
                   } finally {
                     setMismatchConfirming(false);
                     setMismatchData(null);
                   }
                }}
                className="py-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xl shadow-amber-200 transition-all h-auto"
              >
                {mismatchConfirming ? <Loader2 className="animate-spin" /> : "Update Balance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddTransactions;
