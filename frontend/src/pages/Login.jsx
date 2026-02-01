import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navbar />
      
      <div className="pt-20 flex min-h-[calc(100vh-0px)]">
        {/* Left Side - Form */}
        <div className="flex-[0.55] flex items-center justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-2xl shadow-slate-200/50">
              <div className="mb-10 text-center lg:text-left">
                <h1 className="font-heading font-extrabold text-4xl text-primary mb-3">Welcome Back</h1>
                <p className="text-slate-500 font-medium">Simplify your business finances today.</p>
              </div>

              <form data-testid="login-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                  <Input
                    data-testid="login-email-input"
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all px-6"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                    <Link to="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary/50 hover:text-primary transition-colors">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      data-testid="login-password-input"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all px-6"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  data-testid="login-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  New to Vitta?{' '}
                  <Link to="/signup" className="text-primary font-black hover:text-primary/80 transition-colors">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block flex-[0.45] bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(200,233,71,0.2)_0%,rgba(255,255,255,0)_70%)]" />
          <img
            src="https://images.unsplash.com/photo-1758608631036-7a2370684905?crop=entropy&cs=srgb&fm=jpg&q=85"
            alt="Office workspace"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-xs text-center">
              <div className="w-12 h-1.5 bg-accent rounded-full mb-8 mx-auto" />
              <h2 className="font-heading font-extrabold text-4xl text-white mb-6 leading-tight">Elite Financial Intelligence.</h2>
              <p className="text-white/70 text-lg font-medium leading-relaxed">Join 2,000+ modern businesses transforming their bank statements into growth engines.</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;