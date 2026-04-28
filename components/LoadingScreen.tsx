
import React from 'react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
  isDarkMode?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isDarkMode }) => {
  const emojis = ['⚙️', '📚', '🎓'];

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
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center transition-colors duration-500 ${
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

      <div className="relative flex flex-col items-center">
        {/* Animated Emoji Ring */}
        <div className="flex gap-8 mb-12">
          {emojis.map((emoji, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 0, opacity: 0 }}
              animate={{ 
                y: [0, -20, 0],
                opacity: 1,
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: idx * 0.4,
                ease: "easeInOut"
              }}
              className="text-5xl drop-shadow-2xl"
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-4">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-2xl font-black uppercase tracking-[0.3em] ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Loading
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
            >
              ...
            </motion.span>
          </motion.h2>
          
          <div className={`w-48 h-1 overflow-hidden rounded-full relative ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>

      {/* Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
