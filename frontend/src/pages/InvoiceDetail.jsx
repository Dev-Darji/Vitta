import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  ArrowLeft, Download, Send, CreditCard, Edit, Printer,
  CheckCircle2, Clock, AlertCircle, FileText, MoreHorizontal,
  Mail, Share2, Copy, History, ShieldCheck, Zap, Trash2, PenLine,
  Landmark, Building2, MapPin, Receipt, Package, ShoppingBag, Eye,
  CheckCircle, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [client, setClient] = useState(null);
    const [myProfile, setMyProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingEinvoice, setGeneratingEinvoice] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [invRes, profRes] = await Promise.all([
                    api.get(`/invoices/${id}`),
                    api.get('/company-profile')
                ]);
                setInvoice(invRes.data);
                setMyProfile(profRes.data);
                
                const cRes = await api.get(`/clients/${invRes.data.client_id}`);
                setClient(cRes.data);
            } catch (e) {
                toast.error("Failed to load invoice details");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const exportPDF = () => {
        const doc = new jsPDF();
        const primaryColor = [15, 23, 42];
        const secondaryColor = [100, 116, 139];

        // --- Header Section ---
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(myProfile?.business_name || 'VITTA ACCOUNTING', 15, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice?.invoice_type?.toUpperCase() || 'TAX INVOICE', 195, 25, { align: 'right' });
        
        // --- Addresses Section ---
        doc.setTextColor(...primaryColor);
        let y = 50;
        
        // Seller (Left)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('SOLD BY / BILLER', 15, y);
        doc.setFontSize(10);
        doc.text(myProfile?.business_name || '', 15, y + 6);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(myProfile?.address || '', 15, y + 11, { maxWidth: 80 });
        doc.setFont('helvetica', 'bold');
        doc.text(`GSTIN: ${myProfile?.gstin || 'N/A'}`, 15, y + 22);
        doc.text(`State: ${myProfile?.state || 'N/A'}`, 15, y + 26);

        // Buyer (Right)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('BILLED TO / RECIPIENT', 115, y);
        doc.setFontSize(10);
        doc.text(client?.name || '', 115, y + 6);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(client?.address || '', 115, y + 11, { maxWidth: 80 });
        doc.setFont('helvetica', 'bold');
        doc.text(`GSTIN: ${invoice?.gstin_customer || 'N/A'}`, 115, y + 22);
        doc.text(`Place of Supply: ${invoice?.place_of_supply || 'N/A'}`, 115, y + 26);

        // --- Invoice Metadata ---
        y += 40;
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 15, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...secondaryColor);
        doc.text('INVOICE NO', 20, y + 6);
        doc.text('DATE', 70, y + 6);
        doc.text('DUE DATE', 120, y + 6);
        doc.text('STATUS', 170, y + 6);
        
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.invoice_number, 20, y + 11);
        doc.text(invoice.invoice_date, 70, y + 11);
        doc.text(invoice.due_date || 'N/A', 120, y + 11);
        doc.text(invoice.status.toUpperCase(), 170, y + 11);

        // --- Items Table ---
        const tableBody = invoice.items.map((it, i) => [
            i + 1,
            it.name + (it.hsn_sac ? `\n(HSN: ${it.hsn_sac})` : ''),
            it.quantity,
            it.rate.toLocaleString(),
            it.taxable_value.toLocaleString(),
            `${it.tax_rate}%`,
            it.total_amount.toLocaleString()
        ]);

        autoTable(doc, {
            startY: y + 25,
            head: [['#', 'Description', 'Qty', 'Rate', 'Taxable', 'GST', 'Amount']],
            body: tableBody,
            headStyles: { fillColor: primaryColor, fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'center' },
                6: { halign: 'right' }
            }
        });

        // --- Totals Section ---
        let finalY = doc.lastAutoTable.finalY + 10;
        const summaryX = 130;
        
        const row = (label, value, bold = false) => {
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.text(label, summaryX, finalY);
            doc.text(`INR ${value.toLocaleString()}`, 195, finalY, { align: 'right' });
            finalY += 6;
        };

        row('Subtotal (Taxable)', invoice.subtotal);
        if (invoice.cgst_total > 0) {
            row('CGST Total', invoice.cgst_total);
            row('SGST Total', invoice.sgst_total);
        }
        if (invoice.igst_total > 0) {
            row('IGST Total', invoice.igst_total);
        }
        row('Round Off', invoice.round_off);
        
        doc.setDrawColor(...secondaryColor);
        doc.line(summaryX, finalY - 2, 195, finalY - 2);
        finalY += 2;
        doc.setFontSize(12);
        row('GRAND TOTAL', invoice.grand_total, true);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Note: ${invoice.grand_total_words}`, 15, finalY);

        // --- HSN Summary (Rule 46) ---
        finalY += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('HSN / SAC SUMMARY', 15, finalY);
        finalY += 5;
        
        const hsnBody = invoice.hsn_summary.map(h => [
            h.hsn_sac, h.taxable_value.toLocaleString(), h.tax_rate + '%', 
            h.cgst_amount.toLocaleString(), h.sgst_amount.toLocaleString(), h.igst_amount.toLocaleString(),
            h.total_tax.toLocaleString()
        ]);
        
        autoTable(doc, {
            startY: finalY,
            head: [['HSN/SAC', 'Taxable Val', 'Rate', 'CGST', 'SGST', 'IGST', 'Tax Amt']],
            body: hsnBody,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: primaryColor, fontSize: 7 },
            bodyStyles: { fontSize: 7 }
        });

        // --- Footer ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(7);
        doc.setTextColor(...secondaryColor);
        doc.text('This is a computer generated Tax Invoice. No signature required.', 105, pageHeight - 15, { align: 'center' });
        doc.text('Vitta Accounting Compliance Systems v2.0', 105, pageHeight - 10, { align: 'center' });

        doc.save(`${invoice.invoice_number}.pdf`);
    };

    const generateEinvoice = async () => {
        try {
            setGeneratingEinvoice(true);
            const res = await api.post(`/invoices/${id}/einvoice`);
            toast.success("IRN Registered Successfully");
            setInvoice(prev => ({ ...prev, irn: res.data.irn, signed_qr_code: res.data.signed_qr_code, status: "E-Invoiced" }));
        } catch (e) {
            toast.error(e.response?.data?.detail || "E-Invoice registration failed");
        } finally {
            setGeneratingEinvoice(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50/30">
            <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
        </div>
    );

    return (
        <div className="pb-20 pt-4 px-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm sticky top-4 z-40">
                <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="h-9 px-3 text-slate-500 font-bold hover:bg-slate-50">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Invoices
                </Button>

                <div className="flex items-center gap-2">
                    <Badge className="h-7 px-3 bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] uppercase tracking-widest mr-4">
                        {invoice.status}
                    </Badge>
                    <Separator orientation="vertical" className="h-6" />
                    
                    {!invoice.irn && myProfile?.turnover > 50000000 && (
                        <Button 
                            disabled={generatingEinvoice} 
                            onClick={generateEinvoice} 
                            variant="secondary" 
                            className="h-9 font-bold text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100"
                        >
                            {generatingEinvoice ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                            Register IRN
                        </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={exportPDF} className="h-9 font-bold text-xs border-slate-200 hover:bg-slate-50">
                        <Printer className="h-4 w-4 mr-2" /> Print PDF
                    </Button>
                    <Button onClick={() => navigate(`/invoices/${id}/edit`)} size="sm" className="h-9 bg-slate-900 text-white font-bold text-xs px-5">
                        <Edit className="h-4 w-4 mr-2" /> Edit Record
                    </Button>
                </div>
            </div>

            {/* Tax Invoice Document */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[1000px] flex flex-col">
                {/* Visual Banner */}
                <div className="bg-slate-900 p-10 text-white flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                <Landmark className="h-5 w-5 text-emerald-400" />
                            </div>
                            <span className="text-2xl font-black tracking-tight">{myProfile?.business_name || 'VITTA'}</span>
                        </div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{invoice.invoice_type}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black tabular-nums">{invoice.invoice_number}</h2>
                        <p className="text-[11px] font-bold text-white/40 mt-1">{invoice.invoice_date}</p>
                    </div>
                </div>

                <div className="p-10 flex-1 space-y-12">
                    {/* Biller & Client Grid */}
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Originator (Seller)</h3>
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900 uppercase">{myProfile?.business_name}</p>
                                <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{myProfile?.address}</p>
                                <div className="pt-2 space-y-0.5">
                                    <p className="text-[11px] font-bold text-slate-400">GSTIN: <span className="text-slate-900 uppercase">{myProfile?.gstin}</span></p>
                                    <p className="text-[11px] font-bold text-slate-400">STATE: <span className="text-slate-900 uppercase">{myProfile?.state}</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Recipient (Buyer)</h3>
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900 uppercase">{client?.name}</p>
                                <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{invoice.billing_address}</p>
                                <div className="pt-2 space-y-0.5">
                                    <p className="text-[11px] font-bold text-slate-400">GSTIN: <span className="text-slate-900 uppercase">{invoice.gstin_customer || 'UNREGISTERED'}</span></p>
                                    <p className="text-[11px] font-bold text-slate-400">PLACE OF SUPPLY: <span className="text-slate-900 uppercase">{invoice.place_of_supply}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="pt-4">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                    <th className="py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description of Supply</th>
                                    <th className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">HSN</th>
                                    <th className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                    <th className="py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">UnitPrice</th>
                                    <th className="py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoice.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 text-[11px] font-bold text-slate-300">{String(i+1).zfill(2)}</td>
                                        <td className="py-5">
                                            <p className="text-xs font-black text-slate-900 mb-0.5">{item.name}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">{item.tax_rate}% TAX APPLIED</p>
                                        </td>
                                        <td className="py-5 text-center text-xs font-bold text-slate-500">{item.hsn_sac}</td>
                                        <td className="py-5 text-center text-xs font-bold text-slate-900">{item.quantity} {item.unit}</td>
                                        <td className="py-5 text-right text-xs font-bold text-slate-900">₹{item.rate.toLocaleString()}</td>
                                        <td className="py-5 text-right text-xs font-black text-slate-900">₹{item.taxable_value.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Split */}
                    <div className="grid grid-cols-12 gap-12 border-t border-slate-100 pt-8">
                        <div className="col-span-12 lg:col-span-7 space-y-8">
                            {/* E-Invoice IRN Details */}
                            {invoice.irn && (
                                <div className="space-y-3">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Electronic Transaction Audit (IRN)</h4>
                                    <div className="flex gap-6 items-center bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <div className="h-24 w-24 bg-white border border-slate-200 p-2 rounded-xl flex items-center justify-center shrink-0">
                                            {/* Mock QR Code Visual */}
                                            <div className="grid grid-cols-4 gap-1 w-full h-full opacity-20">
                                                {[...Array(16)].map((_, i) => <div key={i} className="bg-slate-900 rounded-sm" />)}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed IRN Key</p>
                                            <p className="text-[11px] font-black text-slate-900 break-all mb-4">{invoice.irn}</p>
                                            <div className="flex gap-4">
                                                <Badge variant="outline" className="text-[9px] font-black text-emerald-600 bg-white border-emerald-100 uppercase py-1">Digitally Signed (IRP)</Badge>
                                                <Badge variant="outline" className="text-[9px] font-black text-blue-600 bg-white border-blue-100 uppercase py-1 px-3">B2B Compliance</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* HSN Summary Table */}
                            <div className="space-y-3">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HSN / SAC Summary Audit</h4>
                                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 p-4">
                                    <table className="w-full text-[10px]">
                                        <thead>
                                            <tr className="text-slate-400 font-bold text-left border-b border-slate-200">
                                                <th className="pb-2">HSN</th>
                                                <th className="pb-2 text-right">Taxable</th>
                                                <th className="pb-2 text-right">CGST</th>
                                                <th className="pb-2 text-right">SGST</th>
                                                <th className="pb-2 text-right">IGST</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.hsn_summary.map((h, i) => (
                                                <tr key={i} className="text-slate-900 font-bold">
                                                    <td className="py-2">{h.hsn_sac}</td>
                                                    <td className="py-2 text-right">₹{h.taxable_value.toLocaleString()}</td>
                                                    <td className="py-2 text-right">₹{h.cgst_amount.toLocaleString()}</td>
                                                    <td className="py-2 text-right">₹{h.sgst_amount.toLocaleString()}</td>
                                                    <td className="py-2 text-right">₹{h.igst_amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valuation in Words</p>
                                <p className="text-[11px] font-black text-slate-900 uppercase italic">Rupees {invoice.grand_total_words}</p>
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-5 space-y-4">
                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                <span>TAXABLE VALUE TOTAL</span>
                                <span className="text-slate-900 font-black">₹{invoice.subtotal.toLocaleString()}</span>
                            </div>
                            {invoice.cgst_total > 0 && (
                                <>
                                    <div className="flex justify-between text-xs font-bold text-slate-400">
                                        <span>CENTRAL TAX (CGST)</span>
                                        <span className="text-emerald-600 font-black">+ ₹{invoice.cgst_total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400">
                                        <span>STATE TAX (SGST)</span>
                                        <span className="text-emerald-600 font-black">+ ₹{invoice.sgst_total.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                            {invoice.igst_total > 0 && (
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>INTEGRATED TAX (IGST)</span>
                                    <span className="text-emerald-600 font-black">+ ₹{invoice.igst_total.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                <span>ROUND OFF / DIFF</span>
                                <span className="text-slate-900 font-black">{invoice.round_off > 0 ? '+' : ''}₹{invoice.round_off.toFixed(2)}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">RECEIVABLE</span>
                                <span className="text-2xl font-black text-slate-900 tabular-nums">₹{invoice.grand_total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Digitally Verified Ledger</p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold max-w-xs leading-relaxed uppercase">This is a system generated document per Rule 46 of CGST Rules 2017. Physical signature not required.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated on Vitta Protocol</p>
                        <p className="text-[10px] font-black text-slate-900 tracking-tighter">{id}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-center p-8 bg-slate-100/50 rounded-3xl border border-dashed border-slate-200">
                <div className="text-center space-y-4">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest">Invoice Controls</h5>
                    <div className="flex gap-2">
                        <Button variant="outline" className="h-10 rounded-xl px-6 font-bold text-xs">
                            <Send className="h-4 w-4 mr-2" /> Dispatch Receipt
                        </Button>
                        {invoice.status !== 'paid' && (
                            <PaymentModal invoice={invoice} onPaid={(newStatus) => setInvoice({...invoice, status: newStatus})} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PaymentModal = ({ invoice, onPaid }) => {
    const [open, setOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: invoice.balance_due,
        account_id: invoice.account_id || '',
        payment_method: 'Bank Transfer'
    });

    useEffect(() => {
        if (open) api.get('/accounts').then(res => {
            setAccounts(res.data);
            if (!form.account_id && res.data.length > 0) {
                setForm(f => ({ ...f, account_id: res.data[0].id }));
            }
        });
    }, [open]);

    const handleRecord = async () => {
        if (!form.account_id) return toast.error("Please select a bank account");
        setLoading(true);
        try {
            const res = await api.post(`/invoices/${invoice.id}/record-payment`, form);
            toast.success("Payment registered and ledger updated!");
            onPaid(res.data.status_label);
            setOpen(false);
        } catch (e) {
            toast.error("Accounting sync failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="inline-block">
            <Button onClick={() => setOpen(true)} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold text-xs shadow-lg shadow-emerald-200/50">
                <CheckCircle className="h-4 w-4 mr-2" /> Record Receipt
            </Button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Record Payment</h3>
                            <p className="text-[12px] text-slate-400 font-medium">This will update your ledger and bank balance instantly.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Received</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">₹</span>
                                    <input 
                                        type="number" 
                                        value={form.amount} 
                                        onChange={e => setForm({...form, amount: parseFloat(e.target.value)})}
                                        className="w-full h-12 pl-8 pr-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                                <select 
                                    value={form.payment_method}
                                    onChange={e => setForm({...form, payment_method: e.target.value})}
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none"
                                >
                                    {['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'Credit Card'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit To Account</label>
                                <select 
                                    value={form.account_id}
                                    onChange={e => setForm({...form, account_id: e.target.value})}
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none"
                                >
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name} (₹{acc.balance.toLocaleString()})</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-500">Cancel</Button>
                            <Button disabled={loading} onClick={handleRecord} className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default InvoiceDetail;
