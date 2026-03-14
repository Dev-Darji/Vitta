import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmPopup = ({ open, onClose, onConfirm, title, description, confirmText = 'Discard and Move', cancelText = 'Stay on Page' }) => {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-0 rounded-[32px] bg-white shadow-2xl">
        <div className="p-8">
          <div className="mb-6">
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shadow-amber-50">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          
          <DialogHeader className="text-left space-y-2 mb-8">
            <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">
              {title || 'Unsaved Changes'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-base leading-relaxed">
              {description || 'You have unsaved data on this stage. Moving now will clear all progress. Are you sure?'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-6 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all h-auto order-2 sm:order-1"
            >
              {cancelText}
            </Button>
            <Button
              variant="default"
              onClick={onConfirm}
              className="flex-1 py-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-200 transition-all h-auto order-1 sm:order-2"
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmPopup;
