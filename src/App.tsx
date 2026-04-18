/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useInView, useScroll, useSpring, useTransform } from 'motion/react';
import { 
  ArrowRight, 
  MapPin, 
  Users, 
  Globe, 
  ShoppingBag, 
  Utensils, 
  Star, 
  ChevronRight, 
  Calendar, 
  Mail, 
  TrendingUp,
  Award,
  Zap,
  Ticket
} from 'lucide-react';
import { useEffect, useRef, useState, ReactNode, FormEvent } from 'react';

// --- Types ---
interface StatItemProps {
  value: string;
  label: string;
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface AttractionCardProps {
  image: string;
  title: string;
  description: string;
}

// --- Components ---

const AnimatedNumber = ({ value }: { value: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = parseInt(value.replace(/[^0-9]/g, ''));
      if (isNaN(end)) return;
      
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  const suffix = value.replace(/[0-9]/g, '');

  return (
    <span ref={ref} className="text-brand-gold">
      {displayValue}{suffix}
    </span>
  );
};

const StatItem = ({ value, label }: StatItemProps) => (
  <div className="flex flex-col items-center text-center px-4 py-8 border-r border-white/5 last:border-r-0">
    <div className="text-4xl md:text-5xl lg:text-6xl font-serif mb-2">
      <AnimatedNumber value={value} />
    </div>
    <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">{label}</div>
  </div>
);

const NavItem = ({ label, href, active, onClick }: { label: string, href: string, active: boolean, onClick: () => void, key?: string }) => (
  <a 
    href={href} 
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`px-3 py-2 text-[10px] uppercase tracking-widest transition-all duration-300 relative group
      ${active ? 'text-brand-gold' : 'text-white/60 hover:text-white'}`}
  >
    {label}
    <span className={`absolute bottom-0 left-3 right-3 h-[1px] bg-brand-gold transition-transform duration-500 origin-left
      ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} 
    />
  </a>
);

const DigitalThreads = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
    <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
      {[...Array(12)].map((_, i) => (
        <motion.path
          key={i}
          stroke="#3182ce"
          strokeWidth="0.8"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0.5, 1],
            opacity: [0, 0.6, 0.2, 0.6],
            d: [
              `M${-100},${300 + i * 60} C${200},${100 + i * 20} ${500},${800 - i * 40} ${1100},${400 + i * 50}`,
              `M${-100},${600 - i * 40} C${300},${900 + i * 30} ${700},${100 + i * 50} ${1100},${600 - i * 60}`,
              `M${-100},${400 + i * 30} C${400},${200 - i * 50} ${600},${700 + i * 20} ${1100},${500 + i * 40}`,
            ]
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </svg>
  </div>
);

import { 
  collection, 
  addDoc, 
  setDoc,
  doc,
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User 
} from 'firebase/auth';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { db, auth } from './lib/firebase';

// --- Types ---

interface SectionConfig {
  title: string;
  description: string;
  cta: string;
  image: string;
  stats?: string;
}

interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

interface SiteConfig {
  retail: SectionConfig;
  sponsorship: SectionConfig;
  investor: SectionConfig;
  events: SectionConfig;
  timeline: TimelineItem[];
}

interface Booking {
  id: string;
  userId: string;
  venueId: string;
  date: string;
  companyName: string;
  email: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- Components ---

const DEFAULT_CONFIG: SiteConfig = {
  retail: {
    title: "Retail Leasing",
    description: "Secure your place among 450+ global brands. From 500 to 50,000 sq ft spaces, we accommodate every business vision with premium infrastructure and high footfall.",
    cta: "Connect with Leasing",
    image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6",
  },
  sponsorship: {
    title: "Sponsorships",
    description: "Reach over 40M+ annual impressions across our digital and physical ecosystem. Partner with us for high-impact brand visibility.",
    stats: "40M impressions",
    cta: "Explore Sponsorship Opportunities",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
  },
  investor: {
    title: "Investor Relations",
    description: "Driving growth and long-term value through strategic investments, innovation, and strong financial performance.",
    cta: "View Financial Reports",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
  },
  events: {
    title: "Book Venue",
    description: "Host premium events, exhibitions, and live experiences in world-class spaces.",
    cta: "Book Now",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
  },
  timeline: [
    { date: "Oct 2019", title: "Project Launch", description: "The dawn of a new era in global retail and entertainment." },
    { date: "2021", title: "Expansion Phase", description: "Introduction of luxury wings and high-impact entertainment units." },
    { date: "Q3 2025", title: "Investor Meet", description: "Strategic summit for global financial and brand partners." },
    { date: "Yearly", title: "Annual Events", description: "Exclusives and global activations across the ecosystem." }
  ]
};

const BookingModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: User | null }) => {
  const [step, setStep] = useState(1);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const dates = Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i + 1));

  const handleBooking = async () => {
    if (!user || !selectedDate || !company) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        venueId: 'grand-spectacular',
        date: selectedDate.toISOString(),
        companyName: company,
        email: user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (e: FormEvent) => {
    e.preventDefault();
    processAuth();
  };

  const processAuth = async () => {
    setLoading(true);
    setAuthError('');
    try {
      if (authMode === 'sign-up') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName });
        await setDoc(doc(db, 'users', res.user.uid), {
          displayName,
          email,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      // Ensure user profile exists
      await setDoc(doc(db, 'users', res.user.uid), {
        displayName: res.user.displayName,
        email: res.user.email,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-brand-black/90 backdrop-blur-xl" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl bg-brand-charcoal border border-white/10 rounded-[40px] overflow-hidden shadow-2xl shadow-brand-gold/10"
      >
        <div className="p-12">
          {!user ? (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="text-brand-gold w-8 h-8" />
                </div>
                <h2 className="text-4xl font-serif italic text-white mb-4">
                  {authMode === 'sign-in' ? 'Elite Partner Login' : 'Partner Registration'}
                </h2>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  {authMode === 'sign-in' 
                    ? 'Access our exclusive venue calendar and secure your vision.' 
                    : 'Join our elite circle of brand partners and start your journey.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'sign-up' && (
                  <input 
                    type="text"
                    placeholder="Full Name"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-brand-gold outline-none"
                  />
                )}
                <input 
                  type="email"
                  placeholder="Official Email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-brand-gold outline-none"
                />
                <input 
                  type="password"
                  placeholder="Security Key"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-brand-gold outline-none"
                />
                {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
                <button type="submit" disabled={loading} className="btn-gold w-full mt-4">
                  {loading ? 'Authenticating...' : authMode === 'sign-in' ? 'Initialize Session' : 'Create Account'}
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 h-[1px] bg-white/10" />
                <span className="relative z-10 bg-brand-charcoal px-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">OR</span>
              </div>

              <button onClick={loginWithGoogle} className="btn-outline w-full flex items-center justify-center gap-3 py-4">
                <Globe className="w-5 h-5" /> Sign in with Google
              </button>

              <p className="text-center text-xs text-white/30">
                {authMode === 'sign-in' ? "Don't have an account?" : "Already a partner?"}
                <button 
                  onClick={() => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')}
                  className="ml-2 text-brand-gold hover:underline font-bold"
                >
                  {authMode === 'sign-in' ? 'Register Now' : 'Sign In'}
                </button>
              </p>
            </div>
          ) : success ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Star className="text-green-500 w-10 h-10" />
              </div>
              <h2 className="text-4xl font-serif italic text-white mb-4">Reservation Requested</h2>
              <p className="text-white/50 mb-10 max-w-sm mx-auto">Your inquiry for {company} has been transmitted to our executive concierge. We will reach out shortly.</p>
              <button onClick={onClose} className="btn-gold px-12">Return to Deck</button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-10">
                <div className="text-brand-gold text-[10px] uppercase tracking-[0.4em] font-bold">Step {step} of 2</div>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">Close</button>
              </div>

              {step === 1 ? (
                <div>
                   <h2 className="text-4xl font-serif italic text-white mb-8">Select Your Window.</h2>
                   <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-10">
                      {dates.map(date => (
                        <button 
                          key={date.toISOString()}
                          onClick={() => setSelectedDate(date)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300
                            ${selectedDate && isSameDay(date, selectedDate) 
                              ? 'bg-brand-gold border-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' 
                              : 'bg-white/5 border-white/10 text-white/50 hover:border-brand-gold/30 hover:text-white'}`}
                        >
                          <span className="text-[10px] uppercase font-bold mb-1 opacity-60">{format(date, 'EEE')}</span>
                          <span className="text-xl font-serif">{format(date, 'd')}</span>
                        </button>
                      ))}
                   </div>
                   <button 
                    disabled={!selectedDate}
                    onClick={() => setStep(2)} 
                    className="btn-gold w-full disabled:opacity-30"
                   >
                     Confirm Date
                   </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <h2 className="text-4xl font-serif italic text-white mb-8">Refine Your Identity.</h2>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-3 block font-bold">Company Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. LVMH / Nike Global"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-brand-gold outline-none transition-colors"
                    />
                  </div>
                  <div className="p-6 bg-brand-gold/5 border border-brand-gold/20 rounded-2xl">
                    <div className="text-[10px] uppercase tracking-widest text-brand-gold mb-1 font-bold">Selected Schedule</div>
                    <div className="text-white text-lg font-serif">
                      {selectedDate ? format(selectedDate, 'MMMM do, yyyy') : 'No date selected'}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                    <button 
                      onClick={handleBooking} 
                      disabled={loading || !company}
                      className="btn-gold flex-1 disabled:opacity-30"
                    >
                      {loading ? 'Transmitting...' : 'Complete Booking'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

import { ExploreModal, LeasingCallModal } from './components/PropertyModals';
import { AdminDashboard } from './components/AdminDashboard';
import propertySeeds from '../properties-seed.json';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isLeasingCallOpen, setIsLeasingCallOpen] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);

  const seedDB = async () => {
    if (!isAdmin) return;
    try {
      for (const p of propertySeeds) {
        await addDoc(collection(db, 'properties'), {
          ...p,
          createdAt: serverTimestamp()
        });
      }
      alert("Properties Seeded Successfully");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        onSnapshot(doc(db, 'admins', currentUser.uid), (snap) => {
          setIsAdmin(snap.exists());
        });
      } else {
        setIsAdmin(false);
      }
    });
    
    // Fetch dynamic site config
    const unsubConfig = onSnapshot(doc(db, 'config', 'landing'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as SiteConfig);
      }
    });

    return () => {
      unsubscribe();
      unsubConfig();
    };
  }, []);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const luxuryRef = useRef(null);
  const { scrollYProgress: luxuryScroll } = useScroll({
    target: luxuryRef,
    offset: ["start end", "end start"]
  });
  const luxuryParallax = useTransform(luxuryScroll, [0, 1], [-30, 30]);

  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroParallax = useTransform(heroScroll, [0, 1], [0, 150]);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'retail', label: 'Retail' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'dining', label: 'Dining' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'events', label: 'Events' },
    { id: 'sponsorship', label: 'Sponsorship' },
    { id: 'leasing', label: 'Leasing' }
  ];

  const handleScroll = () => {
    const scrollPosition = window.scrollY + 100;
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element && scrollPosition >= element.offsetTop && scrollPosition < element.offsetTop + element.offsetHeight) {
        setActiveSection(section.id);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-brand-black selection:bg-brand-gold selection:text-brand-black">
      {/* --- Navigation --- */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-nav">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('overview')}>
            <span className="text-xl font-serif tracking-[0.1em] text-brand-gold">AMERICAN DREAM</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-1">
            {sections.map((section) => (
              <NavItem 
                key={section.id} 
                label={section.label} 
                href={`#${section.id}`} 
                active={activeSection === section.id}
                onClick={() => scrollTo(section.id)}
              />
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-4">
            {user && (
              <button 
                onClick={() => signOut(auth)}
                className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Sign Out ({user.displayName?.split(' ')[0]})
              </button>
            )}
            <button 
              onClick={() => scrollTo('leasing')}
              className="flex items-center gap-2 px-6 py-2 border border-brand-gold/30 text-brand-gold text-[10px] uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-300 rounded-full"
            >
              Inquire <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* Progress Bar */}
        <motion.div className="h-[2px] bg-brand-gold origin-left w-full" style={{ scaleX }} />
      </nav>

      {/* --- Section 1: Hero --- */}
      <section ref={heroRef} id="overview" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Zoom Animation */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000"
            alt="American Dream Hero"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-black/90 via-brand-black/40 to-brand-black" />
        </div>

        <motion.div 
          style={{ y: heroParallax }}
          className="relative z-10 text-center max-w-4xl px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="section-label mb-6"
          >
            East Rutherford, New Jersey
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl h-display text-white mb-6 leading-tight"
          >
            Where the World <br /> <span className="italic">Comes to Play.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-8 font-light"
          >
            3 million sq ft. 40M+ annual visitors. One extraordinary destination.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={() => scrollTo('retail')} className="btn-gold group flex items-center gap-2">
              Explore Property <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => scrollTo('leasing')} className="btn-outline">
              Book a Leasing Call
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-brand-gold to-transparent" />
          <span className="text-[8px] uppercase tracking-widest text-brand-gold">Scroll</span>
        </motion.div>
      </section>

      {/* --- Section 2: The Numbers --- */}
      <section className="bg-brand-charcoal border-y border-white/5">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-5">
          <StatItem value="3M+" label="Sq Ft of Space" />
          <StatItem value="40M+" label="Annual Visitors" />
          <StatItem value="450+" label="Brands & Retailers" />
          <StatItem value="$5B+" label="Investment Value" />
          <StatItem value="#1" label="Largest Mall in US" />
        </div>
      </section>

      {/* --- Section 3: Why American Dream --- */}
      <section id="why" className="py-32 px-6">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
             <div className="aspect-[4/5] bg-brand-charcoal relative overflow-hidden group">
               <img 
                 src="https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&q=80&w=1200"
                 alt="Luxury Retail Architecture"
                 className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent opacity-60" />
               <div className="absolute inset-0 border border-white/5" />
               <div className="p-12 absolute bottom-0 left-0 z-10">
                 <div className="text-8xl font-serif text-brand-gold opacity-40 mb-4 italic">The Future</div>
                 <div className="text-brand-white/60 max-w-xs uppercase tracking-widest text-xs leading-loose">
                   Redefining the standard of global destination retail.
                 </div>
               </div>
             </div>
             {/* Floating text */}
             <div className="absolute -bottom-10 -right-10 bg-brand-gold p-8 hidden md:block z-20">
               <div className="text-brand-black font-serif text-4xl mb-1">10 Minutes</div>
               <div className="text-brand-black/70 text-[10px] uppercase font-bold tracking-widest">From Manhattan</div>
             </div>
          </motion.div>

          <div>
            <div className="section-label mb-6">Introduction</div>
            <h2 className="text-5xl md:text-6xl h-display text-white mb-8">
              Not a Mall. <br /> <span className="italic">A Global Destination.</span>
            </h2>
            <p className="text-xl text-white/70 mb-12 leading-relaxed">
              American Dream is the most visited entertainment and retail complex in the United States. 
              Located minutes from Manhattan, with direct transit access, it draws premium audiences 
              from the world's most valuable consumer market.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6">
                 <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-brand-gold" />
                 </div>
                 <div>
                    <h3 className="text-lg font-serif italic mb-1 text-brand-gold">Location</h3>
                    <p className="text-white/50 text-sm">10 min from NYC via NJ Transit. Newark Airport 15 min away.</p>
                 </div>
              </div>
              <div className="flex gap-6">
                 <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-brand-gold" />
                 </div>
                 <div>
                    <h3 className="text-lg font-serif italic mb-1 text-brand-gold">Demographics</h3>
                    <p className="text-white/50 text-sm">70% earn $75K+. Average age 28–45. 35% international visitors.</p>
                 </div>
              </div>
              <div className="flex gap-6">
                 <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-brand-gold" />
                 </div>
                 <div>
                    <h3 className="text-lg font-serif italic mb-1 text-brand-gold">Global Reach</h3>
                    <p className="text-white/50 text-sm">Regional pull from NJ, NY, CT, PA. Global tourist destination.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 4: Retail --- */}
      <section id="retail" className="py-32 px-6 bg-brand-charcoal/30">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
              <div className="section-label mb-6">Opportunities</div>
              <h2 className="text-5xl md:text-6xl h-display text-white mb-6">
                The Retail <span className="italic">Opportunity</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-10">
                450+ brands across 3 million sq ft. From heritage luxury to emerging DTC. 
                American Dream offers every retail format: flagship stores, shop-in-shops, 
                seasonal pop-ups, and permanent leases with category exclusivity options.
              </p>
              
              {/* Performance Stats Overlay */}
              <div className="grid grid-cols-2 gap-8 p-8 bg-white/5 border border-white/10 rounded-3xl mb-12">
                <div>
                   <div className="text-3xl font-serif text-brand-gold italic mb-1">$1,200+</div>
                   <div className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Sales PSF (Avg)</div>
                </div>
                <div>
                   <div className="text-3xl font-serif text-brand-gold italic mb-1">98%</div>
                   <div className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Brand Retention</div>
                </div>
              </div>
            </div>
            
            {/* Grid for brands */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { name: 'Louis Vuitton', img: 'https://images.unsplash.com/photo-1549439602-43ebca2327af', cat: 'Luxury', info: 'Top 5 Global Performer' },
                { name: 'Gucci', img: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e', cat: 'Boutique', info: 'Flagship Concept' },
                { name: 'Prada', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b', cat: 'Maison', info: 'Maddison Ave Original' },
                { name: 'Nike', img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3', cat: 'Performance', info: 'Innovation Hub Traffic' },
                { name: 'Apple', img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5', cat: 'Technology', info: 'Next-Gen Retail Design' },
                { name: 'Zara', img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5', cat: 'Contemporary', info: '35,000 sq ft Footprint' },
                { name: 'Rolex', img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49', cat: 'Horology', info: 'World-Class Craftmanship' },
                { name: 'Balenciaga', img: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8', cat: 'Avant-Garde', info: 'Conceptual Retail' }
              ].map((brand, i) => (
                <motion.div 
                  key={brand.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="group relative h-[300px] rounded-[32px] overflow-hidden border border-white/5 hover:border-brand-gold/30 transition-all duration-700 cursor-pointer"
                >
                  <img 
                    src={`${brand.img}?auto=format&fit=crop&q=80&w=800`}
                    alt={brand.name}
                    className="absolute inset-0 w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-[2px]">
                    <div className="text-[10px] uppercase tracking-[0.5em] text-brand-gold font-bold mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">{brand.cat}</div>
                    <h3 className="text-3xl font-serif text-white italic tracking-tight mb-4 scale-95 group-hover:scale-100 transition-transform duration-700">{brand.name}</h3>
                    <div className="text-[8px] uppercase tracking-[0.3em] text-white/70 font-bold border-t border-brand-gold/30 pt-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 delay-100">{brand.info}</div>
                  </div>
                  
                  {/* Subtle bottom info for non-hover state */}
                  <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end group-hover:opacity-0 transition-opacity duration-500">
                    <h3 className="text-xl font-serif text-white italic tracking-tight">{brand.name}</h3>
                  </div>
                  
                  {/* Glass highlight effect */}
                  <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[100%] transition-all duration-1000" />
                </motion.div>
              ))}

              {/* 3D Retail Vision Unit */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mt-12 relative rounded-[40px] overflow-hidden border border-[#3182ce]/30 group/retail3d bg-brand-black h-[500px]"
              >
                <div className="absolute inset-0 z-0">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-60 mix-blend-screen"
                  >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-abstract-architectural-digital-scene-41014-large.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/40 to-transparent" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center p-12 md:p-20 max-w-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-[#3182ce] animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.5em] text-[#3182ce] font-bold">3D Architectural Vision</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl text-white font-serif italic mb-6 leading-tight">Masterful Spatial Design.</h3>
                  <p className="text-white/50 text-lg font-light leading-relaxed mb-10">
                    A multi-sensory retail landscape engineered for maximum brand resonance. 
                    Our 3D spatial strategies integrate architectural spectacle with predictive consumer flow.
                  </p>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-white/40 font-mono text-[9px] tracking-widest border-l border-[#3182ce]/40 pl-4">
                      RENDER_ENGINE: AR_VISION_3.0<br/>
                      LATENCY: 0.12ms<br/>
                      SYSTEM: ACTIVE
                    </div>
                    <div className="text-white/40 font-mono text-[9px] tracking-widest border-l border-[#3182ce]/40 pl-4">
                      COORD: 40.8067° N<br/>
                      MODEL: PH_RETAIL_01<br/>
                      STATUS: OPTIMIZED
                    </div>
                  </div>
                </div>

                {/* Cyber scribble accent from screenshot feel */}
                <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
                  <DigitalThreads />
                </div>
              </motion.div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Flagship Leasing', desc: "Anchor your brand in America's destination mall.", icon: <Award className="w-8 h-8"/> },
              { title: 'Pop-Up Spaces', desc: 'Test, launch, activate. Flexible terms for fast movers.', icon: <Zap className="w-8 h-8"/> },
              { title: 'Permanent Retail', desc: 'Long-term growth in the highest-traffic property in the US.', icon: <TrendingUp className="w-8 h-8"/> }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
                className="group apple-card p-10 cursor-pointer relative"
              >
                <div className="text-brand-gold mb-10 group-hover:scale-110 transition-transform duration-500 origin-left inline-block bg-white/5 p-4 rounded-2xl">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-serif mb-4 text-white italic">{card.title}</h3>
                <p className="text-white/50 text-sm mb-8 leading-relaxed font-light">{card.desc}</p>
                <div className="flex items-center gap-2 text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold">
                  Inquire Now <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 5: Luxury Wing --- */}
      <section ref={luxuryRef} id="luxury" className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=2500"
            alt="Exclusive Luxury Architecture"
            className="w-full h-full object-cover fixed opacity-30 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-brand-black" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-label mb-8"
          >
            Avenue of the Americas
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-5xl mx-auto"
          >
            <div className="relative rounded-[40px] overflow-hidden border border-white/10 group aspect-[16/9] md:aspect-[21/9]">
              <img 
                src="https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80&w=2000"
                alt="Luxury Mall Avenue"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent flex flex-col justify-end p-12 text-left">
                <h2 className="text-4xl md:text-6xl font-serif text-white italic mb-4">A Vision in Marble.</h2>
                <p className="text-white/60 max-w-xl text-lg font-light leading-relaxed">
                  The Avenue of the Americas represents a fundamental shift in luxury retail—where 
                  architecture and commerce converge to create a global destination.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Section 6: Dining --- */}
      <section id="dining" className="py-32 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 mb-16">
          <div className="grid lg:grid-cols-2 gap-20 items-end">
             <div>
               <div className="section-label mb-6">Lifestyle</div>
               <h2 className="text-5xl md:text-6xl h-display text-white mb-8">
                 Food Isn't <span className="italic">Afterthought.</span> <br /> It's Destination.
               </h2>
             </div>
             <p className="text-white/60 leading-relaxed text-lg pb-2">
               100+ dining experiences across fast-casual, full-service, celebrity chef concepts, 
               and immersive food halls. The dining program is a primary driver of repeat visits.
             </p>
          </div>
        </div>

        {/* Carousel */}
        <div className="flex gap-4 overflow-x-auto px-6 pb-16 no-scrollbar snap-x">
          {[
            { id: 1, title: 'Fine Dining', category: 'Curated', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de' },
            { id: 2, title: 'Artisan Halls', category: 'Immersive', img: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20' },
            { id: 3, title: 'Rooftop Lounge', category: 'Exclusive', img: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7' },
            { id: 4, title: 'Fast Casual', category: 'Energized', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' },
            { id: 5, title: 'Sweet Dreams', category: 'Whimsical', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952' }
          ].map((item, i) => (
             <motion.div 
               key={item.id}
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, delay: i * 0.1 }}
               className="min-w-[300px] md:min-w-[450px] aspect-[16/10] bg-brand-charcoal snap-center relative group overflow-hidden"
             >
                <img 
                  src={`${item.img}?auto=format&fit=crop&q=80&w=800`}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-60"
                  alt={item.title}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent" />
                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                   <div className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold mb-2">{item.category}</div>
                   <div className="text-3xl font-serif italic text-white mb-2">{item.title}</div>
                   <div className="text-[10px] uppercase tracking-widest text-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500">View Full Menu & Pricing</div>
                </div>
             </motion.div>
          ))}
        </div>

        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
           <div className="text-center md:text-left">
              <div className="text-3xl md:text-5xl font-serif text-brand-gold mb-1 italic">100+</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Concepts</div>
           </div>
           <div className="text-center md:text-left">
              <div className="text-3xl md:text-5xl font-serif text-brand-gold mb-1 italic">15,000</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Seats</div>
           </div>
           <div className="text-center md:text-left">
              <div className="text-3xl md:text-5xl font-serif text-brand-gold mb-1 italic">3</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Food Halls</div>
           </div>
           <div className="text-center md:text-left">
              <div className="text-3xl md:text-5xl font-serif text-brand-gold mb-1 italic">24/7</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Weekend Hours</div>
           </div>
        </div>
      </section>

      {/* --- Section 7: Attractions --- */}
      <section id="entertainment" className="py-32 px-6 bg-brand-charcoal relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-brand-gold)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
        <DigitalThreads />
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="text-center mb-24">
            <div className="section-label mb-6">Differentiation</div>
            <h2 className="text-6xl md:text-8xl h-display text-white mb-8">
              Nothing Else <span className="italic">Comes Close.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { 
                title: 'Big SNOW', 
                desc: "America's only indoor ski slope.", 
                icon: <Zap className="w-8 h-8"/>, 
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
                video: 'https://assets.mixkit.co/videos/preview/mixkit-skier-sliding-on-the-snow-1284-large.mp4'
              },
              { title: 'Nickelodeon Universe', desc: '35-acre indoor theme park.', icon: <Award className="w-8 h-8"/>, img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a' },
              { title: 'SEA LIFE Aquarium', desc: '25,000+ sea creatures in NJ.', icon: <Globe className="w-8 h-8"/>, img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5' },
              { 
                title: 'Dream Ice', 
                desc: 'NHL-size indoor ice rink.', 
                icon: <Star className="w-8 h-8"/>, 
                img: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460',
                video: 'https://assets.mixkit.co/videos/preview/mixkit-skating-on-an-ice-rink-under-lights-4228-large.mp4'
              },
              { title: 'DreamWorks Water Park', desc: "America's largest indoor waterpark.", icon: <Zap className="w-8 h-8"/>, img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6' },
              { title: 'Theaters & Live', desc: 'Broadway-scale productions.', icon: <Ticket className="w-8 h-8"/>, img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745' }
            ].map((attraction, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group apple-card relative h-[450px]"
              >
                {attraction.video ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={`${attraction.img}?auto=format&fit=crop&q=80&w=800`}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  >
                    <source src={attraction.video} type="video/mp4" />
                  </video>
                ) : (
                  <img 
                    src={`${attraction.img}?auto=format&fit=crop&q=80&w=800`}
                    alt={attraction.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                )}
                 <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent" />
                 
                 <div className="absolute bottom-0 left-0 right-0 p-10">
                   <div className="bg-brand-black/50 backdrop-blur-3xl border border-white/5 p-8 rounded-3xl group-hover:border-[#3182ce]/50 transition-all duration-500">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="text-brand-gold p-3 bg-white/5 rounded-xl group-hover:rotate-12 transition-transform duration-500">{attraction.icon}</div>
                        <h3 className="text-2xl font-serif text-white italic tracking-tight">{attraction.title}</h3>
                     </div>
                     <p className="text-white/50 text-sm leading-relaxed mb-6 font-light">{attraction.desc}</p>
                     <div className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                       Market Exclusive
                     </div>
                   </div>
                 </div>
                 
                 {/* Glow effect on hover */}
                 <div className="absolute inset-0 bg-[#3182ce]/0 group-hover:bg-[#3182ce]/5 transition-colors duration-700 pointer-events-none" />
              </motion.div>
            ))}
          </div>

          {/* Live Spectacular Unit - Matching screenshot aesthetic */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full relative rounded-sm border-2 border-[#3182ce] overflow-hidden group/spectacular bg-black"
          >
            <div className="aspect-video relative overflow-hidden">
              {/* Scribble Energy Background */}
              <div className="absolute inset-0 z-0 opacity-40">
                <DigitalThreads />
              </div>
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover opacity-60 mix-blend-screen"
              >
                <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-digital-lines-background-40018-large.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
              
              <div className="absolute inset-12 flex flex-col justify-end">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-3 h-3 rounded-full bg-[#3182ce] animate-ping" />
                  <span className="text-[10px] uppercase tracking-[0.6em] text-[#3182ce] font-bold">Live Spectacular Odyssey</span>
                </div>
                <h3 className="text-4xl md:text-6xl text-white font-serif italic mb-6">Immersive Digital Canvas</h3>
                <p className="text-white/40 max-w-xl text-lg font-light leading-relaxed">
                  The world's largest interior LED spectacle. A synchronized digital journey 
                  across 450,000 square feet of curated immersive media.
                </p>
              </div>

              {/* Minimalist Tech Decor */}
              <div className="absolute top-6 right-8 text-[#3182ce]/40 font-mono text-[8px] tracking-[0.2em] flex flex-col items-end gap-1">
                <span>COORD: 40.8067° N, 74.0682° W</span>
                <span>STATUS: TRANSMITTING</span>
                <div className="w-20 h-[1px] bg-[#3182ce]/20 mt-2" />
              </div>
            </div>
            
            {/* Hover Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/spectacular:opacity-10 transition-opacity duration-700 bg-[linear-gradient(transparent_0%,rgba(49,130,206,0.1)_50%,transparent_100%)] bg-[length:100%_4px]" />
          </motion.div>
        </div>
      </section>

      {/* --- Section 8: Events & Platform --- */}
      <section id="events" className="py-32 px-6">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl mb-24">
            <div className="section-label mb-6">Activation</div>
            <h2 className="text-5xl md:text-6xl h-display text-white mb-8">
              The Platform. <br /> <span className="italic">Not Just the Property.</span>
            </h2>
            <p className="text-xl text-white/70 font-light">
              American Dream is where global brands come to make news. From massive product reveals to intimate brand world immersions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 mb-24">
             {[
               { title: 'Concerts & Live', desc: 'Our 5,000-capacity venue hosts world-class artists and touring productions year-round.' },
               { title: 'Brand Activations', desc: 'Product launches, experiential marketing, and immersive brand worlds with built-in foot traffic.' },
               { title: 'Corporate Events', desc: 'Convention-scale capacity. Corporate dinners, summits, press events, and bespoke gala productions.' }
             ].map((event, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8, delay: i * 0.2 }}
                 className="space-y-6 group"
               >
                 <div className="h-[1px] w-full bg-white/10 group-hover:bg-brand-gold transition-colors duration-500" />
                 <h3 className="text-2xl font-serif italic text-white">{event.title}</h3>
                 <p className="text-white/50 leading-relaxed text-sm">
                   {event.desc}
                 </p>
               </motion.div>
             ))}
          </div>

          {/* Marquee Ticker */}
          <div className="border-y border-white/5 py-10 overflow-hidden bg-brand-charcoal/50">
             <div className="animate-marquee whitespace-nowrap">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-20 items-center">
                    <span className="text-4xl md:text-5xl font-serif italic text-brand-white/20">Super Bowl Activation</span>
                    <span className="text-brand-gold/30">•</span>
                    <span className="text-4xl md:text-5xl font-serif italic text-brand-white/20">Global Brand Launch</span>
                    <span className="text-brand-gold/30">•</span>
                    <span className="text-4xl md:text-5xl font-serif italic text-brand-white/20">Fashion Week Pop-Up</span>
                    <span className="text-brand-gold/30">•</span>
                    <span className="text-4xl md:text-5xl font-serif italic text-brand-white/20">Celebrity Appearance</span>
                    <span className="text-brand-gold/30">•</span>
                    <span className="text-4xl md:text-5xl font-serif italic text-brand-white/20">New Year's Concert</span>
                    <span className="text-brand-gold/30">•</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="mt-20 text-center">
             <button className="btn-gold group flex items-center gap-2 mx-auto">
                Book a Venue <Calendar className="w-4 h-4 transition-transform group-hover:scale-110" />
             </button>
          </div>
        </div>
      </section>

      {/* --- Section 9: Sponsorship --- */}
      <section id="sponsorship" className="py-32 px-6 bg-brand-charcoal/30">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 mb-32 items-center">
            <div>
              <div className="section-label mb-6">Partnership</div>
              <h2 className="text-5xl md:text-6xl h-display text-white mb-8">
                Your Brand. <br /> <span className="italic">40 Million Eyeballs.</span>
              </h2>
              <p className="text-xl text-white/70 font-light mb-12">
                Sponsorship at American Dream is a media channel, not an asset placement. 
                We create deep integrations that drive measurable brand equity.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                   <div className="text-3xl font-serif italic text-brand-gold mb-1">4.2 Hours</div>
                   <div className="text-[8px] uppercase tracking-[0.3em] text-white/50 font-bold">Average Dwell Time</div>
                </div>
                <div>
                   <div className="text-3xl font-serif italic text-brand-gold mb-1">$120M+</div>
                   <div className="text-[8px] uppercase tracking-[0.3em] text-white/50 font-bold">Earned Media Value</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {[
                { title: 'Presenting Partner', desc: 'Category exclusivity. Naming rights. Omnichannel integration.' },
                { title: 'Brand Partner', desc: 'Seasonal campaigns. Activation spaces. Digital + physical ecosystem.' },
                { title: 'Activation Partner', desc: 'Event-specific presence. Curated audience. Flexible entry format.' }
              ].map((tier, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className="p-8 border border-white/10 hover:border-brand-gold transition-colors duration-500 group cursor-pointer bg-brand-black"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif italic text-brand-white group-hover:text-brand-gold transition-colors duration-500">{tier.title}</h3>
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-brand-gold group-hover:border-brand-gold transition-all duration-500">
                      <Star className="w-4 h-4 text-white group-hover:text-brand-black transition-colors" />
                    </div>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{tier.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <button className="btn-outline group inline-flex items-center gap-2">
              Request Partnership Deck <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* --- Section 11: Timeline --- */}
      <section className="py-32 px-6 bg-brand-black relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
              <div className="section-label mb-6">Velocity</div>
              <h2 className="text-5xl md:text-6xl h-display text-white mb-4">Strategic Timeline.</h2>
              <p className="text-white/40 font-light">The architecture of a global icon, built on precision and vision.</p>
            </div>
            <div className="hidden md:block h-[1px] flex-grow bg-white/10 mx-12 translate-y-[-12px]" />
          </div>

          <div className="relative">
            {/* Horizontal Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 pt-12 gap-12">
               {config.timeline.map((item, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, x: -20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8, delay: i * 0.2 }}
                   className="relative group"
                 >
                    {/* Node */}
                    <div className="absolute -top-[52px] left-0 w-2 h-2 rounded-full bg-brand-gold group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                    
                    <div className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-4">{item.date}</div>
                    <h3 className="text-2xl font-serif italic text-white mb-4">{item.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed font-light">{item.description}</p>
                 </motion.div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 10: Leasing & Opportunities --- */}
      <section id="leasing" className="py-40 px-6 relative overflow-hidden bg-brand-charcoal/20">
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="text-center mb-32 max-w-3xl mx-auto">
            <div className="section-label mb-6 mx-auto">Collaboration</div>
            <h2 className="text-5xl md:text-7xl h-display text-white mb-8">
              Commercial <span className="italic">Opportunities.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {/* Retail Card */}
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="group relative h-[600px] rounded-[48px] overflow-hidden border border-white/5 bg-brand-black shadow-2xl hover:shadow-brand-gold/5 transition-all duration-700"
             >
                <img src={config.retail.image} alt="Retail" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 p-10 flex flex-col justify-between">
                   <div className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center">
                      <ShoppingBag className="text-brand-gold w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-serif italic text-white mb-4">{config.retail.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed mb-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">{config.retail.description}</p>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => setIsLeasingCallOpen(true)}
                          className="btn-gold-pill w-full"
                        >
                          Book a Leasing Call
                        </button>
                        <button 
                          onClick={() => setIsExploreOpen(true)}
                          className="text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-brand-gold transition-colors text-center"
                        >
                          Explore Property Portfolio
                        </button>
                      </div>
                   </div>
                </div>
             </motion.div>

             {/* Sponsorship Card */}
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="group relative h-[600px] rounded-[48px] overflow-hidden border border-white/5 bg-brand-black shadow-2xl mt-12 md:mt-0"
             >
                <img src={config.sponsorship.image} alt="Sponsorship" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 p-10 flex flex-col justify-between">
                   <div>
                      <div className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center mb-6">
                         <Star className="text-brand-gold w-6 h-6" />
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-2">{config.sponsorship.stats}</div>
                   </div>
                   <div>
                      <h3 className="text-3xl font-serif italic text-white mb-4">{config.sponsorship.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed mb-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">{config.sponsorship.description}</p>
                      <button className="btn-gold-pill w-full">{config.sponsorship.cta}</button>
                   </div>
                </div>
             </motion.div>

             {/* Investor Card */}
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="group relative h-[600px] rounded-[48px] overflow-hidden border border-white/5 bg-brand-black shadow-2xl"
             >
                <img src={config.investor.image} alt="Investor" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 p-10 flex flex-col justify-between">
                   <div className="w-14 h-14 bg-[#3182ce]/5 backdrop-blur-xl border border-[#3182ce]/20 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="text-[#3182ce] w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-serif italic text-white mb-4">{config.investor.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed mb-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">{config.investor.description}</p>
                      <button className="btn-gold-pill w-full border-[#3182ce]/30 hover:shadow-[#3182ce]/20">{config.investor.cta}</button>
                   </div>
                </div>
             </motion.div>

             {/* Events Card */}
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.3 }}
               onClick={() => setIsBookingOpen(true)}
               className="group relative h-[600px] rounded-[48px] overflow-hidden border border-white/5 bg-brand-black shadow-2xl mt-12 md:mt-0 cursor-pointer"
             >
                <img src={config.events.image} alt="Events" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 p-10 flex flex-col justify-between">
                   <div className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center">
                      <Ticket className="text-brand-gold w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-serif italic text-white mb-4">{config.events.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed mb-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">{config.events.description}</p>
                      <button className="btn-gold-pill w-full">{config.events.cta}</button>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col gap-4 items-center md:items-start">
             <div className="text-2xl font-serif text-brand-gold tracking-[0.2em]">AMERICAN DREAM</div>
             <div className="text-[10px] uppercase tracking-widest text-white/30">The world's premier destination for commerce and play.</div>
          </div>
          
          <div className="flex items-center gap-10 text-[8px] uppercase tracking-[0.3em] font-bold text-white/50">
             {isAdmin && (
               <div className="flex gap-10 border-r border-white/5 pr-10">
                 <button onClick={() => setIsAdminOpen(true)} className="text-brand-gold hover:text-brand-white transition-colors uppercase">Dashboard</button>
                 <button onClick={seedDB} className="hover:text-brand-gold transition-colors uppercase">Seed DB</button>
               </div>
             )}
             <a href="#" className="hover:text-brand-gold transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-brand-gold transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-brand-gold transition-colors">Accessibility</a>
             <a href="#" className="hover:text-brand-gold transition-colors">Contact</a>
          </div>

          <div className="text-[8px] uppercase tracking-[0.3em] font-bold text-white/20">
             © 2025 American Dream. All Rights Reserved.
          </div>
        </div>
      </footer>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        user={user} 
      />

      <ExploreModal 
        isOpen={isExploreOpen} 
        onClose={() => setIsExploreOpen(false)} 
      />

      <LeasingCallModal 
        isOpen={isLeasingCallOpen} 
        onClose={() => setIsLeasingCallOpen(false)} 
      />

      <AdminDashboard 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
      />
    </div>
  );
}
