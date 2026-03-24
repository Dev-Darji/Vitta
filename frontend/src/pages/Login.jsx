import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

// ── tiny helpers ──────────────────────────────────────────────
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function FieldWrapper({ label, error, success, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
        {hint && <span className="text-[10px] text-slate-300">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />{error}
        </p>
      )}
      {success && !error && (
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />{success}
        </p>
      )}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, disabled, autoComplete, id, testId }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        data-testid={testId}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-[#0B2B1C]/25 focus:ring-2 focus:ring-[#0B2B1C]/5 transition-all px-4 text-slate-700 placeholder:text-slate-300 text-[13px] pr-11 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setShow(s => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors disabled:pointer-events-none"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Input class helpers ───────────────────────────────────────
const inputCls = (hasError) =>
  `h-12 rounded-xl bg-slate-50 border transition-all px-4 text-slate-700 placeholder:text-slate-300 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:bg-white ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-[#0B2B1C]/25 focus:ring-[#0B2B1C]/5'
  }`;

// ─────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formData, setFormData] = useState({ email: '', password: '' });

  const errors = {
    email: touched.email && !validateEmail(formData.email) ? 'Enter a valid email address' : '',
    password: touched.password && formData.password.length < 6 ? 'Password must be at least 6 characters' : '',
  };

  const isValid = validateEmail(formData.email) && formData.password.length >= 6;

  const blur = (field) => setTouched(t => ({ ...t, [field]: true }));
  const set = (field) => (e) => setFormData(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark all touched on submit attempt
    setTouched({ email: true, password: true });
    if (!isValid) return;

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
    <div className="min-h-screen bg-[#F6F6F3]">
      <style>{FONT_STYLE}</style>
      <Navbar />

      <div className="pt-20 flex min-h-[calc(100vh-0px)]">
        {/* Form side */}
        <div className="flex-[0.55] flex items-center justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px]"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-[#0B2B1C]/5 border border-[#0B2B1C]/8 rounded-full px-3 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B2D71E]" />
                <span className="text-[#0B2B1C] text-[9px] font-bold uppercase tracking-widest">Secure Login</span>
              </div>
              <h1 className="font-sora font-bold text-[28px] text-[#0B2B1C] mb-1.5 tracking-[-0.02em]">Welcome back.</h1>
              <p className="text-slate-400 text-[13px]">Sign in to your Vitta account.</p>
            </div>

            <form data-testid="login-form" onSubmit={handleSubmit} noValidate className={`space-y-4 ${loading ? 'pointer-events-none select-none' : ''}`}>

              {/* Email */}
              <FieldWrapper label="Email address" error={errors.email}>
                <Input
                  data-testid="login-email-input"
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  value={formData.email}
                  onChange={set('email')}
                  onBlur={() => blur('email')}
                  autoComplete="email"
                  placeholder="name@company.com"
                  className={inputCls(!!errors.email)}
                />
              </FieldWrapper>

              {/* Password */}
              <FieldWrapper
                label="Password"
                error={errors.password}
                hint={<Link to="/forgot-password" tabIndex={loading ? -1 : 0} className={`text-[10px] text-slate-400 hover:text-[#0B2B1C] transition-colors font-medium ${loading ? 'opacity-50 pointer-events-none' : ''}`}>Forgot password?</Link>}
              >
                <PasswordInput
                  id="password"
                  testId="login-password-input"
                  value={formData.password}
                  onChange={(e) => { set('password')(e); blur('password'); }}
                  onBlur={() => blur('password')}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </FieldWrapper>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  data-testid="login-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white rounded-xl font-sora font-semibold text-[13px] shadow-md shadow-[#0B2B1C]/15 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-6 pt-5 border-t border-slate-100 text-[13px] text-slate-400 text-center">
              New to Vitta?{' '}
              <Link
                to="/signup"
                tabIndex={loading ? -1 : 0}
                className={`text-[#0B2B1C] font-semibold hover:opacity-70 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Create a free account
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Visual side */}
        <div className="hidden lg:block flex-[0.45] bg-[#0B2B1C] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_30%_50%,rgba(178,215,30,0.18)_0%,transparent_65%)]" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <img
            src="https://images.unsplash.com/photo-1758608631036-7a2370684905?crop=entropy&cs=srgb&fm=jpg&q=85"
            alt=""
            className="w-full h-full object-cover opacity-[0.15] mix-blend-overlay absolute inset-0"
          />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-[260px] text-center relative z-10">
              <div className="w-10 h-[3px] bg-[#B2D71E] rounded-full mb-7 mx-auto" />
              <h2 className="font-sora font-bold text-[30px] text-white mb-4 leading-tight tracking-[-0.02em]">
                Elite Financial Intelligence.
              </h2>
              <p className="text-white/45 text-[14px] leading-relaxed mb-10">
                Join 2,000+ modern businesses transforming their bank statements into growth engines.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-7 border-t border-white/[0.08]">
                {[['2K+', 'Clients'], ['99%', 'Accuracy'], ['100%', 'Secure']].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <p className="font-sora font-bold text-[18px] text-[#B2D71E]">{v}</p>
                    <p className="text-white/30 text-[9px] font-semibold uppercase tracking-widest mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;