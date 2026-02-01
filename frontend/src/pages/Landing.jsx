import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileCheck, 
  BarChart3, 
  Shield, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  MousePointer2,
  Lock,
  Zap,
  LayoutDashboard,
  Star
} from 'lucide-react';

const Landing = () => {
  const [billingPeriod, setBillingPeriod] = React.useState('monthly');

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
      <section className="relative pt-44 pb-32 px-4 overflow-hidden bg-primary">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(200,233,71,0.12)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_50%,rgba(200,233,71,0.08)_0%,rgba(0,0,0,0)_60%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-24">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 text-left"
            >
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">v2.0 Now Live</span>
              </div>
              
              <h1 className="font-heading font-extrabold text-4xl lg:text-5xl xl:text-6xl text-white leading-[1.05] tracking-tight mb-8">
                Your Bank Statements, <br />
                <span className="text-accent italic underline decoration-accent/30 underline-offset-8">Automated.</span>
              </h1>
              
              <p className="text-xl text-white/80 mb-10 leading-relaxed max-w-xl">
                The fastest way to transform complex bank data into professional-grade 
                financial reports. Built for modern Indian entrepreneurs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <Link to="/signup">
                  <Button 
                    size="lg" 
                    className="rounded-full bg-accent hover:bg-accent/90 text-primary px-12 py-8 text-xl font-bold shadow-2xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="rounded-full border-2 border-white/20 text-white bg-transparent hover:bg-white hover:text-primary px-12 py-8 text-xl font-bold w-full sm:w-auto transition-all"
                  >
                    See How It Works
                  </Button>
                </Link>
              </div>
              
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white/5 overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-primary bg-accent flex items-center justify-center text-[10px] text-primary font-bold">5k+</div>
                </div>
                <p className="text-white/50 text-sm font-medium italic">"The only tool my accountant actually loves using."</p>
              </div>
            </motion.div>

            {/* Right Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="lg:w-5/12 relative my-12"
            >
              <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 backdrop-blur-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                {/* Dashboard Inner */}
                <div className="bg-white rounded-[1.8rem] overflow-hidden shadow-inner">
                  <div className="h-10 border-b border-slate-100 bg-slate-50/50 flex items-center px-4 gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    <div className="flex-1 text-center">
                      <div className="bg-slate-200/50 h-3.5 w-32 rounded-full mx-auto" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                           <LayoutDashboard className="h-5 w-5 text-white" />
                         </div>
                         <div className="h-4 w-24 bg-slate-100 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-accent/20 rounded-full" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8">
                       {[1,2,3].map(i => (
                         <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="h-3 w-12 bg-slate-200 rounded mb-3" />
                            <div className="h-5 w-16 bg-slate-300 rounded" />
                         </div>
                       ))}
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { name: 'Rent Payment', price: '₹45,000', tag: 'EXPENSE' },
                        { name: 'Razorpay Payout', price: '₹1,24,000', tag: 'INCOME' },
                        { name: 'Cloud Server', price: '₹8,490', tag: 'EXPENSE' }
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                                <FileCheck className="h-4 w-4 text-slate-400" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-primary">{row.name}</div>
                                <div className="text-[10px] text-accent font-black uppercase mt-0.5">{row.tag}</div>
                              </div>
                           </div>
                           <div className="text-xs font-bold text-slate-600">{row.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                   animate={{ y: [0, -10, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -top-10 -right-6 bg-accent p-4 rounded-2xl shadow-2xl border border-white/20 z-20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] text-primary/60 font-black uppercase">Report Readiness</div>
                      <div className="text-lg font-bold text-primary">Instant</div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                   animate={{ y: [0, 10, 0] }}
                   transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                   className="absolute bottom-10 -left-12 bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 z-20 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <Lock className="text-green-600 h-5 w-5" />
                    </div>
                    <div className="text-xs font-bold text-primary">AES-256 Vault</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="relative z-20 -mt-10 px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-[2rem] p-10 border border-slate-100 shadow-2xl shadow-primary/10 flex flex-wrap items-center justify-center md:justify-around gap-12">
            {[
              { value: '1,500+', label: 'SMB Customers' },
              { value: '₹2.5Cr+', label: 'Cashflow Tracked' },
              { value: '98%', label: 'Categorization' },
              { value: '24/7', label: 'Priority Support' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                 <div className="text-3xl font-extrabold text-primary mb-1">{stat.value}</div>
                 <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
        </div>
      </section>

      {/* Main Feature Showcases */}
      <section className="py-32 px-4 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-24 mb-40">
             <motion.div {...fadeInUp} className="lg:w-1/2">
                <div className="inline-block bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-6 font-bold text-primary text-xs uppercase tracking-widest">
                   Proprietary Intelligence
                </div>
                <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-primary leading-tight mb-8">
                  Engineered for <br /><span className="text-slate-400">Indian Schedule Banks</span>
                </h2>
                <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                  Most accounting software fails with Indian bank statement formats. 
                  Vitta's AI engine is trained on over 500+ statement variants from 
                  ICICI, HDFC, SBI, Axis, and all major schedule banks.
                </p>
                
                <div className="space-y-6">
                   {[
                     { title: 'Zero Manual Entry', desc: 'No more copy-pasting from PDFs to Excel sheets.' },
                     { title: 'GST Integrated', desc: 'Automatic mapping to GST-compliant expense categories.' },
                     { title: 'Privacy First', desc: 'We never store your bank login or sensitive credentials.' }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                           <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                           <h4 className="font-bold text-primary">{item.title}</h4>
                           <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
             
             <motion.div 
               {...fadeInUp}
               className="lg:w-1/2 relative"
             >
                <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
                <div className="relative bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-white/10">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                   </div>
                   <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                         <div>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Assets</p>
                            <p className="text-white font-bold text-3xl">₹85,42,100</p>
                         </div>
                         <div className="text-accent text-xs font-bold">+12.4% vs LY</div>
                      </div>
                      <div className="h-32 flex items-end gap-1 px-2">
                         {[40, 60, 45, 90, 75, 55, 100, 80, 65, 85, 70, 95].map((h, i) => (
                           <div key={i} className="flex-1 bg-white/5 rounded-t hover:bg-accent transition-colors cursor-pointer" style={{ height: `${h}%` }} />
                         ))}
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                         <div className="flex items-center gap-3">
                            <Zap className="text-accent h-5 w-5" />
                            <span className="text-white/80 text-sm font-medium">Ready to File ITR-3?</span>
                         </div>
                         <button className="bg-accent text-primary text-[10px] font-black uppercase px-4 py-2 rounded-full">Automate Audit</button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>

          <motion.div {...fadeInUp} className="text-center mb-20">
            <h2 className="font-heading font-extrabold text-4xl text-primary mb-6">Designed for Modern Finance</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Elite features to keep your business finances organized and audit-ready.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Compliance Grade', desc: 'Secure data vaults exceeding global standards.' },
              { icon: Zap, title: 'Lightning Speed', desc: 'Extract and analyze data in under 15 seconds.' },
              { icon: Clock, title: 'Real-time Trends', desc: 'Visualize spending patterns as they happen.' },
              { icon: TrendingUp, title: 'Audit Ready', desc: 'One-click exports for your CA or Tax professional.' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-200 hover:shadow-2xl hover:border-accent group transition-all"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary transition-colors">
                  <feature.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-xl text-primary mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-32 px-4 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="font-heading font-extrabold text-4xl text-primary mb-6">Simple, Honest Pricing</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed mb-10">
              Start for free and scale as you grow. No hidden setups or complex tiers.
            </p>

            {/* Billing Toggle Preview */}
            <div className="flex justify-center items-center gap-4 mb-10">
              <span className={`text-xs font-black uppercase tracking-widest ${billingPeriod === 'monthly' ? 'text-primary' : 'text-slate-400'}`}>Monthly</span>
              <button 
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="w-14 h-7 bg-slate-200 rounded-full p-1 relative transition-colors"
              >
                <div className={`w-5 h-5 bg-primary rounded-full shadow-lg transition-transform ${billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-widest ${billingPeriod === 'yearly' ? 'text-primary' : 'text-slate-400'}`}>Yearly</span>
                <span className="bg-accent text-primary text-[8px] font-black px-2 py-0.5 rounded-full border border-primary/10">SAVE 20%</span>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { 
                name: 'Starter', 
                icon: Zap,
                monthlyPrice: '0', 
                yearlyPrice: '0', 
                desc: 'Perfect for freelancers', 
                features: ['5 Statements /mo', 'PDF Reports', 'Email Support'],
                popular: false 
              },
              { 
                name: 'Business', 
                icon: Star,
                monthlyPrice: '499', 
                yearlyPrice: '4790', 
                desc: 'For growing scale-ups', 
                features: ['25 Statements /mo', 'GST Categorization', 'Excel Exports'],
                popular: true 
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className={`p-10 rounded-[2.5rem] border-2 relative bg-white transition-all overflow-hidden group hover:-translate-y-2 ${
                  plan.popular ? 'border-accent shadow-2xl shadow-accent/10 ring-8 ring-accent/5' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-accent text-primary px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${
                  plan.popular ? 'bg-primary text-accent' : 'bg-slate-50 text-slate-400'
                }`}>
                  <plan.icon className="h-7 w-7" />
                </div>
                <h3 className="font-heading font-bold text-2xl text-primary mb-2 tracking-tight">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-8 font-medium">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black text-primary transition-all">₹{billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}</span>
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/{billingPeriod === 'monthly' ? 'mo' : 'year'}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-primary stroke-[3]" />
                      </div>
                      <span className="text-slate-600 font-semibold text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className={`w-full rounded-2xl py-7 text-lg font-black uppercase tracking-widest transition-all ${
                    plan.popular ? 'bg-primary text-white hover:bg-primary/95 shadow-xl shadow-primary/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                    Select {plan.name}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
             <Link to="/pricing" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:text-accent transition-colors group">
                See all plans and enterprise options
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </div>
      </section>

      {/* Final Glassmorphism CTA Section */}
      <div className="py-20 px-4 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(200,233,71,0.15)_0%,rgba(0,0,0,0)_60%)]" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 lg:p-20"
          >
            <h2 className="font-heading font-extrabold text-3xl lg:text-4xl xl:text-5xl text-white mb-8">
              Ready to <span className="text-accent underline decoration-accent/30 underline-offset-8">Scale?</span>
            </h2>
            <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the 1,500+ modern businesses that have moved beyond 
              manual spreadsheets and outdated accounting.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
               <Link to="/signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-bold px-12 py-8 rounded-full text-xl shadow-2xl shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                  Launch Free Trial
                </Button>
               </Link>
               <Link to="/pricing">
                <Button variant="outline" size="lg" className="border-2 border-white/30 text-white bg-transparent hover:bg-white hover:text-primary px-12 py-8 rounded-full text-xl font-bold transition-all">
                  Compare Plans
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

export default Landing;