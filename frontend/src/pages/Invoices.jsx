import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  FileText, Plus, Search, Download, MoreVertical, Edit,
  Trash2, Send, CreditCard, Eye, Filter, ArrowUpRight,
  TrendingUp, Clock, AlertCircle, CheckCircle2, Zap, ArrowRight,
  LayoutGrid, List, ChevronRight, X, Globe, PenLine
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

const Invoices = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_count: 0, total_amount: 0, pending_count: 0, pending_amount: 0, paid_amount: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const limit = 15;

    useEffect(() => {
        fetchInvoices();
    }, [filterStatus, currentPage]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/invoices', { 
                params: { 
                    status: filterStatus !== 'all' ? filterStatus : undefined,
                    page: currentPage,
                    limit: limit
                } 
            });
            setInvoices(res.data.invoices || []);
            setTotalInvoices(res.data.total || 0);
            
            const sRes = await api.get('/invoices/summary');
            setStats(sRes.data);
        } catch (e) { 
            toast.error("Failed to sync records"); 
            setInvoices([]);
        } finally { 
            setLoading(false); 
        }
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 hover:shadow-sm hover:shadow-emerald-100/50 transition-all cursor-default';
            case 'sent': return 'bg-indigo-50 text-indigo-600 border-none hover:bg-indigo-100 hover:shadow-sm hover:shadow-indigo-100/50 transition-all cursor-default';
            case 'overdue': return 'bg-rose-50 text-rose-600 border-none hover:bg-rose-100 hover:shadow-sm hover:shadow-rose-100/50 transition-all cursor-default';
            default: return 'bg-slate-50 text-slate-500 border-none hover:bg-slate-100 transition-all cursor-default';
        }
    };

    const showPagination = totalInvoices > limit;
    const hasNext = currentPage * limit < totalInvoices;
    const hasPrev = currentPage > 1;

    return (
        <div className="pb-12 pt-4 px-6 md:px-12">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; background: #f8fafc; }
                .compact-stat-card {
                  background: white;
                  border: 1px solid #e2e8f0;
                  padding: 16px 20px;
                  border-radius: 12px;
                  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .compact-stat-card:hover {
                  border-color: #cbd5e1;
                  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.04), 0 8px 10px -6px rgb(0 0 0 / 0.04);
                }
                .slim-row {
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .slim-row:hover {
                  background: #f8fafc;
                  box-shadow: inset 4px 0 0 -1px #0f172a;
                }
            `}</style>

            {/* Compact Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Management</h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Financial Operations Control</p>
                </div>
                <Button onClick={() => navigate('/invoices/new')} className="h-9 px-5 bg-slate-900 text-white font-bold rounded-lg shadow-lg shadow-slate-200">
                    <Plus className="h-4 w-4 mr-2" /> New Invoice
                </Button>
            </div>

            {/* Compact Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Volume', val: stats.total_amount, count: stats.total_count, icon: Globe, color: 'text-slate-900' },
                    { label: 'Unsettled', val: stats.pending_amount, count: stats.pending_count, icon: Clock, color: 'text-indigo-600' },
                    { label: 'Settled', val: stats.paid_amount, count: stats.total_count - stats.pending_count, icon: CheckCircle2, color: 'text-emerald-600' },
                    { label: 'Overdue Delta', val: 0, count: 0, icon: AlertCircle, color: 'text-rose-600' }
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        className="compact-stat-card flex flex-col justify-between h-24 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all cursor-default"
                    >
                        <div className="flex justify-between items-start">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                             <div className={`h-6 w-6 rounded-md bg-slate-50 flex items-center justify-center`}><s.icon className={`h-3.5 w-3.5 ${s.color}`} /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                             <span className="text-xl font-black text-slate-900 tabular-nums tracking-tight">₹{(s.val || 0).toLocaleString()}</span>
                             <span className="text-[11px] font-bold text-slate-400">({s.count || 0})</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter Hub */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search IDs or clients..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 pl-9 text-[13px] border-none bg-slate-50 focus:bg-white transition-all rounded-lg"
                    />
                </div>
                <div className="flex bg-slate-50 p-1 rounded-lg gap-1 border border-slate-100">
                    {['all', 'draft', 'sent', 'overdue', 'paid'].map(s => (
                        <button 
                            key={s} 
                            onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                            className={`px-3 py-1 text-[11px] font-black uppercase rounded-md transition-all ${
                                filterStatus === s ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Infrastructure */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <TooltipProvider>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifier</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Entity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valuation</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Maturity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {filteredInvoices.map((inv) => (
                                    <motion.tr 
                                        layout
                                        key={inv.id} 
                                        className="slim-row cursor-pointer group"
                                        onClick={() => navigate(`/invoices/${inv.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-md bg-slate-50 flex items-center justify-center font-black text-[12px] text-slate-900">{inv.invoice_number?.slice(-2) || 'XX'}</div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900 tracking-tight">{inv.invoice_number || 'SYSTEM-RECD'}</p>
                                                    <p className="text-[11px] text-slate-400 tabular-nums">Issued: {inv.date}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[13px] font-bold text-slate-800">{inv.client_name || 'Individual'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {inv.client_id?.slice(-4)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-[14px] font-black text-slate-900 tabular-nums tracking-tight">₹{(inv.total || 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">Tax: ₹{(inv.tax_amount || 0).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="outline" className="text-[10px] font-black bg-white border-slate-200 px-2 py-0 h-5 tabular-nums">{inv.due_date}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Badge className={`text-[10px] font-black uppercase px-3 h-6 rounded-md ${getStatusStyle(inv.status)}`}>
                                                    {inv.status}
                                                </Badge>
                                                {inv.irn && (
                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[8px] font-black uppercase h-4 px-1.5 flex items-center gap-1">
                                                        <Zap className="h-2 w-2" /> IRN Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end items-center gap-1 transition-all">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => navigate(`/invoices/${inv.id}`)}
                                                            className="h-8 w-8 p-0 text-slate-300 hover:text-slate-900 hover:bg-slate-100"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-[10px] font-bold bg-slate-900 border-slate-900">
                                                        <p>View</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                                                            className="h-8 w-8 p-0 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                                        >
                                                            <PenLine className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-[10px] font-bold bg-slate-900 border-slate-900">
                                                        <p>Edit</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => setDeleteConfirm(inv.id)}
                                                            className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-[10px] font-bold bg-rose-600 border-rose-600 text-white">
                                                        <p>Delete</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </TooltipProvider>
            </div>

            <div className="mt-8 flex justify-between items-center px-4 min-h-[40px]">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalInvoices)} of {totalInvoices} Records
                 </p>
                 
                 {showPagination && (
                    <div className="flex gap-2">
                        {hasPrev && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[11px] font-bold hover:bg-slate-50 transition-all font-inter"
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                Previous Page
                            </Button>
                        )}
                        {hasNext && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[11px] font-bold bg-slate-900 text-white border-slate-900 hover:bg-black transition-all font-inter"
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next Page
                            </Button>
                        )}
                    </div>
                 )}
            </div>

            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-sm rounded-xl py-8">
                    <DialogHeader className="items-center text-center">
                        <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center mb-4"><Trash2 className="h-6 w-6 text-rose-600" /></div>
                        <DialogTitle className="text-lg font-black tracking-tight">Delete Invoice?</DialogTitle>
                        <p className="text-[13px] text-slate-500 font-medium">This action is permanent and will remove the document from your secure vault.</p>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 font-bold h-10 border-slate-200">Cancel</Button>
                        <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 uppercase text-[11px]">Delete Forever</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Invoices;
