import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Search, MapPin, FileText, Trash2, Loader2, CreditCard, Upload } from 'lucide-react';
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '', business_type: '', gstin: '', address: '', state: '', currency: 'INR', country: 'India', notes: ''
  });

  const indianStates = [
    "Jammu & Kashmir", "Himachal Pradesh", "Punjab", "Chandigarh", "Uttarakhand", "Haryana", 
    "Delhi", "Rajasthan", "Uttar Pradesh", "Bihar", "Sikkim", "Arunachal Pradesh", 
    "Nagaland", "Manipur", "Mizoram", "Tripura", "Meghalaya", "Assam", 
    "West Bengal", "Jharkhand", "Odisha", "Chhattisgarh", "Madhya Pradesh", "Gujarat", 
    "Daman & Diu", "Dadra & Nagar Haveli", "Maharashtra", "Andhra Pradesh (Old)", 
    "Karnataka", "Goa", "Lakshadweep", "Kerala", "Tamil Nadu", "Puducherry", 
    "Andaman & Nicobar", "Telangana", "Andhra Pradesh", "Ladakh"
  ];

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
      setNewClient({ name: '', business_type: '', gstin: '', address: '', state: '', currency: 'INR', country: 'India', notes: '' });
      fetchClients();
    } catch { toast.error('Failed to add client'); }
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
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed', { id: toastId });
    } finally {
      e.target.value = ''; // Reset
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.business_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-clients className="space-y-6 pb-20">
      <FontStyle />

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients Management</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Registry of Business Entities & Profiles</p>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            id="bulk-import-clients" 
            className="hidden" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleImportClients}
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('bulk-import-clients').click()}
            className="h-9 px-4 rounded-lg text-[13px] font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-2"
          >
            <Upload className="h-4 w-4 text-slate-400" />
            Bulk Import
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white h-9 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-slate-200 font-bold text-[13px]">
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="px-7 py-5 border-b border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-[17px] font-bold text-slate-900">New Client</DialogTitle>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">Register a new business entity or individual client.</p>
                </DialogHeader>
              </div>

              <div className="px-7 py-6 space-y-4">
                <div>
                  <FieldLabel>Organization Name</FieldLabel>
                  <Input
                    placeholder="e.g. ABC Traders Pvt Ltd"
                    value={newClient.name}
                    onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>GSTIN (Optional)</FieldLabel>
                    <Input
                      placeholder="22AAAAA0000A1Z5"
                      value={newClient.gstin}
                      onChange={e => setNewClient(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-bold uppercase"
                    />
                  </div>
                  <div>
                    <FieldLabel>Business Type</FieldLabel>
                    <Input
                      placeholder="e.g. Retail"
                      value={newClient.business_type}
                      onChange={e => setNewClient(prev => ({ ...prev, business_type: e.target.value }))}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>State (PoS)</FieldLabel>
                    <Select value={newClient.state} onValueChange={v => setNewClient(prev => ({ ...prev, state: v }))}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map(s => <SelectItem key={s} value={s} className="text-xs font-semibold">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Currency</FieldLabel>
                    <Select value={newClient.currency} onValueChange={v => setNewClient(prev => ({ ...prev, currency: v }))}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR" className="text-xs font-semibold">INR (₹)</SelectItem>
                        <SelectItem value="USD" className="text-xs font-semibold">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <FieldLabel>Registered Address</FieldLabel>
                  <Input
                    placeholder="Building, Street, Area..."
                    value={newClient.address}
                    onChange={e => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                  />
                </div>
              </div>

              <div className="px-7 py-5 bg-slate-50/50 border-t border-slate-100">
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="h-10 px-6 text-slate-500 font-bold text-xs uppercase tracking-widest">Cancel</Button>
                  <Button onClick={handleAddClient} disabled={submitting} className="h-10 flex-1 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-200">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Client'}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
        <Input
          placeholder="Filter clients by name or business type..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-11 pl-11 rounded-xl border-slate-100 bg-white shadow-sm font-medium text-[13px]"
        />
      </div>

      {/* ── Clients Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-indigo-200 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, idx) => (
              <motion.div
                layout
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClient(client.id)}
                    className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Building2 className="h-7 w-7" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-black text-slate-900 truncate tracking-tight">{client.name}</h3>
                      {client.gstin && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[9px] h-4 uppercase tracking-tighter shrink-0">
                          GST
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      <span>{client.business_type || 'General'}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      <span>{client.state}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unpaid Balance</p>
                        <p className="text-[14px] font-black text-slate-900">₹0.00</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Invoices</p>
                        <p className="text-[14px] font-black text-slate-900">0</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <MapPin className="h-3 w-3" />
                     </div>
                     <p className="text-[11px] font-bold text-slate-500 truncate max-w-[140px]">{client.address || 'Address not listed'}</p>
                   </div>
                   <Button variant="ghost" className="h-8 pr-0 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-transparent hover:translate-x-1 transition-all">
                      View Ledger
                   </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredClients.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <Building2 className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No Clients Found</h3>
              <p className="text-sm font-medium text-slate-400 max-w-xs mt-2">Try adjusting your search or add a new client to your registry.</p>
              <Button onClick={() => setIsAddOpen(true)} variant="link" className="mt-4 text-indigo-600 font-bold">Register your first client</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Clients;