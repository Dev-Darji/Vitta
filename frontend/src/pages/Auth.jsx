import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Eye, EyeOff, ShieldCheck, Zap, Globe, Lock, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => { setIsLogin(location.pathname === '/login'); }, [location.pathname]);
  const handleToggle = () => navigate(isLogin ? '/signup' : '/login');

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Welcome back to Vitta!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.detail || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!agreedToTerms) { toast.error('Please agree to our terms'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name: formData.name, email: formData.email, password: formData.password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.detail || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const inputCls = "h-12 rounded-xl bg-[#F6F6F3] border-slate-200 focus:bg-white focus:border-[#0B2B1C]/20 focus:ring-2 focus:ring-[#0B2B1C]/5 transition-all px-4 text-slate-700 placeholder:text-slate-300 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed";
  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block";

  return (
    <div className="min-h-screen bg-[#F0F0ED] flex flex-col">
      <style>{FONT_STYLE}</style>
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="absolute top-28 left-[5%] w-[30%] h-[45%] bg-[#0B2B1C]/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 right-[5%] w-[25%] h-[40%] bg-[#B2D71E]/[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl min-h-[640px] bg-white rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(11,43,28,0.12)] border border-slate-100/80 flex overflow-hidden relative">

          {/* Sliding panel */}
          <motion.div
            className="absolute top-0 bottom-0 z-20 hidden lg:flex bg-[#0B2B1C] overflow-hidden"
            animate={{ width: '42%', left: isLogin ? '58%' : '0%', transition: { type: 'spring', stiffness: 65, damping: 18 } }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(178,215,30,0.18)_0%,transparent_65%)]" />
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <motion.img
              src="https://images.unsplash.com/photo-1758608631036-7a2370684905?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt=""
              className="w-full h-full object-cover opacity-15 mix-blend-overlay absolute inset-0"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-10 py-14 text-center text-white w-full">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div key="login-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="max-w-[220px]">
                    <div className="w-10 h-[3px] bg-[#B2D71E] rounded-full mx-auto mb-7" />
                    <h2 className="font-sora font-bold text-[30px] text-white mb-3 tracking-[-0.02em] leading-tight">Elite Financial Intelligence.</h2>
                    <p className="text-white/45 text-[13px] leading-relaxed mb-9">The global standard for modern financial management.</p>
                    <div className="grid grid-cols-3 gap-3 pt-7 border-t border-white/[0.08]">
                      {[['2K+','Clients'],['99%','Accuracy'],['100%','Secure']].map(([v,l])=>(
                        <div key={l} className="text-center">
                          <p className="font-sora font-bold text-[18px] text-[#B2D71E]">{v}</p>
                          <p className="text-white/30 text-[8px] font-semibold uppercase tracking-widest mt-0.5">{l}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="signup-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="max-w-[220px]">
                    <div className="w-10 h-[3px] bg-[#B2D71E] rounded-full mx-auto mb-7" />
                    <h2 className="font-sora font-bold text-[30px] text-white mb-3 tracking-[-0.02em] leading-tight">Modern Finances.</h2>
                    <p className="text-white/45 text-[13px] leading-relaxed mb-9">A faster, more intelligent way to handle your bank statements.</p>
                    <div className="flex items-center justify-center gap-3 pt-7 border-t border-white/[0.08]">
                      {[ShieldCheck, Zap, Globe, Lock].map((Icon, j) => (
                        <div key={j} className="w-8 h-8 rounded-xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-white/45" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Form area */}
          <div className="flex-1 flex overflow-hidden relative">

            {/* Login form */}
            <motion.div className="w-full lg:w-[58%] h-full flex items-center justify-center p-8 lg:p-12 absolute lg:relative z-10 bg-white"
              animate={{ x: isLogin ? '0%' : '-105%', opacity: isLogin ? 1 : 0, filter: isLogin ? 'blur(0px)' : 'blur(5px)', scale: isLogin ? 1 : 0.97 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
              <div className="w-full max-w-[300px]">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-[#0B2B1C]/5 border border-[#0B2B1C]/8 rounded-full px-3 py-1.5 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B2D71E]" />
                    <span className="text-[#0B2B1C] text-[9px] font-bold uppercase tracking-widest">Secure Login</span>
                  </div>
                  <h1 className="font-sora font-bold text-[28px] text-[#0B2B1C] mb-1.5 tracking-[-0.02em]">Welcome back.</h1>
                  <p className="text-slate-400 text-[13px]">Access your financial headquarters.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div><Label className={labelCls}>Email address</Label><Input type="email" required disabled={loading} value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className={inputCls} placeholder="name@company.com" /></div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label className={labelCls} style={{marginBottom:0}}>Password</Label>
                      <Link to="/forgot-password" tabIndex={loading ? -1 : 0} className={`text-[9px] text-slate-400 hover:text-[#0B2B1C] transition-colors font-medium ${loading ? 'opacity-50 pointer-events-none' : ''}`}>Forgot?</Link>
                    </div>
                    <div className="relative">
                      <Input type={showPassword?'text':'password'} required disabled={loading} value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} className={inputCls} placeholder="••••••••" />
                      <button type="button" disabled={loading} onClick={()=>setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors disabled:opacity-50 disabled:pointer-events-none">{showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white rounded-xl font-semibold text-[13px] shadow-md shadow-[#0B2B1C]/15 transition-all gap-2 mt-1">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4"/></>}
                  </Button>
                </form>
                <p className="mt-6 pt-5 border-t border-slate-50 text-[13px] text-slate-400 text-center">
                  New to Vitta?{' '}<button onClick={handleToggle} disabled={loading} className="text-[#0B2B1C] font-semibold hover:opacity-70 transition-opacity disabled:opacity-50 disabled:pointer-events-none">Create a free account</button>
                </p>
              </div>
            </motion.div>

            {/* Signup form */}
            <motion.div className="w-full lg:w-[58%] h-full flex items-center justify-center p-8 lg:p-12 absolute lg:absolute z-10 right-0 bg-white"
              animate={{ x: !isLogin ? '0%' : '105%', opacity: !isLogin ? 1 : 0, filter: !isLogin ? 'blur(0px)' : 'blur(5px)', scale: !isLogin ? 1 : 0.97 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
              <div className="w-full max-w-[300px]">
                <div className="mb-7">
                  <div className="inline-flex items-center gap-2 bg-[#B2D71E]/15 border border-[#B2D71E]/20 rounded-full px-3 py-1.5 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B2D71E]" />
                    <span className="text-[#0B2B1C] text-[9px] font-bold uppercase tracking-widest">Free forever</span>
                  </div>
                  <h1 className="font-sora font-bold text-[28px] text-[#0B2B1C] mb-1.5 tracking-[-0.02em]">Get started.</h1>
                  <p className="text-slate-400 text-[13px]">Join 2,000+ businesses growing with Vitta.</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-3.5">
                  <div><Label className={labelCls}>Full name</Label><Input type="text" required disabled={loading} value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inputCls} placeholder="John Doe" /></div>
                  <div><Label className={labelCls}>Business email</Label><Input type="email" required disabled={loading} value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className={inputCls} placeholder="name@company.com" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={labelCls}>Password</Label>
                      <div className="relative"><Input type={showPassword?'text':'password'} required disabled={loading} value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} className={inputCls} placeholder="••••••••" /><button type="button" disabled={loading} onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors disabled:opacity-50 disabled:pointer-events-none">{showPassword?<EyeOff className="h-3.5 w-3.5"/>:<Eye className="h-3.5 w-3.5"/>}</button></div>
                    </div>
                    <div>
                      <Label className={labelCls}>Confirm</Label>
                      <div className="relative"><Input type={showConfirm?'text':'password'} required disabled={loading} value={formData.confirmPassword} onChange={e=>setFormData({...formData,confirmPassword:e.target.value})} className={inputCls} placeholder="••••••••" /><button type="button" disabled={loading} onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors disabled:opacity-50 disabled:pointer-events-none">{showConfirm?<EyeOff className="h-3.5 w-3.5"/>:<Eye className="h-3.5 w-3.5"/>}</button></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 py-1">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} disabled={loading} className="mt-0.5 rounded border-slate-300 data-[state=checked]:bg-[#0B2B1C] data-[state=checked]:border-[#0B2B1C] disabled:opacity-50 disabled:cursor-not-allowed" />
                    <label htmlFor="terms" className={`text-[11px] leading-relaxed cursor-pointer select-none ${loading ? 'opacity-50 pointer-events-none' : 'text-slate-400'}`}>
                      I agree to the <a href="#" className="text-[#0B2B1C] hover:underline font-semibold">Terms</a> and <a href="#" className="text-[#0B2B1C] hover:underline font-semibold">Privacy Policy</a>
                    </label>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white rounded-xl font-semibold text-[13px] shadow-md shadow-[#0B2B1C]/15 gap-2 transition-all">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating…</> : <>Create account <ArrowRight className="h-4 w-4"/></>}
                  </Button>
                </form>
                <p className="mt-5 pt-5 border-t border-slate-50 text-[13px] text-slate-400 text-center">
                  Already have an account?{' '}<button onClick={handleToggle} disabled={loading} className="text-[#0B2B1C] font-semibold hover:opacity-70 transition-opacity disabled:opacity-50 disabled:pointer-events-none">Sign in here</button>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;