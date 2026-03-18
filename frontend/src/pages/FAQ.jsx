import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, ShieldCheck, Zap, Globe, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
  *, body { font-family: 'Geist', 'Geist Fallback', -apple-system, sans-serif; }
  .font-sora { font-family: 'Sora', sans-serif; }
`;

const FAQ = () => {
  const fadeIn = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } };

  const faqCategories = [
    {
      title: 'Getting Started', icon: <Zap className="w-4 h-4 text-[#B2D71E]" />,
      items: [
        { question: 'What file formats are supported?', answer: 'We support machine-readable CSV and PDF formats for bank statements from all major Indian banks including SBI, HDFC, ICICI, Axis, and more.' },
        { question: 'How do I import my first statement?', answer: 'Log in to your dashboard, click "Import Statement," and drag your PDF or CSV file into the secure upload zone. Our AI engine handles the extraction and classification automatically.' },
      ]
    },
    {
      title: 'Security & Trust', icon: <ShieldCheck className="w-4 h-4 text-[#B2D71E]" />,
      items: [
        { question: 'Is my data secure?', answer: 'Absolutely. We use enterprise-grade AES-256 encryption for all data — in transit and at rest. We never store bank credentials or perform direct bank logins on your behalf.' },
        { question: 'Who can see my financial reports?', answer: 'Only you and the users you explicitly invite (such as your CA) have access to your data. We adhere to strict data privacy standards and never share your information with third parties.' },
      ]
    },
    {
      title: 'Reporting & AI', icon: <Globe className="w-4 h-4 text-[#B2D71E]" />,
      items: [
        { question: 'How accurate is the AI grouping?', answer: 'Our proprietary AI analyzes transaction particulars and matches them against thousands of merchant patterns, achieving up to 98% categorization accuracy. You can manually adjust any classification before export.' },
        { question: 'Can I export my reports?', answer: 'Yes. You can download professional-grade PDF and Excel reports. All reports are audit-ready and suitable for sharing with your Chartered Accountant or for tax filings.' },
      ]
    },
  ];

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
                <HelpCircle className="w-3.5 h-3.5 text-[#B2D71E]" />
                <span className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">Support Center</span>
              </div>
              <h1 className="font-sora font-bold text-[48px] lg:text-[64px] text-white leading-[1.07] tracking-[-0.03em] mb-5">
                Common<br /><span className="text-[#B2D71E]">questions.</span>
              </h1>
              <p className="text-white/45 text-[16px] max-w-lg mx-auto leading-[1.8]">Everything you need to know about setting up and automating your business accounting with Vitta.</p>
            </motion.div>
          </div>
        </div>

        <div className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8 mb-16">
              {faqCategories.map((category, catIndex) => (
                <motion.div key={catIndex} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIndex * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0B2B1C] flex items-center justify-center">{category.icon}</div>
                    <h2 className="font-sora font-semibold text-[#0B2B1C] text-[11px] uppercase tracking-widest">{category.title}</h2>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <Accordion type="single" collapsible>
                      {category.items.map((item, itemIndex) => (
                        <AccordionItem key={itemIndex} value={`cat-${catIndex}-item-${itemIndex}`} className="border-b border-slate-50 last:border-0">
                          <AccordionTrigger className="text-left font-sora font-semibold text-[#0B2B1C] text-[15px] hover:no-underline hover:text-[#0B2B1C]/70 py-5 px-6 [&[data-state=open]>svg]:rotate-180 transition-colors">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-slate-500 text-[14px] leading-[1.8] pb-5 px-6">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.4 }}
              className="bg-[#0B2B1C] rounded-2xl p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_70%_0%,rgba(178,215,30,0.1)_0%,transparent_65%)]" />
              <div className="relative z-10">
                <h2 className="font-sora font-bold text-[22px] text-white mb-2">Still have questions?</h2>
                <p className="text-white/40 mb-7 text-[13px] max-w-xs mx-auto leading-relaxed">Our support team is here to help you around the clock.</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to="/contact">
                    <Button className="h-11 px-7 bg-[#B2D71E] hover:bg-[#c5ef20] text-[#0B2B1C] rounded-xl font-semibold text-[13px] gap-2 shadow-md shadow-[#B2D71E]/20">
                      Chat with us <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <a href="mailto:support@vitta.in">
                    <Button variant="ghost" className="h-11 px-7 text-white/50 hover:text-white hover:bg-white/[0.07] rounded-xl font-medium text-[13px] border border-white/10 gap-2">
                      Drop an email <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </a>
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

export default FAQ;