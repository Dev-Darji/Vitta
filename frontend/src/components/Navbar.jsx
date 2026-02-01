import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHover, setActiveHover] = useState(null);
  const location = useLocation();

  const isLightPage = ['/login', '/signup'].includes(location.pathname);
  const shouldShowSolid = scrolled || isLightPage;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const menuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    opened: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const linkVariants = {
    closed: { opacity: 0, x: -20 },
    opened: { opacity: 1, x: 0 }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 flex justify-center ${
      scrolled ? 'pt-4' : 'pt-0'
    }`}>
      <nav 
        className={`transition-all duration-500 ease-out ${
          scrolled 
            ? 'mx-4 max-w-6xl w-full bg-white/80 backdrop-blur-2xl rounded-[1.5rem] border border-accent/40 py-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]' 
            : isLightPage
              ? 'w-full bg-white border-b border-slate-100 py-4'
              : 'w-full bg-transparent border-b border-transparent py-6'
        }`}
      >
        <div className={`mx-auto px-6 lg:px-10 transition-all duration-500`}>
          <div className="flex items-center h-14">
            {/* Logo Area */}
            <div className="flex-1">
              <Link to="/" className="group flex items-center space-x-3 w-fit">
                <motion.div 
                  whileHover={{ rotate: -10, scale: 1.1 }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                    shouldShowSolid ? 'bg-primary shadow-primary/10' : 'bg-accent shadow-accent/20'
                  }`}
                >
                  <span className={`font-black text-lg italic ${shouldShowSolid ? 'text-accent' : 'text-primary'}`}>V</span>
                </motion.div>
                <span className={`font-heading font-black text-xl tracking-tighter transition-colors duration-500 ${
                  shouldShowSolid ? 'text-primary' : 'text-white' 
                }`}>
                  Vitta<span className="text-accent italic">.</span>
                </span>
              </Link>
            </div>

            {/* Desktop Menu - Centered */}
            <div className={`hidden md:flex flex-2 justify-center items-center space-x-1 uppercase text-[12px] font-bold tracking-[0.15em] transition-colors duration-500 ${
              shouldShowSolid ? 'text-primary' : 'text-white'
            }`}>
              {navLinks.map((link) => (
                <motion.div
                  key={link.name}
                  onHoverStart={() => setActiveHover(link.name)}
                  onHoverEnd={() => setActiveHover(null)}
                  className="relative"
                >
                  <Link 
                    to={link.path} 
                    className="relative px-4 py-2 flex items-center group"
                  >
                    <motion.span 
                      animate={{ 
                        y: activeHover === link.name ? -2 : 0,
                      }}
                      className={`relative z-10 transition-colors duration-300 ${
                        shouldShowSolid 
                          ? (location.pathname === link.path ? 'text-primary' : 'text-primary/80 group-hover:text-primary')
                          : (location.pathname === link.path ? 'text-accent' : 'text-white/90 group-hover:text-white')
                      }`}
                    >
                      {link.name}
                    </motion.span>
                    
                    {location.pathname === link.path && !scrolled && (
                      <motion.div 
                        layoutId="nav-pill"
                        className={`absolute inset-0 rounded-full ${shouldShowSolid ? 'bg-accent/10' : 'bg-white/10'}`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <motion.div 
                      className={`absolute bottom-1 left-4 right-4 h-[2px] origin-left transition-colors duration-500 ${
                        shouldShowSolid ? 'bg-primary' : 'bg-accent'
                      }`}
                      initial={{ scaleX: 0 }}
                      animate={{ 
                        scaleX: (activeHover === link.name || (scrolled && location.pathname === link.path)) ? 1 : 0 
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Nav Actions Area */}
            <div className="flex-1 flex justify-end items-center space-x-6">
              <Link to="/login" className={`hidden lg:block text-[12px] font-black uppercase tracking-widest transition-colors duration-500 ${
                shouldShowSolid ? 'text-primary/80 hover:text-primary' : 'text-white/90 hover:text-accent'
              }`}>
                Login
              </Link>
              <Link to="/signup">
                <Button 
                  size="sm"
                  className={`rounded-full px-5 h-10 text-[11px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 duration-500 ${
                    shouldShowSolid 
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20' 
                      : 'bg-accent hover:bg-accent/90 text-primary shadow-accent/20'
                  }`}
                >
                  Get Started
                  <ArrowRight className={`ml-2 h-3 w-3 ${shouldShowSolid ? 'text-accent' : 'text-primary'}`} />
                </Button>
              </Link>

              {/* Mobile Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-500 ${
                  shouldShowSolid ? 'bg-slate-100 text-primary' : 'bg-white/10 text-white backdrop-blur-md'
                }`}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[100%] left-0 w-full bg-white z-[90] md:hidden"
            >
              <motion.div 
                variants={menuVariants}
                initial="closed"
                animate="opened"
                exit="closed"
                className="px-8 py-12 flex flex-col justify-between h-[calc(100vh-80px)]"
              >
                <div className="space-y-6">
                  {navLinks.map((link) => (
                    <motion.div key={link.name} variants={linkVariants}>
                      <Link 
                        to={link.path} 
                        onClick={() => setIsOpen(false)}
                        className="group flex items-baseline space-x-4"
                      >
                        <span className="text-slate-200 font-heading font-black text-2xl group-hover:text-accent transition-colors italic">0{navLinks.indexOf(link) + 1}</span>
                        <span className="text-5xl font-heading font-black text-primary hover:text-accent transition-colors tracking-tighter">
                          {link.name}<span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">.</span>
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-4">
                  <motion.div variants={linkVariants} className="grid grid-cols-2 gap-4">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full h-16 rounded-2xl border-2 text-primary font-black uppercase tracking-widest text-xs">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20">
                        Join Now
                      </Button>
                    </Link>
                  </motion.div>
                  <p className="text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest">© 2026 VITTA TECHNOLOGIES PVT LTD</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};