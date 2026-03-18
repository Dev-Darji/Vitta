import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Check, ArrowRight, Zap, Star, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = React.useState('monthly');
  const fadeIn = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } };

  const plans = [
    { name: 'Starter', icon: Zap, mp: '0', yp: '0', period: '/forever', desc: 'Ideal for sole proprietors beginning their digital finance journey.', features: ['5 statements per month','Basic financial reports','Email support (24h)','Cloud storage 30 days','PDF export'], cta: 'Get started free', popular: false },
    { name: 'Business', icon: Star, mp: '499', yp: '4,790', period: billingPeriod === 'monthly' ? '/per month' : '/per year', desc: 'Most popular for active SMBs and professional accountants.', features: ['25 statements per month','Advanced reports','Priority email support','Data stored 1 year','PDF & Excel export','GST-ready classification','Bulk editing tools'], cta: 'Start 14-day trial', popular: true },
    { name: 'Enterprise', icon: ShieldCheck, mp: '999', yp: '9,590', period: billingPeriod === 'monthly' ? '/per month' : '/per year', desc: 'The powerhouse for high-volume financial data processing.', features: ['Unlimited statements','Full audit-ready reports','24/7 dedicated support','Unlimited data vault','Custom tags','Multi-user workspace','API & Webhook access'], cta: 'Upgrade to Enterprise', popular: false },
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F3]">
      <style>{FONT_STYLE}</style>
      <Navbar />

      {/* Hero */}
      <div className="relative pt-36 pb-28 px-6 bg-[#0B2B1C] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_-10%,rgba(178,215,30,0.16)_0%,transparent_65%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3.5 py-1.5 rounded-full mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B2D71E]" />
              <span className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">Pricing</span>
            </div>
            <h1 className="font-sora font-bold text-[48px] lg:text-[64px] text-white leading-[1.07] tracking-[-0.03em] mb-5">
              Invest in your<br /><span className="text-[#B2D71E]">growth.</span>
            </h1>
            <p className="text-white/45 text-[16px] max-w-md mx-auto mb-10 leading-[1.8]">Transparent, scalable pricing for every stage of business. No hidden fees.</p>
            <div className="inline-flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-xl p-1.5">
              {['monthly', 'yearly'].map(p => (
                <button key={p} onClick={() => setBillingPeriod(p)}
                  className={`px-5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${billingPeriod === p ? 'bg-[#B2D71E] text-[#0B2B1C] shadow-sm' : 'text-white/40 hover:text-white/70'}`}>
                  {p === 'yearly' ? 'Yearly — save 20%' : 'Monthly'}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative -mt-10 pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Plan cards */}
          <div className="grid lg:grid-cols-3 gap-5 mb-16">
            {plans.map((plan, i) => (
              <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.08, duration: 0.65 }}
                className={`rounded-2xl p-7 border-2 flex flex-col relative transition-all hover:-translate-y-2 duration-300 group ${plan.popular ? 'bg-[#0B2B1C] border-[#0B2B1C] shadow-2xl shadow-[#0B2B1C]/20' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl'}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#B2D71E] text-[#0B2B1C] text-[9px] font-bold uppercase tracking-widest px-5 py-1.5 rounded-full shadow-md">Most popular</div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${plan.popular ? 'bg-[#B2D71E]' : 'bg-slate-50 group-hover:bg-[#0B2B1C]/5 transition-colors'}`}>
                  <plan.icon className={`h-5 w-5 ${plan.popular ? 'text-[#0B2B1C]' : 'text-slate-400 group-hover:text-[#0B2B1C] transition-colors'}`} />
                </div>
                <h3 className={`font-sora font-bold text-[20px] mb-1 ${plan.popular ? 'text-white' : 'text-[#0B2B1C]'}`}>{plan.name}</h3>
                <p className={`text-[12px] mb-6 leading-relaxed ${plan.popular ? 'text-white/40' : 'text-slate-400'}`}>{plan.desc}</p>
                <div className={`mb-7 p-4 rounded-xl border ${plan.popular ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-slate-50/60 border-slate-100/60'}`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`font-sora font-bold text-[38px] tracking-[-0.02em] ${plan.popular ? 'text-white' : 'text-[#0B2B1C]'}`}>₹{billingPeriod === 'monthly' ? plan.mp : plan.yp}</span>
                    <span className={`text-[10px] font-medium uppercase tracking-widest ${plan.popular ? 'text-white/30' : 'text-slate-400'}`}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular ? 'bg-[#B2D71E]/15' : 'bg-[#0B2B1C]/6'}`}>
                        <Check className={`h-2.5 w-2.5 stroke-[3] ${plan.popular ? 'text-[#B2D71E]' : 'text-[#0B2B1C]'}`} />
                      </div>
                      <span className={`text-[13px] font-medium ${plan.popular ? 'text-white/60' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className={`w-full rounded-xl h-11 font-semibold text-[13px] gap-2 transition-all ${plan.popular ? 'bg-[#B2D71E] hover:bg-[#c5ef20] text-[#0B2B1C] shadow-md shadow-[#B2D71E]/20' : 'bg-[#0B2B1C] hover:bg-[#0B2B1C]/90 text-white'}`}>
                    {plan.cta}<ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Trust row */}
          <motion.div {...fadeIn} className="grid md:grid-cols-3 gap-4 py-10 border-y border-slate-100/80 mb-16">
            {[{title:'Secure Payments',desc:'PCI-DSS compliant processing',icon:ShieldCheck},{title:'Cancel Anytime',desc:'No long-term contracts',icon:Zap},{title:'GST Invoicing',desc:'Download GST-ready tax invoices',icon:Star}].map((box,i)=>(
              <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#0B2B1C]/5 flex items-center justify-center flex-shrink-0">
                  <box.icon className="h-4.5 w-4.5 text-[#0B2B1C] h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="font-semibold text-[#0B2B1C] text-[13px]">{box.title}</p>
                  <p className="text-slate-400 text-[12px] mt-0.5">{box.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Comparison table */}
          <motion.div {...fadeIn} className="text-center mb-10">
            <h3 className="font-sora font-bold text-[30px] text-[#0B2B1C] tracking-[-0.02em] mb-2">Compare plans</h3>
            <p className="text-slate-400 text-[14px]">Deep dive into what's included at each tier.</p>
          </motion.div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-16">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Feature</th>
                  {['Starter','Business','Enterprise'].map(n=><th key={n} className="p-5 text-[9px] font-bold uppercase tracking-widest text-[#0B2B1C]">{n}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  {label:'Bank Statement Imports',vals:['5/mo','25/mo','Unlimited']},
                  {label:'AI Classification',vals:[true,true,true]},
                  {label:'GST Reports',vals:[false,true,true]},
                  {label:'Multi-User Support',vals:[false,false,true]},
                  {label:'API Access',vals:[false,false,true]},
                  {label:'Priority Support',vals:[false,true,true]},
                  {label:'Custom PDF Reports',vals:[true,true,true]},
                ].map((row,i)=>(
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-[13px] font-medium text-slate-700">{row.label}</td>
                    {row.vals.map((v,j)=>(
                      <td key={j} className="p-5">
                        {typeof v==='boolean'
                          ? v ? <div className="w-5 h-5 rounded-full bg-[#B2D71E] flex items-center justify-center"><Check className="h-2.5 w-2.5 text-[#0B2B1C] stroke-[3]" /></div>
                              : <X className="h-4 w-4 text-slate-200" />
                          : <span className="font-sora font-semibold text-[13px] text-[#0B2B1C]">{v}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom CTA */}
          <motion.div {...fadeIn} className="bg-[#0B2B1C] rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_30%_30%,rgba(178,215,30,0.1)_0%,transparent_70%)]" />
            <div className="relative z-10">
              <h3 className="font-sora font-bold text-[26px] text-white mb-2">Still have questions?</h3>
              <p className="text-white/40 mb-7 max-w-md mx-auto text-[14px] leading-relaxed">We're here to help you find the right plan for your needs and future growth.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/faq"><Button className="h-11 px-7 bg-[#B2D71E] hover:bg-[#c5ef20] text-[#0B2B1C] rounded-xl font-semibold text-[13px] shadow-md shadow-[#B2D71E]/20">Browse FAQ</Button></Link>
                <Link to="/contact"><Button variant="ghost" className="h-11 px-7 text-white/50 hover:text-white hover:bg-white/[0.07] rounded-xl font-medium text-[13px] border border-white/10">Contact support</Button></Link>
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