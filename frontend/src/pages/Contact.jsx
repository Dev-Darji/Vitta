import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, MessageSquare, Send, ShieldCheck } from 'lucide-react';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Message sent! Our team will reach out within 24 hours.');
    setFormData({ name: '', email: '', message: '' });
    setLoading(false);
  };

  const inputCls = "h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-[#0B2B1C]/20 focus:ring-2 focus:ring-[#0B2B1C]/5 transition-all px-4 text-slate-700 placeholder:text-slate-300 text-[13px]";
  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block";

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex flex-col">
      <style>{FONT_STYLE}</style>
      <Navbar />
      <main className="flex-1 flex flex-col">

        {/* Hero */}
        <div className="relative pt-36 pb-20 px-6 bg-[#0B2B1C] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_-10%,rgba(178,215,30,0.15)_0%,transparent_65%)]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
              <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3.5 py-1.5 rounded-full mb-7">
                <MessageSquare className="w-3.5 h-3.5 text-[#B2D71E]" />
                <span className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">Support</span>
              </div>
              <h1 className="font-sora font-bold text-[48px] lg:text-[64px] text-white leading-[1.07] tracking-[-0.03em] mb-5">
                How can we<br /><span className="text-[#B2D71E]">help you?</span>
              </h1>
              <p className="text-white/45 text-[16px] max-w-lg mx-auto leading-[1.8]">Questions about enterprise solutions or need technical assistance? Our team is standing by.</p>
            </motion.div>
          </div>
        </div>

        <div className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-8 items-start">

              {/* Info cards */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-4 space-y-3">
                {[
                  { icon: Mail, bg: 'bg-[#0B2B1C]', ic: 'text-[#B2D71E]', title: 'Email Support', value: 'support@vitta.in' },
                  { icon: Phone, bg: 'bg-[#B2D71E]', ic: 'text-[#0B2B1C]', title: 'Direct Call', value: '+91 1800-VITTA-HLP' },
                  { icon: MapPin, bg: 'bg-slate-50', ic: 'text-slate-600', title: 'Headquarters', value: 'B-Block, TechHub, Mumbai, MH' },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.65 }}
                    className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all duration-300 group">
                    <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <item.icon className={`w-5 h-5 ${item.ic}`} />
                    </div>
                    <div>
                      <p className="font-sora font-semibold text-[#0B2B1C] text-[13px]">{item.title}</p>
                      <p className="text-slate-400 text-[12px] mt-0.5">{item.value}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Demo card */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.65 }}
                  className="p-6 bg-[#0B2B1C] rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-[#B2D71E]/8 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#B2D71E]" />
                      <span className="text-[#B2D71E] text-[9px] font-bold uppercase tracking-widest">Enterprise</span>
                    </div>
                    <h4 className="font-sora font-semibold text-white text-[16px] mb-1.5">Need a demo?</h4>
                    <p className="text-white/40 text-[12px] mb-5 leading-relaxed">Our experts will walk you through the entire Vitta workflow.</p>
                    <Button variant="outline" className="rounded-xl border-white/15 text-white hover:bg-white hover:text-[#0B2B1C] transition-all h-10 px-5 font-medium text-[12px]">
                      Schedule a demo
                    </Button>
                  </div>
                </motion.div>
              </motion.div>

              {/* Form */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.75, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-9 shadow-sm">
                <div className="mb-7">
                  <h2 className="font-sora font-bold text-[22px] text-[#0B2B1C] mb-1.5">Send us a message</h2>
                  <p className="text-slate-400 text-[13px]">We'll route your inquiry to the right team and respond promptly.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className={labelCls}>Full Name</Label>
                      <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" className={inputCls} />
                    </div>
                    <div>
                      <Label className={labelCls}>Work Email</Label>
                      <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="name@company.com" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <Label className={labelCls}>Your Message</Label>
                    <Textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="How can Vitta help your business today?" className="min-h-[160px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-[#0B2B1C]/20 focus:ring-2 focus:ring-[#0B2B1C]/5 transition-all px-4 py-3.5 text-slate-700 placeholder:text-slate-300 text-[13px] resize-none" />
                  </div>
                  <Button type="submit" disabled={loading} className="h-11 px-8 bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white rounded-xl font-semibold text-[13px] shadow-md shadow-[#0B2B1C]/15 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2.5">
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                      : <>Send inquiry <Send className="w-3.5 h-3.5" /></>
                    }
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trust logos */}
        <div className="py-8 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center text-[9px] font-semibold uppercase tracking-widest text-slate-300 mb-5">Trusted by</p>
            <div className="flex flex-wrap items-center justify-center gap-10 opacity-20">
              {['BANK OF CORE', 'FINANCE.CO', 'ELITE ASSETS', 'GLOBAL TRUST'].map(name => (
                <span key={name} className="font-sora font-semibold text-[16px] tracking-tight text-slate-500">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;