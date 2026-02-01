import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, ShieldCheck, Zap, Globe, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FAQ = () => {
    const faqCategories = [
        {
            title: 'Getting Started',
            icon: <Zap className="w-5 h-5 text-accent" />,
            items: [
                {
                    question: 'What file formats are supported?',
                    answer: 'Currently, we support machine-readable CSV and PDF formats for bank statements. We support exports from all major Indian banks including SBI, HDFC, ICICI, Axis, and more.'
                },
                {
                    question: 'How do I import my first statement?',
                    answer: 'Simply log in to your dashboard, click "Import Statement," and drag your PDF or CSV file into the secure upload zone. Our AI will handle the rest.'
                }
            ]
        },
        {
            title: 'Security & Trust',
            icon: <ShieldCheck className="w-5 h-5 text-accent" />,
            items: [
                {
                    question: 'Is my data secure?',
                    answer: 'Absolutely. We use enterprise-grade AES-256 encryption. Your data is encrypted in transit and at rest. We never store bank credentials or perform direct bank logins.'
                },
                {
                    question: 'Who can see my financial reports?',
                    answer: 'Only you and the users you explicitly invite (like your CA) have access to your data. We adhere to strict data privacy standards and never share your info with third parties.'
                }
            ]
        },
        {
            title: 'Reporting & AI',
            icon: <Globe className="w-5 h-5 text-accent" />,
            items: [
                {
                    question: 'How accurate is the categorization?',
                    answer: 'Our proprietary AI engine analyzes transaction descriptions and matches them against thousands of merchant patterns, achieving up to 98% accuracy.'
                },
                {
                    question: 'Can I export my reports?',
                    answer: 'Yes! You can download professional-grade PDF and Excel reports. Our reports are designed to be audit-ready and suitable for sharing with your Chartered Accountant.'
                }
            ]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
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
                                <HelpCircle className="w-4 h-4 text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Support Center</span>
                            </div>
                            <h1 className="font-heading font-extrabold text-5xl lg:text-7xl text-white mb-8 tracking-tight leading-[1.1]">
                                Common <span className="text-accent italic underline decoration-accent/30 underline-offset-8">Questions</span>.
                            </h1>
                            <p className="max-w-2xl mx-auto text-lg lg:text-xl text-white/70 font-medium leading-relaxed">
                                Everything you need to know about setting up and automating your business accounting with Vitta.
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
                        <div className="absolute top-0 right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-20 left-[-10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />


                    {/* FAQ Categories Grid */}
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto space-y-16"
                    >
                        {faqCategories.map((category, catIndex) => (
                            <motion.div key={catIndex} variants={itemVariants} className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                                        {category.icon}
                                    </div>
                                    <h2 className="font-heading font-extrabold text-2xl text-primary uppercase tracking-tight">{category.title}</h2>
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 lg:p-10 shadow-[0_20px_40px_-12px_rgba(15,57,43,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(15,57,43,0.1)] transition-all duration-500">
                                    <Accordion type="single" collapsible className="space-y-4">
                                        {category.items.map((item, itemIndex) => (
                                            <AccordionItem 
                                                key={itemIndex} 
                                                value={`cat-${catIndex}-item-${itemIndex}`}
                                                className="border-b border-slate-50 last:border-0 pb-2"
                                            >
                                                <AccordionTrigger className="text-left font-heading font-bold text-xl text-primary hover:no-underline hover:text-primary/70 transition-all [&[data-state=open]>svg]:rotate-180 py-4 px-2">
                                                    {item.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-600 text-lg font-medium leading-relaxed pt-2 pb-6 px-2">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-24 max-w-4xl mx-auto p-12 lg:p-16 bg-primary rounded-[4rem] text-center relative overflow-hidden group shadow-2xl shadow-primary/20"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
                        
                        <div className="relative z-10">
                            <h2 className="font-heading font-extrabold text-3xl lg:text-4xl text-white mb-4">Still have questions?</h2>
                            <p className="text-white/60 mb-10 text-lg font-medium">Our world-class support team is here to help you around the clock.</p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/contact">
                                    <Button className="w-full sm:w-auto min-w-[200px] h-16 rounded-2xl bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 group/btn">
                                        Chat with Us
                                        <MessageSquare className="ml-2 w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                    </Button>
                                </Link>
                                <a href="mailto:support@vitta.in">
                                    <Button variant="outline" className="w-full sm:w-auto min-w-[200px] h-16 rounded-2xl border-white/20 text-white hover:bg-white hover:text-primary font-black uppercase tracking-widest transition-all">
                                        Drop an Email
                                        <ArrowRight className="ml-2 w-4 h-4" />
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