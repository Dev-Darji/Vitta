import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

// ── Validators ────────────────────────────────────────────────
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validateName  = (v) => v.trim().length >= 2;

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)               score++;
  if (pw.length >= 12)              score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-400'    };
  if (score <= 2) return { score, label: 'Fair',   color: 'bg-amber-400'  };
  if (score <= 3) return { score, label: 'Good',   color: 'bg-yellow-400' };
  return            { score, label: 'Strong', color: 'bg-emerald-500' };
}

// ── Shared sub-components ─────────────────────────────────────
function FieldWrapper({ label, error, success, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
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

function PasswordInput({ value, onChange, onBlur, placeholder, disabled, autoComplete, id, testId }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        data-testid={testId}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
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

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? strength.color : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${
        strength.label === 'Weak'   ? 'text-red-400'    :
        strength.label === 'Fair'   ? 'text-amber-500'  :
        strength.label === 'Good'   ? 'text-yellow-600' :
        'text-emerald-500'
      }`}>
        {strength.label} password
      </p>
    </div>
  );
}

const inputCls = (hasError) =>
  `h-12 rounded-xl bg-slate-50 border transition-all px-4 text-slate-700 placeholder:text-slate-300 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:bg-white ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-[#0B2B1C]/25 focus:ring-[#0B2B1C]/5'
  }`;

// ─────────────────────────────────────────────────────────────
const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading]             = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [touched, setTouched]             = useState({
    name: false, email: false, password: false, confirmPassword: false,
  });
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const errors = {
    name:            touched.name            && !validateName(formData.name)           ? 'Enter your full name (min 2 chars)' : '',
    email:           touched.email           && !validateEmail(formData.email)          ? 'Enter a valid email address' : '',
    password:        touched.password        && formData.password.length < 8           ? 'Password must be at least 8 characters' : '',
    confirmPassword: touched.confirmPassword && formData.password !== formData.confirmPassword ? 'Passwords do not match' : '',
  };

  const successes = {
    name:            !errors.name  && touched.name  && validateName(formData.name)  ? 'Looks good' : '',
    email:           !errors.email && touched.email && validateEmail(formData.email) ? 'Valid email' : '',
    confirmPassword: !errors.confirmPassword && touched.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword ? 'Passwords match' : '',
  };

  const isFormValid =
    validateName(formData.name) &&
    validateEmail(formData.email) &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    agreedToTerms;

  const blur = (field) => setTouched(t => ({ ...t, [field]: true }));
  const set  = (field) => (e) => setFormData(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Touch all fields to show all errors
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

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
        name:     formData.name,
        email:    formData.email,
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
    <div className="min-h-screen bg-[#F6F6F3]">
      <style>{FONT_STYLE}</style>
      <Navbar />

      <div className="pt-20 flex min-h-[calc(100vh-0px)]">
        {/* Visual side */}
        <div className="hidden lg:block flex-[0.42] bg-[#0B2B1C] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_70%_50%,rgba(178,215,30,0.18)_0%,transparent_65%)]" />
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
                Join the Financial Revolution.
              </h2>
              <p className="text-white/45 text-[14px] leading-relaxed mb-10">
                Experience the most intuitive accounting platform designed for the modern Indian business.
              </p>
              {/* Trust indicators */}
              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, text: 'AES-256 encrypted vault' },
                  { icon: CheckCircle2, text: 'No credit card required' },
                  { icon: CheckCircle2, text: 'Cancel anytime, free forever' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-left">
                    <div className="w-5 h-5 rounded-full bg-[#B2D71E]/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3 w-3 text-[#B2D71E]" />
                    </div>
                    <span className="text-white/40 text-[12px]">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="flex-[0.58] flex items-center justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* Header */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 bg-[#B2D71E]/15 border border-[#B2D71E]/20 rounded-full px-3 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B2D71E]" />
                <span className="text-[#0B2B1C] text-[9px] font-bold uppercase tracking-widest">Free forever</span>
              </div>
              <h1 className="font-sora font-bold text-[28px] text-[#0B2B1C] mb-1.5 tracking-[-0.02em]">Create your account.</h1>
              <p className="text-slate-400 text-[13px]">Join 2,000+ businesses growing with Vitta.</p>
            </div>

            <form data-testid="signup-form" onSubmit={handleSubmit} noValidate className={`space-y-4 ${loading ? 'pointer-events-none select-none' : ''}`}>

              {/* Full name */}
              <FieldWrapper label="Full name" error={errors.name} success={successes.name}>
                <Input
                  data-testid="signup-name-input"
                  id="name"
                  type="text"
                  required
                  disabled={loading}
                  value={formData.name}
                  onChange={set('name')}
                  onBlur={() => blur('name')}
                  autoComplete="name"
                  placeholder="John Doe"
                  className={inputCls(!!errors.name)}
                />
              </FieldWrapper>

              {/* Email */}
              <FieldWrapper label="Email address" error={errors.email} success={successes.email}>
                <Input
                  data-testid="signup-email-input"
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

              {/* Passwords — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</Label>
                  <PasswordInput
                    id="password"
                    testId="signup-password-input"
                    value={formData.password}
                    onChange={(e) => { set('password')(e); }}
                    onBlur={() => blur('password')}
                    disabled={loading}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  {errors.password ? (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />{errors.password}
                    </p>
                  ) : (
                    <PasswordStrengthBar password={formData.password} />
                  )}
                </div>

                <FieldWrapper label="Confirm" error={errors.confirmPassword} success={successes.confirmPassword}>
                  <PasswordInput
                    id="confirmPassword"
                    testId="signup-confirm-password-input"
                    value={formData.confirmPassword}
                    onChange={(e) => { set('confirmPassword')(e); blur('confirmPassword'); }}
                    onBlur={() => blur('confirmPassword')}
                    disabled={loading}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </FieldWrapper>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 py-1">
                <Checkbox
                  data-testid="signup-terms-checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  disabled={loading}
                  className="mt-0.5 rounded border-slate-300 data-[state=checked]:bg-[#0B2B1C] data-[state=checked]:border-[#0B2B1C] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="terms" className={`text-[11px] leading-relaxed cursor-pointer select-none ${loading ? 'opacity-50 pointer-events-none' : 'text-slate-400'}`}>
                  I agree to the{' '}
                  <a href="#" className={`text-[#0B2B1C] hover:underline font-semibold ${loading ? 'pointer-events-none' : ''}`}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className={`text-[#0B2B1C] hover:underline font-semibold ${loading ? 'pointer-events-none' : ''}`}>Privacy Policy</a>
                </label>
              </div>

              {/* Submit */}
              <Button
                data-testid="signup-submit-button"
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white rounded-xl font-sora font-semibold text-[13px] shadow-md shadow-[#0B2B1C]/15 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Get started free'
                )}
              </Button>
            </form>

            <p className="mt-5 pt-5 border-t border-slate-100 text-[13px] text-slate-400 text-center">
              Already have an account?{' '}
              <Link
                to="/login"
                tabIndex={loading ? -1 : 0}
                className={`text-[#0B2B1C] font-semibold hover:opacity-70 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;