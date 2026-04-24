
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ICONS } from '../constants';

interface LandingPageProps {
  onAdminLoginSuccess: () => void;
  onTrainerLoginSuccess: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onAdminLoginSuccess, 
  onTrainerLoginSuccess,
  isDarkMode,
  toggleDarkMode
}) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState<'admin' | 'trainer' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicker, setShowTicker] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [isFlipping, setIsFlipping] = useState(false);

  const handleLogoClick = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => setIsFlipping(false), 1000);
  };

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
      // 1. Check Hardcoded Trainer Credentials First
      if (email === 'trainer@epedu' && password === 'Trainer@EPEDU123') {
        onTrainerLoginSuccess();
        navigate('/trainer-dashboard');
        return;
      }

      // 2. Otherwise, attempt Firebase Auth for Admin Access
      // Any valid Firebase authentication now grants full Admin access
      await signInWithEmailAndPassword(auth, email, password);
      
      onAdminLoginSuccess();
      navigate('/admin-dashboard');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your username and access key.');
      } else {
        setError('Authentication failed. Please verify your credentials.');
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
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`group relative flex flex-col items-center p-4 sm:p-10 border-2 rounded-[2rem] sm:rounded-[4rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden ${
        isDarkMode 
          ? 'bg-[#15171e] border-slate-800 hover:border-purple-500/50' 
          : 'bg-white border-slate-100 hover:border-purple-200'
      }`}
      id={`role-card-${title.toLowerCase()}`}
    >
      <motion.div 
        whileHover={{ scale: 1.1, rotate: -5 }}
        className={`w-10 h-10 sm:w-20 sm:h-20 rounded-[1rem] sm:rounded-[1.8rem] flex items-center justify-center mb-2 sm:mb-6 ${colorClass} text-white shadow-xl ${isDarkMode ? 'shadow-black/50' : ''} transition-transform duration-300`}
      >
        <div className="scale-50 sm:scale-100">{icon}</div>
      </motion.div>
      <h2 className={`text-lg sm:text-3xl font-black uppercase tracking-tighter mb-1 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
      <p className={`font-bold text-center text-[8px] sm:text-sm leading-relaxed uppercase tracking-widest px-1 sm:px-4 mb-3 sm:mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {description}
      </p>
      
      <div className={`mt-auto px-4 py-2 sm:px-8 sm:py-3 rounded-[1rem] sm:rounded-2xl text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg ${isDarkMode ? 'shadow-black/40' : ''} ${colorClass} group-hover:scale-105 active:scale-95 transition-all duration-300`}>
        {title === 'Student' ? 'Start Learning' : 'Access Hub'}
      </div>
    </motion.div>
  );

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className={`h-screen h-[100dvh] ${isDarkMode ? 'dark bg-[#0a0b0d] text-white' : 'bg-slate-50 text-slate-900'} flex flex-col items-center justify-start p-4 sm:p-12 pt-16 sm:pt-24 relative overflow-y-auto custom-scrollbar overflow-x-hidden scroll-smooth transition-colors duration-500`}
    >
      {/* Theme Toggle - Top Left */}
      <div className="absolute top-6 left-6 z-[60] group/theme">
        <button
          onClick={toggleDarkMode}
          className={`p-3 rounded-2xl shadow-xl border transition-all duration-300 active:scale-95 ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700 shadow-black/40' 
              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
          }`}
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <div className="scale-125">
            {isDarkMode ? ICONS.Sun : ICONS.Moon}
          </div>
        </button>
        {/* Tooltip */}
        <div className={`absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/theme:opacity-100 translate-x-2 group-hover/theme:translate-x-0 transition-all pointer-events-none shadow-xl border ${
          isDarkMode 
            ? 'bg-slate-800 text-white border-slate-700' 
            : 'bg-white text-slate-900 border-slate-100'
        }`}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-l border-b ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}></div>
        </div>
      </div>

      {/* Back to Top Arrow */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className={`fixed bottom-24 right-6 sm:bottom-10 sm:right-10 z-[100] w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border-2 transition-all scale-100 hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-5 duration-300 group ${
            isDarkMode 
              ? 'bg-slate-800/80 text-white border-slate-700 hover:bg-purple-700 shadow-black/40' 
              : 'bg-white/80 text-purple-700 border-slate-100 hover:bg-purple-700 hover:text-white'
          }`}
          aria-label="Back to Top"
        >
          <div className="group-hover:-translate-y-1 transition-transform">
            {ICONS.Up}
          </div>
        </button>
      )}
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-50 transition-colors duration-500" 
           style={{ backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(233, 213, 255, 0.5)' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-50 transition-colors duration-500" 
           style={{ backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(219, 234, 254, 0.5)' }} />

      <div className="relative z-10 w-full max-w-7xl mx-auto pb-16 sm:pb-20">
        <div className="text-center mb-6 sm:mb-12 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
             <motion.div 
               onClick={handleLogoClick}
               animate={isFlipping ? {
                 rotateY: [0, 180, 360, 540, 720],
                 y: [0, -60, -80, -60, 0],
                 scale: [1, 1.2, 1.4, 1.2, 1]
               } : { rotateY: 0, y: 0, scale: 1 }}
               transition={{ duration: 1, ease: "easeInOut" }}
               className={`w-10 h-10 sm:w-16 sm:h-16 bg-purple-700 rounded-xl sm:rounded-[2rem] flex items-center justify-center text-white shadow-2xl cursor-pointer ${isDarkMode ? 'shadow-black/50' : 'shadow-purple-200'}`}
             >
                <div className="w-5 h-5 sm:w-8 sm:h-8 border-[3px] sm:border-4 border-white rounded-lg sm:rounded-xl flex items-center justify-center">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                </div>
             </motion.div>
          </div>
          <h1 className={`text-3xl sm:text-6xl font-black uppercase tracking-tighter mb-1 sm:mb-2 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
            CFF VIDEO HUB
          </h1>
          <p className="text-[8px] sm:text-base font-black text-purple-700 uppercase tracking-[0.4em]">
            Empowering Education Through Technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-1000 delay-200">
          <RoleCard 
            title="Student"
            description="Access all CFF educational materials immediately."
            icon={ICONS.Student}
            onClick={() => navigate('/student')}
            colorClass={`bg-blue-500 ${isDarkMode ? 'shadow-black/40' : 'shadow-blue-200'}`}
          />
          <RoleCard 
            title="Trainer"
            description="View CFF materials and specialized trainer resources."
            icon={ICONS.Trainer}
            onClick={() => setShowLoginModal('trainer')}
            colorClass={`bg-purple-600 ${isDarkMode ? 'shadow-black/40' : 'shadow-purple-200'}`}
          />
        </div>
      </div>

      {/* Scrolling Ticker Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
        <div className="flex justify-end px-6 mb-1 pointer-events-auto">
          <button 
            onClick={() => setShowTicker(!showTicker)}
            className={`p-2 transition-all ${isDarkMode ? 'text-white hover:text-purple-400' : 'text-slate-950 hover:text-purple-700'}`}
            aria-label={showTicker ? "Hide Ticker" : "Show Ticker"}
          >
            <div className={`transition-transform duration-500 ${showTicker ? 'rotate-180' : 'rotate-0'}`}>
              {ICONS.Up}
            </div>
          </button>
        </div>
        
        <motion.div 
          initial={false}
          animate={{ height: showTicker ? 'auto' : 0, opacity: showTicker ? 1 : 0 }}
          className={`${isDarkMode ? 'bg-black border-purple-500/10' : 'bg-slate-950 border-purple-500/30'} overflow-hidden border-t pointer-events-auto`}
        >
          <div className="py-4">
            <div className="flex w-max animate-infinite-scroll hover:[animation-play-state:paused] cursor-default">
              {[1, 2].map((set) => (
                <div key={set} className="flex whitespace-nowrap">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-12 px-12">
                      <span className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        WELCOME TO CFF VIDEO HUB 2026
                      </span>
                      <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
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
        </motion.div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[3rem] p-12 shadow-2xl animate-slide-up relative transition-colors duration-500 ${
            isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'
          }`}>
            <button 
              onClick={() => { setShowLoginModal(null); setError(''); setEmail(''); setPassword(''); }}
              className={`absolute top-8 right-8 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group ${
                isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-purple-700'
              }`}
              id="close-modal-btn"
            >
              <span className="group-hover:-translate-x-1 transition-transform">{ICONS.Back}</span> CLOSE
            </button>
            <div className="flex flex-col items-center mb-10">
              <div className={`w-16 h-16 bg-purple-700 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6`}>
                {ICONS.Trainer}
              </div>
              <h2 className={`text-3xl font-black uppercase tracking-tighter text-center ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                {showLoginModal === 'trainer' ? 'Secure Access' : 'Admin Gateway'}
              </h2>
              <p className={`text-[11px] font-black uppercase tracking-[0.3em] mt-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                Trainer / Admin Login
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Username
                </label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-8 py-4 border-2 border-transparent focus:border-purple-600 focus:bg-transparent rounded-2xl text-sm font-bold focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 text-white placeholder-slate-600' 
                      : 'bg-slate-100 text-slate-950'
                  }`}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Access Key</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-8 py-4 border-2 border-transparent focus:border-purple-600 focus:bg-transparent rounded-2xl text-sm font-bold focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 text-white placeholder-slate-600' 
                      : 'bg-slate-100 text-slate-950'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className={`text-[10px] font-bold uppercase text-center py-3 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-red-900/20 border-red-900/50 text-red-400' 
                    : 'bg-red-50 border-red-100 text-red-500'
                }`}>
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
