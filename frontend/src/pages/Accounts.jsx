import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Wallet, Building2, CreditCard, Banknote, Calendar, Info, Loader2, ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';

/* ─── Font Injection ──────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    [data-accounts-root] { font-family: 'DM Sans', sans-serif; }
    

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    [data-accounts-root] .account-card {
      animation: cardIn 0.22s ease both;
    }
  `}</style>
);

/* ─── Shared Field Label ─────────────────────────────────────────────────── */
const FieldLabel = ({ children }) => (
  <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
    {children}
  </Label>
);

/* ─── Account Type Config ────────────────────────────────────────────────── */
const typeConfig = {
  Bank: { icon: Building2, bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100' },
  Cash: { icon: Banknote,   bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  Card: { icon: CreditCard, bg: 'bg-rose-50',    text: 'text-rose-500',    border: 'border-rose-100' },
};

/* ─── Dialog Form Fields (shared between create/edit) ─── */
const AccountFormFields = ({ data, onChange, isEdit = false, clients = [] }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {!isEdit && (
        <div>
          <FieldLabel>Linked Client (Optional)</FieldLabel>
          <Select value={data.client_id} onValueChange={(val) => onChange({ client_id: val })}>
            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
              <SelectValue placeholder="Select Client (Optional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100">
              <SelectItem value="null" className="text-[13px] text-slate-400 italic">None / Internal</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-[13px]">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className={!isEdit ? '' : 'col-span-2'}>
        <FieldLabel>Account Name</FieldLabel>
        <Input
          placeholder="e.g. HDFC Salary"
          value={data.account_name}
          onChange={e => onChange({ account_name: e.target.value })}
          required
          className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <FieldLabel>Account Type</FieldLabel>
        <Select value={data.account_type} onValueChange={(val) => onChange({ account_type: val })}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100">
            <SelectItem value="Bank" className="text-[13px]">Bank Account</SelectItem>
            <SelectItem value="Cash" className="text-[13px]">Cash in Hand</SelectItem>
            <SelectItem value="Card" className="text-[13px]">Credit Card</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <FieldLabel>Currency</FieldLabel>
        <Select value={data.currency} onValueChange={(val) => onChange({ currency: val })}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100">
            <SelectItem value="INR" className="text-[13px]">INR (₹)</SelectItem>
            <SelectItem value="USD" className="text-[13px]">USD ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <FieldLabel>Opening Balance</FieldLabel>
        <Input
          type="number"
          value={data.opening_balance}
          onChange={e => onChange({ opening_balance: parseFloat(e.target.value) || 0 })}
          required
          className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px]"
        />
      </div>
      <div>
        <FieldLabel>As of Date</FieldLabel>
        <Input
          type="date"
          value={data.opening_balance_date}
          onChange={e => onChange({ opening_balance_date: e.target.value })}
          required
          className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
        />
      </div>
    </div>
  </div>
);

/* ─── Account Card ───────────────────────────────────────────────────────── */
const AccountCard = ({ account, cfg, Icon, index, getClientName, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const sym = account.currency === 'INR' ? '₹' : account.currency;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden">

        {/* ── Top section: icon + name + balance ── */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
          {/* Left: icon + name */}
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <Icon style={{ height: '18px', width: '18px' }} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900 leading-tight">{account.account_name}</p>
              <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                {getClientName(account.client_id)}
                {account.bank_name ? <span> · {account.bank_name}</span> : ''}
              </p>
            </div>
          </div>

          {/* Right: balance */}
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Balance</p>
            <p className="text-[18px] font-bold text-slate-900 leading-tight">
              {sym}{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ── Expandable section ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-4">
                {/* Inflow / Outflow */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <ArrowRight className="h-3 w-3 text-emerald-500 rotate-[-45deg]" />
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Inflow</p>
                    </div>
                    <p className="text-[16px] font-bold text-emerald-700">{sym}{(account.inflow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="px-4 py-3 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <ArrowRight className="h-3 w-3 text-rose-500 rotate-[135deg]" />
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Outflow</p>
                    </div>
                    <p className="text-[16px] font-bold text-rose-600">{sym}{(account.outflow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onEdit}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={onDelete}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Toggle — right aligned */}
                  <button
                    onClick={() => setExpanded(false)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
                  >
                    Hide Details <motion.span animate={{ rotate: 180 }} style={{ display:'inline-block' }} className="text-[10px]">▾</motion.span>
                  </button>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Currency</p>
                    <p className="text-[13px] font-semibold text-slate-800">{account.currency}</p>
                  </div>
                  {account.opening_balance_date && (
                    <div>
                      <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Since</p>
                      <p className="text-[13px] font-semibold text-slate-800">
                        {new Date(account.opening_balance_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Opening Balance</p>
                    <p className="text-[13px] font-semibold text-slate-800">{sym}{account.opening_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                    <p className="text-[13px] font-semibold text-slate-800">{account.account_type}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Toggle footer (when collapsed) ── */}
        {!expanded && (
          <div className="px-5 pb-4 flex items-center justify-end">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
            >
              Show Details <span className="text-[10px]">▾</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const [newAccount, setNewAccount] = useState({
    client_id: '',
    account_name: '',
    account_type: 'Bank',
    bank_name: '',
    account_number: '',
    opening_balance: 0,
    opening_balance_date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
    currency: 'INR',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isClientOpen, setIsClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', business_type: '', currency: 'INR', country: 'India', notes: '' });
  const [clientSubmitting, setClientSubmitting] = useState(false);

  const location = useLocation();

  useEffect(() => {
    fetchInitialData();
    if (location.state?.openAdd) setIsOpen(true);
  }, [location.state]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [accRes, clRes] = await Promise.all([
        api.get('/accounts/summary'),
        api.get('/clients')
      ]);
      setAccounts(accRes.data.accounts.map(acc => ({
        ...acc,
        balance: (acc.opening_balance || 0) + (acc.inflow || 0) - (acc.outflow || 0)
      })));
      setClients(clRes.data);
      if (clRes.data.length > 0) setNewAccount(prev => ({ ...prev, client_id: clRes.data[0].id }));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.account_name) { toast.error('Account name is required'); return; }
    const payload = {
      ...newAccount,
      client_id: newAccount.client_id === 'null' ? null : (newAccount.client_id || null)
    };
    try {
      setSubmitting(true);
      await api.post('/accounts', payload);
      toast.success('Account created');
      setIsOpen(false);
      setNewAccount({ client_id: clients[0]?.id || '', account_name: '', account_type: 'Bank', bank_name: '', account_number: '', opening_balance: 0, opening_balance_date: new Date().toISOString().split('T')[0], currency: 'INR', notes: '' });
      fetchInitialData();
    } catch { toast.error('Failed to create account'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Delete this account and all linked transactions?')) return;
    try { await api.delete(`/accounts/${id}`); toast.success('Account removed'); fetchInitialData(); }
    catch { toast.error('Failed to delete account'); }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/accounts/${editingAccount.id}`, editingAccount);
      toast.success('Account updated');
      setIsEditOpen(false);
      fetchInitialData();
    } catch { toast.error('Failed to update account'); }
    finally { setSubmitting(false); }
  };

  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || 'Unknown';

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name) return;
    try {
      setClientSubmitting(true);
      const response = await api.post('/clients', newClient);
      toast.success('Client registered');
      setIsClientOpen(false);
      const clRes = await api.get('/clients');
      setClients(clRes.data);
      setNewAccount(prev => ({ ...prev, client_id: response.data.id }));
    } catch { toast.error('Failed to create client'); }
    finally { setClientSubmitting(false); }
  };

  const handleImportAccounts = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading(`Importing ${file.name}...`);
    try {
      const res = await api.post('/accounts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message, { id: toastId });
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed', { id: toastId });
    } finally {
      e.target.value = ''; // Reset
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div data-accounts-root className="space-y-7 pb-20">
      <FontStyle />

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Accounts Management</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Financial Ledger Control & Balances</p>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            id="bulk-import-accounts" 
            className="hidden" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleImportAccounts}
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('bulk-import-accounts').click()}
            className="h-9 px-4 rounded-lg text-[13px] font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-2"
          >
            <Upload className="h-4 w-4 text-slate-400" />
            Bulk Import
          </Button>

          {/* ── Create Account Dialog ── */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white h-9 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-slate-200 font-bold text-[13px]">
                <Plus className="h-4 w-4" />
                <span>Add Account</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="px-7 py-5 border-b border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-[17px] font-bold text-slate-900">New Ledger Account</DialogTitle>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">Initialize a new asset source for tracking.</p>
                </DialogHeader>
              </div>
              <form onSubmit={handleCreateAccount} className="px-7 py-6 space-y-5">
                <AccountFormFields
                  data={newAccount}
                  onChange={(patch) => setNewAccount(prev => ({ ...prev, ...patch }))}
                  clients={clients}
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="h-9 px-5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="h-9 px-6 rounded-lg bg-slate-900 text-white text-[13px] font-bold shadow-sm">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Worth */}
        <div className="bg-slate-900 px-6 py-5 rounded-xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-2 flex items-center gap-1.5">
              <Wallet className="h-3 w-3" />Total Net Worth
            </p>
            <p className="text-[26px] font-bold tracking-tight leading-none">
              <span className="text-[15px] font-medium opacity-50 mr-0.5">₹</span>
              {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Wallet className="absolute -bottom-3 -right-3 h-14 w-14 opacity-[0.06] group-hover:scale-110 transition-transform duration-300" />
        </div>

        {/* Clients */}
        <div className="bg-white px-6 py-5 rounded-xl border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-1">Total Clients</p>
            <p className="text-[22px] font-bold text-slate-900 leading-none">{clients.length}</p>
          </div>
        </div>

        {/* Active Ledgers */}
        <div className="bg-white px-6 py-5 rounded-xl border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-1">Active Ledgers</p>
            <p className="text-[22px] font-bold text-slate-900 leading-none">{accounts.length}</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-7 w-7 text-primary/30 animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-28 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
            <CreditCard className="h-7 w-7 text-slate-200" />
          </div>
          <h3 className="text-[18px] font-bold text-slate-800 mb-2">No Accounts Yet</h3>
          <p className="text-[13px] text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
            Add your first bank account or cash ledger to start tracking transactions.
          </p>
          <Button onClick={() => setIsOpen(true)} className="bg-slate-900 hover:bg-black text-white px-7 h-10 rounded-xl text-[13px] font-semibold shadow-sm">
            Add First Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {accounts.map((account, index) => {
              const cfg = typeConfig[account.account_type] || typeConfig.Bank;
              const Icon = cfg.icon;
              return (
                <AccountCard
                  key={account.id}
                  account={account}
                  cfg={cfg}
                  Icon={Icon}
                  index={index}
                  getClientName={getClientName}
                  onEdit={() => { setEditingAccount(account); setIsEditOpen(true); }}
                  onDelete={() => handleDeleteAccount(account.id)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Edit Account Dialog ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
          <div className="px-7 py-5 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-[17px] font-bold text-slate-900">Edit Account</DialogTitle>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Update ledger configuration and details.</p>
            </DialogHeader>
          </div>

          {editingAccount && (
            <form onSubmit={handleUpdateAccount} className="px-7 py-6 space-y-5">
              <AccountFormFields
                data={editingAccount}
                onChange={(patch) => setEditingAccount(prev => ({ ...prev, ...patch }))}
                isEdit
                clients={clients}
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="h-9 px-5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="h-9 px-6 rounded-lg bg-primary text-white text-[13px] font-semibold shadow-sm">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;