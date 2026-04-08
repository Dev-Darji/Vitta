import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import ConfirmPopup from '@/components/ConfirmPopup';

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

const scheduleIIIHeads = {
  income: ["Revenue from Operations", "Other Income"],
  expense: ["Cost of Materials", "Employee Benefits", "Finance Costs", "Depreciation", "Other Expenses"]
};

/* ─── Category Row ───────────────────────────────────────────────────────── */
const CategoryRow = ({ category, onDelete, onEdit, delay }) => (
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
      <div className="flex flex-col">
        <span className="text-[13.5px] font-medium text-slate-800">{category.name}</span>
        {category.schedule_iii_head && (
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{category.schedule_iii_head}</span>
        )}
      </div>
    </div>

    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => onEdit(category)}
        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onDelete(category.id)}
        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  </motion.div>
);

/* ─── Section Block ──────────────────────────────────────────────────────── */
const CategorySection = ({ title, dot, categories, onDelete, onEdit, emptyText }) => (
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
            <CategoryRow key={cat.id} category={cat} onDelete={onDelete} onEdit={onEdit} delay={i * 0.03} />
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', color: '#6366f1', schedule_iii_head: 'Other Expenses' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      setSubmitting(true);
      await api.post('/categories', newCategory);
      toast.success('Category created');
      setIsOpen(false);
      setNewCategory({ name: '', type: 'expense', color: '#6366f1', schedule_iii_head: 'Other Expenses' });
      fetchCategories();
    } catch { toast.error('Failed to create category'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory.name.trim()) return;
    try {
      setSubmitting(true);
      await api.put(`/categories/${editingCategory.id}`, editingCategory);
      toast.success('Category updated');
      setIsEditOpen(false);
      fetchCategories();
    } catch { toast.error('Failed to update category'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteCategory = (id) => {
    setCategoryIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/categories/${categoryIdToDelete}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeleteConfirmOpen(false);
      setCategoryIdToDelete(null);
    }
  };

  const openEdit = (cat) => {
    setEditingCategory({ ...cat });
    setIsEditOpen(true);
  };

  const incomeCategories  = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div data-categories data-testid="categories-page" className="space-y-6 pb-20">
      <FontStyle />

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Categories Management</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Classification of Income & Expense Categories</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-category-button"
              className="bg-slate-900 hover:bg-black text-white h-9 px-6 rounded-lg text-[13px] font-bold shadow-lg shadow-slate-200 flex items-center gap-2">
              <Plus className="h-4 w-4" />Add Category
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[380px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-slate-100">
              <DialogHeader>
                <DialogTitle className="text-[17px] font-bold text-slate-900">New Category</DialogTitle>
                <p className="text-[11.5px] text-slate-400 mt-0.5">Create a category for classifying transactions.</p>
              </DialogHeader>
            </div>

            <form onSubmit={handleCreateCategory} className="px-6 py-5 space-y-4">
              <div>
                <FieldLabel>Category Name</FieldLabel>
                <Input
                  data-testid="category-name-input"
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
                  <Select value={newCategory.type} onValueChange={v => setNewCategory({ ...newCategory, type: v, schedule_iii_head: scheduleIIIHeads[v][0] })}>
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

              <div>
                <FieldLabel>Schedule III Classification</FieldLabel>
                <Select value={newCategory.schedule_iii_head} onValueChange={v => setNewCategory({ ...newCategory, schedule_iii_head: v })}>
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    {scheduleIIIHeads[newCategory.type].map(head => (
                      <SelectItem key={head} value={head} className="text-[13px]">{head}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}
                  className="h-9 px-5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100">
                  Cancel
                </Button>
                <Button data-testid="create-category-submit" type="submit" disabled={submitting}
                  className="h-9 px-6 rounded-lg bg-primary text-white text-[13px] font-semibold shadow-sm">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Category'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editingCategory && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[380px] rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="px-6 py-5 border-b border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-[17px] font-bold text-slate-900">Edit Category</DialogTitle>
                </DialogHeader>
              </div>

              <form onSubmit={handleUpdateCategory} className="px-6 py-5 space-y-4">
                <div>
                  <FieldLabel>Category Name</FieldLabel>
                  <Input
                    value={editingCategory.name}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    required
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Type</FieldLabel>
                    <Select value={editingCategory.type} onValueChange={v => setEditingCategory({ ...editingCategory, type: v, schedule_iii_head: scheduleIIIHeads[v][0] })}>
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
                    <div className="flex items-center gap-2.5 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="color"
                        value={editingCategory.color}
                        onChange={e => setEditingCategory({ ...editingCategory, color: e.target.value })}
                        className="w-5 h-5 rounded border-none bg-transparent cursor-pointer"
                      />
                      <span className="text-[11.5px] font-medium text-slate-500 uppercase">
                        {editingCategory.color}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel>Schedule III Classification</FieldLabel>
                  <Select value={editingCategory.schedule_iii_head} onValueChange={v => setEditingCategory({ ...editingCategory, schedule_iii_head: v })}>
                    <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[13px] font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {scheduleIIIHeads[editingCategory.type].map(head => (
                        <SelectItem key={head} value={head} className="text-[13px]">{head}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}
                    className="h-9 px-5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}
                    className="h-9 px-6 rounded-lg bg-primary text-white text-[13px] font-semibold">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-7 w-7 text-primary/30 animate-spin" />
        </div>
      ) : (
        <>
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
              title="Income Categories"
              dot="bg-emerald-400"
              categories={incomeCategories}
              onDelete={handleDeleteCategory}
              onEdit={openEdit}
              emptyText="No income categories yet"
            />
            <CategorySection
              title="Expense Categories"
              dot="bg-rose-400"
              categories={expenseCategories}
              onDelete={handleDeleteCategory}
              onEdit={openEdit}
              emptyText="No expense categories yet"
            />
          </div>
        </>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      <ConfirmPopup
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? All associated data classification will be removed. This action cannot be undone."
        confirmText="Yes, Delete Category"
        cancelText="Keep Category"
      />
    </div>
  );
};

export default Categories;