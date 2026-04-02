import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  ArrowLeft, Download, Send, CreditCard, Edit, Printer,
  CheckCircle2, Clock, AlertCircle, FileText, MoreHorizontal,
  Mail, Share2, Copy, History, ShieldCheck, Zap, Trash2, PenLine
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FontStyle = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      [data-invoice-detail-root] { 
        font-family: 'Inter', sans-serif;
        background: #f8fafc;
        min-height: 100vh;
      }
      .professional-paper {
        background: white;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.03);
      }
      .data-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .data-label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }
      .data-value {
        font-size: 12px;
        font-weight: 700;
        color: #1e293b;
        font-variant-numeric: tabular-nums;
      }
    `}</style>
);

const InvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/invoices/${id}`);
                setInvoice(res.data);
                setPaymentAmount(res.data.balance_due);
                const cRes = await api.get(`/clients/${res.data.client_id}`);
                setClient(cRes.data);
            } catch (e) {
                toast.error("Failed to load invoice");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handleSend = async () => {
        const promise = api.post(`/invoices/${id}/send`);
        toast.promise(promise, {
            loading: 'Processing...',
            success: () => {
                setInvoice({...invoice, status: 'sent'});
                return 'Invoice sent';
            },
            error: 'Failed to send'
        });
    };

    const handleRecordPayment = async () => {
        if (paymentAmount <= 0) return toast.error("Enter a valid amount");
        try {
            await api.post(`/invoices/${id}/record-payment`, { amount: paymentAmount });
            toast.success("Payment recorded");
            setIsPaymentOpen(false);
            const invRes = await api.get(`/invoices/${id}`);
            setInvoice(invRes.data);
        } catch (e) {
            toast.error("Payment sync failed");
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        
        // ─── Document Header (Professional Branding) ───
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.text('VITTA', 20, 28);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('DIGITAL COMPLIANCE INFRASTRUCTURE', 20, 36);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('TAX INVOICE', 190, 28, { align: 'right' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reference: ${invoice.invoice_number}`, 190, 36, { align: 'right' });

        // ─── Entity Information ───
        let yPos = 60;
        
        // From (Your Business)
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('BILLER / ORIGINATOR', 20, yPos);
        
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.setFontSize(12);
        doc.text('Vitta Accounting Services', 20, yPos + 7);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Bangalore, KA, India', 20, yPos + 13);
        doc.text('support@vitta.io', 20, yPos + 18);

        // To (Client)
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('BILLED TO / CUSTOMER', 110, yPos);
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.text(client?.name || 'Customer Entity', 110, yPos + 7);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(client?.business_type || 'Private Client', 110, yPos + 13);
        doc.text(client?.country || 'International', 110, yPos + 18);

        // ─── Status & Dates ───
        yPos += 35;
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(20, yPos, 170, 18, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('ISSUED DATE', 25, yPos + 7);
        doc.text('DUE DATE', 75, yPos + 7);
        doc.text('CURRENCY', 125, yPos + 7);
        doc.text('STATUS', 175, yPos + 7, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.date, 25, yPos + 13);
        doc.text(invoice.due_date, 75, yPos + 13);
        doc.text(invoice.currency, 125, yPos + 13);
        doc.text(invoice.status.toUpperCase(), 175, yPos + 13, { align: 'right' });

        // ─── Itemization Table ───
        const tableData = invoice.line_items.map((it, i) => [
            String(i+1).padStart(2, '0'),
            it.description,
            it.quantity.toString(),
            `INR ${it.unit_price.toLocaleString()}`,
            `${it.tax_rate}%`,
            `INR ${it.amount.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: yPos + 30,
            head: [['Line', 'Description of Services', 'Qty', 'Unit Price', 'Tax', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontSize: 9, cellPadding: 5 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { halign: 'left' },
                2: { halign: 'center', cellWidth: 15 },
                3: { halign: 'right', cellWidth: 35 },
                4: { halign: 'center', cellWidth: 15 },
                5: { halign: 'right', cellWidth: 35 }
            }
        });

        // ─── Financial Summary ───
        let finalY = doc.lastAutoTable.finalY + 15;
        
        const drawSummaryLine = (label, value, isBold = false, isTotal = false) => {
            doc.setFontSize(isTotal ? 11 : 9);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setTextColor(isTotal ? 15 : 100, isTotal ? 23 : 116, isTotal ? 42 : 139);
            
            doc.text(label, 130, finalY);
            doc.setTextColor(15, 23, 42);
            doc.text(`INR ${value.toLocaleString()}`, 190, finalY, { align: 'right' });
            finalY += isTotal ? 10 : 7;
        };

        drawSummaryLine('Net Subtotal', invoice.subtotal);
        drawSummaryLine(`Tax (${invoice.tax_type})`, invoice.tax_amount);
        if (invoice.discount_amount > 0) {
            drawSummaryLine('Discounts Applied', -invoice.discount_amount);
        }
        
        doc.setDrawColor(226, 232, 240);
        doc.line(130, finalY - 2, 190, finalY - 2);
        finalY += 5;
        drawSummaryLine('TOTAL VALUATION', invoice.total, true, true);
        
        if (invoice.amount_paid > 0) {
            drawSummaryLine('Amount Settled', -invoice.amount_paid, false, false);
            doc.setFont('helvetica', 'bold');
            drawSummaryLine('BALANCE DUE', invoice.balance_due, true, false);
        }

        // ─── Footer & Compliance ───
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Terms: All payments are due by the specified maturity date. Vitta Ledger Records are system-verified.', 20, pageHeight - 20);
        doc.text('This is a computer generated document and does not require a physical signature.', 20, pageHeight - 15);
        doc.text(`Generated via Vitta Protocol on ${new Date().toLocaleString()}`, 190, pageHeight - 15, { align: 'right' });

        doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-white">
            <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div data-invoice-detail-root className="pb-12 pt-4 px-6 md:px-12 lg:px-20">
            <FontStyle />
            
            {/* Minimal Toolbar */}
            <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="text-slate-500 hover:text-slate-900 gap-1.5 h-8 px-2">
                    <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
                </Button>
                
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md border-slate-200">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-lg border-slate-100">
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${id}/edit`)} className="h-9 cursor-pointer text-[13px]">
                                <Edit className="h-4 w-4 mr-2 text-slate-400" /> Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportPDF} className="h-9 cursor-pointer text-[13px]">
                                <Printer className="h-4 w-4 mr-2 text-slate-400" /> Print to PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="h-9 cursor-pointer text-[13px] text-rose-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Record
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {invoice.status === 'draft' ? (
                        <Button onClick={handleSend} size="sm" className="bg-slate-900 text-white h-8 px-4 text-[13px] font-semibold">
                            Approve & Send
                        </Button>
                    ) : (invoice.status === 'sent' || invoice.status === 'overdue') ? (
                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 text-[13px] font-semibold">
                                    Record Payment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm rounded-xl py-6 px-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-bold">Receive Payment</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Settlement Amount</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                            <Input 
                                                type="number" 
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                className="h-10 pl-7 text-[15px] font-bold"
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleRecordPayment} className="w-full h-10 bg-slate-900 text-white font-bold">
                                        Sync with Ledger
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                         <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-bold h-8 flex items-center">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> FULLY PAID
                         </Badge>
                    )}
                </div>
            </div>

            {/* Professional Document Layout */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto professional-paper rounded-lg overflow-hidden"
            >
                {/* Slim Header */}
                <div className="px-10 py-10 border-b border-slate-50 grid grid-cols-2">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-slate-900 rounded-md flex items-center justify-center">
                                <Zap className="h-4 w-4 text-emerald-400" />
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tight">Vitta Accounting</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Digital Compliance Infrastructure</p>
                    </div>
                    <div className="text-right space-y-1">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Registry</h2>
                        <h3 className="text-2xl font-bold text-slate-900 tabular-nums">{invoice.invoice_number}</h3>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-5 ${
                            invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                            {invoice.status}
                        </Badge>
                    </div>
                </div>

                <div className="px-10 py-8">
                    {/* Compact Info Grid */}
                    <div className="grid grid-cols-12 gap-8 mb-12">
                        <div className="col-span-12 md:col-span-7 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Information</p>
                                <h4 className="text-[15px] font-bold text-slate-900">{client?.name || 'Customer'}</h4>
                                <p className="text-[12px] text-slate-500">{client?.business_type || 'Entity'}</p>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <div className="text-[11px] flex gap-2"><span className="text-slate-400 font-bold">Currency:</span> {invoice.currency}</div>
                                <div className="text-[11px] flex gap-2"><span className="text-slate-400 font-bold">Vault:</span> Internal Ledger</div>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-5 space-y-2 pt-6 md:pt-0">
                            <div className="data-row">
                                <span className="data-label">Issued Date</span>
                                <span className="data-value">{invoice.date}</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Due Date</span>
                                <span className="data-value text-rose-500">{invoice.due_date}</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Reference ID</span>
                                <span className="data-value text-slate-400">#{id.slice(-6)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Compact Table */}
                    <div className="mb-12">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-2 text-left text-[11px] font-black text-slate-900 uppercase">Service Summary</th>
                                    <th className="py-2 text-center text-[11px] font-black text-slate-900 uppercase">Qty</th>
                                    <th className="py-2 text-right text-[11px] font-black text-slate-900 uppercase">Rate</th>
                                    <th className="py-2 text-right text-[11px] font-black text-slate-900 uppercase pl-8">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.line_items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-4">
                                            <p className="text-[13px] font-semibold text-slate-800">{item.description}</p>
                                            <span className="text-[10px] text-slate-400">{invoice.tax_type} @ {item.tax_rate}%</span>
                                        </td>
                                        <td className="py-4 text-center text-[13px] font-medium text-slate-600 tabular-nums">{item.quantity}</td>
                                        <td className="py-4 text-right text-[13px] font-medium text-slate-600 tabular-nums">₹{(item.unit_price || 0).toLocaleString()}</td>
                                        <td className="py-4 text-right text-[14px] font-bold text-slate-900 tabular-nums pl-8">₹{(item.amount || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Settlement Summary */}
                    <div className="grid grid-cols-12 gap-8 pt-6 border-t border-slate-100">
                        <div className="col-span-12 md:col-span-6 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Notes</p>
                                <p className="text-[11px] text-slate-600 leading-relaxed italic">{invoice.notes || 'No standard additional notes.'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement terms</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed tabular-nums">{invoice.terms}</p>
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-6 space-y-3">
                            <div className="data-row border-none">
                                <span className="data-label">Net Subtotal</span>
                                <span className="data-value">₹{(invoice.subtotal || 0).toLocaleString()}</span>
                            </div>
                            <div className="data-row border-none">
                                <span className="data-label">Tax Aggregation</span>
                                <span className="data-value text-emerald-600">+ ₹{(invoice.tax_amount || 0).toLocaleString()}</span>
                            </div>
                            {(invoice.discount_amount || 0) > 0 && (
                                <div className="data-row border-none">
                                    <span className="data-label">Discounts</span>
                                    <span className="data-value text-rose-500">- ₹{(invoice.discount_amount || 0).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="data-row border-none pt-2 border-t border-slate-900 mt-2">
                                <span className="text-[13px] font-black text-slate-900 uppercase">Valuation Total</span>
                                <span className="text-[20px] font-black text-slate-900 tabular-nums">₹{(invoice.total || 0).toLocaleString()}</span>
                            </div>
                            {(invoice.amount_paid || 0) > 0 && (
                                <div className="flex justify-between items-center bg-emerald-50 px-3 py-2 rounded mt-2">
                                    <span className="text-[11px] font-bold text-emerald-700">Accumulated Settlements</span>
                                    <span className="text-[13px] font-black text-emerald-700">- ₹{(invoice.amount_paid || 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-10 py-6 bg-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-emerald-500" />
                        <span>Vitta Ledger Verified</span>
                    </div>
                    <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors"
                        onClick={() => {
                            navigator.clipboard.writeText(id);
                            toast.success("Reference ID copied to clipboard");
                        }}
                    >
                        <span>Reference: {id}</span>
                        <Copy className="h-3 w-3" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InvoiceDetail;
