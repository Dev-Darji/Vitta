import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Loader2, Save, Key, Download, Upload, 
  Database, FileSpreadsheet, AlertTriangle, FileJson, RefreshCcw,
  Building, CheckCircle2, XCircle, AlertCircle, Building2,
  ChevronRight, Laptop, Globe, Phone, Mail, CreditCard,
  History, Sparkles, LogOut, Trash2, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  RadioGroup, RadioGroupItem 
} from '@/components/ui/radio-group';
import { toast } from 'sonner';
import api from '@/lib/api';

/* ─── Styles ────────────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
    [data-settings] { font-family: 'DM Sans', sans-serif; }
    [data-settings] input:focus { border-color: #6366f1 !important; background: #fafbff !important; }
    [data-settings] input::placeholder { color: #94a3b8 !important; font-weight: 500 !important; }
  `}</style>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', business_name: '' });
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState('merge');
  const [restoreFile, setRestoreFile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState({
    company_name: '', trade_name: '', gstin: '', pan: '', cin: '',
    business_type: 'Pvt Ltd', registration_type: 'Regular',
    address_line1: '', address_line2: '', city: '', state: '',
    state_code: '', pincode: '', phone: '', email: '', website: '',
    annual_turnover: 0, bank_name: '', account_number: '', ifsc_code: '', branch: '',
    bank_balance: 0, fiscal_year_start: 'April'
  });
  const [gstinValid, setGstinValid] = useState(null);
  const [gstinError, setGstinError] = useState('');

  const indianStates = [
    { code: "01", name: "Jammu & Kashmir" }, { code: "02", name: "Himachal Pradesh" },
    { code: "03", name: "Punjab" }, { code: "04", name: "Chandigarh" },
    { code: "05", name: "Uttarakhand" }, { code: "06", name: "Haryana" },
    { code: "07", name: "Delhi" }, { code: "08", name: "Rajasthan" },
    { code: "09", name: "Uttar Pradesh" }, { code: "10", name: "Bihar" },
    { code: "11", name: "Sikkim" }, { code: "12", name: "Arunachal Pradesh" },
    { code: "13", name: "Nagaland" }, { code: "14", name: "Manipur" },
    { code: "15", name: "Mizoram" }, { code: "16", name: "Tripura" },
    { code: "17", name: "Meghalaya" }, { code: "18", name: "Assam" },
    { code: "19", name: "West Bengal" }, { code: "20", name: "Jharkhand" },
    { code: "21", name: "Odisha" }, { code: "22", name: "Chhattisgarh" },
    { code: "23", name: "Madhya Pradesh" }, { code: "24", name: "Gujarat" },
    { code: "25", name: "Daman & Diu" }, { code: "26", name: "Dadra & Nagar Haveli" },
    { code: "27", name: "Maharashtra" }, { code: "28", name: "Andhra Pradesh (Old)" },
    { code: "29", name: "Karnataka" }, { code: "30", name: "Goa" },
    { code: "31", name: "Lakshadweep" }, { code: "32", name: "Kerala" },
    { code: "33", name: "Tamil Nadu" }, { code: "34", name: "Puducherry" },
    { code: "35", name: "Andaman & Nicobar" }, { code: "36", name: "Telangana" },
    { code: "37", name: "Andhra Pradesh" }, { code: "38", name: "Ladakh" }
  ];

  useEffect(() => {
    fetchUser();
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const response = await api.get('/company-profile');
      if (response.data) {
        setCompanyProfile({...response.data, 
          bank_balance: response.data.bank_balance || 0,
          fiscal_year_start: response.data.fiscal_year_start || 'April'
        });
        if (response.data.gstin) validateGSTIN(response.data.gstin);
      }
    } catch { console.error('Failed to load company profile'); }
  };

  const validateGSTIN = async (gstin) => {
    if (gstin.length !== 15) {
      setGstinValid(null);
      setGstinError('');
      return;
    }
    try {
      const response = await api.get(`/validate-gstin/${gstin}`);
      if (response.data.valid) {
        setGstinValid(true);
        setGstinError('');
        setCompanyProfile(prev => ({
          ...prev, state: response.data.state_name,
          state_code: response.data.state_code, pan: response.data.pan
        }));
      } else {
        setGstinValid(false);
        setGstinError(response.data.error);
      }
    } catch { setGstinValid(false); setGstinError('Validation failed'); }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setProfileData({ name: response.data.name || '', business_name: response.data.business_name || '' });
    } catch { toast.error('Failed to load user data'); }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sanitized = {
        ...companyProfile,
        annual_turnover: companyProfile.annual_turnover ? parseFloat(companyProfile.annual_turnover) : 0,
        bank_balance: companyProfile.bank_balance ? parseFloat(companyProfile.bank_balance) : 0
      };
      await api.put('/company-profile', sanitized);
      toast.success('Business profile updated');
    } catch { toast.error('Failed to update business profile'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'business', label: 'Business Profile', icon: Building2, desc: 'GSTIN, Branding, Compliance' },
    { id: 'account', label: 'My Account', icon: User, desc: 'Personal info & Business Title' },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Password & Access keys' },
    { id: 'data', label: 'Data & Backup', icon: Database, desc: 'Exports & System Restore' }
  ];

  return (
    <div data-settings className="w-full pb-24 space-y-8 pr-4">
      <FontStyle />
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-none">Fiscal Configuration & Identity</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ── Sidebar Nav ── */}
        <div className="inline-flex w-full lg:w-72 flex-row lg:flex-col p-1.5 bg-slate-100/60 rounded-2xl border border-slate-100 overflow-x-auto lg:overflow-visible no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <tab.icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="text-left hidden lg:block">
                <p className="text-[13px] font-bold leading-none">{tab.label}</p>
                <p className="text-[10px] opacity-60 font-medium mt-1 leading-tight">{tab.desc}</p>
              </div>
              <span className="lg:hidden text-[12px] font-bold">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="tab-pill" className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full hidden lg:block" />
              )}
            </button>
          ))}
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* Business Profile Tab */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  {/* Compliance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${companyProfile.gstin && gstinValid ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100 shadow-sm shadow-amber-900/5'}`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${companyProfile.gstin && gstinValid ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-amber-600'}`}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${companyProfile.gstin && gstinValid ? 'text-emerald-700' : 'text-amber-800'}`}>
                          GST Compliance Status
                        </p>
                        <p className={`text-[12.5px] font-bold leading-tight truncate ${companyProfile.gstin && gstinValid ? 'text-emerald-900' : 'text-amber-900'}`}>
                          {companyProfile.gstin && gstinValid ? 'Rule 46 Tax Invoice Ready' : 'Bill of Supply (Basic)'}
                        </p>
                      </div>
                      <Badge variant="outline" className={`ml-auto border-none text-[9px] uppercase tracking-widest font-black ${companyProfile.gstin && gstinValid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                        {companyProfile.gstin && gstinValid ? 'Compliant' : 'Unverified'}
                      </Badge>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <History className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Reporting</p>
                        <p className="text-[12.5px] font-bold leading-tight text-slate-900">Schedule III Ready</p>
                      </div>
                      <div className="ml-auto flex -space-x-2">
                        {[1, 2].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100" />)}
                      </div>
                    </div>
                  </div>

                  {/* Firm Details Form */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <form onSubmit={handleUpdateCompany} className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        
                        {/* Legal Identity Section */}
                        <div className="space-y-6">
                           <div>
                             <p className="text-[11px] font-black text-slate-900 uppercase tracking-[.15em] mb-1">Legal Identity</p>
                             <div className="h-0.5 w-8 bg-indigo-600 rounded-full" />
                           </div>
                           
                           <div className="space-y-4">
                             <div className="space-y-1.5">
                               <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Entity Name</Label>
                               <Input value={companyProfile.company_name} onChange={e => setCompanyProfile({...companyProfile, company_name: e.target.value})} placeholder="e.g. Acme Tech Solutions Pvt Ltd" className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" required />
                             </div>

                             <div className="space-y-1.5">
                               <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trade Name (Optional)</Label>
                               <Input value={companyProfile.trade_name} onChange={e => setCompanyProfile({...companyProfile, trade_name: e.target.value})} placeholder="Doing Business As (DBA)" className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" />
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1.5 pt-2">
                                  <div className="flex justify-between items-center h-4 mb-1 px-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTIN</Label>
                                    {gstinValid && <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-widest leading-none"><CheckCircle2 className="h-3 w-3" /> Valid</span>}
                                  </div>
                                  <Input 
                                    value={companyProfile.gstin} 
                                    onChange={e => {
                                      const val = e.target.value.toUpperCase();
                                      setCompanyProfile({...companyProfile, gstin: val});
                                      validateGSTIN(val);
                                    }} 
                                    placeholder="24AAAC..."
                                    className={`h-11 rounded-xl font-black text-[13px] uppercase ${gstinValid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`} 
                                  />
                               </div>
                               <div className="space-y-1.5 pt-2">
                                  <div className="flex justify-between items-center h-4 mb-1 px-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PAN</Label>
                                  </div>
                                  <Input value={companyProfile.pan} onChange={e => setCompanyProfile({...companyProfile, pan: e.target.value.toUpperCase()})} placeholder="ABCDE1234F" className="h-11 rounded-xl border-slate-100 bg-slate-50 font-black text-[13px] uppercase" />
                               </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corporate ID (CIN)</Label>
                                 <Input value={companyProfile.cin} onChange={e => setCompanyProfile({...companyProfile, cin: e.target.value})} placeholder="U00000GJ..." className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" />
                               </div>
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Type</Label>
                                 <Select value={companyProfile.business_type} onValueChange={v => setCompanyProfile({...companyProfile, business_type: v})}>
                                   <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]"><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                     {["Proprietorship", "Partnership", "LLP", "Pvt Ltd", "Public Ltd", "Other"].map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reg. Type</Label>
                                  <Select value={companyProfile.registration_type} onValueChange={v => setCompanyProfile({...companyProfile, registration_type: v})}>
                                   <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]"><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                     {["Regular", "Composition", "Unregistered"].map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}
                                   </SelectContent>
                                 </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turnover (₹)</Label>
                                  <Input type="number" value={companyProfile.annual_turnover} onChange={e => setCompanyProfile({...companyProfile, annual_turnover: e.target.value})} className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" />
                                </div>
                             </div>
                           </div>
                        </div>

                        {/* Registered Office Section */}
                        <div className="space-y-6">
                           <div>
                             <p className="text-[11px] font-black text-slate-900 uppercase tracking-[.15em] mb-1">Office & Contact</p>
                             <div className="h-0.5 w-8 bg-indigo-600 rounded-full" />
                           </div>
                           <div className="space-y-4">
                             <div className="space-y-1.5">
                               <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headquarters Address</Label>
                               <Input value={companyProfile.address_line1} onChange={e => setCompanyProfile({...companyProfile, address_line1: e.target.value})} placeholder="Building / Street" className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" required />
                               <Input value={companyProfile.address_line2} onChange={e => setCompanyProfile({...companyProfile, address_line2: e.target.value})} placeholder="Locality / Area" className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px] mt-2" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</Label>
                                 <Input value={companyProfile.city} onChange={e => setCompanyProfile({...companyProfile, city: e.target.value})} className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" required />
                               </div>
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State (PoS)</Label>
                                 <Select value={companyProfile.state} onValueChange={v => setCompanyProfile({...companyProfile, state: v})}>
                                   <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]"><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                     {indianStates.map(s => <SelectItem key={s.code} value={s.name} className="font-bold text-xs">{s.name}</SelectItem>)}
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pincode</Label>
                                  <Input value={companyProfile.pincode} onChange={e => setCompanyProfile({...companyProfile, pincode: e.target.value})} className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" required />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State Code</Label>
                                  <Input value={companyProfile.state_code} onChange={e => setCompanyProfile({...companyProfile, state_code: e.target.value})} placeholder="24" className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px]" />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</Label>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                                    <Input value={companyProfile.phone} onChange={e => setCompanyProfile({...companyProfile, phone: e.target.value})} className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[13px] pl-9" />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</Label>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                                    <Input value={companyProfile.email} onChange={e => setCompanyProfile({...companyProfile, email: e.target.value})} className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-[12px] pl-9" />
                                  </div>
                                </div>
                             </div>
                           </div>
                        </div>
                      </div>

                      {/* Treasury Section */}
                      <div className="mt-8 bg-indigo-50/20 rounded-3xl border border-indigo-100/50 p-6">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                              <CreditCard className="h-5 w-5" />
                           </div>
                           <div>
                             <p className="text-[11px] font-black text-slate-900 uppercase tracking-[.15em] leading-none">Fiscal Treasury & Banking</p>
                             <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Audit-Ready Payment Details</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Bank Name</Label>
                              <Input value={companyProfile.bank_name} onChange={e => setCompanyProfile({...companyProfile, bank_name: e.target.value})} placeholder="HDFC Bank" className="h-11 rounded-xl border-slate-100 bg-white font-bold text-[13px]" />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Account Number</Label>
                              <Input value={companyProfile.account_number} onChange={e => setCompanyProfile({...companyProfile, account_number: e.target.value.replace(/[^0-9]/g, '')})} placeholder="501...423" className="h-11 rounded-xl border-slate-100 bg-white font-bold text-[13px]" />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">IFSC Code</Label>
                              <Input value={companyProfile.ifsc_code} onChange={e => setCompanyProfile({...companyProfile, ifsc_code: e.target.value.toUpperCase()})} placeholder="HDFC000..." className="h-11 rounded-xl border-slate-100 bg-white font-black text-[13px] uppercase" />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Fiscal Year Start</Label>
                              <Select value={companyProfile.fiscal_year_start} onValueChange={v => setCompanyProfile({...companyProfile, fiscal_year_start: v})}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-white font-bold text-[13px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {["April", "January", "July", "October"].map(m => <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Opening Balance (₹)</Label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-black text-indigo-400">₹</span>
                                <Input type="number" value={companyProfile.bank_balance} onChange={e => setCompanyProfile({...companyProfile, bank_balance: e.target.value.replace(/[^0-9.]/g, '')})} className="h-11 rounded-xl border-indigo-200 bg-indigo-50/50 font-black text-[14px] text-indigo-900 pl-8" />
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-[12px] uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-[0.98] group">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2 opacity-50 group-hover:opacity-100 transition-opacity" />}
                          Persist Business Profile
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Data Management Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <Database className="h-6 w-6" />
                       </div>
                       <div>
                         <h3 className="text-lg font-black text-slate-900 leading-tight">Data Stewardship</h3>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Manage backups, portability & recovery</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-[.15em] mb-4">Export Protocol</p>
                            <div className="space-y-3">
                               <Button onClick={() => toast.info('Generating JSON backup...')} className="w-full justify-between h-12 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-900 px-5 group">
                                 <div className="flex items-center gap-3">
                                   <FileJson className="h-4 w-4 text-indigo-500" />
                                   <span className="text-[12px] font-bold">System Backup (.json)</span>
                                 </div>
                                 <Download className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100" />
                               </Button>
                               <div className="grid grid-cols-2 gap-3">
                                  <Button onClick={() => toast.info('Preparing Excel export...')} variant="outline" className="h-12 rounded-xl border-slate-100 font-bold text-[11.5px] hover:bg-emerald-50 hover:text-emerald-600">
                                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                                  </Button>
                                  <Button onClick={() => toast.info('Preparing CSV export...')} variant="outline" className="h-12 rounded-xl border-slate-100 font-bold text-[11.5px] hover:bg-blue-50 hover:text-blue-600">
                                    <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
                                  </Button>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-[.15em] mb-4">Recovery Engine</p>
                            <div className="p-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                               <RefreshCcw className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                               <p className="text-[12.5px] font-bold text-slate-900">Restore from previous state</p>
                               <p className="text-[10px] font-medium text-slate-400 mt-1 mb-6">Import a valid .json file to recover your data flow.</p>
                               <Button onClick={() => setIsRestoreOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 h-9 px-6 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-sm">
                                 Initiate
                               </Button>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
                           <Trash2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[12.5px] font-black text-rose-900 leading-none">Purge Environment</p>
                          <p className="text-[10px] font-medium text-rose-600 mt-1">Permanently delete all ledger entries and accounts.</p>
                        </div>
                     </div>
                     <Button variant="ghost" className="text-rose-600 font-black text-[11px] uppercase tracking-widest hover:bg-rose-100">
                        Zeroize Data
                     </Button>
                  </div>
                </div>
              )}

              {/* security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-900/10">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                          <Shield className="h-6 w-6 text-indigo-400" />
                       </div>
                       <div>
                         <h3 className="text-lg font-black tracking-tight leading-tight">Access Control</h3>
                         <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Fortify your financial data</p>
                       </div>
                    </div>

                    <form className="space-y-6">
                       <div className="space-y-1.5">
                         <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Current Password</Label>
                         <Input type="password" placeholder="••••••••••••" className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:bg-white/[0.08]" />
                       </div>
                       <Separator className="bg-white/5" />
                       <div className="space-y-4">
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">New Access Key</Label>
                             <Input type="password" placeholder="Create robust password" className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:bg-white/[0.08]" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Verify Key</Label>
                             <Input type="password" placeholder="Repeat new password" className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:bg-white/[0.08]" />
                          </div>
                       </div>
                       <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-950/20 mt-4">
                         Update Credentials
                       </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="h-12 w-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center border border-slate-100">
                          <User className="h-6 w-6" />
                       </div>
                       <div>
                         <h3 className="text-lg font-black text-slate-900 leading-tight">Personal Identity</h3>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Update your profile metadata</p>
                       </div>
                    </div>

                    <form className="space-y-6">
                       <div className="space-y-1.5">
                         <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Owner / Full Name</Label>
                         <Input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Registered Email</Label>
                         <Input value={user?.email} disabled className="h-12 rounded-xl border-none bg-slate-100 text-slate-400 font-bold opacity-60 cursor-not-allowed" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Business Title (Public)</Label>
                         <Input value={profileData.business_name} onChange={e => setProfileData({...profileData, business_name: e.target.value})} placeholder="e.g. CEO, Principal Partner" className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold" />
                       </div>
                       <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-100 mt-4 transition-all active:scale-[0.98]">
                         Save Preferences
                       </Button>
                    </form>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default Settings;