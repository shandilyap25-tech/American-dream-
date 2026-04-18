import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  MapPin, 
  Maximize, 
  DollarSign, 
  Filter, 
  Loader2, 
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  Mail,
  Building,
  ArrowRight
} from 'lucide-react';
import { 
  Property, 
  LeasingCall, 
  fetchProperties, 
  submitLeasingCall 
} from '../lib/propertyService';

// --- Explore Properties Modal ---
export const ExploreModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { properties: data } = await fetchProperties({ 
        type: filterType === 'all' ? undefined : filterType, 
        search: searchTerm 
      });
      setProperties(data);
      setLoading(false);
    };
    if (isOpen) load();
  }, [isOpen, filterType, searchTerm]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-black/95 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full h-full max-w-[1440px] bg-brand-charcoal border border-white/5 rounded-[48px] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif italic text-white mb-2">Explore the Portfolio.</h2>
              <p className="text-white/40 text-sm font-light uppercase tracking-widest">Premium Commercial Assets</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search location or name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 text-white text-sm outline-none focus:border-brand-gold/50 transition-colors w-full md:w-64"
                />
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
                {['all', 'retail', 'luxury', 'dining', 'entertainment'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-6 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all
                      ${filterType === type ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' : 'text-white/40 hover:text-white'}`}
                  >
                    {type}
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

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-8 md:p-12 custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <span className="uppercase tracking-[0.4em] text-[10px] font-bold">Initializing Inventory...</span>
              </div>
            ) : properties.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Search className="w-16 h-16 mb-4 opacity-10" />
                <span className="uppercase tracking-[0.4em] text-[10px] font-bold">No properties match your vision.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((p) => (
                  <motion.div
                    key={p.id}
                    layoutId={p.id}
                    onClick={() => setSelectedProperty(p)}
                    className="group bg-brand-black/50 border border-white/5 rounded-[40px] overflow-hidden cursor-pointer hover:border-brand-gold/30 transition-all duration-700"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img 
                        src={p.images[0]} 
                        alt={p.propertyName} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gold">{p.type}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 tracking-widest uppercase">
                          <Maximize className="w-3 h-3" /> {p.sizeRange}
                        </div>
                      </div>
                      <h3 className="text-2xl font-serif italic text-white mb-2">{p.propertyName}</h3>
                      <div className="flex items-center gap-2 text-white/40 text-sm font-light mb-6">
                        <MapPin className="w-4 h-4 text-brand-gold/50" />
                        {p.location}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.features.slice(0, 3).map(f => (
                          <span key={f} className="px-3 py-1 bg-white/5 rounded-full text-[9px] uppercase tracking-wider text-white/50">{f}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Property Detail Modal */}
        <AnimatePresence>
          {selectedProperty && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProperty(null)}
                className="absolute inset-0 bg-brand-black/90 backdrop-blur-md"
              />
              <motion.div 
                layoutId={selectedProperty.id}
                className="relative w-full max-w-4xl bg-brand-charcoal border border-white/10 rounded-[48px] overflow-hidden"
              >
                 <div className="grid md:grid-cols-2">
                    <div className="aspect-square md:aspect-auto h-96 md:h-full relative overflow-hidden">
                       <img 
                          src={selectedProperty.images[0]} 
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    </div>
                    <div className="p-10 flex flex-col justify-between">
                       <div>
                          <div className="flex items-center justify-between mb-8">
                             <div className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold">{selectedProperty.type} Space</div>
                             <button onClick={() => setSelectedProperty(null)} className="text-white/30 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                             </button>
                          </div>
                          <h2 className="text-5xl font-serif italic text-white mb-4">{selectedProperty.propertyName}</h2>
                          <div className="flex items-center gap-3 text-white/50 mb-8 border-b border-white/5 pb-8">
                             <MapPin className="w-5 h-5 text-brand-gold" />
                             {selectedProperty.location}
                          </div>
                          <p className="text-white/40 font-light leading-relaxed mb-8">{selectedProperty.description}</p>
                          <div className="grid grid-cols-2 gap-6 mb-12">
                             <div>
                                <div className="text-[10px] uppercase tracking-widest text-brand-gold mb-1 font-bold">Pricing Guide</div>
                                <div className="text-white text-xl font-serif">{selectedProperty.priceRange}</div>
                             </div>
                             <div>
                                <div className="text-[10px] uppercase tracking-widest text-brand-gold mb-1 font-bold">Availability</div>
                                <div className="text-white text-xl font-serif">{selectedProperty.available ? 'Immediate' : 'Leased'}</div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-4">
                          <button className="btn-gold-pill w-full">Request Private Tour</button>
                          <button 
                            onClick={() => {
                              setSelectedProperty(null);
                              // onClose(); 
                              // Suggest opening form here
                            }}
                            className="text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-brand-gold transition-colors text-center"
                          >
                            Explore Leasing Terms
                          </button>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

// --- Leasing Form Modal ---
export const LeasingCallModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<LeasingCall>>({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    businessType: '',
    preferredPropertyType: 'retail',
    spaceRequired: '',
    budget: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitLeasingCall(formData as any);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({}); // Reset
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-black/80 backdrop-blur-3xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-4xl bg-brand-charcoal border border-white/10 rounded-[48px] overflow-hidden"
        >
          {success ? (
            <div className="p-20 text-center flex flex-col items-center justify-center min-h-[600px]">
               <div className="w-24 h-24 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mb-8">
                  <CheckCircle2 className="w-12 h-12 text-brand-gold" />
               </div>
               <h2 className="text-4xl font-serif italic text-white mb-4">Inquiry Received.</h2>
               <p className="text-white/40 max-w-sm mb-12">
                 Your vision has been registered within our ecosystem. A member of our executive 
                 leasing team will reach out within 24 standard business hours.
               </p>
               <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold animate-pulse">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 Transmitting Confirmation
               </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-5 h-full min-h-[700px]">
               {/* Left Sidebar Info */}
               <div className="md:col-span-2 bg-gradient-to-br from-brand-black to-brand-charcoal p-12 border-r border-white/5 flex flex-col justify-between">
                  <div>
                     <div className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold mb-12">American Dream Hub</div>
                     <h2 className="text-5xl font-serif italic text-white mb-8">Schedule <br /> <span className="text-brand-gold">a Consultation.</span></h2>
                     <p className="text-white/40 text-sm font-light leading-relaxed mb-12">
                       Our specialized advisors will analyze your business architecture and identify 
                       the ideal integration point within our global commerce destination.
                     </p>
                     
                     <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-brand-gold transition-colors">
                              <Phone className="w-4 h-4 text-brand-gold" />
                           </div>
                           <span className="text-xs tracking-widest text-white/60">+1 (800) DREAM-RETAIL</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-brand-gold transition-colors">
                              <Mail className="w-4 h-4 text-brand-gold" />
                           </div>
                           <span className="text-xs tracking-widest text-white/60">leasing-exec@americandream.com</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="text-[8px] uppercase tracking-[0.3em] font-bold text-white/20">
                    © 2025 Commercial Excellence Unit
                  </div>
               </div>

               {/* Form */}
               <div className="md:col-span-3 p-12 overflow-y-auto max-h-[85vh] custom-scrollbar">
                  <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Full Identity</label>
                           <input 
                              required
                              type="text" 
                              placeholder="e.g. Julian Sterling"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-brand-gold transition-colors"
                              value={formData.fullName}
                              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Email Channel</label>
                           <input 
                              required
                              type="email" 
                              placeholder="office@brand.com"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-brand-gold transition-colors"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Direct Contact</label>
                           <input 
                              required
                              type="tel" 
                              placeholder="+1 (---) --- ----"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-brand-gold transition-colors"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Organization</label>
                           <input 
                              required
                              type="text" 
                              placeholder="Brand or Holding Co."
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-brand-gold transition-colors"
                              value={formData.companyName}
                              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Space Archetype</label>
                        <select 
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-gold transition-colors appearance-none"
                           value={formData.preferredPropertyType}
                           onChange={(e) => setFormData({...formData, preferredPropertyType: e.target.value})}
                        >
                           <option value="retail" className="bg-brand-charcoal">Global Retail Flagship</option>
                           <option value="luxury" className="bg-brand-charcoal">Luxury Boutique Suite</option>
                           <option value="dining" className="bg-brand-charcoal">Culinary Destination</option>
                           <option value="entertainment" className="bg-brand-charcoal">Immersive Entertainment</option>
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Preferred Date</label>
                           <div className="relative">
                              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold/50" />
                              <input 
                                 type="date" 
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white outline-none focus:border-brand-gold transition-colors"
                                 value={formData.preferredDate}
                                 onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Preferred Window</label>
                           <div className="relative">
                              <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold/50" />
                              <input 
                                 type="time" 
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white outline-none focus:border-brand-gold transition-colors"
                                 value={formData.preferredTime}
                                 onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Strategic Requirements (Optional)</label>
                        <textarea 
                           placeholder="Describe your vision or specific footprint needs..."
                           rows={4}
                           className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-brand-gold transition-colors resize-none"
                           value={formData.message}
                           onChange={(e) => setFormData({...formData, message: e.target.value})}
                        />
                     </div>

                     <button 
                        disabled={loading}
                        className="btn-gold-pill w-full flex items-center justify-center gap-3 py-5"
                     >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-brand-black" />
                            <span className="text-brand-black">Transmitting Strategic Inquiry</span>
                          </>
                        ) : (
                          <>
                            <span className="text-brand-black">Initiate Consultation</span>
                            <ArrowRight className="w-4 h-4 text-brand-black" />
                          </>
                        )}
                     </button>
                  </form>
               </div>
            </div>
          )}
          
          <button 
             onClick={onClose}
             className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all hover:border-white/30"
          >
             <X className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
