import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Trash2, CheckCircle2, AlertCircle, 
  Search, Wand2, Tag, ArrowRight, Loader2, Play, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Zap className="h-7 w-7 text-amber-500 fill-amber-500" />
            Automation Engine
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Smart Categorization & Fiscal Rules
          </p>
        </div>
        <Button 
          onClick={handleApplyBulk} 
          disabled={applying || rules.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 rounded-xl text-[13px] font-black shadow-xl shadow-indigo-100 flex items-center gap-2 group transition-all"
        >
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 group-hover:rotate-12 transition-transform" />}
          Apply to History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 items-start">
        {/* Left: Create Rule */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap className="h-32 w-32 rotate-12" />
            </div>
            
            <h3 className="text-[16px] font-black uppercase tracking-widest mb-6 relative z-10">Define New Rule</h3>
            
            <form onSubmit={handleAddRule} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Keyword Match</Label>
                <Input 
                  placeholder="e.g. Swiggy, Amazon, Rent" 
                  value={newRule.keyword}
                  onChange={(e) => setNewRule({...newRule, keyword: e.target.value})}
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Assign Category</Label>
                <Select value={newRule.category_id} onValueChange={(val) => setNewRule({...newRule, category_id: val})}>
                  <SelectTrigger className="bg-white/10 border-white/10 text-white h-11 rounded-xl">
                    <SelectValue placeholder="Select Target..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl shadow-2xl border-slate-100 p-1">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} className="rounded-lg py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 h-11 rounded-xl font-black text-[13px] uppercase tracking-widest mt-4">
                <Plus className="h-4 w-4 mr-2" /> Activate Rule
              </Button>
            </form>
          </div>

          <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-950 mb-1 leading-tight">Precision Hint</p>
              <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                Rules are case-insensitive. If a transaction description contains your keyword, the category will be auto-assigned instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Active Rules List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[460px]">
          <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-widest">Active Intelligence Rules</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">{rules.length} Active</span>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 text-slate-200 animate-spin" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading ruleset...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {rules.map((rule, idx) => {
                const category = categories.find(c => c.id === rule.category_id);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={rule.id} 
                    className={`px-6 py-4 flex items-center justify-between group border-b border-slate-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="bg-slate-100 rounded-lg h-9 px-3 flex items-center justify-center text-[13px] font-black text-slate-700 tracking-tight">
                        "{rule.keyword}"
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category?.color || '#cbd5e1' }} />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Maps to</span>
                        <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{category?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleDeleteRule(rule.id)}
                      variant="ghost" 
                      className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
              {rules.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
                  <Play className="h-10 w-10 text-slate-400 mb-4" />
                  <p className="text-[13px] font-medium text-slate-900 max-w-[200px]">Define your first rule to start the engine.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationRules;
