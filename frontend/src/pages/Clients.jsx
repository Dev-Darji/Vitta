import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Search, MapPin, FileText, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
                  <FieldLabel>State (Place of Supply)</FieldLabel>
                  <Select value={newClient.state} onValueChange={v => setNewClient(prev => ({ ...prev, state: v }))}>
                    <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map(s => (
                        <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Currency</FieldLabel>
                  <Select value={newClient.currency} onValueChange={v => setNewClient(prev => ({ ...prev, currency: v }))}>
                    <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      <SelectItem value="INR" className="text-[13px]">INR (₹)</SelectItem>
                      <SelectItem value="USD" className="text-[13px]">USD ($)</SelectItem>
                      <SelectItem value="GBP" className="text-[13px]">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <FieldLabel>Full Address</FieldLabel>
                <Input
                  placeholder="Building, Street, Area..."
                  value={newClient.address}
                  onChange={e => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                />
              </div>

              <div>
                <FieldLabel>Country</FieldLabel>
                <Input
                  placeholder="India"
                  value={newClient.country}
                  onChange={e => setNewClient(prev => ({ ...prev, country: e.target.value }))}
                  className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  placeholder="Additional details..."
                  value={newClient.notes}
                  onChange={e => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 min-h-[72px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-7 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)}
                className="h-9 px-5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100">
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={submitting}
                className="h-9 px-6 rounded-lg bg-primary text-white text-[13px] font-semibold shadow-sm">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Search clients…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-9 rounded-lg border-slate-200 bg-white text-[13px] font-medium placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300 shadow-sm"
        />
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-7 w-7 text-primary/30 animate-spin" />
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
              >
                <div className="group bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100 transition-all duration-200 overflow-hidden">

                  {/* Card body */}
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/8 transition-colors">
                        <Building2 className="h-4.5 w-4.5 text-slate-500 group-hover:text-primary transition-colors" style={{ height: '18px', width: '18px' }} />
                      </div>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Name + type */}
                    <div className="mb-4">
                      <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight mb-1.5 truncate">{client.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10.5px] font-medium">
                          {client.business_type || 'Private Entity'}
                        </span>
                        {client.gstin && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[10.5px] font-black uppercase tracking-tighter">
                            GST: {client.gstin}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                      <div>
                        <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Value</p>
                        <p className="text-[13px] font-semibold text-slate-800">₹0.00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Due</p>
                        <p className="text-[13px] font-semibold text-rose-500">₹0.00</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                        <span className="text-[12px] text-slate-500 font-medium truncate">
                          {client.country || 'Not specified'} ({client.currency || 'INR'})
                        </span>
                      </div>
                      {client.notes && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                          <span className="text-[12px] text-slate-400 font-medium line-clamp-2 leading-snug">{client.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>


                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-28 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
          <div className="h-14 w-14 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mb-5">
            <Building2 className="h-6 w-6 text-slate-200" />
          </div>
          <h3 className="text-[17px] font-bold text-slate-800 mb-1.5">No clients yet</h3>
          <p className="text-[13px] text-slate-400 mb-7 max-w-xs mx-auto leading-relaxed">
            Add your first client to start organizing accounts and transactions by business entity.
          </p>
          <Button onClick={() => setIsAddOpen(true)}
            className="bg-slate-900 hover:bg-black text-white px-7 h-10 rounded-xl text-[13px] font-semibold shadow-sm">
            Add First Client
          </Button>
        </div>
      )}
    </div>
  );
};

export default Clients;