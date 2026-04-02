import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  ArrowLeft, Plus, Trash2, Save, Send, Calculator,
  UserPlus, ArrowRight, Receipt, Zap, ShieldCheck,
  ChevronDown, Info, Sparkles, Globe, PenLine
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// High-density style overrides
const FontStyle = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      [data-create-invoice-root] { 
        font-family: 'Inter', sans-serif;
        background: #fcfcfc;
      }
      .compact-input {
        height: 34px !important;
        font-size: 13px !important;
        border-radius: 6px !important;
      }
      .compact-label {
        font-size: 11px !important;
        font-weight: 600 !important;
        color: #64748b !important;
        margin-bottom: 4px !important;
        display: block;
      }
       /* Remove Number Spinners */
      input[type=number]::-webkit-inner-spin-button, 
      input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
      }
      input[type=number] { -moz-appearance: textfield; }
    `}</style>
);

const CreateInvoice = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [clients, setClients] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        client_id: '', account_id: '', invoice_number: '',
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB').replace(/\//g, '-'),
        line_items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0, tax_amount: 0 }],
        notes: '', terms: 'Net 15 Days', tax_type: 'GST',
        discount_type: 'none', discount_value: 0
    });

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [cRes, aRes] = await Promise.all([api.get('/clients'), api.get('/accounts')]);
                setClients(cRes.data);
                setAccounts(aRes.data);
                if (aRes.data.length > 0) setFormData(p => ({ ...p, account_id: aRes.data[0].id }));
                if (isEdit) {
                    const invRes = await api.get(`/invoices/${id}`);
                    setFormData(invRes.data);
                }
            } catch (e) { toast.error("Data fetch failed"); }
        };
        fetchDependencies();
    }, [isEdit, id]);

    const totals = useMemo(() => {
        const subtotal = formData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const tax_amount = formData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0);
        let discount_amount = 0;
        if (formData.discount_type === 'percentage') discount_amount = subtotal * (formData.discount_value / 100);
        else if (formData.discount_type === 'fixed') discount_amount = formData.discount_value;
        const total = subtotal - discount_amount + tax_amount;
        return { subtotal, tax_amount, discount_amount, total };
    }, [formData]);

    const handleLineItemChange = (index, field, value) => {
        const newItems = [...formData.line_items];
        newItems[index][field] = value;
        if (['quantity', 'unit_price', 'tax_rate'].includes(field)) {
            const qty = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0;
            const up = parseFloat(field === 'unit_price' ? value : newItems[index].unit_price) || 0;
            const tx = parseFloat(field === 'tax_rate' ? value : newItems[index].tax_rate) || 0;
            newItems[index].amount = qty * up;
            newItems[index].tax_amount = (qty * up) * (tx / 100);
        }
        setFormData({ ...formData, line_items: newItems });
    };

    const addLineItem = () => {
        setFormData({ ...formData, line_items: [...formData.line_items, { description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0, tax_amount: 0 }] });
    };

    const removeLineItem = (index) => {
        if (formData.line_items.length === 1) return;
        setFormData({ ...formData, line_items: formData.line_items.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (shouldSend = false) => {
        if (!formData.client_id) return toast.error("Select Client");
        setLoading(true);
        try {
            const res = await api.post('/invoices', formData);
            if (shouldSend) await api.post(`/invoices/${res.data.id}/send`);
            toast.success("Success");
            navigate('/invoices');
        } catch (e) { toast.error("Error"); } finally { setLoading(false); }
    };

    const selectedClient = clients.find(c => c.id === formData.client_id);

    return (
        <div data-create-invoice-root className="pb-12 pt-4 px-6">
            <FontStyle />
            
            {/* Minimal Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="h-8 px-2 text-slate-500">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Invoices
                    </Button>
                    <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit' : 'New'} Invoice</h1>
                </div>
                <div className="flex gap-2">
                    <Button disabled={loading} variant="outline" size="sm" onClick={() => handleSubmit(false)} className="h-8 px-4 font-semibold border-slate-200">
                        Save Draft
                    </Button>
                    <Button disabled={loading} onClick={() => handleSubmit(true)} size="sm" className="h-8 px-4 bg-slate-900 text-white font-semibold">
                        Finalize & Send
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    
                    {/* Primary Info */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label className="compact-label">Client Entity</Label>
                                <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
                                    <SelectTrigger className="h-[34px] text-[13px] rounded-md border-slate-200">
                                        <SelectValue placeholder="Select Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="compact-label">Settlement Account</Label>
                                <Select value={formData.account_id} onValueChange={(v) => setFormData({...formData, account_id: v})}>
                                    <SelectTrigger className="h-[34px] text-[13px] rounded-md border-slate-200">
                                        <SelectValue placeholder="Select Vault" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <Label className="compact-label">Invoice #</Label>
                                <Input placeholder="Auto" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} className="compact-input" />
                            </div>
                            <div className="space-y-1">
                                <Label className="compact-label">Date</Label>
                                <Input value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="compact-input" />
                            </div>
                            <div className="space-y-1">
                                <Label className="compact-label">Due Date</Label>
                                <Input value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="compact-input text-rose-600" />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Line Items</h3>
                            <Button onClick={addLineItem} variant="outline" size="sm" className="h-7 text-[11px] font-bold px-3">
                                <Plus className="h-3 w-3 mr-1" /> Add Row
                            </Button>
                        </div>

                        {/* Headers */}
                        <div className="grid grid-cols-12 gap-3 mb-2 px-1">
                            <div className="col-span-6 text-[10px] font-bold text-slate-400">Description</div>
                            <div className="col-span-1 text-[10px] font-bold text-slate-400 text-center">Qty</div>
                            <div className="col-span-2 text-[10px] font-bold text-slate-400 text-right">Price</div>
                            <div className="col-span-2 text-[10px] font-bold text-slate-400 text-right">Tax %</div>
                        </div>

                        <div className="space-y-2">
                            {formData.line_items.map((it, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-center group">
                                    <div className="col-span-6">
                                        <Input placeholder="Service name..." value={it.description} onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)} className="compact-input" />
                                    </div>
                                    <div className="col-span-1">
                                        <Input type="number" onWheel={(e) => e.target.blur()} value={it.quantity} onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)} className="compact-input text-center" />
                                    </div>
                                    <div className="col-span-2">
                                        <Input type="number" onWheel={(e) => e.target.blur()} value={it.unit_price} onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)} className="compact-input text-right" />
                                    </div>
                                    <div className="col-span-2">
                                        <Input type="number" onWheel={(e) => e.target.blur()} value={it.tax_rate} onChange={(e) => handleLineItemChange(idx, 'tax_rate', e.target.value)} className="compact-input text-right" />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button onClick={() => removeLineItem(idx)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-end gap-2">
                            <div className="flex justify-between w-48 text-[12px]">
                                <span className="text-slate-400 font-medium">Subtotal</span>
                                <span className="font-semibold text-slate-900">₹{totals.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between w-48 text-[12px]">
                                <span className="text-slate-400 font-medium">Tax ({formData.tax_type})</span>
                                <span className="font-semibold text-emerald-600">+ ₹{totals.tax_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between w-48 pt-2 mt-2 border-t border-slate-900 border-opacity-10">
                                <span className="text-[13px] font-bold text-slate-900">Total Due</span>
                                <span className="text-[18px] font-black text-slate-900">₹{totals.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-1">
                             <Label className="compact-label">Notes (Internal/Client)</Label>
                             <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="text-[13px] rounded-md border-slate-200 min-h-[60px]" />
                         </div>
                         <div className="space-y-1">
                             <Label className="compact-label">Maturity Terms</Label>
                             <Textarea value={formData.terms} onChange={(e) => setFormData({...formData, terms: e.target.value})} className="text-[13px] rounded-md border-slate-200 min-h-[60px]" />
                         </div>
                    </div>
                </div>

                {/* Compact Sidemenu / Preview (Responsive) */}
                <div className="hidden lg:block lg:col-span-4">
                    <div className="bg-slate-900 rounded-lg p-6 text-white min-h-[400px] sticky top-8">
                        <div className="space-y-6">
                            <div className="border-b border-white/10 pb-4">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Document Registry</p>
                                <p className="text-lg font-black">{formData.invoice_number || 'AUTO'}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Client Entity</p>
                                    <p className="text-[14px] font-semibold">{selectedClient?.name || '---'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Issued</p>
                                        <p className="text-[13px] tabular-nums font-medium">{formData.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Maturity</p>
                                        <p className="text-[13px] tabular-nums font-medium text-rose-400">{formData.due_date}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-white/10">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-md">
                                    <span className="text-[11px] font-bold text-white/40">Total Valuation</span>
                                    <span className="text-xl font-black tabular-nums">₹{totals.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 flex flex-col gap-2">
                             <Button onClick={() => handleSubmit(false)} variant="secondary" className="w-full h-8 text-[12px] font-bold">Local Cache Save</Button>
                             <Button onClick={() => handleSubmit(true)} className="w-full h-8 bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600">Finalize & Push</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoice;
