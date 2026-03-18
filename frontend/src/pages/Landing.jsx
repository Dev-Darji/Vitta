import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  FileCheck, Shield, Clock, TrendingUp,
  CheckCircle2, ArrowRight, Lock, Zap, Star, ArrowUpRight, ScanLine
} from 'lucide-react';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

const testimonials = [
  {
    quote: "Vitta saved our CA 6 hours every month. We went from messy PDFs to clean GST-ready reports in one afternoon.",
    name: "Rohan Mehta",
    role: "Founder, Stackify Labs",
    img: 11,
  },
  {
    quote: "Finally a tool that actually understands Indian bank formats. HDFC, ICICI, Axis — it handles all of them flawlessly.",
    name: "Priya Nair",
    role: "CFO, Bloom Retail",
    img: 12,
  },
  {
    quote: "The categorization accuracy is genuinely impressive. Our tax filings are faster and I trust the numbers completely.",
    name: "Ankit Sharma",
    role: "CEO, Crescendo Studio",
    img: 13,
  },
];

const Landing = () => {
  const [billingPeriod, setBillingPeriod] = React.useState('monthly');

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F3]">
      <style>{FONT_STYLE}</style>
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-[#0B2B1C] pt-36 pb-16 px-6">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_65%_-10%,rgba(178,215,30,0.18)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_35%_40%_at_5%_90%,rgba(178,215,30,0.07)_0%,transparent_60%)]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative z-10 max-w-[1240px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 lg:gap-4 py-14">

            {/* ── Left copy ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="lg:w-[48%] max-w-[560px]"
            >
              <div className="inline-flex items-center gap-2.5 border border-[#B2D71E]/20 bg-[#B2D71E]/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-8 shadow-[0_4px_30px_rgba(178,215,30,0.15)]">
                <Zap className="h-3.5 w-3.5 text-[#B2D71E]" />
                <span className="text-[#B2D71E] text-[10px] font-bold tracking-[0.15em] uppercase">Vitta — Meet the new standard</span>
              </div>

              <h1 className="font-sora font-bold text-[46px] lg:text-[52px] xl:text-[60px] text-white leading-[1.08] tracking-[-0.03em] mb-7">
  Your finances,<br />
  <span className="text-[#B2D71E]">finally on autopilot.</span>
</h1>
<p className="text-white/55 text-[17px] leading-[1.75] max-w-[460px] mb-10">
  Vitta reads your bank statements, auto-categorizes every transaction, and delivers audit-ready reports — in seconds, not hours.
</p>

              <div className="flex flex-wrap gap-3">
                <Link to="/signup">
                  <Button className="h-[50px] px-7 bg-[#B2D71E] hover:bg-[#c5ef20] text-[#0B2B1C] font-sora font-semibold text-[14px] rounded-xl gap-2 transition-all hover:shadow-[0_6px_28px_rgba(178,215,30,0.4)] group">
                    Start for free
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="ghost" className="h-[50px] px-7 text-white/55 hover:text-white hover:bg-white/[0.07] rounded-xl font-medium text-[14px] border border-white/10 transition-all">
                    See how it works
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-12 pt-8 border-t border-white/[0.07] flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[11, 12, 13, 14].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/80?img=${i}`} alt="" className="w-8 h-8 rounded-full border-2 border-[#0B2B1C] object-cover" />
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 fill-[#B2D71E] text-[#B2D71E]" />)}
                  </div>
                  <p className="text-white/30 text-[11px]">Loved by 1,500+ Indian entrepreneurs</p>
                </div>
              </div>
            </motion.div>

            {/* ── Right: compact dashboard mockup ── */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="lg:w-[50%] relative flex justify-center lg:justify-end"
            >
              {/* Glow behind card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-[#B2D71E]/20 blur-[90px] rounded-full pointer-events-none" />

              {/* The mockup — capped width, full rounded card */}
              <div className="relative w-full max-w-[470px] transition-transform duration-700 hover:-translate-y-1">
                {/* Outer Glass Rim matching requested style */}
                <div className="absolute inset-0 -m-3 sm:-m-4 md:-m-5 bg-white/[0.04] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl pointer-events-none" />

                {/* Inner white card */}
                <div className="relative w-full bg-white rounded-2xl md:rounded-[1.25rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-[#F6F6F4] border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  <div className="flex-1 mx-3 flex justify-center">
                    <div className="bg-white border border-slate-200/80 py-1.5 px-4 w-full max-w-[260px] rounded-full flex items-center justify-center gap-1.5 shadow-sm">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium">app.vitta.in/dashboard</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-5 bg-white">
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <h3 className="font-sora font-semibold text-slate-800 text-[18px]">Overview</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">FY 2024-25</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-100 transition-colors">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Export</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-6">
                    {/* Stat pills */}
                    <div className="col-span-2 flex flex-col gap-3">
                      <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-100 relative overflow-hidden group hover:border-[#B2D71E]/50 transition-all cursor-default flex flex-col justify-center">
                        <div className="absolute inset-0 bg-[#B2D71E]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Inflow</p>
                          <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">+14%</span>
                        </div>
                        <p className="font-sora font-semibold text-[20px] text-[#0B2B1C] leading-none">₹12.4L</p>
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-100 relative overflow-hidden group hover:border-slate-300 transition-all cursor-default flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Outflow</p>
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">-3%</span>
                        </div>
                        <p className="font-sora font-semibold text-[20px] text-[#0B2B1C] leading-none">₹8.1L</p>
                      </div>
                    </div>

                    {/* Mini bar chart */}
                    <div className="col-span-3 bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-sora font-semibold text-[13px] text-slate-700">Cashflow Trend</p>
                        <span className="text-[8px] font-bold text-[#B2D71E] bg-[#B2D71E]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Healthy</span>
                      </div>
                      <div className="h-16 flex items-end gap-1.5 mt-auto">
                        {[30, 45, 35, 60, 50, 75, 60, 85, 70, 95, 80, 100].map((h, i) => (
                          <div key={i} className={`flex-1 rounded-t-full cursor-pointer transition-all hover:opacity-80 ${i === 11 ? 'bg-[#B2D71E]' : 'bg-slate-100'}`} style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-sora font-semibold text-[13px] text-slate-700">Recent Transactions</p>
                      <span className="text-[9px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer tracking-wider">View All</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Razorpay Settlement', tag: 'Income', val: '+₹1,24,000', icon: 'bg-emerald-50 text-emerald-600', valc: 'text-emerald-600' },
                        { name: 'Rent — Koramangala', tag: 'Expense', val: '-₹45,000', icon: 'bg-slate-100 text-slate-400', valc: 'text-slate-700' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${row.icon}`}>
                              <FileCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-slate-800 leading-tight mb-0.5">{row.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{row.tag}</p>
                            </div>
                          </div>
                          <p className={`font-sora font-semibold text-[13px] ${row.valc}`}>{row.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-3 lg:-right-6 -top-10 bg-[#B2D71E] rounded-xl px-4 py-3 shadow-xl shadow-[#B2D71E]/30 border border-[#B2D71E]/50 z-20"
              >
                <p className="text-[8px] text-[#0B2B1C]/60 font-bold uppercase tracking-widest mb-0.5">Time Saved</p>
                <p className="font-sora font-bold text-[14px] text-[#0B2B1C]">12+ Hours/mo</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 7, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -left-4 lg:left-3 bottom-12 bg-white rounded-xl p-3 shadow-2xl shadow-slate-400/20 border border-slate-100 z-20 flex gap-3 items-center"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Shield className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Encrypted</p>
                  <p className="font-sora font-semibold text-[12px] text-slate-700">AES-256 Vault</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="bg-[#0B2B1C] border-t border-white/[0.06] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-5">
            {[
              { v: '1,500+', l: 'SMB Customers' },
              { v: '₹2.5Cr+', l: 'Cashflow Tracked' },
              { v: '98%', l: 'Accuracy' },
              { v: '<10s', l: 'Processing Time' },
              { v: '24/7', l: 'Support' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-sora font-bold text-[18px] text-[#B2D71E]">{s.v}</p>
                <p className="text-white/30 text-[9px] font-medium uppercase tracking-widest mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature showcase ─── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-28">
            <motion.div {...fadeIn}>
              <div className="inline-flex items-center gap-2 border border-[#0B2B1C]/12 bg-[#0B2B1C]/5 px-3.5 py-1.5 rounded-full mb-6">
                <ScanLine className="h-3.5 w-3.5 text-[#0B2B1C]/70" />
                <span className="text-[10px] font-semibold text-[#0B2B1C]/70 uppercase tracking-widest">Proprietary Engine</span>
              </div>
              <h2 className="font-sora font-bold text-[38px] lg:text-[48px] text-[#0B2B1C] leading-[1.12] tracking-[-0.025em] mb-5">
                Built for every<br />Indian bank.
              </h2>
              <p className="text-slate-500 text-[16px] leading-[1.8] mb-9 max-w-md">
                Most accounting tools fail with Indian bank formats. Vitta's AI is trained on 500+ statement variants — ICICI, HDFC, SBI, Axis, and all major schedule banks.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Zero Manual Entry', desc: 'No more copy-pasting from PDFs to Excel sheets.' },
                  { title: 'GST Integrated', desc: 'Automatic mapping to GST-compliant expense categories.' },
                  { title: 'Privacy First', desc: 'We never store your bank login or credentials.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3.5 items-start">
                    <div className="w-5 h-5 rounded-full bg-[#B2D71E] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-[#0B2B1C]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0B2B1C] text-[14px]">{item.title}</p>
                      <p className="text-slate-400 text-[13px] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeIn} className="relative">
              <div className="absolute inset-0 bg-[#B2D71E]/10 blur-[70px] rounded-full" />
              <div className="relative bg-[#0B2B1C] rounded-[1.75rem] p-7 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#B2D71E]/6 rounded-full blur-2xl" />
                <div className="relative z-10 space-y-5">
                  <div>
                    <p className="text-white/30 text-[9px] font-medium uppercase tracking-widest mb-1">Total Assets — FY25</p>
                    <p className="font-sora font-bold text-[34px] text-white tracking-[-0.02em]">₹85,42,100</p>
                    <span className="text-[#B2D71E] text-[11px] font-semibold">↑ 12.4% vs last year</span>
                  </div>
                  <div className="h-20 flex items-end gap-1 border-b border-white/[0.06] pb-4">
                    {[40, 58, 44, 88, 72, 54, 100, 78, 64, 84, 70, 94].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-sm ${i === 7 ? 'bg-[#B2D71E]' : 'bg-white/[0.08]'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-[#B2D71E]" />
                      <span className="text-white/60 text-[13px]">Ready to file ITR-3?</span>
                    </div>
                    <button className="bg-[#B2D71E] text-[#0B2B1C] text-[8px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full">Automate</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature cards */}
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="font-sora font-bold text-[34px] text-[#0B2B1C] tracking-[-0.02em] mb-3">Everything you need.</h2>
            <p className="text-slate-400 text-[15px] max-w-md mx-auto">Elite features keeping your finances organized and audit-ready.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: 'Compliance Grade', desc: 'Secure data vaults exceeding global security standards.' },
              { icon: Zap, title: 'Lightning Speed', desc: 'Extract and analyze all data in under 10 seconds.' },
              { icon: Clock, title: 'Real-time Trends', desc: 'Visualize spending patterns as they emerge live.' },
              { icon: TrendingUp, title: 'Audit Ready', desc: 'One-click exports for your CA or tax professional.' },
            ].map((f, i) => (
              <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.07, duration: 0.65 }}
                className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#B2D71E]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 bg-[#0B2B1C] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#B2D71E] transition-colors duration-300">
                  <f.icon className="h-4.5 w-4.5 text-white group-hover:text-[#0B2B1C] transition-colors h-[18px] w-[18px]" />
                </div>
                <h3 className="font-sora font-semibold text-[#0B2B1C] text-[14px] mb-1.5">{f.title}</h3>
                <p className="text-slate-400 text-[13px] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 px-6 bg-[#0B2B1C] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_110%,rgba(178,215,30,0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeIn} className="text-center mb-14">
            <p className="text-[#B2D71E] text-[10px] font-semibold uppercase tracking-[0.22em] mb-3">Customer stories</p>
            <h2 className="font-sora font-bold text-[34px] text-white tracking-[-0.02em]">Loved by builders & accountants.</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.1, duration: 0.65 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 flex flex-col hover:bg-white/[0.07] transition-colors duration-300">
                {/* Large decorative quotation mark */}
                <div className="mb-4">
                  <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 28V17.5C0 7.83333 5.33333 2.16667 16 0L18 3.5C12.4444 4.72222 9.27778 7.72222 8.5 12.5H14V28H0ZM22 28V17.5C22 7.83333 27.3333 2.16667 38 0L40 3.5C34.4444 4.72222 31.2778 7.72222 30.5 12.5H36V28H22Z" fill="#B2D71E" fillOpacity="0.55"/>
                  </svg>
                </div>
                <p className="text-white/60 text-[14px] leading-[1.8] flex-1 mb-6">{t.quote}</p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/[0.07]">
                  <img src={`https://i.pravatar.cc/80?img=${t.img}`} alt={t.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-[#B2D71E]/20" />
                  <div>
                    <p className="text-white text-[13px] font-semibold">{t.name}</p>
                    <p className="text-white/30 text-[11px] mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-28 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="font-sora font-bold text-[34px] text-[#0B2B1C] tracking-[-0.02em] mb-3">Simple, honest pricing.</h2>
            <p className="text-slate-400 text-[15px] max-w-md mx-auto mb-7">Start for free and scale as you grow. No hidden fees.</p>
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              {['monthly', 'yearly'].map(p => (
                <button key={p} onClick={() => setBillingPeriod(p)}
                  className={`px-5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${billingPeriod === p ? 'bg-[#0B2B1C] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  {p === 'yearly' ? 'Yearly — save 20%' : 'Monthly'}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {[
              { name: 'Starter', icon: Zap, mp: '0', yp: '0', desc: 'Perfect for freelancers & sole proprietors', features: ['5 Statements / month', 'PDF Reports', 'Email Support', '30-day storage'], popular: false },
              { name: 'Business', icon: Star, mp: '499', yp: '4,790', desc: 'For growing businesses & accountants', features: ['25 Statements / month', 'GST Categorization', 'Excel + PDF Export', 'Priority Support'], popular: true },
            ].map((plan, i) => (
              <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-7 border-2 transition-all hover:-translate-y-1 duration-300 ${plan.popular ? 'bg-[#0B2B1C] border-[#0B2B1C] shadow-xl shadow-[#0B2B1C]/15' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B2D71E] text-[#0B2B1C] text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">Most popular</div>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-5 ${plan.popular ? 'bg-[#B2D71E]' : 'bg-slate-50'}`}>
                  <plan.icon className={`h-4 w-4 ${plan.popular ? 'text-[#0B2B1C]' : 'text-slate-400'}`} />
                </div>
                <h3 className={`font-sora font-bold text-[18px] mb-1 ${plan.popular ? 'text-white' : 'text-[#0B2B1C]'}`}>{plan.name}</h3>
                <p className={`text-[12px] mb-5 ${plan.popular ? 'text-white/40' : 'text-slate-400'}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`font-sora font-bold text-[38px] tracking-[-0.02em] ${plan.popular ? 'text-white' : 'text-[#0B2B1C]'}`}>₹{billingPeriod === 'monthly' ? plan.mp : plan.yp}</span>
                  <span className={`text-[11px] font-medium ${plan.popular ? 'text-white/30' : 'text-slate-400'}`}>/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-[#B2D71E]/20' : 'bg-[#0B2B1C]/7'}`}>
                        <CheckCircle2 className={`h-2.5 w-2.5 ${plan.popular ? 'text-[#B2D71E]' : 'text-[#0B2B1C]'}`} />
                      </div>
                      <span className={`text-[13px] ${plan.popular ? 'text-white/60' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className={`w-full rounded-xl h-11 font-semibold text-[13px] transition-all ${plan.popular ? 'bg-[#B2D71E] hover:bg-[#c5ef20] text-[#0B2B1C] shadow-md shadow-[#B2D71E]/20' : 'bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white'}`}>
                    {plan.popular ? 'Start 14-day trial' : 'Get started free'}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-8">
            <Link to="/pricing" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#0B2B1C] text-[13px] transition-colors group">
              Compare all plans including Enterprise
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 bg-[#0B2B1C] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_75%_0%,rgba(178,215,30,0.14)_0%,transparent_65%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div {...fadeIn}>
            <h2 className="font-sora font-bold text-[44px] lg:text-[56px] text-white leading-[1.08] tracking-[-0.025em] mb-5">
              Ready to scale<br /><span className="text-[#B2D71E]">your finances?</span>
            </h2>
            <p className="text-white/40 text-[16px] mb-9 max-w-sm mx-auto leading-relaxed">
              Join 1,500+ modern businesses that have moved beyond manual spreadsheets.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/signup">
                <Button className="h-[50px] px-9 bg-[#B2D71E] hover:bg-[#c5ef20] text-[#0B2B1C] rounded-xl font-sora font-semibold text-[14px] shadow-xl shadow-[#B2D71E]/20 transition-all hover:scale-[1.02]">
                  Launch free trial
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" className="h-[50px] px-9 text-white/50 hover:text-white hover:bg-white/[0.07] rounded-xl font-medium text-[14px] border border-white/10">
                  Compare plans
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;