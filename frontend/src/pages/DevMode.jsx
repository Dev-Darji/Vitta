import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, ShieldAlert, Sliders, Save, RefreshCw, 
  LayoutDashboard, Users, Wallet, CreditCard, 
  FileText, BarChart3, Receipt, Settings, History, 
  Lock, Loader2, Globe, Terminal, Ghost
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUAC } from '@/lib/UACContext';

const DevMode = () => {
    const { config, updateConfig, fetchConfig } = useUAC();
    const [localFeatures, setLocalFeatures] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (config?.features) {
            setLocalFeatures(config.features);
            setLoading(false);
        }
    }, [config]);

    const handleToggle = (feature) => {
        setLocalFeatures(prev => ({
            ...prev,
            [feature]: !prev[feature]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const success = await updateConfig(localFeatures);
            if (success) {
                toast.success('Global System Configuration Synchronized', {
                    description: 'Changes will propagate to every user session instantly.',
                    icon: <ShieldAlert className="h-4 w-4 text-emerald-500" />
                });
            } else {
                toast.error('Synchronization Failed');
            }
        } catch {
            toast.error('Network Error during sync');
        } finally {
            setSaving(false);
        }
    };

    const featureDefinitions = [
        { key: 'dashboard', label: 'Financial Dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
        { key: 'clients', label: 'Client Management', icon: Users, color: 'bg-indigo-500' },
        { key: 'accounts', label: 'Vault / Accounts', icon: Wallet, color: 'bg-emerald-500' },
        { key: 'transactions', label: 'Transaction Ledger', icon: CreditCard, color: 'bg-amber-500' },
        { key: 'invoices', label: 'Smart Invoicing', icon: FileText, color: 'bg-purple-500' },
        { key: 'reports', label: 'Business Intelligence', icon: BarChart3, color: 'bg-rose-500' },
        { key: 'gst_reports', label: 'GST Compliance', icon: Receipt, color: 'bg-orange-500' },
        { key: 'automation', label: 'Automation Engine', icon: Zap, color: 'bg-yellow-500' },
        { key: 'audit_trail', label: 'Audit Intelligence', icon: History, color: 'bg-slate-500' },
        { key: 'settings', label: 'User Preferences', icon: Settings, color: 'bg-teal-500' },
    ];

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
            <Terminal className="h-10 w-10 text-slate-800 animate-pulse" />
            <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <motion.div key={i} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, delay: i*0.2 }} className="h-1 w-1 bg-slate-600 rounded-full" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-white pb-32">
            {/* Header / HUD */}
            <div className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-900/50 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                            <Ghost className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-tight uppercase italic underline decoration-indigo-500 transition-all hover:decoration-4">DEVMODE_COMMAND</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Global UAC Switchboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => fetchConfig()}
                            className="bg-transparent border-slate-800 hover:bg-slate-900 text-[10px] uppercase font-black"
                        >
                            <RefreshCw className="h-3 w-3 mr-2" /> Pull Config
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-white hover:bg-slate-200 text-slate-950 font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl shadow-xl shadow-white/5 active:scale-95 transition-all"
                        >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                            Sync Global State
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Warning Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex gap-5 items-start"
                >
                    <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldAlert className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1 italic">DANGER_ZONE</h3>
                        <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
                            Disabling a module from this switchboard will instantly hide it for 100% of the platform’s user population. 
                            New users, old users, and active sessions will be impacted immediately.
                        </p>
                    </div>
                </motion.div>

                {/* Switchboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featureDefinitions.map((feature, idx) => {
                        const Icon = feature.icon;
                        const isActive = localFeatures[feature.key];
                        
                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={feature.key}
                                className={`p-1.5 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-slate-900/30 border-slate-800' : 'bg-rose-950/5 border-rose-900/10'}`}
                            >
                                <div className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${isActive ? feature.color + ' shadow-lg shadow-black/20' : 'bg-slate-800/50'}`}>
                                            <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                                        </div>
                                        <div>
                                            <h4 className={`text-[12px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                                {feature.label}
                                            </h4>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                                                ID: {feature.key} — {isActive ? 'BROADCASTING' : 'OFFLINE'}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={isActive} 
                                        onCheckedChange={() => handleToggle(feature.key)}
                                        className={`${isActive ? 'data-[state=checked]:bg-emerald-500' : 'data-[state=unchecked]:bg-slate-800'}`}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Maintenance Actions */}
                <div className="mt-12 space-y-6">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] italic">Maintenance_Protocols</h3>
                        <div className="h-px bg-slate-900 w-24" />
                    </div>

                    <Card className="bg-slate-900/20 border-slate-800/50 rounded-3xl overflow-hidden group hover:border-indigo-500/30 transition-all">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                    <Zap className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black text-white uppercase tracking-tight">Generate Realistic Demo Data</CardTitle>
                                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Populate account with 6-month financial history</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-6">
                                This will create 3 realistic clients, 1 primary bank account, and 6 months of recurring transactions (Rent, Salary, Sales, Utilities). Perfect for stress-testing reports and visualizers.
                            </p>
                            <Button 
                                onClick={async () => {
                                    const id = toast.loading('Synchronizing temporal data streams...');
                                    try {
                                        await api.post('/dev/seed-data');
                                        toast.success('Simulation Complete', { id, description: '6 months of data generated successfully.' });
                                    } catch {
                                        toast.error('Simulation Failed', { id });
                                    }
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-indigo-500/10"
                            >
                                Trigger Seed Sequence
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                        <Lock className="h-3 w-3" /> SECURED_RECOVERY_KEY_ENABLED
                    </p>
                </div>
            </main>
        </div>
    );
};

export default DevMode;
