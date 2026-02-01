import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Check, ArrowRight, Zap, Star, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = React.useState('monthly');

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      monthlyPrice: '0',
      yearlyPrice: '0',
      period: billingPeriod === 'monthly' ? '/forever' : '/forever',
      description: 'Ideal for sole proprietors starting their digital financial journey.',
      features: [
        '5 statements per month',
        'Basic financial reports',
        'Email support (24h response)',
        'Cloud storage for 30 days',
        'Direct PDF export'
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Business',
      icon: Star,
      monthlyPrice: '499',
      yearlyPrice: '4790',
      period: billingPeriod === 'monthly' ? '/per month' : '/per year',
      description: 'Our most popular plan for active SMBs and professional accountants.',
      features: [
        '25 statements per month',
        'Advanced financial reports',
        'Priority email support',
        'Data stored for 1 year',
        'PDF & Excel export',
        'GST-ready classification',
        'Bulk editing tools'
      ],
      cta: 'Start 14-Day Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      icon: ShieldCheck,
      monthlyPrice: '999',
      yearlyPrice: '9590',
      period: billingPeriod === 'monthly' ? '/per month' : '/per year',
      description: 'The ultimate power-house for high-volume financial data processing.',
      features: [
        'Unlimited statements',
        'Full audit-ready reports',
        '24/7 dedicated support',
        'Unlimited data vault',
        'Custom classification tags',
        'Multi-user workspace',
        'API & Webhook access'
      ],
      cta: 'Upgrade to Pro',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-44 pb-32 px-4 overflow-hidden bg-primary text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(200,233,71,0.1)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-heading font-extrabold text-5xl lg:text-7xl text-white mb-6 tracking-tight text-balance">
              Invest in Your <span className="text-accent underline decoration-accent/30 underline-offset-8">Growth</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Transparent, scalable pricing for every stage of your business. 
              Switch between billing periods to find your perfect fit.
            </p>

            {/* Billing Toggle */}
            <div className="mt-12 flex justify-center items-center gap-4">
              <span className={`text-sm font-bold tracking-widest uppercase transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-white/40'}`}>Monthly</span>
              <button 
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="w-16 h-8 bg-white/10 rounded-full p-1 relative transition-colors hover:bg-white/20"
              >
                <div className={`w-6 h-6 bg-accent rounded-full shadow-lg transition-transform duration-300 ${billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tracking-widest uppercase transition-colors ${billingPeriod === 'yearly' ? 'text-white' : 'text-white/40'}`}>Yearly</span>
                <span className="bg-accent/20 text-accent text-[10px] font-black px-2 py-1 rounded-full border border-accent/30">SAVE 20%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative -mt-16 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 mb-24">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-[2.5rem] p-10 border-2 relative flex flex-col transition-all duration-500 group hover:-translate-y-3 ${
                  plan.popular 
                    ? 'border-accent shadow-[0_40px_80px_-15px_rgba(200,233,71,0.2)] ring-8 ring-accent/5' 
                    : 'border-slate-100 hover:border-slate-300 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-accent px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border border-accent/20">
                    Most Popular Choice
                  </div>
                )}
                
                <div className="mb-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 ${
                    plan.popular 
                      ? 'bg-primary text-accent rotate-[-6deg] group-hover:rotate-0' 
                      : 'bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary group-hover:scale-110'
                  }`}>
                    <plan.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-black text-3xl text-primary mb-2 tracking-tight">{plan.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">{plan.description}</p>
                </div>

                <div className="mb-10 p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-primary tracking-tighter transition-all">
                      ₹{billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{plan.period}</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.monthlyPrice !== '0' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent-dark text-[10px] font-black mt-2 text-primary/40 uppercase tracking-wider">
                      Billed annually (Save substantial)
                    </motion.p>
                  )}
                </div>

                <div className="flex-grow">
                  <ul className="space-y-5 mb-12">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-4 group/item">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 transition-colors ${
                          plan.popular ? 'bg-accent/20 text-primary' : 'bg-slate-100 text-slate-400 group-hover/item:bg-primary/10 group-hover/item:text-primary'
                        }`}>
                          <Check className="h-3 w-3 stroke-[4]" />
                        </div>
                        <span className="text-slate-700 font-semibold text-sm tracking-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link to="/signup" className="mt-auto">
                  <Button
                    size="lg"
                    className={`w-full rounded-2xl py-9 text-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/95 text-white shadow-primary/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-transparent hover:shadow-slate-200/50'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className={`h-5 w-5 ${plan.popular ? 'text-accent' : 'text-primary'}`} />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Trust Section */}
          <motion.div {...fadeInUp} className="grid md:grid-cols-3 gap-8 py-16 border-y border-slate-200/60 mb-24">
            {[
              { title: 'Secure Payments', desc: 'PCI-DSS compliant processing', icon: ShieldCheck },
              { title: 'Cancel Anytime', desc: 'No long-term contracts', icon: Zap },
              { title: 'Gst Invoicing', desc: 'Download GST-ready bills', icon: Star }
            ].map((box, i) => (
              <div key={i} className="flex items-center gap-5 px-8">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group hover:bg-primary hover:text-white transition-all">
                   <box.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-primary">{box.title}</h4>
                  <p className="text-sm text-slate-600 font-medium">{box.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Detailed Comparison Table */}
          <div className="mt-32 max-w-5xl mx-auto overflow-hidden">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <h3 className="font-heading font-black text-4xl text-primary mb-4">Compare Features</h3>
              <p className="text-slate-600 font-medium text-lg">Deep dive into the specifics of each plan.</p>
            </motion.div>
            
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="p-8 text-xs font-black uppercase tracking-widest text-slate-400">Features</th>
                    <th className="p-8 text-xs font-black uppercase tracking-widest text-primary">Starter</th>
                    <th className="p-8 text-xs font-black uppercase tracking-widest text-primary">Business</th>
                    <th className="p-8 text-xs font-black uppercase tracking-widest text-primary">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: 'Bank Statement Imports', vals: ['5/mo', '25/mo', 'Unlimited'] },
                    { label: 'AI Classification', vals: [true, true, true] },
                    { label: 'Multi-User Support', vals: [false, false, true] },
                    { label: 'API Access', vals: [false, false, true] },
                    { label: 'Priority Support', vals: [false, true, true] },
                    { label: 'Custom PDF Reports', vals: [true, true, true] },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-8 text-sm font-bold text-slate-700">{row.label}</td>
                      {row.vals.map((v, j) => (
                        <td key={j} className="p-8">
                          {typeof v === 'boolean' ? (
                            v ? <Check className="h-5 w-5 text-accent stroke-[3]" /> : <X className="h-5 w-5 text-slate-200" />
                          ) : (
                            <span className="text-sm font-black text-primary">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <motion.div {...fadeInUp} className="mt-32 text-center p-16 bg-primary rounded-[4rem] relative overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(200,233,71,0.1)_0%,rgba(0,0,0,0)_70%)]" />
             <div className="relative z-10">
               <h3 className="font-heading font-black text-3xl text-white mb-4">Still have questions?</h3>
               <p className="text-white/60 mb-10 max-w-xl mx-auto font-medium text-lg leading-relaxed">
                 We're here to help you choose the right plan for your current business needs and future growth.
               </p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Link to="/faq">
                    <Button className="rounded-full px-12 py-8 bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-accent/20">
                      Read the FAQ
                    </Button>
                 </Link>
                 <Link to="/contact">
                    <Button variant="outline" className="rounded-full px-12 py-8 border-2 border-white/20 text-white hover:bg-white hover:text-primary font-black uppercase tracking-widest text-xs">
                      Contact Support
                    </Button>
                 </Link>
               </div>
             </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Pricing;