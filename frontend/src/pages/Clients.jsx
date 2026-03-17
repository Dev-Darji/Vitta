import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Search, MapPin, Globe, FileText, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Client Form
  const [newClient, setNewClient] = useState({
    name: '',
    business_type: '',
    currency: 'INR',
    country: 'India',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const location = useLocation();

  useEffect(() => {
    fetchClients();
    if (location.state?.openAdd) {
      setIsAddOpen(true);
    }
  }, [location.state]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name) {
      toast.error('Client name is required');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/clients', newClient);
      toast.success('Client added successfully');
      setIsAddOpen(false);
      setNewClient({
        name: '',
        business_type: '',
        currency: 'INR',
        country: 'India',
        notes: ''
      });
      fetchClients();
    } catch (error) {
      toast.error('Failed to add client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client? All associated accounts will remain but may need re-linking.')) return;
    
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      fetchClients();
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.business_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients & Organizations</h1>
          <p className="text-slate-500 font-medium">Manage multiple business entities from a single dashboard</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-6 rounded-xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="h-5 w-5 mr-2" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Register New Client</DialogTitle>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Foundational Entity Setup</p>
              </DialogHeader>
            </div>
            
            <div className="p-8 space-y-6 bg-white">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Organization Name</Label>
                <Input 
                  placeholder="e.g. ABC Traders Pvt Ltd" 
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Business Type</Label>
                  <Input 
                    placeholder="e.g. Retail" 
                    value={newClient.business_type}
                    onChange={(e) => setNewClient({...newClient, business_type: e.target.value})}
                    className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Currency</Label>
                  <Select 
                    value={newClient.currency} 
                    onValueChange={(val) => setNewClient({...newClient, currency: val})}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 py-6 font-medium">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Country</Label>
                <Input 
                  placeholder="India" 
                  value={newClient.country}
                  onChange={(e) => setNewClient({...newClient, country: e.target.value})}
                  className="rounded-xl border-slate-200 py-6 focus:ring-primary/20 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Notes (Internal)</Label>
                <textarea 
                  placeholder="Any additional details..." 
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  className="w-full rounded-xl border-slate-200 p-4 focus:ring-primary/20 font-medium min-h-[100px] outline-none border focus:border-primary"
                />
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex-row gap-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAddOpen(false)}
                className="flex-1 rounded-xl py-6 font-bold border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddClient}
                disabled={submitting}
                className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold shadow-lg shadow-primary/20"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Organization'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
        <Input 
          placeholder="Search by name or type..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 py-6 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-primary/20 shadow-sm transition-all focus:bg-white"
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group rounded-2xl border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border hover:border-primary/20">
                  <CardContent className="p-0">
                    <div className="p-6 bg-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id)} className="text-slate-300 hover:text-red-500 rounded-full h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Building2 className="h-6 w-6" />
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{client.name}</h3>
                      <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium mb-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] uppercase tracking-wider font-black">{client.business_type || 'General'}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{client.currency}</span>
                      </div>
                      
                      <div className="space-y-2 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-[13px] text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{client.country}</span>
                        </div>
                        {client.notes && (
                          <div className="flex items-start gap-2 text-[13px] text-slate-600">
                            <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                            <p className="line-clamp-1">{client.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Accounts</span>
                      <Button variant="ghost" size="sm" className="h-8 text-primary font-bold hover:bg-white rounded-lg text-xs">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No organizations found</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Create your first client to start organizing separate ledgers and accounts.</p>
          <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl font-bold transition-all hover:scale-105">
            Add Your First Client
          </Button>
        </div>
      )}
    </div>
  );
};

export default Clients;
