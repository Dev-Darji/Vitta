import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Loader2, Save, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

  return (
    <div data-testid="settings-page" className="max-w-4xl space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium text-sm">Manage your account and security preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
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

        {/* Password Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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