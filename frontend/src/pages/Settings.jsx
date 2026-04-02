import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Shield, Loader2, Save, Key, Download, Upload, 
  Database, FileSpreadsheet, AlertTriangle, FileJson, RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  RadioGroup, RadioGroupItem 
} from '@/components/ui/radio-group';
import { toast } from 'sonner';
import api from '@/lib/api';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    business_name: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState('merge');
  const [restoreFile, setRestoreFile] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setProfileData({
        name: response.data.name || '',
        business_name: response.data.business_name || '',
      });
    } catch (error) {
      toast.error('Failed to load user data');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/user/profile', profileData);
      toast.success('Profile updated');
      fetchUser();
      
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('At least 6 characters required');
      return;
    }

    setLoading(true);

    try {
      await api.put('/user/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password updated');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // --- DATA MANAGEMENT HANDLERS ---

  const handleExportAll = async () => {
    toast.info('Preparing backup file...');
    try {
      const response = await api.get('/export/all', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitta_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch {
      toast.error('Failed to generate backup');
    }
  };

  const handleExportTransactions = async (format) => {
    toast.info(`Generating ${format.toUpperCase()} export...`);
    try {
      const response = await api.get(`/export/transactions?format=${format}`, { responseType: 'blob' });
      const ext = format === 'excel' ? 'xlsx' : 'csv';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitta_transactions_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch {
      toast.error('Failed to export transactions');
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      toast.error('Please select a JSON backup file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', restoreFile);

    try {
      const res = await api.post(`/import/restore?mode=${restoreMode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      setIsRestoreOpen(false);
      setRestoreFile(null);
      // Optional: reload page to refresh all context
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Restore failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="settings-page" className="max-w-4xl space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium text-sm">Manage your account and security preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Profile Identity</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update your personal details</p>
            </div>
          </div>

          <form data-testid="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</Label>
              <Input
                data-testid="profile-name-input"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                className="rounded-lg border-slate-100 bg-slate-50 h-10 font-bold text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</Label>
              <Input value={user?.email || ''} disabled className="bg-slate-100/50 text-slate-400 border-none h-10 font-bold text-xs cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Name</Label>
              <Input
                data-testid="profile-business-input"
                value={profileData.business_name}
                onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                placeholder="Tax ID or Business Title"
                className="rounded-lg border-slate-100 bg-slate-50 h-10 font-bold text-xs"
              />
            </div>
            <Button data-testid="update-profile-button" type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md mt-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile Changes'}
            </Button>
          </form>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Data Stewardship</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage backups and continuity</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Download className="h-3 w-3 text-indigo-500" /> Export Assets
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={handleExportAll} variant="outline" className="justify-start gap-3 h-11 border-slate-100 font-bold text-[11px] uppercase tracking-tight hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  <FileJson className="h-4 w-4" /> Full System Backup (.json)
                </Button>
                <div className="flex gap-2">
                  <Button onClick={() => handleExportTransactions('excel')} variant="outline" className="flex-1 justify-start gap-3 h-11 border-slate-100 font-bold text-[11px] uppercase tracking-tight hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                    <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
                  </Button>
                  <Button onClick={() => handleExportTransactions('csv')} variant="outline" className="flex-1 justify-start gap-3 h-11 border-slate-100 font-bold text-[11px] uppercase tracking-tight hover:bg-blue-50 hover:text-blue-600 transition-all">
                    <FileSpreadsheet className="h-4 w-4" /> CSV (.csv)
                  </Button>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Backup includes all clients, invoices, accounts, and audit trails.</p>
            </div>

            <Separator className="bg-slate-50" />

            <div className="space-y-4 pt-2">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Upload className="h-3 w-3 text-rose-500" /> Restore System
              </h4>
              
              <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-11 border-dashed border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-widest hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/30 transition-all">
                    <RefreshCcw className="h-4 w-4 mr-2" /> Initiate Recovery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-rose-600" />
                      Restore From Backup
                    </DialogTitle>
                    <DialogDescription className="text-[13px] font-medium text-slate-500 leading-relaxed pt-2">
                      Recover your entire fiscal ecosystem from a previous Vitta JSON backup. 
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Restoration Mode</Label>
                      <RadioGroup value={restoreMode} onValueChange={setRestoreMode} className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border transition-all cursor-pointer ${restoreMode === 'merge' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 opacity-60'}`} onClick={() => setRestoreMode('merge')}>
                          <RadioGroupItem value="merge" id="merge" className="sr-only" />
                          <Label htmlFor="merge" className="font-black text-[12px] text-slate-900 block mb-1">Merge</Label>
                          <p className="text-[9px] text-slate-500 font-medium">Keep existing + add new records</p>
                        </div>
                        <div className={`p-4 rounded-xl border transition-all cursor-pointer ${restoreMode === 'replace' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 bg-slate-50 opacity-60'}`} onClick={() => setRestoreMode('replace')}>
                          <RadioGroupItem value="replace" id="replace" className="sr-only" />
                          <Label htmlFor="replace" className="font-black text-[12px] text-rose-600 block mb-1">Replace</Label>
                          <p className="text-[9px] text-rose-500 font-medium leading-tight">Wipe EVERYTHING then import</p>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select JSON File</Label>
                      <div className="relative group">
                        <Input 
                          type="file" 
                          accept=".json"
                          onChange={(e) => setRestoreFile(e.target.files[0])}
                          className="h-12 pt-3 pb-3 file:hidden border-slate-100 bg-slate-50 text-[11px] font-bold group-hover:border-slate-200 transition-colors"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                          <FileJson className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    {restoreMode === 'replace' && (
                      <div className="p-3 bg-rose-600 rounded-xl text-white flex items-start gap-3 shadow-lg shadow-rose-100">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p className="text-[10px] font-black leading-normal uppercase tracking-wide">CAUTION: This will permanently purge your entire current database. This action is irreversible.</p>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={() => setIsRestoreOpen(false)} className="rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-400">Cancel</Button>
                    <Button 
                      onClick={handleRestore} 
                      disabled={loading || !restoreFile}
                      className={`h-11 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all ${restoreMode === 'replace' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-black'}`}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Restoration'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Password Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Security</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reset your access password</p>
            </div>
          </div>

          <form data-testid="password-form" onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Password</Label>
              <Input
                data-testid="current-password-input"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                required
                className="rounded-lg border-slate-100 bg-slate-50 h-10 font-bold text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</Label>
              <Input
                data-testid="new-password-input"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                className="rounded-lg border-slate-100 bg-slate-50 h-10 font-bold text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm New Password</Label>
              <Input
                data-testid="confirm-password-input"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
                className="rounded-lg border-slate-100 bg-slate-50 h-10 font-bold text-xs"
              />
            </div>
            <Button data-testid="update-password-button" type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md mt-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Access Keys'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;