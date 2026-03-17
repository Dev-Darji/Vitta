import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Wallet, Building2, CreditCard, Banknote, Calendar, Info, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';

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
    opening_balance_date: new Date().toISOString().split('T')[0],
    currency: 'INR',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // New Client on the fly
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    business_type: '',
    currency: 'INR',
    country: 'India',
    notes: ''
  });
  const [clientSubmitting, setClientSubmitting] = useState(false);

  const location = useLocation();

  useEffect(() => {
    fetchInitialData();
    if (location.state?.openAdd) {
      setIsOpen(true);
    }
  }, [location.state]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [accRes, clRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/clients')
      ]);
      setAccounts(accRes.data);
      setClients(clRes.data);
      if (clRes.data.length > 0) {
        setNewAccount(prev => ({ ...prev, client_id: clRes.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.client_id) {
      toast.error('Please select or create a client first');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post('/accounts', newAccount);
      toast.success('Account created successfully');
      setIsOpen(false);
      setNewAccount({
        client_id: clients[0]?.id || '',
        account_name: '',
        account_type: 'Bank',
        bank_name: '',
        account_number: '',
        opening_balance: 0,
        opening_balance_date: new Date().toISOString().split('T')[0],
        currency: 'INR',
        notes: ''
      });
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account? associated transactions will also be deleted.')) return;

    try {
      await api.delete(`/accounts/${id}`);
      toast.success('Account deleted');
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/accounts/${editingAccount.id}`, editingAccount);
      toast.success('Account updated successfully');
      setIsEditOpen(false);
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update account');
    } finally {
      setSubmitting(false);
    }
  };

  const getClientName = (clientId) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name) {
      toast.error('Client name is required');
      return;
    }

    try {
      setClientSubmitting(true);
      const response = await api.post('/clients', newClient);
      toast.success('Client created successfully');
      setIsClientOpen(false);
      
      // Refresh clients and auto-select the new one
      const clRes = await api.get('/clients');
      setClients(clRes.data);
      setNewAccount(prev => ({ ...prev, client_id: response.data.id }));
      
      setNewClient({
        name: '',
        business_type: '',
        currency: 'INR',
        country: 'India',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to create client');
    } finally {
      setClientSubmitting(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Accounts</h1>
          <p className="text-slate-500 font-medium">Manage ledgers for Banks, Cash, and Credit Cards</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-6 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="h-5 w-5 mr-2" /> Add New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-8 text-white relative shrink-0 overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-50" />
               <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tight">Financial Source Setup</DialogTitle>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Register New Asset Account
                  </p>
               </DialogHeader>
            </div>
            
            <form onSubmit={handleCreateAccount} className="overflow-y-auto flex-1">
              <div className="p-8 space-y-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Linked Client</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={newAccount.client_id} 
                        onValueChange={(val) => setNewAccount({...newAccount, client_id: val})}
                      >
                        <SelectTrigger className="flex-1 rounded-xl border-slate-200 py-6 font-medium">
                          <SelectValue placeholder="Select Client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={isClientOpen} onOpenChange={setIsClientOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" className="h-[52px] w-[52px] rounded-xl border-slate-200 p-0 shrink-0 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all">
                            <Plus className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden shadow-2xl border-none">
                          <div className="bg-primary/5 p-8 border-b border-primary/10">
                            <h3 className="text-xl font-black text-primary">Quick Add Client</h3>
                            <p className="text-slate-500 text-sm font-medium">Create a new organization on the fly</p>
                          </div>
                          <div className="p-8 space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Organization Name</Label>
                              <Input 
                                placeholder="Client Name"
                                value={newClient.name}
                                onChange={e => setNewClient({...newClient, name: e.target.value})}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Business Type</Label>
                              <Input 
                                placeholder="Retail, IT, etc."
                                value={newClient.business_type}
                                onChange={e => setNewClient({...newClient, business_type: e.target.value})}
                                className="rounded-xl"
                              />
                            </div>
                            <Button 
                              onClick={handleCreateClient} 
                              disabled={clientSubmitting}
                              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                            >
                              {clientSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & Select'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Account Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Account Name</Label>
                    <Input 
                      placeholder="e.g. HDFC Salary" 
                      value={newAccount.account_name}
                      onChange={(e) => setNewAccount({...newAccount, account_name: e.target.value})}
                      required
                      className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Account Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Account Type</Label>
                    <Select 
                      value={newAccount.account_type} 
                      onValueChange={(val) => setNewAccount({...newAccount, account_type: val})}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 py-6 font-medium">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank">Bank Account</SelectItem>
                        <SelectItem value="Cash">Cash in Hand</SelectItem>
                        <SelectItem value="Card">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Currency */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Currency</Label>
                    <Select 
                      value={newAccount.currency} 
                      onValueChange={(val) => setNewAccount({...newAccount, currency: val})}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 py-6 font-medium">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newAccount.account_type !== 'Cash' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Bank / Provider</Label>
                      <Input 
                        placeholder="e.g. HDFC Bank" 
                        value={newAccount.bank_name}
                        onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
                        className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">A/C Number (Optional)</Label>
                      <Input 
                        placeholder="•••• •••• •••• 1234" 
                        value={newAccount.account_number}
                        onChange={(e) => setNewAccount({...newAccount, account_number: e.target.value})}
                        className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Opening Balance</Label>
                    <Input 
                      type="number"
                      placeholder="0.00" 
                      value={newAccount.opening_balance}
                      onChange={(e) => setNewAccount({...newAccount, opening_balance: parseFloat(e.target.value) || 0})}
                      onWheel={(e) => e.target.blur()}
                      required
                      className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">As of Date</Label>
                    <Input 
                      type="date"
                      value={newAccount.opening_balance_date}
                      onChange={(e) => setNewAccount({...newAccount, opening_balance_date: e.target.value})}
                      required
                      className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Notes & Settings</Label>
                  <textarea 
                    placeholder="Internal reference notes..." 
                    value={newAccount.notes}
                    onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                    className="w-full rounded-xl border-slate-200 p-4 focus:ring-primary/20 font-medium min-h-[80px] outline-none border focus:border-primary"
                  />
                </div>
              </div>

              <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex-row gap-4 shrink-0">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl py-6 font-bold border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold shadow-lg shadow-primary/20"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Activate Ledger'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary p-8 rounded-[40px] text-white overflow-hidden relative"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 opacity-60 mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-[10px] font-black tracking-widest uppercase">Combined Portfolio</span>
            </div>
            <p className="text-4xl font-black tracking-tight mb-2">₹{totalBalance.toLocaleString('en-IN')}</p>
            <p className="text-xs font-medium text-white/50">Current net liquid position</p>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-10">
            <Wallet className="h-40 w-40" />
          </div>
        </motion.div>

        <Card className="rounded-2xl border-slate-100 p-8 flex items-center gap-6 shadow-sm">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Organizations</p>
            <p className="text-2xl font-black text-slate-900">{clients.length}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-100 p-8 flex items-center gap-6 shadow-sm">
          <div className="h-16 w-16 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Active Accounts</p>
            <p className="text-2xl font-black text-slate-900">{accounts.length}</p>
          </div>
        </Card>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No accounts created</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">First register a client and then add their bank or cash ledgers here.</p>
          <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90">
            Get Started
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-2xl border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center
                          ${account.account_type === 'Bank' ? 'bg-blue-50 text-blue-600' : 
                            account.account_type === 'Cash' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                          {account.account_type === 'Bank' ? <Building2 className="h-7 w-7" /> : 
                           account.account_type === 'Cash' ? <Banknote className="h-7 w-7" /> : <CreditCard className="h-7 w-7" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{account.account_name}</h3>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-primary/20" />
                            {getClientName(account.client_id)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingAccount(account); setIsEditOpen(true); }} className="text-slate-200 hover:text-primary rounded-full h-10 w-10">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)} className="text-slate-200 hover:text-red-500 rounded-full h-10 w-10">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl mb-1">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Balance</p>
                        <p className="text-2xl font-black text-slate-900">
                          {account.currency === 'INR' ? '₹' : account.currency} {account.balance.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                        <p className="text-sm font-bold text-slate-600">{account.account_type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-2 pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>OPENED {account.opening_balance_date}</span>
                      </div>
                      {account.bank_name && (
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span>{account.bank_name.toUpperCase()}</span>
                          {account.account_number && <span> •••• {account.account_number.slice(-4)}</span>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* Edit Account Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-primary p-8 text-white relative shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Edit Account</DialogTitle>
              <p className="text-white/70 font-medium text-sm">Modify account details and balance</p>
            </DialogHeader>
          </div>
          
          {editingAccount && (
            <form onSubmit={handleUpdateAccount} className="overflow-y-auto flex-1">
              <div className="p-8 space-y-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Account Name</Label>
                    <Input 
                      value={editingAccount.account_name}
                      onChange={(e) => setEditingAccount({...editingAccount, account_name: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Account Type</Label>
                    <Select 
                      value={editingAccount.account_type} 
                      onValueChange={(val) => setEditingAccount({...editingAccount, account_type: val})}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank">Bank Account</SelectItem>
                        <SelectItem value="Cash">Cash in Hand</SelectItem>
                        <SelectItem value="Card">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Opening Balance</Label>
                    <Input 
                      type="number"
                      value={editingAccount.opening_balance}
                      onChange={(e) => setEditingAccount({...editingAccount, opening_balance: parseFloat(e.target.value) || 0})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">As of Date</Label>
                    <Input 
                      type="date"
                      value={editingAccount.opening_balance_date}
                      onChange={(e) => setEditingAccount({...editingAccount, opening_balance_date: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {editingAccount.account_type !== 'Cash' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Bank Name</Label>
                      <Input 
                        value={editingAccount.bank_name || ''}
                        onChange={(e) => setEditingAccount({...editingAccount, bank_name: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">A/C Number</Label>
                      <Input 
                        value={editingAccount.account_number || ''}
                        onChange={(e) => setEditingAccount({...editingAccount, account_number: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={submitting} className="rounded-xl bg-primary text-white">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;