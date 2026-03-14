import React from 'react';
import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('Application Error:', error);

  let title = "Something went wrong";
  let message = "We encountered an unexpected error. Don't worry, your data is safe.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page Not Found";
      message = "The page you're looking for doesn't exist or has been moved.";
    } else if (error.status === 401) {
      title = "Not Authorized";
      message = "You don't have permission to view this page.";
    } else if (error.status === 503) {
      title = "System Under Maintenance";
      message = "We're currently updating Vitta. Please check back in a few minutes.";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="h-24 w-24 bg-red-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-200/50">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
          {title}
        </h1>
        
        <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10 px-4">
          {message}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-10 p-4 bg-slate-900 rounded-2xl text-left overflow-hidden border border-slate-800 shadow-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Developer Debug</p>
            <div className="text-xs font-mono text-slate-300 break-all bg-black/50 p-3 rounded-lg border border-white/5">
              {error?.message || error?.statusText || "Unknown Error"}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh Page
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="py-6 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-white h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="py-6 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-white h-auto"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
