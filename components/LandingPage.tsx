
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ICONS } from '../constants';

interface LandingPageProps {
  onAdminLoginSuccess: () => void;
  onTrainerLoginSuccess: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAdminLoginSuccess, onTrainerLoginSuccess }) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState<'admin' | 'trainer' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 300);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (showLoginModal === 'admin') {
        // Admin: Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (user.email?.toLowerCase() === 'edusupport@ep-asia.com') {
          onAdminLoginSuccess();
          navigate('/admin-dashboard');
        } else {
          // If they logged into Firebase but aren't the designated admin
          await auth.signOut();
          setError('Authorized admin access only. Your account does not have admin privileges.');
        }
      } else if (showLoginModal === 'trainer') {
        // Trainer: Hardcoded Check
        if (email === 'trainer@epedu' && password === 'Trainer@EPEDU123') {
          onTrainerLoginSuccess();
          navigate('/trainer-dashboard');
        } else {
          setError('Invalid trainer credentials. Access denied.');
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (showLoginModal === 'admin') {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Invalid admin credentials. Please check your email and password.');
        } else {
          setError('Admin authentication failed. Ensure credentials are correct in Firebase.');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const RoleCard = ({ 
    title, 
    description, 
    icon, 
    onClick, 
    colorClass 
  }: { 
    title: string; 
    description: string; 
    icon: React.ReactNode; 
    onClick: () => void; 
    colorClass: string;
  }) => (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col items-center p-8 sm:p-10 bg-white border-2 border-slate-100 rounded-[2rem] sm:rounded-[4rem] shadow-xl hover:shadow-2xl hover:border-purple-200 transition-shadow cursor-pointer"
      id={`role-card-${title.toLowerCase()}`}
    >
      <motion.div 
        whileHover={{ scale: 1.1, rotate: -5 }}
        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.2rem] sm:rounded-[1.8rem] flex items-center justify-center mb-4 sm:mb-6 ${colorClass} text-white shadow-xl`}
      >
        <div className="scale-75 sm:scale-100">{icon}</div>
      </motion.div>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tighter mb-2 sm:mb-4">{title}</h2>
      <p className="text-slate-500 font-bold text-center text-[10px] sm:text-sm leading-relaxed uppercase tracking-widest px-2 sm:px-4">
        {description}
      </p>
    </motion.div>
  );

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto overflow-x-hidden scroll-smooth"
    >
      {/* Back to Top Arrow */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 sm:bottom-10 sm:right-10 z-[100] w-12 h-12 bg-white/80 backdrop-blur-md text-purple-700 rounded-full flex items-center justify-center shadow-xl border-2 border-slate-100 hover:bg-purple-700 hover:text-white transition-all scale-100 hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-5 duration-300 group"
          aria-label="Back to Top"
        >
          <div className="group-hover:-translate-y-1 transition-transform">
            {ICONS.Up}
          </div>
        </button>
      )}
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />

      <div className="relative z-10 w-full max-w-7xl mx-auto pb-24">
        <div className="text-center mb-10 sm:mb-20 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
             <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-700 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-purple-200">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white rounded-lg sm:rounded-xl flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
             </div>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black text-slate-950 uppercase tracking-tighter mb-2 sm:mb-4">
            CFF VIDEO HUB
          </h1>
          <p className="text-[10px] sm:text-lg font-black text-purple-700 uppercase tracking-[0.4em]">
            Empowering Education Through Technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in zoom-in duration-1000 delay-200">
          <RoleCard 
            title="Student"
            description="Access all CFF educational materials immediately."
            icon={ICONS.Student}
            onClick={() => navigate('/student')}
            colorClass="bg-blue-500 shadow-blue-200"
          />
          <RoleCard 
            title="Trainer"
            description="View CFF materials and specialized trainer resources."
            icon={ICONS.Trainer}
            onClick={() => setShowLoginModal('trainer')}
            colorClass="bg-purple-600 shadow-purple-200"
          />
          <RoleCard 
            title="Admin"
            description="Complete system management and content moderation."
            icon={ICONS.Shield}
            onClick={() => setShowLoginModal('admin')}
            colorClass="bg-slate-900 shadow-slate-200"
          />
        </div>
      </div>

      {/* Scrolling Ticker Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-950 py-4 overflow-hidden border-t border-purple-500/30 z-50">
        <div className="flex w-max animate-infinite-scroll hover:[animation-play-state:paused] cursor-default">
          {[1, 2].map((set) => (
            <div key={set} className="flex whitespace-nowrap">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-12 px-12">
                  <span className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    WELCOME TO CFF VIDEO HUB 2026
                  </span>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    EMPOWERING EDUCATION THROUGH TECHNOLOGY
                  </span>
                  <span className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    LATEST UPDATES SYNCED IN REAL-TIME
                  </span>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">
                    VER: 1.0.4-PRO
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl animate-slide-up relative">
            <button 
              onClick={() => { setShowLoginModal(null); setError(''); setEmail(''); setPassword(''); }}
              className="absolute top-8 right-8 text-slate-400 hover:text-purple-700 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group"
              id="close-modal-btn"
            >
              <span className="group-hover:-translate-x-1 transition-transform">{ICONS.Back}</span> CLOSE
            </button>
            <div className="flex flex-col items-center mb-10">
              <div className={`w-16 h-16 ${showLoginModal === 'admin' ? 'bg-slate-900' : 'bg-purple-700'} rounded-2xl flex items-center justify-center text-white shadow-xl mb-6`}>
                {showLoginModal === 'admin' ? ICONS.Shield : ICONS.Trainer}
              </div>
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter text-center">
                {showLoginModal === 'admin' ? 'Admin Gateway' : 'Trainer Access'}
              </h2>
              <p className="text-[11px] font-black text-purple-700 uppercase tracking-[0.3em] mt-2">
                Secure Login
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                  Username
                </label>
                <input 
                  type={showLoginModal === 'admin' ? "email" : "text"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-8 py-4 bg-slate-100 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl text-sm font-bold focus:outline-none transition-all"
                  placeholder={showLoginModal === 'admin' ? "admin@ep-asia.com" : "trainer@epedu"}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Access Key</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-8 py-4 bg-slate-100 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl text-sm font-bold focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-[10px] font-bold text-red-500 uppercase text-center bg-red-50 py-3 rounded-xl border border-red-100">
                  {error}
                </p>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-700 hover:bg-slate-950 text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-purple-700/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                id="submit-login-btn"
              >
                {isLoading ? 'Verifying...' : 'Authenticate Access'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
