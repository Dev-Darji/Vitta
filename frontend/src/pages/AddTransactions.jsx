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

/* ─── Font Injection ─────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
    [data-add-txn] { font-family: 'DM Sans', sans-serif; }
    
  `}</style>
);

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

const SYSTEM_FIELDS = Object.keys(headerMap);

const TAB_META = [
  { value: 'manual',   label: 'Manual Entry',       icon: PenLine },
  { value: 'template', label: 'Bulk Template',       icon: Download },
  { value: 'csv',      label: 'CSV / Excel',         icon: FileSpreadsheet },
  { value: 'pdf',      label: 'Bank PDF',            icon: FileText },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const result = [];
  let row = [], current = '', inQuotes = false;
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i], nextChar = normalized[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') { current += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else current += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { row.push(current.trim()); current = ''; }
      else if (char === '\n') { row.push(current.trim()); result.push(row); row = []; current = ''; }
      else current += char;
    }
  }
  if (current || row.length > 0) { row.push(current.trim()); result.push(row); }
  if (result.length < 1) return { headers: [], rows: [] };
  const headers = result[0];
  const rows = result.slice(1).filter(r => r.some(v => v)).map(row => {
    const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date'));
    if (dateIdx !== -1 && row[dateIdx]) row[dateIdx] = normalizeDate(row[dateIdx]);
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
      const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date'));
      if (dateIdx !== -1 && row[dateIdx]) {
        if (typeof row[dateIdx] === 'number') {
          const date = new Date((row[dateIdx] - 25569) * 86400 * 1000);
          row[dateIdx] = `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`;
        } else row[dateIdx] = normalizeDate(String(row[dateIdx]));
      }
      return row;
    });
    return { headers, rows };
  } catch (err) { console.error('Excel parse error:', err); throw new Error('Failed to parse Excel file'); }
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return dateStr;
  const str = String(dateStr).trim();
  if (!str) return str;
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const val = parseFloat(str);
    const date = new Date((val - 25569) * 86400 * 1000);
    return `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`;
  }
  const match = str.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/);
  if (match) {
    let p1 = parseInt(match[1]), p2 = parseInt(match[2]), p3 = parseInt(match[3]);
    if (p1 > 1000) return `${String(p3).padStart(2,'0')}-${String(p2).padStart(2,'0')}-${p1}`;
    if (p3 > 1000) {
      if (p2 > 12) return `${String(p2).padStart(2,'0')}-${String(p1).padStart(2,'0')}-${p3}`;
      return `${String(p1).padStart(2,'0')}-${String(p2).padStart(2,'0')}-${p3}`;
    }
  }
  return str;
};

const autoMapHeaders = (fileHeaders) => {
  const mapping = {};
  fileHeaders.forEach(h => {
    const normalized = String(h || '').toLowerCase().trim().replace(/[._-]/g, ' ').replace(/\s+/g, ' ');
    for (const [field, keywords] of Object.entries(headerMap)) {
      if (keywords.some(k => k === normalized) || field.toLowerCase() === normalized) { mapping[h] = field; break; }
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
  a.setAttribute('hidden', ''); a.setAttribute('href', url); a.setAttribute('download', 'vitta_transaction_template.csv');
  document.body.appendChild(a); a.click(); URL.revokeObjectURL(url);
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  return dateStr;
};

// ─── Section Label ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className="h-[14px] w-[3px] bg-primary rounded-full" />
    <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.16em]">{children}</span>
  </div>
);

// ─── Field Label ──────────────────────────────────────────────────────────────
const FieldLabel = ({ children, required }) => (
  <Label className="text-[11.5px] font-semibold text-slate-500 mb-1.5 block">
    {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
  </Label>
);

// ─── Field Error ──────────────────────────────────────────────────────────────
const FieldError = ({ msg }) => msg ? (
  <p className="text-[10.5px] text-rose-500 font-medium mt-1 flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />{msg}
  </p>
) : null;

// ─── Drop Zone ────────────────────────────────────────────────────────────────
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
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
        ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]'
          : file ? 'border-emerald-300 bg-emerald-50/40'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'}`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200
        ${file ? 'bg-emerald-100' : 'bg-slate-100'}`}>
        {loading ? <Loader2 className="h-6 w-6 text-primary animate-spin" />
          : file ? <FileText className="h-6 w-6 text-emerald-600" />
          : <Upload className="h-6 w-6 text-slate-400" />}
      </div>
      {file ? (
        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-[14px] font-semibold text-slate-800">{file.name}</p>
            {file.isGhost && (
              <span className="bg-blue-100 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Recovered</span>
            )}
          </div>
          <p className="text-[12px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      ) : (
        <div>
          <p className="text-[14px] font-semibold text-slate-700 mb-1">{label}</p>
          <p className="text-[12px] text-slate-400">{sublabel}</p>
        </div>
      )}
      {dragOver && (
        <div className="absolute inset-0 rounded-xl bg-primary/10 flex items-center justify-center">
          <p className="font-semibold text-primary text-[15px]">Drop file here</p>
        </div>
      )}
    </div>
  );
};

// ─── Preview Table ────────────────────────────────────────────────────────────
const PreviewTable = ({ headers, rows, mapping = {}, maxRows = 12 }) => {
  const display = rows.slice(0, maxRows);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-r border-slate-100 w-10">#</th>
              {headers.map((h, i) => {
                const isMapped = mapping && mapping[h];
                return (
                  <th key={i} className="px-4 py-3 text-left border-r border-slate-100 last:border-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">{h}</span>
                      {isMapped && (
                        <span className="text-[9.5px] font-medium text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" />{mapping[h]}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {display.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-2.5 text-slate-300 text-[11px] border-r border-slate-100 text-center">{ri + 1}</td>
                {headers.map((_, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-[12.5px] font-medium text-slate-600 whitespace-nowrap border-r border-slate-100 last:border-0">
                    {row[ci] || <span className="text-slate-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <div className="px-5 py-3 bg-slate-50/60 text-center border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-400">
            Showing first {maxRows} of <span className="text-primary font-semibold">{rows.length}</span> records
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Column Mapping Modal ─────────────────────────────────────────────────────
const ColumnMappingModal = ({ open, onClose, fileHeaders, mapping, setMapping, customFields, setCustomFields, onConfirm }) => {
  const [newFieldName, setNewFieldName] = useState('');
  const allFields = [...SYSTEM_FIELDS, ...customFields];
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
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-slate-400" /> Column Mapping
          </DialogTitle>
          <p className="text-[12.5px] text-slate-400 mt-1">Match each column from your file to a system field</p>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          <div className="grid grid-cols-[1fr,32px,1fr] items-center gap-2 px-1 mb-3">
            <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">File Column</p>
            <div />
            <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Map to Field</p>
          </div>
          {fileHeaders.map((header, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="grid grid-cols-[1fr,32px,1fr] items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="text-[13px] font-medium text-slate-700 truncate px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                {header}
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <Select
                value={mapping[header] || 'skip'}
                onValueChange={(val) => setMapping(prev => ({ ...prev, [header]: val === 'skip' ? undefined : val }))}
              >
                <SelectTrigger className="text-[13px] h-10 rounded-lg border-slate-200">
                  <SelectValue placeholder="Skip column" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="skip"><span className="text-slate-400 text-[12px]">— Skip —</span></SelectItem>
                  {allFields.map(f => {
                    const isAlreadyUsed = mappedValues.includes(f) && mapping[header] !== f;
                    if (isAlreadyUsed) return null;
                    return <SelectItem key={f} value={f} className="text-[13px]">{f}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Add Custom Field</p>
          <div className="flex gap-2">
            <Input
              value={newFieldName}
              onChange={e => setNewFieldName(e.target.value)}
              placeholder="e.g. Group, Tags, Notes..."
              className="flex-1 text-[13px] h-10 rounded-lg border-slate-200"
              onKeyDown={e => e.key === 'Enter' && addCustomField()}
            />
            <Button size="sm" variant="outline" onClick={addCustomField} className="rounded-lg h-10 px-4 text-[12px] font-medium">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-5 gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg h-10 text-[13px] font-medium">Cancel</Button>
          <Button onClick={onConfirm} className="rounded-lg h-10 text-[13px] font-medium bg-primary hover:bg-primary/90 text-white">
            Confirm Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Done State ───────────────────────────────────────────────────────────────
const DoneState = ({ title, subtitle, accentClass, onView, onReset, resetLabel = 'Import More' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    className="py-20 text-center"
  >
    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${accentClass}`}>
      <CheckCircle2 className="h-8 w-8 text-white" />
    </div>
    <h3 className="text-[20px] font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-[13.5px] text-slate-400 mb-10">{subtitle}</p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Button onClick={onView} className="bg-slate-900 hover:bg-black text-white px-8 h-11 rounded-xl font-semibold text-[13px] shadow-sm">
        <ArrowRight className="h-4 w-4 mr-2" />View Transactions
      </Button>
      <Button onClick={onReset} variant="outline" className="border-slate-200 text-slate-600 px-8 h-11 rounded-xl font-medium text-[13px] hover:bg-slate-50">
        {resetLabel}
      </Button>
    </div>
  </motion.div>
);

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
    if (location.state?.activeTab) setActiveTab(location.state.activeTab);
  }, [location.state]);

  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '', type: 'debit', amount: '', category_id: '',
    ledger_name: '', group_name: '', reference_number: '', cheque_number: '', notes: '', balance: '',
  });
  const [manualCustomFields, setManualCustomFields] = useState([]);
  const [manualErrors, setManualErrors] = useState({});
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [mismatchData, setMismatchData] = useState(null);
  const [mismatchConfirming, setMismatchConfirming] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvMapping, setCsvMapping] = useState({});
  const [csvCustomFields, setCsvCustomFields] = useState([]);
  const [csvMappingOpen, setCsvMappingOpen] = useState(false);
  const [csvStep, setCsvStep] = useState('upload');
  const [csvImporting, setCsvImporting] = useState(false);

  const [templateFile, setTemplateFile] = useState(null);
  const [templateParsing, setTemplateParsing] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [templateStep, setTemplateStep] = useState('download');
  const [templateImporting, setTemplateImporting] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfStep, setPdfStep] = useState('upload');

  const [csvFileMeta, setCsvFileMeta] = useState(null);
  const [templateFileMeta, setTemplateFileMeta] = useState(null);

  const PERSIST_KEY = 'vitta_add_txn_state';

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
      } catch (err) { console.error('Failed to load persisted state:', err); }
    }
  }, []);

  useEffect(() => {
    const state = { activeTab, manualForm, manualCustomFields, csvStep, csvData, csvMapping, csvCustomFields, templateStep, templateData, csvFileMeta, templateFileMeta, pdfStep };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  }, [activeTab, manualForm, manualCustomFields, csvStep, csvData, csvMapping, csvCustomFields, templateStep, templateData, csvFileMeta, templateFileMeta, pdfStep]);

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
    const manualDirty = manualForm.description !== '' || manualForm.amount !== '' || manualForm.category_id !== '' || manualCustomFields.length > 0;
    const csvDirty = csvStep !== 'upload' || csvFile !== null;
    const templateDirty = templateStep !== 'download' || templateFile !== null;
    const pdfDirty = pdfFile !== null;
    return manualDirty || csvDirty || templateDirty || pdfDirty;
  }, [manualForm, manualCustomFields, csvStep, csvFile, templateStep, templateFile, pdfFile]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty() && currentLocation.pathname !== nextLocation.pathname);
  const [pendingTab, setPendingTab] = useState(null);

  const handleTabChange = (val) => {
    if (isDirty()) setPendingTab(val);
    else setActiveTab(val);
  };

  const confirmDiscard = () => {
    localStorage.removeItem(PERSIST_KEY);
    setCsvFile(null); setCsvData(null); setCsvMapping({}); setCsvStep('upload'); setCsvFileMeta(null);
    setTemplateFile(null); setTemplateData(null); setTemplateStep('download'); setTemplateFileMeta(null);
    setPdfFile(null); setPdfStep('upload');
    setManualForm({ date: new Date().toISOString().split('T')[0], description: '', type: 'debit', amount: '', category_id: '', balance: '' });
    setManualCustomFields([]);
    if (blocker.state === "blocked") blocker.proceed();
    else if (pendingTab) { setActiveTab(pendingTab); setPendingTab(null); }
  };

  const cancelDiscard = () => {
    if (blocker.state === "blocked") blocker.reset();
    setPendingTab(null);
  };

  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [accRes, catRes, clRes] = await Promise.all([api.get('/accounts'), api.get('/categories'), api.get('/clients')]);
      setAccounts(accRes.data); setCategories(catRes.data); setClients(clRes.data);
      if (accRes.data.length > 0) setSelectedAccount(accRes.data[0].id);
    } catch { toast.error('Failed to load data'); }
  };

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
        account_id: selectedAccount, date: manualForm.date, description: manualForm.description.trim(),
        amount: Number(manualForm.amount), type: manualForm.type, category_id: manualForm.category_id || null,
        ledger_name: manualForm.ledger_name || null, group_name: manualForm.group_name || null,
        reference_number: manualForm.reference_number || null, cheque_number: manualForm.cheque_number || null,
        notes: manualForm.notes || null,
        metadata: manualCustomFields.reduce((acc, curr) => { if (curr.key && curr.value) acc[curr.key] = curr.value; return acc; }, {})
      };
      if (force && manualForm.balance !== null && manualForm.balance !== '') {
        await api.put(`/accounts/${selectedAccount}`, { balance: Number(manualForm.balance) });
      }
      const res = await api.post('/transactions', payload);
      setAccounts(prev => prev.map(acc => acc.id === selectedAccount
        ? { ...acc, balance: acc.balance + (manualForm.type === 'credit' ? Number(manualForm.amount) : -Number(manualForm.amount)) }
        : acc));
      toast.success('Transaction added successfully!');
      setRecentTransactions(prev => [res.data, ...prev].slice(0, 5));
      setManualForm({ date: new Date().toISOString().split('T')[0], description: '', type: 'debit', amount: '', category_id: '', ledger_name: '', group_name: '', reference_number: '', cheque_number: '', notes: '', balance: '' });
      setManualCustomFields([]); setManualErrors({}); setMismatchData(null);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to add transaction'); }
    finally { setManualSubmitting(false); }
  };

  const clearManualForm = () => {
    setManualForm({ date: new Date().toISOString().split('T')[0], description: '', type: 'debit', amount: '', category_id: '', ledger_name: '', group_name: '', reference_number: '', cheque_number: '', notes: '', balance: '' });
    setManualCustomFields([]); setManualErrors({});
  };

  const handleTemplateFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) { toast.error('Please upload a CSV or Excel file'); return; }
    setTemplateFile(file); setTemplateFileMeta({ name: file.name, size: file.size }); setTemplateParsing(true);
    try {
      let parsed;
      if (ext === 'csv') { const text = await file.text(); parsed = parseCSV(text); }
      else parsed = await parseExcel(file);
      if (!parsed || !parsed.rows || parsed.rows.length === 0) { toast.error('No data rows found in the file'); setTemplateParsing(false); return; }
      setTemplateData(parsed); setTemplateStep('preview'); toast.success('File loaded successfully');
    } catch (err) { console.error(err); toast.error('Failed to parse file'); }
    finally { setTemplateParsing(false); }
  };

  const handleTemplateImport = async (force = false) => {
    if (!selectedAccount) return;
    if (!templateFile) {
      toast.error('Session restored from refresh. Please re-upload the file to proceed.', { duration: 5000 });
      setTemplateStep('download'); return;
    }
    setTemplateImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', templateFile);
      const url = `/import/csv?account_id=${selectedAccount}${force ? '&force_balance=true' : ''}`;
      const res = await api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message); setTemplateStep('done'); fetchData();
    } catch (err) {
      if (err.response?.status === 409) setMismatchData({ ...err.response.data, source: 'template' });
      else toast.error(err.response?.data?.detail || 'Import failed');
    }
    finally { setTemplateImporting(false); }
  };

  const resetTemplate = () => { setTemplateFile(null); setTemplateData(null); setTemplateStep('download'); setTemplateFileMeta(null); };

  const handleCsvFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) { toast.error('Please upload a CSV or Excel file'); return; }
    setCsvFile(file); setCsvFileMeta({ name: file.name, size: file.size }); setCsvParsing(true);
    try {
      let parsed;
      if (ext === 'csv') { const text = await file.text(); parsed = parseCSV(text); }
      else parsed = await parseExcel(file);
      if (!parsed || !parsed.rows || parsed.rows.length === 0) { toast.error('No valid data rows found'); setCsvParsing(false); return; }
      setCsvData(parsed);
      const autoMap = autoMapHeaders(parsed.headers);
      setCsvMapping(autoMap); setCsvStep('preview');
      const mapped = Object.values(autoMap);
      const hasMandatory = ['Date', 'Particulars'].every(f => mapped.includes(f));
      if (hasMandatory) toast.success('Columns auto-detected and matched!');
      else { toast.info('Please finish mapping your columns'); setCsvMappingOpen(true); }
    } catch (err) { console.error(err); toast.error('Error parsing file. Please check the format.'); }
    finally { setCsvParsing(false); }
  };

  const handleCsvImport = async (force = false) => {
    if (!selectedAccount) return;
    if (!csvFile) {
      toast.error('Session restored from refresh. Please re-upload the file.', { duration: 5000 });
      setCsvStep('upload'); return;
    }
    if (!force) {
      const balanceCol = Object.keys(csvMapping).find(h => csvMapping[h] === 'Balance');
      if (balanceCol && csvData.rows.length > 0) {
        const lastRow = csvData.rows[csvData.rows.length - 1];
        const balanceIdx = csvData.headers.indexOf(balanceCol);
        const providedFinalBalance = Number(lastRow[balanceIdx]);
        if (!isNaN(providedFinalBalance)) {
          const account = accounts.find(a => a.id === selectedAccount);
          let delta = 0;
          csvData.rows.forEach(row => {
            Object.entries(csvMapping).forEach(([header, mappedField]) => {
              const idx = csvData.headers.indexOf(header);
              const val = Number(row[idx]) || 0;
              if (mappedField === 'Debit') delta -= val;
              else if (mappedField === 'Credit') delta += val;
            });
          });
          const expectedFinal = account.balance + delta;
          if (Math.abs(expectedFinal - providedFinalBalance) > 0.01) {
            setMismatchData({ source: 'csv', calculated: expectedFinal, provided: providedFinalBalance });
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
      const res = await api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message); setCsvStep('done'); fetchData();
    } catch (err) {
      if (err.response?.status === 409) setMismatchData({ ...err.response.data, source: 'csv' });
      else toast.error(err.response?.data?.detail || 'Import failed');
    }
    finally { setCsvImporting(false); }
  };

  const resetCsv = () => { setCsvFile(null); setCsvData(null); setCsvMapping({}); setCsvCustomFields([]); setCsvStep('upload'); setCsvFileMeta(null); };

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
      const res = await api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message); setPdfStep('done'); fetchData();
    } catch (err) {
      if (err.response?.status === 409) setMismatchData({ ...err.response.data, source: 'pdf' });
      else toast.error(err.response?.data?.detail || 'PDF parsing failed');
    }
    finally { setPdfImporting(false); }
  };

  const resetPdf = () => { setPdfFile(null); setPdfStep('upload'); };

  /* ── Account Selector ── */
  const renderAccountSelector = () => (
    <div className="mb-6">
      <FieldLabel>Bank Account</FieldLabel>
      {accounts.length > 0 ? (
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="max-w-sm h-10 rounded-lg border-slate-200 text-[13px] font-medium" data-testid="account-select">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
            {accounts.map(acc => {
              const client = clients.find(c => c.id === acc.client_id);
              return (
                <SelectItem key={acc.id} value={acc.id} className="text-[13px]">
                  {client ? <span className="font-semibold text-primary mr-1">{client.name} —</span> : ''}
                  {acc.account_name}
                  <span className="text-slate-400 text-[11px] ml-1">({acc.bank_name})</span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 max-w-sm">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">No accounts found</p>
            <p className="text-[12px] text-amber-700">Add a bank account from the Accounts page first.</p>
          </div>
        </div>
      )}
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div data-add-txn data-testid="add-transactions-page" className="space-y-6 pb-20">
      <FontStyle />

      {/* ── Page Header ── */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[3px] h-5 bg-slate-800 rounded-full" />
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">Add Transactions</h1>
          </div>
          <p className="text-[12px] text-slate-400 font-medium ml-[18px]">Enter records manually or import from statements.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

          {/* ── Tab Bar ── */}
          <TabsList className="w-full max-w-xl bg-slate-100/80 border border-slate-200 p-1 rounded-xl mb-6 h-auto gap-1">
            {TAB_META.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-medium transition-all
                  data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:font-semibold
                  data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700"
              >
                <tab.icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl border border-slate-100 shadow-sm"
            >

              {/* ══════════════════════════════════════
                  TAB 1: MANUAL ENTRY
              ══════════════════════════════════════ */}
              <TabsContent value="manual" className="mt-0 focus-visible:ring-0 outline-none p-6 md:p-8">
                <div className="space-y-10">

                  {/* Header row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <h3 className="text-[17px] font-bold text-slate-900">Manual Entry</h3>
                      <p className="text-[12px] text-slate-400 mt-0.5">Append a single transaction to your ledger.</p>
                    </div>
                    {renderAccountSelector()}
                  </div>

                  <form onSubmit={handleManualSubmit} className="space-y-8">

                    {/* Section: Core Details — 12-col grid */}
                    <div>
                      <SectionLabel>Transaction Details</SectionLabel>
                      <div className="grid grid-cols-12 gap-4">
                        {/* Date — col-span-3 */}
                        <div className="col-span-12 md:col-span-3">
                          <FieldLabel required>Date</FieldLabel>
                          <Input
                            type="date"
                            value={manualForm.date}
                            onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))}
                            className={`h-10 rounded-lg border-slate-200 text-[13px] font-medium ${manualErrors.date ? 'border-rose-300' : ''}`}
                          />
                          <FieldError msg={manualErrors.date} />
                        </div>
                        {/* Description — col-span-6 */}
                        <div className="col-span-12 md:col-span-6">
                          <FieldLabel required>Particulars / Description</FieldLabel>
                          <Input
                            placeholder="e.g. Monthly cloud subscription payment"
                            value={manualForm.description}
                            onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                            className={`h-10 rounded-lg border-slate-200 text-[13px] font-medium ${manualErrors.description ? 'border-rose-300' : ''}`}
                          />
                          <FieldError msg={manualErrors.description} />
                        </div>
                        {/* col-span-3 intentionally empty — breathing room */}
                      </div>
                    </div>

                    {/* Section: Amount & Type */}
                    <div>
                      <SectionLabel>Amount & Type</SectionLabel>
                      <div className="grid grid-cols-12 gap-4 p-5 bg-slate-50/60 rounded-xl border border-slate-100">
                        {/* Type toggle — col-span-5 */}
                        <div className="col-span-12 md:col-span-5">
                          <FieldLabel>Transaction Type</FieldLabel>
                          <div className="flex gap-2 p-1 bg-white rounded-lg border border-slate-200 h-10">
                            <button
                              type="button"
                              onClick={() => setManualForm({ ...manualForm, type: 'debit' })}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md text-[12px] font-semibold transition-all
                                ${manualForm.type === 'debit'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <Scale className="h-3 w-3" />Debit
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualForm({ ...manualForm, type: 'credit' })}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md text-[12px] font-semibold transition-all
                                ${manualForm.type === 'credit'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <Plus className="h-3 w-3" />Credit
                            </button>
                          </div>
                        </div>
                        {/* Amount — col-span-4 */}
                        <div className="col-span-12 md:col-span-4">
                          <FieldLabel required>Amount (INR)</FieldLabel>
                          <div className="relative">
                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold ${manualForm.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>₹</span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={manualForm.amount}
                              onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                              className={`h-10 pl-7 text-[15px] font-semibold text-slate-900 rounded-lg border-slate-200 focus-visible:ring-1 ${manualErrors.amount ? 'border-rose-300' : ''}`}
                            />
                          </div>
                          <FieldError msg={manualErrors.amount} />
                        </div>
                        {/* col-span-3 empty */}
                      </div>
                    </div>

                    {/* Section: Ledger Details */}
                    <div>
                      <SectionLabel>Ledger Details</SectionLabel>
                      <div className="grid grid-cols-12 gap-4">
                        {/* Category — col-span-4 */}
                        <div className="col-span-12 md:col-span-4">
                          <FieldLabel>Category / Group</FieldLabel>
                          <Select
                            value={manualForm.category_id || 'none'}
                            onValueChange={val => setManualForm(p => ({ ...p, category_id: val === 'none' ? '' : val }))}
                          >
                            <SelectTrigger className="h-10 rounded-lg border-slate-200 text-[13px] font-medium">
                              <SelectValue placeholder="Uncategorized" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                              <SelectItem value="none" className="text-[13px] text-slate-400">— Uncategorized —</SelectItem>
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="text-[13px]">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                    {cat.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Ledger — col-span-4 */}
                        <div className="col-span-12 md:col-span-4">
                          <FieldLabel>Counterpart Ledger</FieldLabel>
                          <Input
                            placeholder="e.g. Sales A/c, Rent A/c"
                            value={manualForm.ledger_name}
                            onChange={(e) => setManualForm({ ...manualForm, ledger_name: e.target.value })}
                            className="h-10 rounded-lg border-slate-200 text-[13px] font-medium"
                          />
                        </div>
                        {/* Ref — col-span-3 */}
                        <div className="col-span-12 md:col-span-3">
                          <FieldLabel>Reference No.</FieldLabel>
                          <Input
                            placeholder="#"
                            value={manualForm.reference_number || manualForm.cheque_number}
                            onChange={(e) => setManualForm({ ...manualForm, reference_number: e.target.value })}
                            className="h-10 rounded-lg border-slate-200 text-[13px] uppercase"
                          />
                        </div>
                        {/* col-span-1 empty */}
                      </div>
                      {/* Notes — col-span-8 */}
                      <div className="grid grid-cols-12 gap-4 mt-4">
                        <div className="col-span-12 md:col-span-8">
                          <FieldLabel>Notes</FieldLabel>
                          <textarea
                            placeholder="Contextual notes for reconciliation..."
                            value={manualForm.notes}
                            onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                            className="w-full h-20 px-4 py-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/8 outline-none transition-all text-[13px] font-medium text-slate-700 placeholder:text-slate-400 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions — Add Transaction first, Clear Form after */}
                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={manualSubmitting || !selectedAccount}
                        className="bg-primary hover:bg-primary/90 text-white h-10 px-7 rounded-lg text-[13px] font-semibold shadow-sm flex items-center gap-2"
                      >
                        {manualSubmitting
                          ? <><Loader2 className="h-4 w-4 animate-spin" />Adding…</>
                          : <><CheckCircle2 className="h-4 w-4" />Add Transaction</>}
                      </Button>
                      <Button type="button" variant="ghost" onClick={clearManualForm}
                        className="h-10 px-5 text-[12.5px] font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                        Clear Form
                      </Button>
                    </div>
                  </form>

                  {/* Recent entries feed */}
                  {recentTransactions.length > 0 && (
                    <div className="pt-8 border-t border-slate-100">
                      <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Recently Added</p>
                      <div className="space-y-2">
                        {recentTransactions.slice(0, 4).map((txn, idx) => (
                          <div key={txn.id || idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 flex items-center justify-center rounded-lg text-[10px] font-bold
                                ${txn.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                                {txn.type === 'credit' ? 'CR' : 'DR'}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-slate-800 leading-tight">{txn.description}</p>
                                <p className="text-[11px] text-slate-400">{formatDisplayDate(txn.date)}</p>
                              </div>
                            </div>
                            <p className={`text-[13.5px] font-semibold tabular-nums ${txn.type === 'credit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                              ₹{txn.amount?.toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ══════════════════════════════════════
                  TAB 2: BULK TEMPLATE
              ══════════════════════════════════════ */}
              <TabsContent value="template" className="mt-0 focus-visible:ring-0 outline-none p-6 md:p-8">
                <div className="space-y-7">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-[17px] font-bold text-slate-900">Bulk Template Import</h3>
                    <p className="text-[12px] text-slate-400 mt-0.5">Download our template, fill it in Excel, then upload.</p>
                  </div>
                  {renderAccountSelector()}

                  <AnimatePresence mode="wait">
                    {(templateStep === 'download' || templateStep === 'upload') && (
                      <motion.div key="template-upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                        {/* Step 1 */}
                        <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-[12px] font-bold text-slate-500">1</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[14px] font-semibold text-slate-800 mb-0.5">Download Template</h4>
                            <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">Get the recommended format to ensure error-free import.</p>
                            <Button onClick={downloadTemplate} variant="outline" className="h-9 px-4 rounded-lg text-[12.5px] font-medium border-slate-200 hover:bg-slate-100">
                              <Download className="h-3.5 w-3.5 mr-2" />Download CSV Template
                            </Button>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div>
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-[12px] font-bold text-slate-500">2</span>
                            </div>
                            <p className="text-[13px] font-semibold text-slate-700">Upload Filled File</p>
                          </div>
                          <DropZone accept=".csv,.xls,.xlsx" onFile={handleTemplateFile} file={templateFile} loading={templateParsing}
                            label="Drop your filled template here" sublabel="Supports CSV, XLS, XLSX" />
                        </div>
                      </motion.div>
                    )}

                    {templateStep === 'preview' && templateData && (
                      <motion.div key="template-preview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-slate-900">Review Transactions</p>
                              <p className="text-[11px] text-slate-400">{templateData.rows.length} records detected</p>
                            </div>
                          </div>
                          <button onClick={resetTemplate} className="text-[12px] font-medium text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors">
                            <X className="h-3.5 w-3.5" />Cancel
                          </button>
                        </div>

                        <PreviewTable headers={templateData.headers} rows={templateData.rows} />

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <Button onClick={handleTemplateImport} disabled={templateImporting}
                            className="bg-primary hover:bg-primary/90 text-white h-10 px-7 rounded-lg text-[13px] font-semibold shadow-sm flex items-center gap-2">
                            {templateImporting ? <><Loader2 className="h-4 w-4 animate-spin" />Importing…</> : <><CheckCircle2 className="h-4 w-4" />Confirm Import</>}
                          </Button>
                          <Button variant="outline" onClick={resetTemplate} className="h-10 px-5 rounded-lg text-[13px] font-medium border-slate-200 text-slate-500">Discard</Button>
                        </div>
                      </motion.div>
                    )}

                    {templateStep === 'done' && (
                      <DoneState title="Import Complete" subtitle="All records have been added to the ledger."
                        accentClass="bg-emerald-500 shadow-emerald-200"
                        onView={() => navigate('/transactions')} onReset={resetTemplate} resetLabel="Import More" />
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>

              {/* ══════════════════════════════════════
                  TAB 3: CSV / EXCEL
              ══════════════════════════════════════ */}
              <TabsContent value="csv" className="mt-0 focus-visible:ring-0 outline-none p-6 md:p-8">
                <div className="space-y-7">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-[17px] font-bold text-slate-900">CSV & Excel Import</h3>
                    <p className="text-[12px] text-slate-400 mt-0.5">Upload any bank statement or ledger file — headers auto-detected.</p>
                  </div>
                  {renderAccountSelector()}

                  <AnimatePresence mode="wait">
                    {csvStep === 'upload' && (
                      <motion.div key="csv-upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                        <DropZone accept=".csv,.xls,.xlsx"
                          onFile={handleCsvFile}
                          file={csvFile || (csvFileMeta ? { name: csvFileMeta.name, size: csvFileMeta.size, isGhost: true } : null)}
                          loading={csvParsing}
                          label="Upload your bank statement or ledger"
                          sublabel="Auto-maps headers for Date, Particulars, and Amount"
                        />
                        <div className="flex items-start gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
                          <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[12.5px] text-blue-700 font-medium leading-relaxed">
                            Our engine automatically detects and matches column headers. You can refine the mapping in the next step.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {csvStep === 'preview' && csvData && (
                      <motion.div key="csv-preview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                              <FileSpreadsheet className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-slate-900">Validate Transactions</p>
                              <p className="text-[11px] text-slate-400">{csvData.rows.length} records to be imported</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCsvMappingOpen(true)}
                              className="h-8 px-3 rounded-lg border-slate-200 text-[12px] font-medium hover:bg-slate-50 flex items-center gap-1.5">
                              <GripVertical className="h-3.5 w-3.5" />Edit Mapping
                            </Button>
                            <button onClick={resetCsv} className="text-[12px] font-medium text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors h-8 px-2">
                              <X className="h-3.5 w-3.5" />Cancel
                            </button>
                          </div>
                        </div>

                        {/* Mapping pills */}
                        <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          {csvData.headers.map((h, i) => {
                            const mapped = csvMapping[h];
                            return (
                              <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-medium
                                ${mapped ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                {h}
                                {mapped && <><ArrowRight className="h-2.5 w-2.5 opacity-60" />{mapped}</>}
                              </span>
                            );
                          })}
                        </div>

                        <PreviewTable headers={csvData.headers} rows={csvData.rows} mapping={csvMapping} />

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <Button onClick={handleCsvImport} disabled={csvImporting || !selectedAccount}
                            className={`bg-primary hover:bg-primary/90 text-white h-10 px-7 rounded-lg text-[13px] font-semibold shadow-sm flex items-center gap-2 ${!selectedAccount ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {csvImporting ? <><Loader2 className="h-4 w-4 animate-spin" />Importing…</> : <><CheckCircle2 className="h-4 w-4" />Finalize & Import</>}
                          </Button>
                          <Button variant="outline" onClick={resetCsv} className="h-10 px-5 rounded-lg text-[13px] font-medium border-slate-200 text-slate-500">Discard</Button>
                          {!selectedAccount && (
                            <p className="text-[12px] text-rose-500 font-medium flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" />Select an account first
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {csvStep === 'done' && (
                      <DoneState title="Ledger Updated" subtitle="CSV data has been processed and posted successfully."
                        accentClass="bg-primary shadow-primary/20"
                        onView={() => navigate('/transactions')} onReset={resetCsv} resetLabel="Finish" />
                    )}
                  </AnimatePresence>

                  <ColumnMappingModal
                    open={csvMappingOpen} onClose={() => setCsvMappingOpen(false)}
                    fileHeaders={csvData?.headers || []} mapping={csvMapping} setMapping={setCsvMapping}
                    customFields={csvCustomFields} setCustomFields={setCsvCustomFields}
                    onConfirm={() => { setCsvMappingOpen(false); setCsvStep('preview'); }}
                  />
                </div>
              </TabsContent>

              {/* ══════════════════════════════════════
                  TAB 4: PDF STATEMENT
              ══════════════════════════════════════ */}
              <TabsContent value="pdf" className="mt-0 focus-visible:ring-0 outline-none p-6 md:p-8">
                <div className="space-y-7">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-[17px] font-bold text-slate-900">PDF Bank Statement</h3>
                    <p className="text-[12px] text-slate-400 mt-0.5">Upload a text-based PDF statement for automatic extraction.</p>
                  </div>
                  {renderAccountSelector()}

                  {pdfStep === 'upload' && (
                    <div className="space-y-5">
                      <DropZone accept=".pdf" onFile={handlePdfFile} file={pdfFile} loading={pdfParsing}
                        label="Drop your bank statement PDF" sublabel="Text-based PDF files only" />

                      {pdfFile && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                          <Button onClick={handlePdfImport} disabled={pdfImporting || !selectedAccount}
                            className="w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 shadow-sm">
                            {pdfImporting ? <><Loader2 className="h-4 w-4 animate-spin" />Parsing & Importing…</> : <><Upload className="h-4 w-4" />Parse & Import Transactions</>}
                          </Button>
                        </motion.div>
                      )}

                      <div className="flex items-start gap-3 p-4 bg-amber-50/70 border border-amber-100 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[12.5px] font-semibold text-amber-800 mb-1.5">Tips for Best Results</p>
                          <ul className="text-[12px] text-amber-700 space-y-1 list-disc list-inside">
                            <li>Use text-based PDFs, not scanned images</li>
                            <li>Works best with standard bank statement layouts</li>
                            <li>Ensure the statement has a clear transaction table</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {pdfStep === 'done' && (
                    <DoneState title="Import Successful" subtitle="Transactions extracted from PDF and added to the ledger."
                      accentClass="bg-emerald-500 shadow-emerald-200"
                      onView={() => navigate('/transactions')} onReset={resetPdf} resetLabel="Import Another" />
                  )}
                </div>
              </TabsContent>

            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* ── Discard Popup ── */}
      <ConfirmPopup
        open={blocker.state === "blocked" || !!pendingTab}
        onClose={cancelDiscard} onConfirm={confirmDiscard}
        title="Discard Changes?"
        description="You have an active operation in progress. If you leave now, your session data and previews will be lost."
      />

      {/* ── Balance Mismatch Dialog ── */}
      <Dialog open={!!mismatchData} onOpenChange={(val) => !val && setMismatchData(null)}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border border-slate-100 shadow-2xl bg-white">
          <div className="p-8">
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 mb-6 mx-auto">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>

            <DialogHeader className="text-center mb-7">
              <DialogTitle className="text-[20px] font-bold text-slate-900">Balance Mismatch</DialogTitle>
              <DialogDescription className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">
                The balance in your file doesn't match the calculated ledger balance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mb-7">
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calculated Balance</span>
                <span className="text-[15px] font-bold text-slate-900">₹{mismatchData?.calculated?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-center py-1">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-3 py-1 bg-amber-50 rounded-full border border-amber-100">vs</span>
              </div>
              <div className="flex items-center justify-between px-5 py-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">File Balance</span>
                <span className="text-[15px] font-bold text-amber-800">₹{mismatchData?.provided?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-center text-[12.5px] text-slate-400 mb-7 leading-relaxed">
              Force update account balance to <span className="font-semibold text-slate-700">₹{mismatchData?.provided?.toLocaleString('en-IN')}</span> and continue?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setMismatchData(null)}
                className="h-10 rounded-xl border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </Button>
              <Button
                disabled={mismatchConfirming}
                onClick={async () => {
                  setMismatchConfirming(true);
                  try {
                    if (mismatchData.source === 'manual') await handleManualSubmit(null, true);
                    else if (mismatchData.source === 'csv') await handleCsvImport(true);
                    else if (mismatchData.source === 'template') await handleTemplateImport(true);
                    else if (mismatchData.source === 'pdf') await handlePdfImport(true);
                  } finally { setMismatchConfirming(false); setMismatchData(null); }
                }}
                className="h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-semibold shadow-sm"
              >
                {mismatchConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Balance'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddTransactions;