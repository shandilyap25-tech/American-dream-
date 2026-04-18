import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Filter, 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  Building,
  ChevronDown,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  LeasingCall, 
  fetchLeasingCalls, 
  updateCallStatus 
} from '../lib/propertyService';

export const AdminDashboard = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [calls, setCalls] = useState<LeasingCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadCalls = async () => {
    setLoading(true);
    const data = await fetchLeasingCalls({ 
      status: filterStatus === 'all' ? undefined : filterStatus as any 
    });
    setCalls(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) loadCalls();
  }, [isOpen, filterStatus]);

  const handleStatusUpdate = async (id: string, status: LeasingCall['status']) => {
    await updateCallStatus(id, status);
    loadCalls(); // Refresh
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-black/95 backdrop-blur-2xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="relative w-full h-full bg-brand-charcoal border border-white/5 rounded-[48px] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-serif italic text-white mb-1">Executive Dashboard.</h2>
              <p className="text-brand-gold text-[10px] uppercase tracking-[0.4em] font-bold">Leasing Lead Management</p>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                 {['all', 'pending', 'contacted', 'closed'].map(s => (
                   <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-6 py-2 rounded-lg text-[9px] uppercase font-bold tracking-widest transition-all
                      ${filterStatus === s ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
                   >
                     {s}
                   </button>
                 ))}
               </div>
               <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
               >
                 <X className="w-5 h-5 text-white" />
               </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-grow overflow-auto p-10 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold border-b border-white/5 pb-6">
                    <th className="pb-6 pl-4">Client / Company</th>
                    <th className="pb-6">Requirement</th>
                    <th className="pb-6">Preferred Window</th>
                    <th className="pb-6">Status</th>
                    <th className="pb-6 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {calls.map((call) => (
                    <tr key={call.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-8 pl-4">
                        <div className="font-serif text-xl text-white mb-1">{call.fullName}</div>
                        <div className="text-[10px] uppercase tracking-widest text-brand-gold/60 font-bold">{call.companyName}</div>
                        <div className="flex items-center gap-4 mt-3 text-white/30 text-xs">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {call.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {call.phone}</span>
                        </div>
                      </td>
                      <td className="py-8">
                        <div className="text-white/70 text-sm mb-1">{call.spaceRequired} sq ft</div>
                        <div className="text-[9px] uppercase tracking-widest text-white/30">{call.preferredPropertyType}</div>
                      </td>
                      <td className="py-8">
                        <div className="text-white text-sm mb-1">{call.preferredDate}</div>
                        <div className="text-white/40 text-xs">{call.preferredTime}</div>
                      </td>
                      <td className="py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest font-bold border
                          ${call.status === 'pending' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 
                            call.status === 'contacted' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 
                            'bg-green-500/10 border-green-500/20 text-green-500'}`}
                        >
                          {call.status}
                        </span>
                      </td>
                      <td className="py-8 text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                           {call.status !== 'closed' && (
                             <button 
                              onClick={() => handleStatusUpdate(call.id!, 'contacted')}
                              className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand-gold/20 hover:text-brand-gold transition-all text-white/30"
                              title="Mark Contacted"
                             >
                               <Phone className="w-4 h-4" />
                             </button>
                           )}
                           <button 
                            onClick={() => handleStatusUpdate(call.id!, 'closed')}
                            className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-green-500/20 hover:text-green-500 transition-all text-white/30"
                            title="Close / Signed"
                           >
                             <CheckCircle className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
