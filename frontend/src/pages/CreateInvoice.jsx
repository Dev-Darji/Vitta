import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  ArrowLeft, Plus, Trash2, Save, Send, Calculator,
  UserPlus, ArrowRight, Receipt, Zap, ShieldCheck,
  ChevronDown, Info, Sparkles, Globe, PenLine, AlertCircle, CheckCircle2,
  Package, ShoppingBag, FileText, Landmark
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const CreateInvoice = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [clients, setClients] = useState([]);
    const [items, setItems] = useState([]);
    const [myProfile, setMyProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        client_id: '',
        invoice_number: 'AUTO',
        invoice_date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB').split('/').join('-'),
        invoice_type: 'Tax Invoice',
        place_of_supply: '',
        billing_address: '',
        gstin_customer: '',
        items: [],
        notes: '',
        terms: '1. Goods once sold will not be taken back.\n2. Interest @ 18% will be charged if payment is not made within due date.',
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cRes, iRes, pRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/items'),
                    api.get('/company-profile')
                ]);
                setClients(cRes.data);
                setItems(iRes.data);
                setMyProfile(pRes.data);
                
                if (!pRes.data) {
                    toast.error("Please complete your Business Profile in Settings first");
                }

                if (isEdit) {
                    const invRes = await api.get(`/invoices/${id}`);
                    setFormData(invRes.data);
                }
            } catch (e) { toast.error("Data fetch failed"); }
        };
        fetchData();
    }, [isEdit, id]);

    // Handle Client Selection
    const handleClientSelect = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                client_id: clientId,
                gstin_customer: client.gstin || '',
                billing_address: client.address || '',
                place_of_supply: client.state || '',
                // If company has no GSTIN, it's a Bill of Supply by default
                invoice_type: myProfile?.gstin ? 'Tax Invoice' : 'Bill of Supply'
            }));
        }
    };

    // Add Item to Invoice
    const addInvoiceItem = (templateItem) => {
        const newItem = {
            item_id: templateItem.id,
            name: templateItem.name,
            description: templateItem.description || '',
            hsn_sac: templateItem.hsn_sac,
            quantity: 1,
            unit: templateItem.unit,
            rate: templateItem.sale_price,
            tax_rate: templateItem.tax_rate,
            item_type: templateItem.item_type,
            discount_percent: 0,
            taxable_value: 0,
            cgst_rate: 0, cgst_amount: 0,
            sgst_rate: 0, sgst_amount: 0,
            igst_rate: 0, igst_amount: 0,
            total_amount: 0
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const updateItemRow = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const removeItemRow = (index) => {
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    };

    // Real-time Calculations
    const calculatedData = useMemo(() => {
        let subtotal = 0;
        let cgst_total = 0;
        let sgst_total = 0;
        let igst_total = 0;
        const myState = myProfile?.state;
        const isInterState = formData.place_of_supply !== myState;

        const updatedItems = formData.items.map(item => {
            const baseValue = item.quantity * item.rate;
            const taxable = baseValue - (baseValue * (item.discount_percent || 0) / 100);
            
            let cgst_r = 0, cgst_a = 0, sgst_r = 0, sgst_a = 0, igst_r = 0, igst_a = 0;

            if (isInterState) {
                igst_r = item.tax_rate;
                igst_a = taxable * (igst_r / 100);
            } else {
                cgst_r = item.tax_rate / 2;
                cgst_a = taxable * (cgst_r / 100);
                sgst_r = item.tax_rate / 2;
                sgst_a = taxable * (sgst_r / 100);
            }

            subtotal += taxable;
            cgst_total += cgst_a;
            sgst_total += sgst_a;
            igst_total += igst_a;

            return {
                ...item,
                taxable_value: taxable,
                cgst_rate: cgst_r, cgst_amount: cgst_a,
                sgst_rate: sgst_r, sgst_amount: sgst_a,
                igst_rate: igst_r, igst_amount: igst_a,
                total_amount: taxable + cgst_a + sgst_a + igst_a
            };
        });

        const totalTax = cgst_total + sgst_total + igst_total;
        const grandTotalRaw = subtotal + totalTax;
        const grandTotal = Math.round(grandTotalRaw);
        const roundOff = grandTotal - grandTotalRaw;

        // Group by HSN for UI summary
        const hsnMap = {};
        updatedItems.forEach(item => {
            const h = item.hsn_sac;
            if (!hsnMap[h]) hsnMap[h] = { hsn: h, taxable: 0, tax: 0, rate: item.tax_rate };
            hsnMap[h].taxable += item.taxable_value;
            hsnMap[h].tax += (item.cgst_amount + item.sgst_amount + item.igst_amount);
        });

        return { items: updatedItems, subtotal, cgst_total, sgst_total, igst_total, totalTax, grandTotal, roundOff, hsnSummary: Object.values(hsnMap) };
    }, [formData.items, formData.place_of_supply, myProfile]);

    const handleSave = async () => {
        if (!formData.client_id) return toast.error("Please select a client");
        if (formData.items.length === 0) return toast.error("Please add at least one item");
        if (!myProfile?.gstin && formData.invoice_type === 'Tax Invoice') {
            return toast.error("GSTIN missing in your profile. Cannot create Tax Invoice.");
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                ...calculatedData,
                // Server calculated these too, but we send them for consistency
                hsn_summary: [] // Server will recalculate this
            };
            
            if (isEdit) {
                await api.put(`/invoices/${id}`, payload);
                toast.success("Invoice updated");
            } else {
                await api.post('/invoices', payload);
                toast.success("Invoice generated successfully");
            }
            navigate('/invoices');
        } catch (e) {
            toast.error(e.response?.data?.detail || "Failed to save invoice");
        } finally {
            setLoading(false);
        }
    };

    const selectedClient = clients.find(c => c.id === formData.client_id);

    return (
        <div className="max-w-6xl mx-auto pb-24 pt-4 space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')} className="h-9 w-9 rounded-xl border border-slate-100">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{isEdit ? 'Edit' : 'Create'} {formData.invoice_type}</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule 46 CGST Compliance Enabled</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button disabled={loading} variant="outline" onClick={() => navigate('/invoices')} className="flex-1 md:flex-none h-10 rounded-xl font-bold text-xs">Discard</Button>
                    <Button disabled={loading} onClick={handleSave} className="flex-1 md:flex-none h-10 px-8 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xl shadow-slate-100 transition-all active:scale-95">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> {isEdit ? 'Update Invoice' : 'Finalize Invoice'}</>}
                    </Button>
                </div>
            </div>

            {/* Warning if profile not set */}
            {!myProfile?.gstin && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                    <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-amber-900 font-bold text-xs uppercase">Company Profile Incomplete</p>
                        <p className="text-amber-700 font-medium text-[10px]">You haven't set your GSTIN in Settings. Invoices will be created as "Bill of Supply" instead of "Tax Invoice".</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100 h-8 font-bold text-[10px]">Complete Settings</Button>
                </div>
            )}

            <div className="grid grid-cols-12 gap-8">
                {/* Main Form Area */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Basic Context */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Client / Customer</Label>
                                <Select value={formData.client_id} onValueChange={handleClientSelect}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs">
                                        <SelectValue placeholder="Choose a client..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Place of Supply (State)</Label>
                                <Select value={formData.place_of_supply} onValueChange={(v) => setFormData({...formData, place_of_supply: v})}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs">
                                        <SelectValue placeholder="Select Destination State" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {indianStates.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Number</Label>
                                <Input disabled value={formData.invoice_number} className="h-11 rounded-xl border-slate-100 bg-slate-100/50 font-black text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Date</Label>
                                <Input type="date" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</Label>
                                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs text-rose-600" />
                            </div>
                        </div>
                    </div>

                    {/* Line Items Logic */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-primary" /> Billing Liquidity
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Specify quantity and item details</p>
                            </div>
                            
                            <Select onValueChange={(val) => {
                                const it = items.find(i => i.id === val);
                                if (it) addInvoiceItem(it);
                            }}>
                                <SelectTrigger className="w-56 h-9 rounded-xl border-slate-200 bg-slate-50 font-bold text-[11px] uppercase">
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Product / Service
                                </SelectTrigger>
                                <SelectContent>
                                    {items.map(i => (
                                        <SelectItem key={i.id} value={i.id} className="text-xs font-bold">{i.name} ({i.hsn_sac})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Items List */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 px-2">
                                <div className="col-span-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description / HSN</div>
                                <div className="col-span-1 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</div>
                                <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</div>
                                <div className="col-span-1 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Disc %</div>
                                <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Taxable</div>
                                <div className="col-span-1"></div>
                            </div>
                            
                            <Separator className="bg-slate-50" />

                            <AnimatePresence>
                                {formData.items.length > 0 ? (
                                    formData.items.map((item, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="grid grid-cols-12 gap-4 items-center group bg-slate-50/50 p-2 rounded-xl hover:bg-slate-100/50 transition-all border border-transparent hover:border-slate-100"
                                        >
                                            <div className="col-span-5 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                                                    {item.unit === 'SAC' ? <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" /> : <Package className="h-3.5 w-3.5 text-blue-500" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12.5px] font-bold text-slate-900 truncate">{item.name}</p>
                                                    <Input 
                                                        placeholder="Add item description..." 
                                                        value={item.description}
                                                        onChange={(e) => updateItemRow(idx, 'description', e.target.value)}
                                                        className="h-6 mt-0.5 border-none bg-transparent p-0 text-[10px] text-slate-400 font-medium focus-visible:ring-0 placeholder:text-slate-300"
                                                    />
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">HSN: {item.hsn_sac}</span>
                                                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter">{item.tax_rate}% GST</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-1">
                                                <Input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={(e) => updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="h-8 rounded-lg border-slate-200 bg-white text-center font-bold text-[12px]"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input 
                                                    type="number" 
                                                    value={item.rate} 
                                                    onChange={(e) => updateItemRow(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="h-8 rounded-lg border-slate-200 bg-white text-right font-bold text-[12px]"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Input 
                                                    type="number" 
                                                    value={item.discount_percent} 
                                                    onChange={(e) => updateItemRow(idx, 'discount_percent', parseFloat(e.target.value) || 0)}
                                                    className="h-8 rounded-lg border-slate-200 bg-white text-right font-bold text-[12px]"
                                                />
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-[12.5px] font-black text-slate-700">₹{(item.quantity * item.rate - (item.quantity * item.rate * item.discount_percent / 100)).toLocaleString()}</p>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button onClick={() => removeItemRow(idx)} className="h-7 w-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-12 border border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <Receipt className="h-10 w-10 text-slate-100 mb-3" />
                                        <p className="text-[12px] font-bold text-slate-400">The billable sheet is empty.</p>
                                        <p className="text-[10px] font-medium text-slate-300">Choose a product from the dropdown above to begin.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* HSN Summary Logic */}
                    {calculatedData.hsnSummary.length > 0 && (
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <ShieldCheck className="h-16 w-16 text-slate-900" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-primary" /> HSN / SAC Tax Summary
                            </h3>
                            <div className="grid grid-cols-12 gap-4 px-2 py-2 border-b border-slate-50">
                                <div className="col-span-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">HSN Code</div>
                                <div className="col-span-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Taxable Value</div>
                                <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Rate</div>
                                <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">GST Amount</div>
                            </div>
                            {calculatedData.hsnSummary.map((sum, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 px-2 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="col-span-3 text-[11px] font-bold text-slate-900">{sum.hsn}</div>
                                    <div className="col-span-3 text-[11px] font-bold text-slate-600 text-right">₹{sum.taxable.toLocaleString()}</div>
                                    <div className="col-span-2 text-[11px] font-bold text-slate-400 text-center">{sum.rate}%</div>
                                    <div className="col-span-4 text-[11px] font-black text-emerald-600 text-right">₹{sum.tax.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer Details */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Remarks / Instructions</Label>
                            <Textarea 
                                placeholder="Add specific bank details or UPI IDs here if needed..."
                                value={formData.notes} 
                                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                                className="min-h-[100px] rounded-2xl border-slate-100 bg-white shadow-sm font-medium text-xs leading-relaxed p-4"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard Terms of Agreement</Label>
                            <Textarea 
                                value={formData.terms} 
                                onChange={(e) => setFormData({...formData, terms: e.target.value})} 
                                className="min-h-[100px] rounded-2xl border-slate-100 bg-white shadow-sm font-medium text-xs leading-relaxed p-4"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Valuations Card */}
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl shadow-slate-200 sticky top-8">
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 mt-1">Invoice Abstract</p>
                                    <h4 className="text-xl font-black">{formData.invoice_number}</h4>
                                </div>
                                <Badge className="bg-white/10 hover:bg-white/20 text-white border-transparent text-[8px] font-black uppercase tracking-widest py-1">Draft</Badge>
                            </div>

                            <Separator className="bg-white/5" />

                            <div className="space-y-3">
                                <div className="flex justify-between text-[11px] font-bold text-white/50">
                                    <span>Total Taxable Value</span>
                                    <span className="text-white">₹{calculatedData.subtotal.toLocaleString()}</span>
                                </div>
                                
                                {calculatedData.cgst_total > 0 && (
                                    <>
                                        <div className="flex justify-between text-[11px] font-bold text-white/50">
                                            <span>CGST (Central Tax)</span>
                                            <span className="text-emerald-400">+ ₹{calculatedData.cgst_total.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-white/50">
                                            <span>SGST (State Tax)</span>
                                            <span className="text-emerald-400">+ ₹{calculatedData.sgst_total.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                                
                                {calculatedData.igst_total > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold text-white/50">
                                        <span>IGST (Integrated Tax)</span>
                                        <span className="text-emerald-400">+ ₹{calculatedData.igst_total.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-[11px] font-bold text-white/50">
                                    <span>Rounding Diff</span>
                                    <span className="text-slate-400">{calculatedData.roundOff > 0 ? '+' : ''}₹{calculatedData.roundOff.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 mt-4">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">Grand Receivable</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black tabular-nums">₹{calculatedData.grandTotal.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">INR</span>
                                </div>
                            </div>

                            {/* Entity Preview */}
                            <div className="space-y-4 pt-2">
                                <div>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Customer Recipient</p>
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                                        <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
                                            {selectedClient?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-black truncate">{selectedClient?.name || 'No Client Selected'}</p>
                                            <p className="text-[10px] font-medium text-white/30 truncate">{formData.gstin_customer || 'No GSTIN provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Place of Supply</p>
                                        <p className="text-[11px] font-bold truncate">{formData.place_of_supply || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Maturity Date</p>
                                        <p className="text-[11px] font-bold tabular-nums text-rose-400">{formData.due_date}</p>
                                    </div>
                                </div>
                            </div>

                            <Button disabled={loading} onClick={handleSave} className="w-full h-11 bg-white text-slate-900 hover:bg-slate-50 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] mt-4">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit to Ledgers"}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="p-5 border border-slate-100 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Compliance Engine</h5>
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <p className="text-[10px] font-medium text-slate-500 leading-normal">GST rates are auto-pulled from your <span className="text-slate-900 font-bold cursor-pointer" onClick={() => navigate('/items')}>Items Catalog</span> for auditing accuracy.</p>
                            </div>
                            <div className="flex gap-3">
                                <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <p className="text-[10px] font-medium text-slate-500 leading-normal">IGST is automatically applied for inter-state supply based on the <span className="text-slate-900 font-bold">Place of Supply</span> selected.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoice;
