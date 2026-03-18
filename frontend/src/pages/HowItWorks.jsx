import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Upload, CheckCircle2, Shield, Zap, BarChart3, ArrowRight, MousePointer2, FilePieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

const HowItWorks = () => {
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

      {/* Hero */}
      <div className="relative pt-36 pb-20 px-6 bg-[#0B2B1C] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_-15%,rgba(178,215,30,0.16)_0%,transparent_65%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3.5 py-1.5 rounded-full mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B2D71E]" />
              <span className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">How it works</span>
            </div>
            <h1 className="font-sora font-bold text-[48px] lg:text-[64px] text-white leading-[1.07] tracking-[-0.03em] mb-5">
              Simple.<br /><span className="text-[#B2D71E]">Automated.</span><br />Professional.
            </h1>
            <p className="text-white/45 text-[16px] max-w-lg mx-auto leading-[1.8]">
              Vitta converts complex bank data into beautiful, audit-ready financial reports in minutes — not days.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Steps */}
      <div className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-24">

          {/* Step 1 */}
          <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-full bg-[#0B2B1C] flex items-center justify-center">
                  <span className="font-sora font-bold text-[#B2D71E] text-[10px]">01</span>
                </div>
                <span className="font-semibold text-[10px] text-[#0B2B1C]/60 uppercase tracking-widest">Upload</span>
              </div>
              <h2 className="font-sora font-bold text-[36px] lg:text-[44px] text-[#0B2B1C] leading-[1.12] tracking-[-0.025em] mb-5">
                Securely upload your bank statements.
              </h2>
              <p className="text-slate-500 text-[16px] leading-[1.8] mb-7">
                Drag and drop your statements. We support CSV and machine-readable PDFs from all major Indian banks — SBI, HDFC, ICICI, Axis, and more.
              </p>
              <ul className="space-y-3.5">
                {['Bank-level AES-256 encryption', 'Automatic text extraction', 'Supports multiple bank formats'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#B2D71E] flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-[#0B2B1C]" />
                    </div>
                    <span className="text-slate-600 text-[13px] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[#B2D71E]/8 blur-[60px] rounded-full" />
              <div className="relative bg-white rounded-2xl p-9 shadow-lg border border-slate-100">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-[#B2D71E] transition-colors group cursor-pointer">
                  <div className="w-14 h-14 bg-[#0B2B1C]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#B2D71E]/15 group-hover:scale-110 transition-all">
                    <Upload className="h-7 w-7 text-[#0B2B1C]" />
                  </div>
                  <p className="font-sora font-semibold text-[#0B2B1C] text-[15px] mb-1">Drop statement here</p>
                  <p className="text-slate-400 text-[12px]">PDF or CSV · All banks supported</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-[#0B2B1C]/5 blur-[60px] rounded-full" />
              <div className="relative bg-[#0B2B1C] rounded-2xl p-7 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#B2D71E]/6 rounded-full blur-2xl" />
                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B2D71E] animate-pulse" />
                    <span className="text-white/35 text-[9px] font-semibold uppercase tracking-widest">Auto-classifying…</span>
                  </div>
                  {[
                    { label: 'Amazon Business', cat: 'Office Supplies', val: '₹4,500' },
                    { label: 'WeWork Office Koramangala', cat: 'Rent & Utilities', val: '₹45,000' },
                    { label: 'Uber for Business', cat: 'Travel & Transport', val: '₹1,200' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                      <div>
                        <p className="text-white text-[13px] font-medium mb-1">{row.label}</p>
                        <span className="text-[#B2D71E] text-[8px] font-bold uppercase tracking-wider bg-[#B2D71E]/10 px-2 py-0.5 rounded-full">{row.cat}</span>
                      </div>
                      <p className="font-sora font-semibold text-white text-[13px]">{row.val}</p>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-center">
                    <div className="bg-[#B2D71E] text-[#0B2B1C] px-4 py-1.5 rounded-full text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <MousePointer2 className="h-3 w-3" />Processing 47 transactions
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-full bg-[#0B2B1C] flex items-center justify-center">
                  <span className="font-sora font-bold text-[#B2D71E] text-[10px]">02</span>
                </div>
                <span className="font-semibold text-[10px] text-[#0B2B1C]/60 uppercase tracking-widest">Classify</span>
              </div>
              <h2 className="font-sora font-bold text-[36px] lg:text-[44px] text-[#0B2B1C] leading-[1.12] tracking-[-0.025em] mb-5">AI-powered grouping.</h2>
              <p className="text-slate-500 text-[16px] leading-[1.8] mb-7">Our engine automatically groups transactions using GST-ready classifications. Review, adjust, and confirm in bulk — in seconds.</p>
              <ul className="space-y-3.5">
                {['Intelligent pattern matching', 'GST-compliant category structure', 'Bulk editing for speed'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#B2D71E] flex items-center justify-center flex-shrink-0"><CheckCircle2 className="h-3 w-3 text-[#0B2B1C]" /></div>
                    <span className="text-slate-600 text-[13px] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-full bg-[#0B2B1C] flex items-center justify-center">
                  <span className="font-sora font-bold text-[#B2D71E] text-[10px]">03</span>
                </div>
                <span className="font-semibold text-[10px] text-[#0B2B1C]/60 uppercase tracking-widest">Export</span>
              </div>
              <h2 className="font-sora font-bold text-[36px] lg:text-[44px] text-[#0B2B1C] leading-[1.12] tracking-[-0.025em] mb-5">Instantly ready audit reports.</h2>
              <p className="text-slate-500 text-[16px] leading-[1.8] mb-7">Download professional P&L, Balance Sheets, and Cash Flow statements. CA-ready, tax-filing ready, investor-ready.</p>
              <div className="flex flex-wrap gap-2">
                {['P&L Statement', 'Balance Sheet', 'GST Report', 'Cash Flow'].map((tag, i) => (
                  <span key={i} className="bg-[#0B2B1C]/6 text-[#0B2B1C] text-[12px] font-medium px-4 py-2 rounded-lg border border-[#0B2B1C]/10">{tag}</span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[#0B2B1C]/6 blur-[60px] rounded-full" />
              <div className="relative bg-white rounded-2xl p-7 shadow-lg border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-widest mb-1">Financial Report</p>
                    <h3 className="font-sora font-bold text-[18px] text-[#0B2B1C]">Monthly Summary</h3>
                  </div>
                  <div className="w-9 h-9 bg-[#B2D71E] rounded-xl flex items-center justify-center">
                    <span className="text-[#0B2B1C] text-[8px] font-bold">PDF</span>
                  </div>
                </div>
                <div className="space-y-3.5 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[13px]">Total Revenue</span>
                    <span className="font-sora font-semibold text-[#0B2B1C] text-[16px]">₹12,40,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[13px]">Operating Expenses</span>
                    <span className="font-sora font-semibold text-red-500 text-[15px]">−₹8,10,240</span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#0B2B1C] text-[14px]">Monthly Profit</span>
                    <span className="font-sora font-bold text-[22px] text-emerald-500">₹4,29,760</span>
                  </div>
                </div>
                <Button className="w-full mt-5 bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white rounded-xl h-11 font-semibold text-[13px] gap-2">
                  <BarChart3 className="h-4 w-4" />Export Full Report
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feature grid */}
      <div className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="font-sora font-bold text-[32px] text-[#0B2B1C] tracking-[-0.02em] mb-3">Built for modern Indian business.</h2>
            <p className="text-slate-400 text-[14px] max-w-lg mx-auto">Powerful features keeping your finances organized and audit-ready.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: 'Secure Vault', desc: 'Enterprise-grade security for your data.' },
              { icon: Zap, title: 'Fast Processing', desc: 'Reports generated in under 60 seconds.' },
              { icon: FilePieChart, title: 'In-Depth Analysis', desc: 'Visualize spending patterns over time.' },
              { icon: ArrowRight, title: 'Multi-Bank', desc: 'All major Indian schedule banks.' },
            ].map((feature, i) => (
              <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.07 }}
                className="group bg-[#F6F6F3] p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 bg-[#0B2B1C] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#B2D71E] transition-colors">
                  <feature.icon className="h-[18px] w-[18px] text-white group-hover:text-[#0B2B1C] transition-colors" />
                </div>
                <h3 className="font-sora font-semibold text-[#0B2B1C] text-[14px] mb-1.5">{feature.title}</h3>
                <p className="text-slate-400 text-[13px] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-6 bg-[#0B2B1C] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_72%_0%,rgba(178,215,30,0.12)_0%,transparent_65%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div {...fadeIn}>
            <h2 className="font-sora font-bold text-[40px] lg:text-[52px] text-white leading-[1.08] tracking-[-0.025em] mb-5">
              Take control of your<br /><span className="text-[#B2D71E]">accounting today.</span>
            </h2>
            <p className="text-white/40 text-[15px] mb-8 max-w-sm mx-auto leading-relaxed">Join 1,500+ professionals using Vitta for their financial reporting.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/signup"><Button className="h-[50px] px-9 bg-[#B2D71E] hover:bg-[#c5ef20] text-[#0B2B1C] rounded-xl font-sora font-semibold text-[14px] shadow-xl shadow-[#B2D71E]/20">Start your free trial</Button></Link>
              <Link to="/contact"><Button variant="ghost" className="h-[50px] px-9 text-white/50 hover:text-white hover:bg-white/[0.07] rounded-xl font-medium text-[14px] border border-white/10">Book a demo</Button></Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorks;