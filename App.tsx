
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ProjectEditor from './components/ProjectEditor';
import ProjectViewer from './components/ProjectViewer';
import { ICONS, DEFAULT_TRACKS } from './constants';
import { ViewState, Project, LearningTrack, ProjectStatus } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [tracks, setTracks] = useState<LearningTrack[]>(DEFAULT_TRACKS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const getYoutubeThumbnail = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl);
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      }
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    } catch (e) { return null; }
  };

  const getProjectDisplayThumbnail = (p: Project) => {
    // Check if the current thumbnail is the "default placeholder" or empty
    const isDefault = p.thumbnail.includes('unsplash.com/photo-1498050108023-c5249f4df085');
    if (!isDefault && p.thumbnail) return p.thumbnail;

    // Look for first video thumbnail fallback
    const videoUrl = p.sections
      .flatMap(section => section.blocks)
      .find(block => block.type === 'video' && block.content)?.content;

    if (videoUrl) {
      const ytThumb = getYoutubeThumbnail(videoUrl);
      if (ytThumb) return ytThumb;
    }

    return p.thumbnail; // Final fallback
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Tutorial Title',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop',
      status: ProjectStatus.DRAFT,
      lastEdited: 'Just now',
      trackId: tracks[0]?.id || '',
      sections: []
    };
    setSelectedProject(newProject);
    setCurrentView('editor');
  };

  const handleSaveProject = (updated: Project) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === updated.id);
      if (exists) return prev.map(p => (p.id === updated.id ? updated : p));
      return [updated, ...prev];
    });
    setCurrentView('home');
    setSelectedProject(null);
  };

  const handleProjectClick = (p: Project) => {
    setSelectedProject(p);
    setCurrentView('viewer');
  };

  const handlePlayVideo = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const videoUrl = p.sections
      .flatMap(section => section.blocks)
      .find(block => block.type === 'video' && block.content)?.content;

    if (videoUrl) {
      window.open(videoUrl, '_blank');
    } else {
      handleProjectClick(p);
    }
  };

  const handleEditFromViewer = () => {
    setCurrentView('editor');
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (currentView === 'editor' && selectedProject) {
    return (
      <ProjectEditor 
        project={selectedProject} 
        tracks={tracks} 
        onSave={handleSaveProject} 
        onBack={() => {
          setCurrentView('home');
          setSelectedProject(null);
        }} 
      />
    );
  }

  if (currentView === 'viewer' && selectedProject) {
    return (
      <ProjectViewer 
        project={selectedProject}
        track={tracks.find(t => t.id === selectedProject.trackId)}
        onBack={() => {
          setCurrentView('home');
          setSelectedProject(null);
        }}
        onEdit={handleEditFromViewer}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        tracks={tracks}
        onTracksReorder={setTracks}
      />
      
      <main className="flex-1 flex flex-col relative overflow-y-auto px-12 py-12 scroll-smooth no-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <h1 className="text-[42px] font-black text-slate-950 leading-tight uppercase tracking-tighter">
              LEARNING GALLERY
            </h1>
            <p className="text-[14px] font-black text-purple-700 uppercase tracking-[0.3em] mt-1">
              EDUCATIONAL HUB • CURATED BY EXPERTS
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600">
                {ICONS.Search}
              </div>
              <input 
                type="text" 
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-300 rounded-[2rem] text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/20 focus:border-purple-600 shadow-xl transition-all text-slate-950 placeholder:text-slate-500"
              />
            </div>
            <button 
              onClick={handleCreateProject}
              className="flex items-center gap-3 bg-purple-700 text-white px-10 py-5 rounded-[2rem] text-[13px] font-black uppercase tracking-widest hover:bg-slate-950 shadow-2xl shadow-purple-200 transition-all active:scale-95"
            >
              {ICONS.Plus} ADD TUTORIAL
            </button>
          </div>
        </header>

        <div className="space-y-24 pb-20">
          {tracks.map((track) => {
            const trackProjects = filteredProjects.filter(p => p.trackId === track.id);
            
            return (
              <section key={track.id} className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between border-b-4 border-slate-200 pb-8">
                  <div className="flex items-center gap-6">
                    <span className="text-5xl bg-white p-5 rounded-[2.5rem] shadow-xl border-2 border-slate-100">{track.icon}</span>
                    <div>
                      <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight leading-none">
                        {track.title}
                      </h3>
                      <p className="text-[13px] font-black text-slate-600 uppercase tracking-[0.2em] mt-3">
                        {track.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {trackProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                    {trackProjects.map((project) => {
                      const displayImg = getProjectDisplayThumbnail(project);
                      return (
                        <div 
                          key={project.id}
                          className="group bg-white rounded-[4rem] border-2 border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-purple-700/20 transition-all duration-500 cursor-pointer hover:border-purple-400"
                          onClick={() => handleProjectClick(project)}
                        >
                          <div className="relative aspect-video overflow-hidden border-b-2 border-slate-100">
                            <img 
                              src={displayImg} 
                              alt={project.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-purple-950/40 transition-all duration-500" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                               <div 
                                 onClick={(e) => handlePlayVideo(project, e)}
                                 className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-purple-700 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500 cursor-pointer hover:bg-slate-50 active:scale-90"
                               >
                                 <div className="scale-150">{ICONS.Play}</div>
                               </div>
                            </div>
                          </div>
                          <div className="p-10">
                            <div className="flex items-center gap-2 mb-6">
                              <span className="px-3 py-1 bg-purple-700 text-white rounded-[1rem] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-200">
                                {project.status}
                              </span>
                            </div>
                            <h4 className="text-[20px] font-black text-slate-950 uppercase tracking-tight group-hover:text-purple-700 transition-colors line-clamp-2 leading-tight">
                              {project.title}
                            </h4>
                            <div className="flex items-center justify-between mt-10 pt-8 border-t-2 border-slate-100">
                               <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{project.lastEdited}</span>
                               <button 
                                 onClick={(e) => handlePlayVideo(project, e)}
                                 className="text-[11px] font-black text-purple-700 uppercase flex items-center gap-2 group-hover:translate-x-2 transition-transform hover:underline"
                               >
                                 LEARN NOW {ICONS.External}
                               </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div 
                    className="w-full h-40 border-4 border-dashed border-slate-300 rounded-[4rem] flex items-center justify-center bg-white hover:border-purple-600 hover:bg-purple-50 transition-all group cursor-pointer shadow-xl" 
                    onClick={handleCreateProject}
                  >
                    <p className="text-[14px] font-black text-slate-500 group-hover:text-purple-700 uppercase tracking-[0.4em] transition-colors flex items-center gap-6">
                      <span className="scale-150">{ICONS.Plus}</span> ADD YOUR FIRST TUTORIAL
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default App;
