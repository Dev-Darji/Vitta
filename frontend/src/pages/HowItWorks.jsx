import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Upload, CheckCircle2, Shield, Zap, BarChart3, ArrowRight, MousePointer2, FilePieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-44 pb-32 px-4 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(200,233,71,0.12)_0%,rgba(0,0,0,0)_70%)]" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-heading font-extrabold text-5xl lg:text-7xl text-white mb-8 tracking-tight">
              Simple. Automated. <span className="text-accent">Professional.</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-12">
              Vitta streamlines your accounting by converting complex bank data into 
              beautiful, ready-to-use financial reports in minutes.
            </p>
            <div className="flex justify-center">
              <div className="w-20 h-1.5 bg-accent rounded-full animate-pulse" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Process Headline */}
      <div className="bg-white py-16 border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="font-heading font-bold text-3xl text-primary mb-4">Our 3-Step Success Framework</h2>
          <p className="text-slate-600">Designed to save you hours of manual data entry and spreadsheet headaches.</p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-32">
          
          {/* Step 1: Upload */}
          <motion.div {...fadeInUp} className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-primary px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Step 01
              </div>
              <h2 className="font-heading font-bold text-4xl lg:text-5xl text-primary leading-tight">
                Securely Upload Your <br/>Bank Statements
              </h2>
              <p className="text-lg text-slate-600">
                Simply drag and drop your statements. We support CSV and machine-readable PDFs from all major Indian banks including SBI, HDFC, ICICI, and Axis.
              </p>
              <ul className="space-y-4">
                {[
                  'Bank-level AES-256 encryption',
                  'Automatic text extraction technology',
                  'Supports multiple bank formats'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
              <div className="relative bg-white rounded-3xl p-10 shadow-2xl border border-slate-100">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center hover:border-accent transition-colors group cursor-pointer">
                  <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-primary font-bold text-xl mb-2">Drop Statement Here</p>
                  <p className="text-slate-400 text-sm">PDF or CSV files supported</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2: Classify */}
          <motion.div {...fadeInUp} className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <div className="relative bg-[#0F392B] rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  {[
                    { label: 'Amazon Business', cat: 'Office Supplies', val: '₹4,500' },
                    { label: 'WeWork Office', cat: 'Rent & Utilities', val: '₹45,000' },
                    { label: 'Uber for Business', cat: 'Travel', val: '₹1,200' }
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{row.label}</span>
                        <span className="text-accent text-xs font-bold uppercase mt-1 px-2 py-0.5 bg-accent/10 rounded w-fit">{row.cat}</span>
                      </div>
                      <span className="text-white font-bold">{row.val}</span>
                    </div>
                  ))}
                  <div className="pt-4 flex justify-center">
                    <div className="bg-accent text-primary px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                       <MousePointer2 className="h-3 w-3" />
                       Auto-Classifying Transactions...
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-primary px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Step 02
              </div>
              <h2 className="font-heading font-bold text-4xl lg:text-5xl text-primary leading-tight">
                AI-Powered <br/>Categorization
              </h2>
              <p className="text-lg text-slate-600">
                Our smart engine automatically categorizes your transactions using GST-ready classifications. Review, adjust, and confirm in bulk.
              </p>
              <ul className="space-y-4">
                {[
                  'Intelligent pattern matching',
                  'GST-compliant category structure',
                  'Bulk editing tools for speed'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Step 3: Generate Reports */}
          <motion.div {...fadeInUp} className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-primary px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Step 03
              </div>
              <h2 className="font-heading font-bold text-4xl lg:text-5xl text-primary leading-tight">
                Instantly Ready <br/>Audit Reports
              </h2>
              <p className="text-lg text-slate-600">
                Download professional Profit & Loss, Balance Sheets, and Cash Flow statements. Ready for your CA, tax filing, or internal review.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {['P&L Statement', 'Balance Sheet', 'GST Report', 'Cash Flow'].map((tag, i) => (
                   <span key={i} className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-200">
                     {tag}
                   </span>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                   <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-primary font-bold">PDF</div>
                </div>
                <div className="border-b border-slate-100 pb-6 mb-8">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Internal Report</p>
                  <h3 className="font-heading font-bold text-2xl text-primary">Financial Summary</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="font-bold text-primary text-xl">₹12,40,000</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-sm font-medium">Operating Expenses</span>
                    <span className="font-bold text-red-500 text-lg">-₹8,10,240</span>
                  </div>
                  <div className="h-px bg-slate-100 w-full" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">Monthly Profit</span>
                    <span className="font-extrabold text-[#10B981] text-2xl">₹4,29,760</span>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/95 text-white rounded-xl py-6 font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Export Full Report
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Features Grid */}
      <div className="py-32 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <h2 className="font-heading font-bold text-4xl text-primary mb-6">Designed for Modern Indian Business</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Powerful features to keep your business finances organized and audit-ready.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Secure Vault', desc: 'Enterprise-grade security for your data' },
              { icon: Zap, title: 'Fast Processing', desc: 'Reports generated in under 60 seconds' },
              { icon: FilePieChart, title: 'In-Depth Analysis', desc: 'Visualize your spending trends over time' },
              { icon: ArrowRight, title: 'Multi-Bank', desc: 'Supports all major Indian schedule banks' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent transition-colors">
                  <feature.icon className="h-7 w-7 text-white group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-lg text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 px-4 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(200,233,71,0.1)_0%,rgba(0,0,0,0)_60%)]" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[3rem] p-16 lg:p-24"
          >
            <h2 className="font-heading font-extrabold text-5xl lg:text-7xl text-white mb-8">
              Take Control of Your <br/> <span className="text-accent underline decoration-accent/30 underline-offset-8">Accounting</span> Today
            </h2>
            <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
              Ready to stop wasting hours on spreadsheets? Join over 1,500+ professionals using Vitta for their financial reporting.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
               <Link to="/signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-bold px-12 py-8 rounded-full text-xl shadow-2xl shadow-accent/20 transition-all active:scale-95">
                  Start Your Free Trial
                </Button>
               </Link>
               <Link to="/contact">
                <Button variant="outline" size="lg" className="border-2 border-white/20 text-white bg-transparent hover:bg-white hover:text-primary px-12 py-8 rounded-full text-xl transition-all">
                  Book a Demo
                </Button>
               </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HowItWorks;