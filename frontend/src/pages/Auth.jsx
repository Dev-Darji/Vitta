import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Eye, EyeOff, ShieldCheck, Zap, Globe, Lock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine initial mode from URL
    const isSignupInitial = location.pathname === '/signup';
    const [isLogin, setIsLogin] = useState(!isSignupInitial);
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

    // Sync mode with URL changes
    useEffect(() => {
        setIsLogin(location.pathname === '/login');
    }, [location.pathname]);

    const handleToggle = () => {
        const newMode = isLogin ? '/signup' : '/login';
        navigate(newMode);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Welcome back to Vitta!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (!agreedToTerms) {
            toast.error('Please agree to our terms');
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
        <div className="min-h-screen bg-slate-50 overflow-x-hidden flex flex-col">
            <Navbar />
            
            <main className="flex-1 flex items-center justify-center pt-28 pb-16 px-4 relative">
                {/* Background decorative elements */}
                <div className="absolute top-40 left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-20 right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-7xl mx-auto min-h-[750px] bg-white rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(15,57,43,0.12)] border border-slate-100 flex overflow-hidden relative">
                    
                    {/* Animated Image Overlay (45% Width) */}
                    <motion.div
                        className="absolute top-0 bottom-0 z-20 hidden lg:block bg-primary overflow-hidden"
                        initial={false}
                        animate={{ 
                            width: '45%',
                            left: isLogin ? '55%' : '0%',
                            transition: { type: 'spring', stiffness: 80, damping: 20 }
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-[#0A291F]/90 z-10" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,233,71,0.25)_0%,rgba(0,0,0,0)_80%)] opacity-70 z-10" />
                        <motion.img
                            src="https://images.unsplash.com/photo-1758608631036-7a2370684905?crop=entropy&cs=srgb&fm=jpg&q=85"
                            alt="Visual"
                            className="w-full h-full object-cover opacity-45 mix-blend-overlay absolute inset-0"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        />
                        
                        <div className="relative z-30 h-full flex flex-col items-center justify-center p-20 text-center text-white">
                            <AnimatePresence mode="wait">
                                {isLogin ? (
                                    <motion.div
                                        key="login-msg"
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                        className="max-w-xs"
                                    >
                                        <h2 className="font-heading font-extrabold text-5xl mb-6 leading-[1.1]">Elite Intelligence.</h2>
                                        <p className="text-white/60 text-lg font-medium mb-8 leading-relaxed">The global standard for modern financial management. Join the inner circle.</p>
                                        <div className="w-16 h-1.5 bg-accent rounded-full mb-12 mx-auto" />
                                        
                                        <div className="grid grid-cols-3 gap-5 pt-6 border-t border-white/10 items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-accent font-black text-2xl">2K+</div>
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Clients</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-accent font-black text-2xl">99%</div>
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Accuracy</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-accent font-black text-2xl">100%</div>
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Secure</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="signup-msg"
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                        className="max-w-xs"
                                    >
                                        <h2 className="font-heading font-extrabold text-5xl mb-6 leading-[1.1]">Modern Finances.</h2>
                                        <p className="text-white/60 text-lg font-medium mb-8 leading-relaxed">Experience a faster, more intelligent way to handle your business bank statements.</p>
                                        <div className="w-16 h-1.5 bg-accent rounded-full mb-12 mx-auto" />
                                        
                                        <div className="flex items-center justify-center gap-4 pt-6 border-t border-white/10 opacity-60">
                                            <ShieldCheck className="text-white h-5 w-5" />
                                            <Zap className="text-white h-5 w-5" />
                                            <Globe className="text-white h-5 w-5" />
                                            <Lock className="text-white h-5 w-5" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Form Areas (55% Width zones) */}
                    <div className="flex-1 flex overflow-hidden relative bg-white">
                        
                        {/* Login Form Panel */}
                        <motion.div 
                            className="w-full lg:w-[55%] h-full flex items-center justify-center p-8 lg:p-16 absolute lg:relative z-10"
                            animate={{ 
                                x: isLogin ? '0%' : '-100%',
                                opacity: isLogin ? 1 : 0,
                                scale: isLogin ? 1 : 0.98,
                                filter: isLogin ? 'blur(0px)' : 'blur(4px)'
                            }}
                            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="w-full max-w-sm">
                                <div className="mb-12">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-full text-[10px] text-primary font-black uppercase tracking-widest">
                                            Trusted Login
                                        </div>
                                    </div>
                                    <h1 className="font-heading font-extrabold text-4xl text-primary mb-3">Welcome Back</h1>
                                    <p className="text-slate-600 font-medium">Access your global financial headquarters.</p>
                                </div>

                                <form onSubmit={handleLoginSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Business Email</Label>
                                        <Input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-14 rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
                                            placeholder="name@company.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Password</Label>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="h-14 rounded-2xl bg-white border-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
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

                                    <div className="pt-3 flex justify-center">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-[#16523E] hover:from-primary/95 hover:to-[#16523E]/95 text-white font-black uppercase tracking-widest shadow-[0_20px_40px_-12px_rgba(15,57,43,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] border-t border-white/10"
                                        >
                                            {loading ? 'Signing In...' : 'Sign In'}
                                        </Button>
                                    </div>
                                </form>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-600 font-medium text-center">
                                        New to the platform?{' '}
                                        <button 
                                            onClick={handleToggle}
                                            className="text-primary font-black hover:text-primary/70 transition-all ml-1"
                                        >
                                            Create a free account
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Sign Up Form Panel */}
                        <motion.div 
                            className="w-full lg:w-[55%] h-full flex items-center justify-center p-8 lg:p-16 absolute lg:absolute z-10 right-0"
                            animate={{ 
                                x: !isLogin ? '0%' : '100%',
                                opacity: !isLogin ? 1 : 0,
                                scale: !isLogin ? 1 : 0.98,
                                filter: !isLogin ? 'blur(0px)' : 'blur(4px)'
                            }}
                            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="w-full max-w-sm">
                                <div className="mb-10">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] text-primary font-black uppercase tracking-widest">
                                            Immediate Access
                                        </div>
                                    </div>
                                    <h1 className="font-heading font-extrabold text-4xl text-primary mb-3">Get Started</h1>
                                    <p className="text-slate-600 font-medium">Join 2,000+ businesses growing with Vitta.</p>
                                </div>

                                <form onSubmit={handleSignupSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Your Full Name</Label>
                                        <Input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="h-14 rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Business Email</Label>
                                        <Input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-14 rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
                                            placeholder="name@company.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Password</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="h-14 rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
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

                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Confirm</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    required
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    className="h-14 rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center space-x-3 py-3">
                                        <div className="mt-1">
                                            <Checkbox
                                                id="auth-terms-refined"
                                                checked={agreedToTerms}
                                                onCheckedChange={setAgreedToTerms}
                                                className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </div>
                                        <label htmlFor="auth-terms-refined" className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                            I agree to the <a href="#" className="text-primary font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>.
                                        </label>
                                    </div>

                                    <div className="flex justify-center">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-[#16523E] hover:from-primary/95 hover:to-[#16523E]/95 text-white font-black uppercase tracking-widest shadow-[0_20px_40px_-12px_rgba(15,57,43,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] border-t border-white/10"
                                        >
                                            {loading ? 'Creating...' : 'Create Account'}
                                        </Button>
                                    </div>
                                </form>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-600 font-medium text-center">
                                        Have a member account?{' '}
                                        <button 
                                            onClick={handleToggle}
                                            className="text-primary font-black hover:text-primary/70 transition-all ml-1"
                                        >
                                            Sign in here
                                        </button>
                                    </p>
                                </div>
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
