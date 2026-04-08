import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Trash2, CheckCircle2, AlertCircle, 
  Search, Wand2, Tag, ArrowRight, Loader2, Play, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

const AutomationRules = () => {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  
  // New Rule Form State
  const [newRule, setNewRule] = useState({
    keyword: '',
    category_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, catsRes] = await Promise.all([
        api.get('/automation-rules'),
        api.get('/categories')
      ]);
      setRules(rulesRes.data);
      setCategories(catsRes.data);
    } catch {
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.keyword || !newRule.category_id) {
      return toast.error('Please provide both keyword and category');
    }

    try {
      await api.post('/automation-rules', newRule);
      toast.success('Automation rule created');
      setNewRule({ keyword: '', category_id: '' });
      fetchData();
    } catch {
      toast.error('Failed to create rule');
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await api.delete(`/automation-rules/${id}`);
      toast.success('Rule removed');
      fetchData();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const handleApplyBulk = async () => {
    setApplying(true);
    try {
      const res = await api.post('/automation-rules/apply-bulk');
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to apply rules to past transactions');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 max-w-6xl mx-auto px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap');
        .automation-root { font-family: 'DM Sans', sans-serif; }
      `}</style>
      
      <div className="automation-root space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Zap className="h-5 w-5 text-white fill-white/20" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Engine</h1>
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 ml-13">Automated Fiscal Categorization</p>
          </div>
          
          <Button 
            onClick={handleApplyBulk} 
            disabled={applying || rules.length === 0}
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 h-11 px-6 rounded-2xl text-[12px] font-black shadow-sm flex items-center gap-2.5 group transition-all active:scale-95"
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-indigo-500 group-hover:rotate-12 transition-transform" />}
            Sync Active Rules to History
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Create Rule Form */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Zap className="h-48 w-48 rotate-12" />
              </div>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100/50">
                  <Plus className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">Configure Rule</h3>
              </div>
              
              <form onSubmit={handleAddRule} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condition: Keyword Match</Label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                    <Input 
                      placeholder="e.g. Swiggy, Amazon, Uber" 
                      value={newRule.keyword}
                      onChange={(e) => setNewRule({...newRule, keyword: e.target.value})}
                      className="bg-slate-50 border-slate-100 text-slate-900 font-bold placeholder:text-slate-300 h-12 pl-11 rounded-2xl focus:bg-white focus:border-indigo-500/30 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Effect: Auto-Assign Category</Label>
                  <Select value={newRule.category_id} onValueChange={(val) => setNewRule({...newRule, category_id: val})}>
                    <SelectTrigger className="bg-slate-50 border-slate-100 text-slate-900 font-bold h-12 rounded-2xl focus:bg-white focus:border-indigo-500/30">
                      <div className="flex items-center gap-2">
                        {newRule.category_id ? <Tag className="h-4 w-4 text-slate-400" /> : <div className="h-4 w-4 rounded-full border border-dashed border-slate-300" />}
                        <SelectValue placeholder="Select Destination..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl shadow-2xl border-slate-100 p-2 max-h-[300px]">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-xl py-3 px-4 focus:bg-slate-50 cursor-pointer mb-1 last:mb-0">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                            <span className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full bg-slate-900 hover:bg-black text-white h-12 rounded-2xl font-black text-[12px] uppercase tracking-widest mt-4 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]">
                  Deploy Intelligence Rule
                </Button>
              </form>
            </div>

            <div className="bg-indigo-50/40 rounded-3xl p-6 border border-indigo-100/50 flex gap-4 items-start backdrop-blur-sm">
              <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Info className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-[13px] font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight">Global Engine Hint</p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Rules are processed in sequence. Use atomic keywords (e.g., "ZOMATO") for maximum categorization accuracy across all ledger accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Active Rules List */}
          <div className="lg:col-span-12 xl:col-span-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 overflow-hidden flex flex-col min-h-[560px]">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="space-y-0.5">
                <h3 className="text-[14px] font-black text-slate-950 uppercase tracking-widest">Active Intelligence Suite</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Production Ruleset</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] uppercase px-3 py-1">{rules.length} Rules Online</Badge>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 border-2 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Evaluating Ledger Logic...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {rules.map((rule, idx) => {
                    const category = categories.find(c => c.id === rule.category_id);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={rule.id} 
                        className={`px-8 py-6 flex items-center justify-between group border-b border-slate-50 transition-all hover:bg-slate-50/40`}
                      >
                        <div className="flex items-center gap-8">
                          <div className="relative">
                            <div className="text-[14px] font-bold text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm min-w-[120px] text-center">
                              {rule.keyword}
                            </div>
                            <div className="absolute -top-2 -left-2 h-4 w-4 bg-indigo-500 text-white flex items-center justify-center rounded-full text-[8px] font-black border-2 border-white">
                              IF
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1">
                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[8px] font-black text-slate-300 uppercase">Map</span>
                          </div>

                          <div className="flex items-center gap-4 bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-slate-100">
                             <div className="h-4 w-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.05)]" style={{ backgroundColor: category?.color || '#cbd5e1' }} />
                             <div className="flex flex-col">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Set Category</span>
                               <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none">{category?.name || 'Uncategorized'}</span>
                             </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleDeleteRule(rule.id)}
                          variant="ghost" 
                          className="h-10 w-10 p-0 rounded-2xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {rules.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                    <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 border-dashed">
                      <Zap className="h-8 w-8 text-slate-200" />
                    </div>
                    <h4 className="text-[17px] font-black text-slate-900 mb-2">No active intelligence rules</h4>
                    <p className="text-[13px] font-medium text-slate-400 max-w-[280px]">Your categorization is currently manual. Define a rule to start automating your ledger.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationRules;
