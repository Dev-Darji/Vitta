import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Search, MapPin, FileText, Trash2, Loader2, CreditCard, Upload, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

/* ─── Font ─────────────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    [data-clients] { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

/* ─── Field Label ────────────────────────────────────────────────────────── */
const FieldLabel = ({ children }) => (
  <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
    {children}
  </Label>
);

const indianStates = [
  "Jammu & Kashmir", "Himachal Pradesh", "Punjab", "Chandigarh", "Uttarakhand", "Haryana", 
  "Delhi", "Rajasthan", "Uttar Pradesh", "Bihar", "Sikkim", "Arunachal Pradesh", 
  "Nagaland", "Manipur", "Mizoram", "Tripura", "Meghalaya", "Assam", 
  "West Bengal", "Jharkhand", "Odisha", "Chhattisgarh", "Madhya Pradesh", "Gujarat", 
  "Daman & Diu", "Dadra & Nagar Haveli", "Maharashtra", "Andhra Pradesh (Old)", 
  "Karnataka", "Goa", "Lakshadweep", "Kerala", "Tamil Nadu", "Puducherry", 
  "Andaman & Nicobar", "Telangana", "Andhra Pradesh", "Ladakh"
];

const businessTypes = [
  "Proprietorship", "Partnership", "LLP", "Pvt Ltd", "Public Ltd", "Trust", "HUF", "Individual"
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '', business_type: 'Pvt Ltd', gstin: '', address: '', state: 'Gujarat', currency: 'INR', country: 'India', notes: ''
  });
  const [editingClient, setEditingClient] = useState(null);

  const location = useLocation();

  useEffect(() => {
    fetchClients();
    if (location.state?.openAdd) setIsAddOpen(true);
  }, [location.state]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  };

  const handleAddClient = async () => {
    if (!newClient.name) { toast.error('Client name is required'); return; }
    try {
      setSubmitting(true);
      await api.post('/clients', newClient);
      toast.success('Client added');
      setIsAddOpen(false);
      setNewClient({ name: '', business_type: 'Pvt Ltd', gstin: '', address: '', state: 'Gujarat', currency: 'INR', country: 'India', notes: '' });
      fetchClients();
    } catch { toast.error('Failed to add client'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateClient = async () => {
    if (!editingClient.name) { toast.error('Client name is required'); return; }
    try {
      setSubmitting(true);
      await api.put(`/clients/${editingClient.id}`, editingClient);
      toast.success('Client updated');
      setIsEditOpen(false);
      fetchClients();
    } catch { toast.error('Failed to update client'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    try { await api.delete(`/clients/${id}`); toast.success('Client removed'); fetchClients(); }
    catch { toast.error('Failed to delete client'); }
  };

  const handleImportClients = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading(`Importing ${file.name}...`);
    try {
      const res = await api.post('/clients/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message, { id: toastId });
      fetchClients();
    } catch { toast.error('Import failed', { id: toastId }); }
  };

  const openEdit = (client) => {
    setEditingClient({ ...client });
    setIsEditOpen(true);
  };

  const filteredClients = clients.filter(c =>
    (c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.gstin?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div data-clients data-testid="clients-page" className="space-y-6 pb-20">
      <FontStyle />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients Management</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your customer database & billing info</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 h-9 px-4 rounded-lg text-[13px] font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="h-4 w-4" /> Import Clients
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImportClients} />
          </label>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-client-button"
                className="bg-slate-900 hover:bg-black text-white h-9 px-6 rounded-lg text-[13px] font-bold shadow-lg shadow-slate-200 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Client
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="px-6 py-5 border-b border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-[17px] font-bold text-slate-900">New Client</DialogTitle>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <FieldLabel>Company Name</FieldLabel>
                  <Input 
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    required 
                    placeholder="Legal Name" 
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Business Type</FieldLabel>
                    <Select value={newClient.business_type} onValueChange={v => setNewClient({ ...newClient, business_type: v })}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        {businessTypes.map(t => <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>GSTIN</FieldLabel>
                    <Input 
                      value={newClient.gstin}
                      onChange={e => setNewClient({ ...newClient, gstin: e.target.value.toUpperCase() })}
                      maxLength={15} 
                      placeholder="Optional" 
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>State</FieldLabel>
                    <Select value={newClient.state} onValueChange={v => setNewClient({ ...newClient, state: v })}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        {indianStates.map(s => <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>City / Currency</FieldLabel>
                    <Input 
                      value={newClient.currency}
                      onChange={e => setNewClient({ ...newClient, currency: e.target.value })}
                      placeholder="INR" 
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px]"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Billing Address</FieldLabel>
                  <Input 
                    value={newClient.address}
                    onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                    placeholder="Full Address" 
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100 mt-2">
                  <Button variant="ghost" className="h-10 text-[13px] font-medium" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleAddClient} 
                    disabled={submitting}
                    className="h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-md"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Client'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          {editingClient && (
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
                <div className="px-6 py-5 border-b border-slate-100">
                  <DialogHeader>
                    <DialogTitle className="text-[17px] font-bold text-slate-900">Edit Client</DialogTitle>
                  </DialogHeader>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div>
                    <FieldLabel>Company Name</FieldLabel>
                    <Input 
                      value={editingClient.name}
                      onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                      required 
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Business Type</FieldLabel>
                      <Select value={editingClient.business_type} onValueChange={v => setEditingClient({ ...editingClient, business_type: v })}>
                        <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <FieldLabel>GSTIN</FieldLabel>
                      <Input 
                        value={editingClient.gstin}
                        onChange={e => setEditingClient({ ...editingClient, gstin: e.target.value.toUpperCase() })}
                        className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>State</FieldLabel>
                    <Select value={editingClient.state} onValueChange={v => setEditingClient({ ...editingClient, state: v })}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FieldLabel>Billing Address</FieldLabel>
                    <Input 
                      value={editingClient.address}
                      onChange={e => setEditingClient({ ...editingClient, address: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100 mt-2">
                    <Button variant="ghost" className="h-10 text-[13px]" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleUpdateClient} 
                      disabled={submitting}
                      className="h-10 rounded-lg bg-primary text-white text-[13px] font-bold"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
          <Input 
            placeholder="Search clients by name, GSTIN, or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-10 border-transparent bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl transition-all text-[13.5px] font-medium"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <div className="h-10 px-4 flex items-center bg-indigo-50/50 rounded-xl">
             <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-tighter">{clients.length} Total</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-8 w-8 text-primary/30 animate-spin" />
          <p className="text-[12px] font-medium text-slate-400">Loading your customers...</p>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
           <AnimatePresence>
            {filteredClients.map((client, idx) => (
              <motion.div
                layout
                key={client.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="group p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:border-slate-900 transition-colors duration-300">
                      <Building2 className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(client)} className="h-8 w-8 text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id)} className="h-8 w-8 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-bold text-[15px] text-slate-900 leading-tight mb-1">{client.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight py-0 px-1.5 border-slate-200 text-slate-400">
                      {client.business_type || 'Individual'}
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <div className="h-6 w-6 rounded-md bg-slate-50 flex items-center justify-center">
                        <FileText className="h-3 w-3" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded uppercase">
                        {client.gstin || 'No GSTIN'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-slate-500">
                      <div className="h-6 w-6 rounded-md bg-slate-50 flex items-center justify-center mt-0.5">
                        <MapPin className="h-3 w-3" />
                      </div>
                      <span className="text-[12px] font-medium leading-normal line-clamp-2">
                        {client.address}, {client.state}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Base Currency</span>
                       <span className="text-[12px] font-black text-slate-900">{client.currency}</span>
                    </div>
                    <Button variant="link" className="h-auto p-0 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group/btn">
                      View Invoices <Plus className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
           </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-4">
            <Building2 className="h-7 w-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No clients found</h3>
          <p className="text-[13px] text-slate-400 mt-1 mb-6 text-center max-w-[280px]">
            {searchQuery ? `No results for "${searchQuery}"` : "Get started by adding your first client for billing."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsAddOpen(true)} className="h-10 px-8 rounded-xl bg-slate-900 text-white font-bold text-[13px] shadow-lg shadow-slate-200">
               Add First Client
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Clients;