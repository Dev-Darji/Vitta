import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  History, User, Activity, Clock, Shield, Search, 
  Filter, FileText, Settings, CreditCard, Users, 
  ArrowRight, CheckCircle2, AlertCircle, Info, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data);
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'update': return <Activity className="h-3.5 w-3.5 text-amber-500" />;
      case 'delete': return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
      case 'bulk_apply': return <Activity className="h-3.5 w-3.5 text-indigo-500" />;
      default: return <Info className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getResourceIcon = (resource) => {
    switch (resource) {
      case 'invoice': return <FileText className="h-4 w-4" />;
      case 'transaction': return <CreditCard className="h-4 w-4" />;
      case 'automation_rule': return <Settings className="h-4 w-4" />;
      case 'client': return <Users className="h-4 w-4" />;
      case 'automation': return <Tag className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      relative: new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)), 'day'
      )
    };
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <History className="h-7 w-7 text-indigo-600" />
            Audit Intelligence
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Complete Fiscal Accountability & Activity Tracking
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 focus:ring-slate-900 text-[13px] font-medium"
            />
          </div>
          <Button onClick={fetchLogs} variant="outline" className="h-10 rounded-xl border-slate-200 px-4">
            <Activity className={`h-4 w-4 text-slate-500 ${loading ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Activity className="h-7 w-7 text-slate-300" />
          </motion.div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Reconstructing events...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Detail</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 leading-snug max-w-md">
                          {log.details}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center">
                          {getResourceIcon(log.resource)}
                        </div>
                        <Badge variant="outline" className="border-indigo-100 bg-indigo-50/30 text-indigo-700 text-[10px] font-black uppercase px-2 py-0">
                          {log.resource}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-900">{formatDate(log.timestamp).full}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(log.timestamp).relative}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium text-[13px]">
                      No audit records found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
