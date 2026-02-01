import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, MessageSquare, Send, Globe, ShieldCheck } from 'lucide-react';

const Contact = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success('Your message has been sent successfully! Our team will reach out within 24 hours.');
        setFormData({ name: '', email: '', message: '' });
        setLoading(false);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
            <Navbar />
            
            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <div className="relative pt-44 pb-32 px-6 overflow-hidden bg-primary text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(200,233,71,0.12)_0%,rgba(0,0,0,0)_70%)]" />
                    
                    <div className="max-w-4xl mx-auto relative z-10">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                                <MessageSquare className="w-4 h-4 text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Global Support</span>
                            </div>
                            <h1 className="font-heading font-extrabold text-5xl lg:text-7xl text-white mb-8 tracking-tight leading-[1.1]">
                                How can we <span className="text-accent italic underline decoration-accent/30 underline-offset-8">help</span> you?
                            </h1>
                            <p className="max-w-2xl mx-auto text-lg lg:text-xl text-white/70 font-medium leading-relaxed">
                                Whether you have questions about our enterprise solutions or need technical assistance, our elite support team is standing by.
                            </p>
                            <div className="mt-12 flex justify-center">
                                <div className="w-20 h-1.5 bg-accent rounded-full animate-pulse opacity-50" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="py-24 px-6 lg:px-12 relative z-10">
                    <div className="max-w-7xl mx-auto relative">
                        {/* Decorative background elements for content area */}
                        <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-20 right-[-10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />


                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                        {/* Info Cards Side */}
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="lg:col-span-5 space-y-6"
                        >
                            <motion.div variants={itemVariants} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(15,57,43,0.08)] hover:shadow-[0_40px_80px_-24px_rgba(15,57,43,0.12)] transition-all duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#0F392B] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        <Mail className="w-8 h-8 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-bold text-xl text-primary mb-1">Email Support</h3>
                                        <p className="text-slate-600 font-medium">support@vitta.in</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(15,57,43,0.08)] hover:shadow-[0_40px_80px_-24px_rgba(15,57,43,0.12)] transition-all duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        <Phone className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-bold text-xl text-primary mb-1">Direct Call</h3>
                                        <p className="text-slate-600 font-medium">+91 1800-VITTA-HLP</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(15,57,43,0.08)] hover:shadow-[0_40px_80px_-24px_rgba(15,57,43,0.12)] transition-all duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#F0F4F2] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        <MapPin className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-bold text-xl text-primary mb-1">Headquarters</h3>
                                        <p className="text-slate-600 font-medium">B-Block, TechHub, Mumbai, MH</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="p-8 bg-primary rounded-[2.5rem] text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldCheck className="w-5 h-5 text-accent" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Enterprise Ready</span>
                                    </div>
                                    <h4 className="font-heading font-bold text-2xl mb-2">Need a demo?</h4>
                                    <p className="text-white/60 mb-6">Our solutions experts can walk you through the entire Vitta automation workflow.</p>
                                    <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white hover:text-primary transition-all px-8 py-6 h-auto font-bold uppercase tracking-widest text-xs">
                                        Schedule Demo
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Form Side */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="lg:col-span-7 bg-white rounded-[4rem] border border-slate-100 p-10 lg:p-16 shadow-[0_32px_64px_-16px_rgba(15,57,43,0.12)]"
                        >
                            <div className="mb-12">
                                <h2 className="font-heading font-extrabold text-3xl lg:text-4xl text-primary mb-4 text-center lg:text-left">Send us a message</h2>
                                <p className="text-slate-600 font-medium text-center lg:text-left">Use the form below and we'll route your inquiry to the correct department.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                                        <Input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                            className="h-16 rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Email</Label>
                                        <Input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="name@company.com"
                                            className="h-16 rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 text-slate-700 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Your Message</Label>
                                    <Textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="How can Vitta help your business today?"
                                        className="min-h-[200px] rounded-2xl bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all px-6 py-5 text-slate-700 placeholder:text-slate-400 resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex justify-center lg:justify-start">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full lg:w-auto min-w-[240px] h-16 rounded-2xl bg-gradient-to-r from-primary to-[#16523E] hover:from-primary/95 hover:to-[#16523E]/95 text-white font-black uppercase tracking-widest shadow-[0_20px_40px_-12px_rgba(15,57,43,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border-t border-white/10 px-10 group"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Send Inquiry
                                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer Trust Section */}
                <div className="mt-24 py-12 border-y border-slate-100 bg-white/50 backdrop-blur-sm overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="font-heading font-black text-2xl tracking-tighter">BANK OF CORE</span>
                            <span className="font-heading font-black text-2xl tracking-tighter">FINANCE.CO</span>
                            <span className="font-heading font-black text-2xl tracking-tighter">ELITE ASSETS</span>
                            <span className="font-heading font-black text-2xl tracking-tighter">GLOBAL TRUST</span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;