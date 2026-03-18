import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

/* ─── Font ─────────────────────────────────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    [data-categories] { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

/* ─── Field Label ────────────────────────────────────────────────────────── */
const FieldLabel = ({ children }) => (
  <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
    {children}
  </Label>
);

/* ─── Category Row ───────────────────────────────────────────────────────── */
const CategoryRow = ({ category, onDelete, delay }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -8 }}
    transition={{ duration: 0.18, delay }}
    className="group flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
  >
    <div className="flex items-center gap-3">
      {/* Color swatch */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${category.color}18` }}
      >
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
      </div>
      <span className="text-[13.5px] font-medium text-slate-800">{category.name}</span>
    </div>

    <button
      onClick={() => onDelete(category.id)}
      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  </motion.div>
);

/* ─── Section Block ──────────────────────────────────────────────────────── */
const CategorySection = ({ title, dot, categories, onDelete, emptyText }) => (
  <div className="space-y-3">
    {/* Section header */}
    <div className="flex items-center gap-2 px-1">
      <div className={`h-2 w-2 rounded-full ${dot}`} />
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
      <span className="ml-auto text-[11px] font-medium text-slate-400">{categories.length}</span>
    </div>

    {/* Items */}
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {categories.length > 0 ? (
          categories.map((cat, i) => (
            <CategoryRow key={cat.id} category={cat} onDelete={onDelete} delay={i * 0.03} />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center"
          >
            <p className="text-[12px] font-medium text-slate-400">{emptyText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', color: '#6366f1' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      setSubmitting(true);
      await api.post('/categories', newCategory);
      toast.success('Group created');
      setIsOpen(false);
      setNewCategory({ name: '', type: 'expense', color: '#6366f1' });
      fetchCategories();
    } catch { toast.error('Failed to create group'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Group deleted'); fetchCategories(); }
    catch { toast.error('Failed to delete group'); }
  };

  const incomeCategories  = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div data-categories data-testid="groups-page" className="space-y-6 pb-20">
      <FontStyle />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[3px] h-5 bg-slate-800 rounded-full" />
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">Groups</h1>
          </div>
          <p className="text-[12px] text-slate-400 font-medium ml-[18px]">Organise transactions into income and expense categories.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-group-button"
              className="bg-slate-900 hover:bg-black text-white h-9 px-5 rounded-lg text-[13px] font-semibold shadow-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />Add Group
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[380px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-slate-100">
              <DialogHeader>
                <DialogTitle className="text-[17px] font-bold text-slate-900">New Group</DialogTitle>
                <p className="text-[11.5px] text-slate-400 mt-0.5">Create a category for classifying transactions.</p>
              </DialogHeader>
            </div>

            <form onSubmit={handleCreateCategory} className="px-6 py-5 space-y-4">
              <div>
                <FieldLabel>Group Name</FieldLabel>
                <Input
                  data-testid="group-name-input"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                  placeholder="e.g. Marketing, Salary, Rent"
                  className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <Select value={newCategory.type} onValueChange={v => setNewCategory({ ...newCategory, type: v })}>
                    <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      <SelectItem value="income"  className="text-[13px]">Income</SelectItem>
                      <SelectItem value="expense" className="text-[13px]">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FieldLabel>Colour</FieldLabel>
                  <div className="flex items-center gap-2.5 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 transition-colors">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-5 h-5 rounded border-none bg-transparent cursor-pointer"
                    />
                    <span className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wider">
                      {newCategory.color}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview swatch */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${newCategory.color}18` }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: newCategory.color }} />
                </div>
                <span className="text-[12.5px] font-medium text-slate-700">{newCategory.name || 'Preview'}</span>
                <span className={`ml-auto text-[10.5px] font-medium px-2 py-0.5 rounded-md ${newCategory.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                  {newCategory.type}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}
                  className="h-9 px-5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100">
                  Cancel
                </Button>
                <Button data-testid="create-group-submit" type="submit" disabled={submitting}
                  className="h-9 px-6 rounded-lg bg-primary text-white text-[13px] font-semibold shadow-sm">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Group'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-7 w-7 text-primary/30 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-xl border border-slate-100 shadow-sm w-fit">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[12px] font-medium text-slate-600">{incomeCategories.length} income</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="text-[12px] font-medium text-slate-600">{expenseCategories.length} expense</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <span className="text-[12px] font-medium text-slate-400">{categories.length} total</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategorySection
              title="Income Groups"
              dot="bg-emerald-400"
              categories={incomeCategories}
              onDelete={handleDeleteCategory}
              emptyText="No income groups yet"
            />
            <CategorySection
              title="Expense Groups"
              dot="bg-rose-400"
              categories={expenseCategories}
              onDelete={handleDeleteCategory}
              emptyText="No expense groups yet"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Categories;