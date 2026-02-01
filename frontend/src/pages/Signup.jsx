import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to terms and conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navbar />
      
      <div className="pt-20 flex min-h-[calc(100vh-0px)]">
        {/* Left Side - Image */}
        <div className="hidden lg:block flex-[0.45] bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(200,233,71,0.2)_0%,rgba(255,255,255,0)_70%)]" />
          <img
            src="https://images.unsplash.com/photo-1758608631036-7a2370684905?crop=entropy&cs=srgb&fm=jpg&q=85"
            alt="Office workspace"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-xs text-center">
              <div className="w-12 h-1.5 bg-accent rounded-full mb-8 mx-auto" />
              <h2 className="font-heading font-extrabold text-4xl text-white mb-6 leading-tight">Join the Financial Revolution.</h2>
              <p className="text-white/70 text-lg font-medium leading-relaxed">Experience the most intuitive accounting platform designed for the modern era.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-[0.55] flex items-center justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-2xl shadow-slate-200/50">
              <div className="mb-10 text-center lg:text-left">
                <h1 className="font-heading font-extrabold text-4xl text-primary mb-3">Get Started</h1>
                <p className="text-slate-500 font-medium">Create your free account in seconds.</p>
              </div>

              <form data-testid="signup-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                  <Input
                    data-testid="signup-name-input"
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all px-5"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                  <Input
                    data-testid="signup-email-input"
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all px-5"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                    <div className="relative">
                      <Input
                        data-testid="signup-password-input"
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all px-5"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-slate-400">Confirm</Label>
                    <div className="relative">
                      <Input
                        data-testid="signup-confirm-password-input"
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all px-5"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 py-2">
                  <div className="mt-1">
                    <Checkbox
                      data-testid="signup-terms-checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={setAgreedToTerms}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <label htmlFor="terms" className="text-[11px] text-slate-500 font-medium leading-tight">
                    By creating an account, I agree to the{' '}
                    <a href="#" className="text-primary font-bold hover:underline">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>
                  </label>
                </div>

                <Button
                  data-testid="signup-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Creating Account...' : 'Get Started Free'}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-black hover:text-primary/80 transition-colors">
                    Log in here
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Signup;