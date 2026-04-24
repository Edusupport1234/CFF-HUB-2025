
import React, { useState } from 'react';
import { Project, LearningTrack } from '../types';
import { ICONS } from '../constants';
import VideoPlayer from './VideoPlayer';

interface ProjectViewerProps {
  project: Project;
  track?: LearningTrack;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isAdmin: boolean;
  isSidebarOpen?: boolean;
  isDarkMode?: boolean;
}

const ProjectViewer: React.FC<ProjectViewerProps> = ({ project, track, onBack, onEdit, onDelete, isAdmin, isSidebarOpen, isDarkMode }) => {
  const [showHeroVideo, setShowHeroVideo] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const getYoutubeUrl = (videoUrl: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    const id = (match && match[7].length === 11) ? match[7] : null;
    return id ? `https://www.youtube.com/watch?v=${id}` : videoUrl;
  };

  const getYoutubeThumbnail = (videoUrl: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    const id = (match && match[7].length === 11) ? match[7] : null;
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  };

  const firstVideo = React.useMemo(() => {
    if (!project?.sections || !Array.isArray(project.sections)) return null;
    return project.sections
      .flatMap(s => s?.blocks || [])
      .find(b => b && b.type === 'video' && b.content);
  }, [project]);

  const displayThumbnail = React.useMemo(() => {
    const isDefault = project.thumbnail.includes('unsplash.com/photo-1498050108023-c5249f4df085');
    if (!isDefault && project.thumbnail) return project.thumbnail;

    if (firstVideo?.content) {
      const ytThumb = getYoutubeThumbnail(firstVideo.content);
      if (ytThumb) return ytThumb;
    }
    return project.thumbnail;
  }, [project, firstVideo]);

  const getSectionBg = (bg?: string) => {
    switch(bg) {
      case 'gray': return isDarkMode ? 'bg-[#15171e]' : 'bg-slate-100';
      case 'purple': return isDarkMode ? 'bg-gradient-to-br from-purple-950 to-[#15171e]' : 'bg-gradient-to-br from-purple-50 to-white';
      case 'dark': return 'bg-slate-950 text-white';
      default: return isDarkMode ? 'bg-[#0a0b0d]' : 'bg-white';
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 500);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getRelativeTime = (timestamp: string | number) => {
    let numericTime: number;

    if (typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp);
      if (!isNaN(parsed)) {
        numericTime = parsed;
      } else {
        return timestamp;
      }
    } else {
      numericTime = timestamp;
    }

    const now = Date.now();
    const diffInSeconds = Math.floor((now - numericTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div 
      ref={scrollContainerRef} 
      onScroll={handleScroll}
      className={`flex flex-col h-screen overflow-y-auto custom-scrollbar scroll-smooth transition-colors duration-500 ${isDarkMode ? 'dark bg-[#0a0b0d] text-white' : 'bg-white text-slate-900'}`}
    >
      {/* Back to Top Arrow */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className={`fixed bottom-10 right-6 sm:right-10 z-[100] w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-2 transition-all scale-100 hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-5 duration-300 group ${
            isDarkMode 
              ? 'bg-slate-800/80 backdrop-blur-md text-white border-slate-700 hover:bg-purple-700 shadow-black/40' 
              : 'bg-white/80 backdrop-blur-md text-purple-700 border-slate-100 hover:bg-purple-700 hover:text-white'
          }`}
          aria-label="Back to Top"
        >
          <div className="group-hover:-translate-y-1 transition-transform">
            {ICONS.Up}
          </div>
        </button>
      )}
      {/* Viewer Navigation */}
      <nav className={`sticky top-0 z-50 border-b-2 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between shadow-sm transition-all duration-500 backdrop-blur-xl ${isDarkMode ? 'bg-[#0a0b0d]/90 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="flex items-center gap-3 sm:gap-6">
          <button onClick={onBack} className={`p-2 sm:p-3 hover:text-purple-700 transition-colors group ${isDarkMode ? 'text-white hover:text-purple-400' : 'text-slate-900'}`}>
            <span className="group-hover:-translate-x-1 transition-transform inline-block">{ICONS.Back}</span>
          </button>
          <div className="max-w-[150px] sm:max-w-none">
            <h2 className={`text-xs sm:text-base font-black uppercase tracking-tight leading-none truncate ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
              {project.title}
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
              <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-widest truncate max-w-[80px] sm:max-w-none ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>{track?.title || 'Course Content'}</span>
              <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
              <span className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">{getRelativeTime(project.lastEdited)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {firstVideo?.content && (
             <button 
              onClick={() => window.open(getYoutubeUrl(firstVideo.content), '_blank')}
              className={`flex items-center gap-2 px-2 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'text-slate-300 hover:text-purple-400' : 'text-slate-950 hover:text-purple-700'}`}
             >
               {ICONS.External} <span className="hidden sm:inline">SOURCE</span>
             </button>
          )}
          {isAdmin && (
            <>
              <button 
                onClick={onEdit}
                className={`flex items-center gap-2 px-2 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'text-slate-300 hover:text-purple-400' : 'text-slate-950 hover:text-purple-700'}`}
              >
                {ICONS.Settings} <span className="hidden sm:inline">CONFIGURE</span>
              </button>
              <button 
                onClick={onDelete}
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 transition-all ${isDarkMode ? 'text-slate-500 hover:text-red-500' : 'text-slate-400 hover:text-red-600'}`}
                title="Delete Tutorial"
              >
                {ICONS.Delete}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative h-[60vh] sm:h-[70vh] bg-slate-950 flex items-center justify-center overflow-hidden">
        {showHeroVideo && firstVideo?.content ? (
          <div className="absolute inset-0 w-full h-full z-20 bg-black">
             <VideoPlayer url={firstVideo.content} autoPlay={true} className="rounded-none h-full border-0" />
             <button 
               onClick={() => setShowHeroVideo(false)}
               className="absolute top-4 right-4 sm:top-8 sm:right-8 z-40 p-3 sm:p-4 bg-black/50 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-md"
             >
               {ICONS.Back}
             </button>
          </div>
        ) : (
          <>
            <img src={displayThumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-110" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="relative z-10 text-center px-6 sm:px-10 max-w-5xl">
              <div className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-purple-700 rounded-full text-[9px] sm:text-[11px] font-black text-white uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-8 sm:mb-12 shadow-2xl border border-white/10">
                EXCELLENCE IN LEARNING
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                {project.title}
              </h1>
              <div className="mt-8 sm:mt-14 flex items-center justify-center gap-4 sm:gap-8">
                 {firstVideo?.content && (
                   <button 
                    onClick={() => setShowHeroVideo(true)}
                    className="flex items-center gap-3 sm:gap-4 px-6 sm:px-12 py-3.5 sm:py-5 bg-white text-slate-950 rounded-full text-[10px] sm:text-[13px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all shadow-2xl group active:scale-95"
                   >
                     {ICONS.Play} <span className="hidden sm:inline">Start Tutorial In-App</span><span className="sm:hidden">START</span>
                   </button>
                 )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Dynamic Content Sections */}
      <main className="w-full">
        {(project.sections || []).map((section) => (
          <div 
            key={section.id} 
            className={`${getSectionBg(section.style?.background)} ${section.style?.padding === 'compact' ? 'py-12 sm:py-16' : section.style?.padding === 'large' ? 'py-24 sm:py-44' : 'py-16 sm:py-28'} border-b border-slate-100 last:border-0`}
          >
            <div className={`max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-12 gap-8 sm:gap-12 ${isSidebarOpen ? 'lg:gap-16' : 'md:gap-16'}`}>
              {(section.blocks || []).map((block) => {
                if (!block) return null;
                const responsiveSpan = isSidebarOpen 
                  ? `col-span-12 lg:col-span-${block.gridSpan || 12}`
                  : `col-span-12 md:col-span-${block.gridSpan || 12}`;
                  
                return (
                  <div 
                    key={block.id} 
                    className={`${responsiveSpan} flex flex-col`}
                  >
                    {block.type === 'heading' && (
                      <h2 className={`text-2xl sm:text-4xl font-black uppercase tracking-tight mb-6 sm:mb-10 border-l-[8px] sm:border-l-[12px] border-purple-700 pl-5 sm:pl-8 leading-none ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{block.content}</h2>
                    )}
                    {block.type === 'text' && (
                      <div className="max-w-none">
                        <p className={`leading-relaxed text-lg sm:text-2xl font-bold whitespace-pre-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                          {block.content}
                        </p>
                      </div>
                    )}
                    {block.type === 'image' && block.content && (
                      <div className="rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl border-2 sm:border-4 border-white transform transition-transform hover:scale-[1.01] duration-500">
                        <img src={block.content} className="w-full h-auto" alt="Learning Material" />
                      </div>
                    )}
                    {block.type === 'video' && block.content && (
                      <VideoPlayer url={block.content} className="shadow-2xl rounded-[2rem] sm:rounded-[4rem]" />
                    )}
                    {block.type === 'divider' && (
                      <div className="py-16"><div className="h-1.5 w-full bg-slate-200 opacity-80 rounded-full shadow-inner" /></div>
                    )}
                    {block.type === 'spacer' && (
                      <div className="h-28" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {(!project.sections || project.sections.length === 0) && (
          <div className="text-center py-56 bg-slate-50">
            <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-sm">Building course content...</p>
          </div>
        )}
      </main>

      <footer className={`border-t-4 transition-colors duration-500 py-16 sm:py-32 px-6 sm:px-12 mt-auto ${
        isDarkMode 
          ? 'bg-[#0a0b0d] border-slate-800' 
          : 'bg-white border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 sm:gap-16">
          <div className="flex items-center gap-6 sm:gap-8">
             <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-purple-700 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-2xl ${isDarkMode ? 'shadow-black/50' : 'shadow-purple-300'}`}>EP</div>
             <div className="text-left">
               <span className={`block text-xl sm:text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>CFF VIDEO HUB</span>
               <span className={`block text-[10px] sm:text-[12px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>UNIVERSAL LEARNING ARCHITECTURE</span>
             </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <p className={`text-[12px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>© 2026 EP EDUCATION • ALL RIGHTS RESERVED</p>
            <p className={`text-[11px] font-black uppercase tracking-large ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>EXCELLENCE IN PEDAGOGICAL DESIGN</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectViewer;
