
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, LearningTrack } from '../types';

interface LoadingScreenProps {
  isDarkMode?: boolean;
  tip?: string | null;
  suggestedProject?: Project | null;
  tracks?: LearningTrack[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isDarkMode, tip, suggestedProject, tracks }) => {
  const emojis = ['⚙️', '📚', '🎓'];
  const [currentTip, setCurrentTip] = useState(0);
  const loadingTips = [
    "Tip: Use the search bar for instant module results.",
    "Pro-tip: Resume learning from your history section.",
    "Did you know? Progress is saved automatically.",
    "Explore different tracks for specialized knowledge.",
    "Registry Trash: Recover deleted items within 30 days.",
    "Learning Tip: Take short breaks to maintain focus.",
    "Students: Check your specific track for new uploads.",
    "Trainers: Direct students to curated subcategories.",
    "Master a technical skill by watching twice - once to learn, once to do.",
    "Feeling stuck? Explore the troubleshooting modules."
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  return (
    <motion.div 
      initial={{ x: 0 }}
      exit={{ 
        x: '-100%',
        transition: { 
          duration: 0.8, 
          ease: [0.4, 0, 0.2, 1] 
        }
      }}
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center transition-colors duration-500 overflow-hidden ${
        isDarkMode ? 'bg-[#0a0b0d]' : 'bg-white'
      }`}
    >
      {/* Wave shape overlay for the exit effect */}
      <motion.div
        initial={{ x: '100%' }}
        exit={{ x: '0%' }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-y-0 left-0 w-full bg-gradient-to-l from-transparent via-purple-500/10 to-purple-600/20 pointer-events-none"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15% 100%)'
        }}
      />

      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
        {/* Animated Emoji Ring */}
        <div className="flex gap-8 mb-16">
          {emojis.map((emoji, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 0, opacity: 0 }}
              animate={{ 
                y: [0, -15, 0],
                opacity: 1,
                scale: [1, 1.15, 1]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: idx * 0.5,
                ease: "easeInOut"
              }}
              className="text-4xl sm:text-6xl drop-shadow-2xl"
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-start">
          {/* Left Side: Progress & General Loading */}
          <div className="flex flex-col items-center lg:items-end text-center lg:text-right space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-2xl sm:text-4xl font-black uppercase tracking-[0.2em] leading-none ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Syncing
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                >
                  ...
                </motion.span>
              </motion.h2>
              <div className={`w-48 h-1 lg:ml-auto overflow-hidden rounded-full relative ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </div>

            <div className="space-y-4 max-w-sm">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">
                Quick Guide
              </span>
              <div className="h-20 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={currentTip}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className={`text-[12px] sm:text-[14px] font-bold leading-relaxed ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {loadingTips[currentTip]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Side: Featured Dynamic Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <AnimatePresence mode="wait">
              {tip && (
                <motion.div
                  key="tip-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-6 rounded-[2.5rem] border-2 relative overflow-hidden group ${
                    isDarkMode ? 'bg-purple-900/10 border-purple-500/20 shadow-xl shadow-black/40' : 'bg-purple-50 border-purple-100 shadow-sm'
                  }`}
                >
                  <div className="relative">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-2">
                       Insight for you
                    </span>
                    <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Tip of the Session
                    </h3>
                    <p className={`text-sm font-bold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {tip}
                    </p>
                  </div>
                </motion.div>
              )}

              {suggestedProject && (
                <motion.div
                  key="suggested-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-6 rounded-[2.5rem] border-2 flex items-center gap-6 ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center text-3xl">
                    {tracks?.find(t => t.id === suggestedProject.trackId)?.icon || '💿'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest block mb-1">
                      Up Next Suggestion
                    </span>
                    <h4 className={`text-sm font-black uppercase tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {suggestedProject.title}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 line-clamp-1">
                      Ready to dive back into {tracks?.find(t => t.id === suggestedProject.trackId)?.title}?
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-[40rem] h-[40rem] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
