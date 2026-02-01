import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      toast.success('Profile updated successfully');
      fetchUser();
      
      // Update localStorage
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
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put('/user/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password updated successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="settings-page" className="max-w-3xl mx-auto space-y-6">
      <h2 className="font-heading font-bold text-2xl text-primary">Settings</h2>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="font-heading font-semibold text-lg text-primary mb-6">Profile Information</h3>
        <form data-testid="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              data-testid="profile-name-input"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-slate-50" />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <Label>Business Name</Label>
            <Input
              data-testid="profile-business-input"
              value={profileData.business_name}
              onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <Button data-testid="update-profile-button" type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </motion.div>

      {/* Password Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="font-heading font-semibold text-lg text-primary mb-6">Change Password</h3>
        <form data-testid="password-form" onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <Input
              data-testid="current-password-input"
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>New Password</Label>
            <Input
              data-testid="new-password-input"
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              data-testid="confirm-password-input"
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              required
            />
          </div>
          <Button data-testid="update-password-button" type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Settings;