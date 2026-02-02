
import React from 'react';
import { Project, LearningTrack } from '../types';
import { ICONS } from '../constants';
import VideoPlayer from './VideoPlayer';

interface ProjectViewerProps {
  project: Project;
  track?: LearningTrack;
  onBack: () => void;
  onEdit: () => void;
}

const ProjectViewer: React.FC<ProjectViewerProps> = ({ project, track, onBack, onEdit }) => {
  const getYoutubeUrl = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl);
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) videoId = urlObj.pathname.slice(1);
      else if (urlObj.hostname.includes('youtube.com')) videoId = urlObj.searchParams.get('v') || '';
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoUrl;
    } catch (e) { return videoUrl; }
  };

  const getYoutubeThumbnail = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl);
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) videoId = urlObj.pathname.slice(1);
      else if (urlObj.hostname.includes('youtube.com')) videoId = urlObj.searchParams.get('v') || '';
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    } catch (e) { return null; }
  };

  const firstVideo = React.useMemo(() => {
    return project.sections
      .flatMap(s => s.blocks)
      .find(b => b.type === 'video' && b.content);
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
      case 'gray': return 'bg-slate-100';
      case 'purple': return 'bg-gradient-to-br from-purple-50 to-white';
      case 'dark': return 'bg-slate-900 text-white';
      default: return 'bg-white';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-y-auto no-scrollbar">
      {/* Viewer Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-900 shadow-sm border border-slate-200">
            {ICONS.Back}
          </button>
          <div>
            <h2 className="text-base font-black text-slate-950 uppercase tracking-tight leading-none">
              {project.title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] font-black text-purple-700 uppercase tracking-widest">{track?.title || 'Course Content'}</span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{project.lastEdited}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {firstVideo?.content && (
             <button 
              onClick={() => window.open(getYoutubeUrl(firstVideo.content), '_blank')}
              className="flex items-center gap-3 bg-white border-2 border-slate-300 text-slate-950 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
             >
               {ICONS.External} SOURCE
             </button>
          )}
          <button 
            onClick={onEdit}
            className="flex items-center gap-3 bg-slate-950 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-purple-800 transition-all shadow-xl"
          >
            {ICONS.Settings} CONFIGURE
          </button>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative h-[60vh] bg-slate-950 flex items-center justify-center overflow-hidden">
        <img src={displayThumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-110" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="relative z-10 text-center px-10 max-w-5xl">
          <div className="inline-block px-8 py-3 bg-purple-700 rounded-full text-[11px] font-black text-white uppercase tracking-[0.4em] mb-12 animate-in slide-in-from-top-6 duration-1000 shadow-2xl border border-white/10">
            EXCELLENCE IN LEARNING
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter leading-[0.85] animate-in fade-in zoom-in duration-1000 drop-shadow-2xl">
            {project.title}
          </h1>
          <div className="mt-14 flex items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
             {firstVideo?.content && (
               <button 
                onClick={() => window.open(getYoutubeUrl(firstVideo.content), '_blank')}
                className="flex items-center gap-4 px-12 py-5 bg-white text-slate-950 rounded-full text-[13px] font-black uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all shadow-2xl group"
               >
                 {ICONS.Play} Watch On YouTube
                 <span className="group-hover:translate-x-1 transition-transform">{ICONS.External}</span>
               </button>
             )}
          </div>
        </div>
      </header>

      {/* Dynamic Content Sections */}
      <main className="w-full">
        {project.sections.map((section) => (
          <div 
            key={section.id} 
            className={`${getSectionBg(section.style?.background)} ${section.style?.padding === 'compact' ? 'py-16' : section.style?.padding === 'large' ? 'py-44' : 'py-28'} border-b border-slate-100 last:border-0`}
          >
            <div className="max-w-7xl mx-auto px-12 grid grid-cols-12 gap-12 md:gap-16">
              {section.blocks.map((block) => (
                <div 
                  key={block.id} 
                  className={`col-span-12 md:col-span-${block.gridSpan || 12} flex flex-col`}
                >
                  {block.type === 'heading' && (
                    <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tight mb-10 border-l-[12px] border-purple-700 pl-8 leading-none">{block.content}</h2>
                  )}
                  {block.type === 'text' && (
                    <div className="max-w-none">
                      <p className="text-slate-900 leading-relaxed text-2xl font-bold whitespace-pre-wrap">
                        {block.content}
                      </p>
                    </div>
                  )}
                  {block.type === 'image' && block.content && (
                    <div className="rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white transform transition-transform hover:scale-[1.01] duration-500">
                      <img src={block.content} className="w-full h-auto" alt="Learning Material" />
                    </div>
                  )}
                  {block.type === 'video' && block.content && (
                    <VideoPlayer url={block.content} className="shadow-2xl rounded-[4rem]" />
                  )}
                  {block.type === 'divider' && (
                    <div className="py-16"><div className="h-1.5 w-full bg-slate-200 opacity-80 rounded-full shadow-inner" /></div>
                  )}
                  {block.type === 'spacer' && (
                    <div className="h-28" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {project.sections.length === 0 && (
          <div className="text-center py-56 bg-slate-50">
            <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-sm">Building course content...</p>
          </div>
        )}
      </main>

      <footer className="border-t-4 border-slate-100 py-32 px-12 bg-white mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex items-center gap-8">
             <div className="w-16 h-16 bg-purple-700 rounded-[2rem] flex items-center justify-center text-white text-xl font-black shadow-2xl shadow-purple-300">EP</div>
             <div className="text-left">
               <span className="block text-2xl font-black text-slate-950 uppercase tracking-tighter">Learning Gallery Hub</span>
               <span className="block text-[12px] font-black text-purple-700 uppercase tracking-widest mt-1">Universal Learning Architecture</span>
             </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.3em]">© 2026 EP EDUCATION • ALL RIGHTS RESERVED</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-large">EXCELLENCE IN PEDAGOGICAL DESIGN</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectViewer;
