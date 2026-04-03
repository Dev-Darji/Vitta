import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Package, Tag, ShoppingBag, Edit3, Search, Info, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  
  const initialItemState = {
    name: '',
    description: '',
    hsn_sac: '',
    unit: 'PCS',
    item_type: 'Goods',
    tax_rate: 18.0,
    sale_price: 0,
    is_tax_inclusive: false
  };
  
  const [formData, setFormData] = useState(initialItemState);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items');
      setItems(res.data);
    } catch { toast.error('Failed to load items'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingItem) {
        await api.put(`/items/${editingItem.id}`, formData);
        toast.success('Item updated');
      } else {
        await api.post('/items', formData);
        toast.success('Item created');
      }
      setIsOpen(false);
      setEditingItem(null);
      setFormData(initialItemState);
      fetchItems();
    } catch { toast.error('Check all fields and try again'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { 
      await api.delete(`/items/${id}`); 
      toast.success('Item deleted'); 
      fetchItems(); 
    } catch { toast.error('Failed to delete item'); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      hsn_sac: item.hsn_sac,
      unit: item.unit,
      item_type: item.item_type,
      tax_rate: item.tax_rate,
      sale_price: item.sale_price,
      is_tax_inclusive: item.is_tax_inclusive
    });
    setIsOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.hsn_sac.includes(searchQuery)
  );

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading(`Importing ${file.name}...`);
    try {
      const res = await api.post('/items/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message, { id: toastId });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed', { id: toastId });
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Items & SAC</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your catalog of goods and services</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search items, HSN..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 pl-9 rounded-lg border-slate-200 bg-white text-[13px] font-medium"
            />
          </div>

          <input 
            type="file" 
            id="bulk-import-input" 
            className="hidden" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleImport}
          />

          <Button 
            variant="outline" 
            onClick={() => document.getElementById('bulk-import-input').click()}
            className="h-9 px-4 rounded-lg text-[13px] font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-2"
          >
            <Upload className="h-4 w-4 text-slate-400" />Bulk Import
          </Button>
          <Dialog open={isOpen} onOpenChange={(val) => {
            setIsOpen(val);
            if (!val) {
              setEditingItem(null);
              setFormData(initialItemState);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white h-9 px-6 rounded-lg text-[13px] font-bold shadow-lg shadow-slate-200 flex items-center gap-2">
                <Plus className="h-4 w-4" />New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="px-6 py-5 border-b border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-[17px] font-bold text-slate-900">{editingItem ? 'Edit Item' : 'New Item / Service'}</DialogTitle>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">HSN/SAC and GST rates are required for Tax Invoices.</p>
                </DialogHeader>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Item Name</Label>
                    <Input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="e.g. Graphic Design, MacBook Air"
                      className="h-10 rounded-lg border-slate-100 bg-slate-50 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type</Label>
                    <Select value={formData.item_type} onValueChange={v => setFormData({...formData, item_type: v, unit: v === 'Service' ? 'SAC' : 'PCS'})}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-100 bg-slate-50 text-[13px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Goods" className="font-bold text-xs">Goods</SelectItem>
                        <SelectItem value="Service" className="font-bold text-xs">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">HSN / SAC Code</Label>
                    <Input 
                      value={formData.hsn_sac}
                      onChange={e => setFormData({...formData, hsn_sac: e.target.value})}
                      required
                      className="h-10 rounded-lg border-slate-100 bg-slate-50 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unit</Label>
                    <Select value={formData.unit} onValueChange={v => setFormData({...formData, unit: v})}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-100 bg-slate-50 text-[13px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.item_type === 'Goods' ? (
                          ["PCS", "BOX", "MTR", "KG", "NOS", "SET", "LTR"].map(u => <SelectItem key={u} value={u} className="font-bold text-xs">{u}</SelectItem>)
                        ) : (
                          ["SAC", "HOURS", "DAYS"].map(u => <SelectItem key={u} value={u} className="font-bold text-xs">{u}</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">GST Rate (%)</Label>
                    <Select value={String(formData.tax_rate)} onValueChange={v => setFormData({...formData, tax_rate: parseFloat(v)})}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-100 bg-slate-50 text-[13px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["0", "5", "12", "18", "28"].map(r => <SelectItem key={r} value={r} className="font-bold text-xs">{r}% GST</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Base Price (₹)</Label>
                    <Input 
                      type="number"
                      value={formData.sale_price}
                      onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value)})}
                      required
                      className="h-10 rounded-lg border-slate-100 bg-slate-50 text-[13px] font-bold"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input 
                      type="checkbox" 
                      id="tax_inclusive"
                      checked={formData.is_tax_inclusive}
                      onChange={e => setFormData({...formData, is_tax_inclusive: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="tax_inclusive" className="text-[11px] font-bold text-slate-600 uppercase tracking-tight cursor-pointer">Tax Inclusive Price</Label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-50">
                  <DialogFooter className="w-full gap-2 mt-0">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="h-10 rounded-xl text-slate-500 font-bold text-xs">Cancel</Button>
                    <Button data-testid="submit-item" type="submit" disabled={submitting} className="h-10 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex-1">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? 'Update Item' : 'Create Item'}
                    </Button>
                  </DialogFooter>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-primary/30 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest h-12">Item Detail</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest h-12">HSN/SAC</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest h-12">GST Rate</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest h-12 text-right">Selling Price</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition-colors border-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${item.item_type === 'Goods' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.item_type === 'Goods' ? <Package className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.unit}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md border-slate-100 bg-slate-50 text-slate-600 font-bold text-[10px]">
                        {item.hsn_sac}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12.5px] font-black text-slate-700">{item.tax_rate}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-[13px] font-black text-slate-900">₹{item.sale_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {item.is_tax_inclusive ? 'Incl. Tax' : 'Excl. Tax'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center bg-slate-50/30">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Package className="h-10 w-10 text-slate-200" />
                      <p className="text-[13px] font-bold text-slate-900">No items created yet</p>
                      <p className="text-[11px] font-medium text-slate-400">Setup your goods and services to start invoicing</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Items;
