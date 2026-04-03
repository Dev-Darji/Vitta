import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  Download, FileText, FileSpreadsheet, TrendingUp, TrendingDown,
  Wallet, PieChart as PieIcon, BarChart3, Loader2, Receipt, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertCircle, Building2, Gavel, Landmark, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('pnl');
    const [loading, setLoading] = useState(true);
    const [pnlData, setPnlData] = useState(null);
    const [bsData, setBsData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pnlRes, bsRes] = await Promise.all([
                    api.get('/reports/pnl'),
                    api.get('/reports/schedule-iii-balance-sheet')
                ]);
                setPnlData(pnlRes.data);
                setBsData(bsRes.data);
            } catch (e) {
                toast.error("Compliance data sync failed");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const ScheduleIIIRow = ({ label, value, isSub = false, isTotal = false, isBold = false }) => (
        <div className={`flex justify-between items-center py-3 border-b border-slate-50 ${isTotal ? 'bg-slate-50/50 px-4 rounded-xl border-none mb-2' : ''}`}>
            <span className={`text-[12px] ${isSub ? 'pl-6 text-slate-400 font-medium' : isTotal ? 'font-black text-slate-900 uppercase tracking-widest' : isBold ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                {label}
            </span>
            <span className={`text-[13px] tabular-nums ${isTotal ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                ₹{value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
        </div>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen opacity-30">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Aggregating Ledgers per Schedule III</p>
        </div>
    );

    return (
        <div className="pb-24 pt-4 px-2 space-y-8">
            {/* Regulatory Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Gavel className="h-5 w-5 text-primary" />
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statutory Reporting</h1>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Companies Act, 2013 & GST Advisory Standards</p>
                </div>
                <Button className="h-10 px-8 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xl shadow-slate-100">
                    <Download className="h-4 w-4 mr-2" /> Audit Export
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto mb-8 border border-slate-200">
                    <TabsTrigger value="pnl" className="flex-1 py-2.5 font-black text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-white shadow-none">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="bs" className="flex-1 py-2.5 font-black text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-white shadow-none">Balance Sheet</TabsTrigger>
                    <TabsTrigger value="gst" className="flex-1 py-2.5 font-black text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-white shadow-none">GST Summary</TabsTrigger>
                </TabsList>

                {/* 1. Schedule III Profit & Loss */}
                <TabsContent value="pnl" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase">Statement of Profit & Loss</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporting Period: Current FY</p>
                            </div>
                            <Badge variant="outline" className="border-emerald-100 text-emerald-600 font-black text-[10px] px-4 py-1 uppercase">Net Profit: ₹{pnlData?.profit_for_period.toLocaleString()}</Badge>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" /> Income
                            </h3>
                            <ScheduleIIIRow label="Revenue from Operations" value={pnlData?.revenue.revenue_from_operations} isBold />
                            <ScheduleIIIRow label="Other Income" value={pnlData?.revenue.other_income} />
                            <ScheduleIIIRow label="Total Revenue (I + II)" value={pnlData?.revenue.total_revenue} isTotal />
                            
                            <div className="h-8" />
                            
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <TrendingDown className="h-3 w-3" /> Expenses
                            </h3>
                            <ScheduleIIIRow label="Cost of materials consumed" value={pnlData?.expenses.cost_of_materials} />
                            <ScheduleIIIRow label="Employee benefits expense" value={pnlData?.expenses.employee_benefit_expenses} />
                            <ScheduleIIIRow label="Finance costs" value={pnlData?.expenses.finance_costs} />
                            <ScheduleIIIRow label="Depreciation and amortization" value={pnlData?.expenses.depreciation} />
                            <ScheduleIIIRow label="Other expenses" value={pnlData?.expenses.other_expenses} />
                            <ScheduleIIIRow label="Total Expenses (IV)" value={pnlData?.expenses.total_expenses} isTotal />

                            <div className="h-8" />

                            <ScheduleIIIRow label="Profit/(Loss) before tax (III - IV)" value={pnlData?.profit_before_tax} isBold />
                            <ScheduleIIIRow label="Tax expense (25.0%)" value={pnlData?.tax_expense.current_tax} />
                            <ScheduleIIIRow label="Profit/(Loss) for the period" value={pnlData?.profit_for_period} isTotal />
                        </div>
                    </div>
                </TabsContent>

                {/* 2. Schedule III Balance Sheet */}
                <TabsContent value="bs" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Equity & Liabilities */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                            <h2 className="text-sm font-black text-slate-900 uppercase mb-8 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" /> Equity & Liabilities
                            </h2>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Shareholders' Funds</p>
                                <ScheduleIIIRow label="Share Capital" value={bsData?.equity_and_liabilities.shareholders_funds.share_capital} isSub />
                                <ScheduleIIIRow label="Reserves and Surplus" value={bsData?.equity_and_liabilities.shareholders_funds.reserves_and_surplus} isSub />
                                <ScheduleIIIRow label="Total Shareholders' Funds" value={bsData?.equity_and_liabilities.shareholders_funds.total} isBold />

                                <div className="h-6" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Non-Current Liabilities</p>
                                <ScheduleIIIRow label="Long-term borrowings" value={0} isSub />
                                
                                <div className="h-6" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Liabilities</p>
                                <ScheduleIIIRow label="Short-term borrowings" value={bsData?.equity_and_liabilities.current_liabilities.short_term_borrowings} isSub />
                                <ScheduleIIIRow label="Trade payables" value={0} isSub />
                                <ScheduleIIIRow label="Total Current Liabilities" value={bsData?.equity_and_liabilities.current_liabilities.total} isBold />

                                <div className="h-12" />
                                <ScheduleIIIRow label="TOTAL EQUITY & LIABILITIES" value={bsData?.equity_and_liabilities.total} isTotal />
                            </div>
                        </div>

                        {/* Assets */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                            <h2 className="text-sm font-black text-slate-900 uppercase mb-8 flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-emerald-500" /> Assets
                            </h2>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Non-Current Assets</p>
                                <ScheduleIIIRow label="Property, Plant and Equipment" value={0} isSub />
                                <ScheduleIIIRow label="Non-current investments" value={0} isSub />
                                
                                <div className="h-6" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Assets</p>
                                <ScheduleIIIRow label="Inventories" value={0} isSub />
                                <ScheduleIIIRow label="Trade receivables" value={0} isSub />
                                <ScheduleIIIRow label="Cash and cash equivalents" value={bsData?.assets.current_assets.cash_and_equivalents} isSub />
                                <ScheduleIIIRow label="Total Current Assets" value={bsData?.assets.current_assets.total} isBold />

                                <div className="h-32" />
                                <ScheduleIIIRow label="TOTAL ASSETS" value={bsData?.assets.total} isTotal />
                            </div>
                        </div>
                    </div>
                    
                    {!bsData?.is_balanced && (
                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <AlertCircle className="h-6 w-6 text-amber-500" />
                                <div>
                                    <p className="text-amber-900 font-black text-xs uppercase">Accounting Mismatch</p>
                                    <p className="text-amber-700 text-[11px] font-medium">Assets do not equal Equity & Liabilities. Review unposted transactions.</p>
                                </div>
                            </div>
                            <Button variant="outline" className="bg-white border-amber-200 text-amber-700 font-bold text-xs h-9 px-6 rounded-xl">Audit Ledger</Button>
                        </div>
                    )}
                </TabsContent>

                {/* 3. GST Summary (Placeholder for detailed compliance) */}
                <TabsContent value="gst" className="mt-0 focus-visible:outline-none">
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                         <div className="text-center py-12">
                            <ShieldCheck className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-900 uppercase">GST Auditor</h3>
                            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                                Our real-time engine compares your GSTR-1 Sales with Input Tax Credits found in your ledgers.
                            </p>
                            <Button className="h-10 px-8 bg-slate-900 text-white rounded-xl font-bold text-xs">Run GST Compliance Audit</Button>
                         </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Reports;