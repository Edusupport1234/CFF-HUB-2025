
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ProjectEditor from './components/ProjectEditor';
import ProjectViewer from './components/ProjectViewer';
import { ICONS, DEFAULT_TRACKS } from './constants';
import { ViewState, Project, LearningTrack, ProjectStatus } from './types';
import { db, auth } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-vimeo-new',
    title: 'FEATURED: VIMEO MASTERCLASS',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    status: ProjectStatus.PUBLISHED,
    lastEdited: 'Just now',
    trackId: 'ai-2026',
    subcategoryId: null,
    sections: [{
      id: 'main-section',
      columns: 1,
      style: { background: 'white', padding: 'normal' },
      blocks: [
        { id: 'main-video', type: 'video', content: 'https://vimeo.com/1152450382/c07623a9a6?share=copy&fl=sv&fe=ci', gridSpan: 12 },
        { id: 'main-desc', type: 'text', content: 'Explore this exclusive featured content played directly via our responsive internal player. This demo showcases how we handle unlisted or shared Vimeo links seamlessly within the learning environment.', gridSpan: 12 }
      ]
    }]
  },
  {
    id: 'demo-ai-1',
    title: 'AI BASICS: EXPLORING NEURAL NETWORKS',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    status: ProjectStatus.PUBLISHED,
    lastEdited: '2 hours ago',
    trackId: 'ai-2026',
    subcategoryId: 'ai-intro',
    sections: [{
      id: 'main-section',
      columns: 1,
      style: { background: 'white', padding: 'normal' },
      blocks: [
        { id: 'main-video', type: 'video', content: 'https://www.youtube.com/watch?v=aircAruvnKk', gridSpan: 12 },
        { id: 'main-desc', type: 'text', content: 'In this introductory session, we explore the fundamental architecture of neural networks. We\'ll cover how layers work together to process information and make predictions, mirroring biological processes in a digital environment.', gridSpan: 12 }
      ]
    }]
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isViewerAuthenticated, setIsViewerAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState<'admin' | 'viewer' | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Sync Tracks with Firebase
  useEffect(() => {
    const tracksRef = ref(db, 'tracks');
    const unsubscribe = onValue(tracksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tracksList = Array.isArray(data) ? data : Object.values(data) as LearningTrack[];
        setTracks(tracksList);
      } else {
        // Seed initial tracks if empty
        set(tracksRef, DEFAULT_TRACKS);
        setTracks(DEFAULT_TRACKS);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Projects with Firebase
  useEffect(() => {
    const projectsRef = ref(db, 'projects');
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array if stored as object, or handle array
        const projectsList = Array.isArray(data) ? data : Object.values(data) as Project[];
        setProjects(projectsList);
      } else {
        // Seed initial projects if empty
        set(projectsRef, DEMO_PROJECTS);
        setProjects(DEMO_PROJECTS);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // We consider ANY Firebase auth user as a Viewer unless they are specifically the EP Admin
        // However, the EP Admin is currently local-only for login, but let's keep things separated.
        setIsViewerAuthenticated(true);
      } else {
        setIsViewerAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleTracksReorder = (newTracks: LearningTrack[]) => {
    setTracks(newTracks);
    // Remove undefined values before saving to Firebase
    const cleanedTracks = JSON.parse(JSON.stringify(newTracks));
    set(ref(db, 'tracks'), cleanedTracks);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showLoginModal === 'admin') {
      if (loginUsername === 'EPEDUSUPPORT' && loginPassword === '12345678') {
        setIsAuthenticated(true);
        setLoginError('');
        setShowLoginModal(null);
        setLoginUsername('');
        setLoginPassword('');
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } else if (showLoginModal === 'viewer') {
      try {
        await signInWithEmailAndPassword(auth, loginUsername, loginPassword);
        setLoginError('');
        setShowLoginModal(null);
        setLoginUsername('');
        setLoginPassword('');
      } catch (error: any) {
        setLoginError(error.message || 'Login failed. Please check your credentials.');
      }
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    await signOut(auth);
    setIsViewerAuthenticated(false);
    setCurrentView('home');
  };

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
    const isDefault = p.thumbnail.includes('unsplash.com/photo-1498050108023-c5249f4df085');
    if (!isDefault && p.thumbnail) return p.thumbnail;
    const videoUrl = (p.sections || [])
      .flatMap(section => section?.blocks || [])
      .find(block => block && block.type === 'video' && block.content)?.content;
    if (videoUrl) {
      const ytThumb = getYoutubeThumbnail(videoUrl);
      if (ytThumb) return ytThumb;
    }
    return p.thumbnail;
  };

  const handleCreateProject = (trackId?: string, subcategoryId?: string) => {
    if (!isAuthenticated) return;
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Tutorial Title',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop',
      status: ProjectStatus.DRAFT,
      lastEdited: 'Just now',
      trackId: trackId || selectedTrackId || tracks[0]?.id || '',
      subcategoryId: subcategoryId || selectedSubcategoryId || null,
      sections: []
    };
    setSelectedProject(newProject);
    setCurrentView('editor');
  };

  const handleSaveProject = (updated: Project) => {
    const newProjects = projects.find(p => p.id === updated.id)
      ? projects.map(p => (p.id === updated.id ? updated : p))
      : [updated, ...projects];
    
    setProjects(newProjects);
    // Remove undefined values before saving to Firebase
    const cleanedProjects = JSON.parse(JSON.stringify(newProjects));
    set(ref(db, 'projects'), cleanedProjects);
    
    setCurrentView('home');
    setSelectedProject(null);
  };

  const handleProjectClick = (p: Project) => {
    setSelectedProject(p);
    setCurrentView('viewer');
  };
  
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Tutorial',
      message: 'Are you sure you want to permanently delete this tutorial? This action cannot be undone.',
      confirmText: 'Delete Tutorial',
      isDestructive: true,
      onConfirm: () => {
        const newProjects = projects.filter(p => p.id !== projectId);
        setProjects(newProjects);
        const cleanedProjects = JSON.parse(JSON.stringify(newProjects));
        set(ref(db, 'projects'), cleanedProjects);
        
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
          setCurrentView('home');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (!isAuthenticated) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Track',
      message: 'Delete this track and all its subcategories? Tutorials in this track will remain but will be unassigned.',
      confirmText: 'Delete Track',
      isDestructive: true,
      onConfirm: () => {
        const newTracks = tracks.filter(t => t.id !== trackId);
        handleTracksReorder(newTracks);
        if (selectedTrackId === trackId) {
          setSelectedTrackId(null);
          setSelectedSubcategoryId(null);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteSubcategory = (trackId: string, subId: string) => {
    if (!isAuthenticated) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Subcategory',
      message: 'Are you sure you want to delete this subcategory?',
      confirmText: 'Delete Subcategory',
      isDestructive: true,
      onConfirm: () => {
        const newTracks = tracks.map(t => {
          if (t.id === trackId) {
            return { ...t, subcategories: t.subcategories?.filter(s => s.id !== subId) };
          }
          return t;
        });
        handleTracksReorder(newTracks);
        if (selectedSubcategoryId === subId) setSelectedSubcategoryId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const onProjectDragStart = (e: React.DragEvent, id: string) => {
    if (!isAuthenticated) return;
    setDraggedProjectId(id);
    e.dataTransfer.setData('projectId', id);
  };

  const onProjectDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!isAuthenticated || !draggedProjectId || draggedProjectId === targetId) return;
    const draggedIdx = projects.findIndex(p => p.id === draggedProjectId);
    const targetIdx = projects.findIndex(p => p.id === targetId);
    const draggedProj = projects[draggedIdx];
    const targetProj = projects[targetIdx];
    if (draggedProj.trackId !== targetProj.trackId || draggedProj.subcategoryId !== targetProj.subcategoryId) return;
    const newProjects = [...projects];
    const [movedProject] = newProjects.splice(draggedIdx, 1);
    newProjects.splice(targetIdx, 0, movedProject);
    setProjects(newProjects);
  };

  const onProjectDragEnd = () => {
    setDraggedProjectId(null);
    // Persist the final order after dragging ends
    const cleanedProjects = JSON.parse(JSON.stringify(projects));
    set(ref(db, 'projects'), cleanedProjects);
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProjectCard = (project: Project) => {
    const displayImg = getProjectDisplayThumbnail(project);
    const isDragging = draggedProjectId === project.id;
    return (
      <div 
        key={project.id}
        draggable={isAuthenticated}
        onDragStart={(e) => onProjectDragStart(e, project.id)}
        onDragOver={(e) => onProjectDragOver(e, project.id)}
        onDragEnd={onProjectDragEnd}
        className={`group bg-white rounded-[2rem] sm:rounded-[3.5rem] border-2 border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-purple-700/20 transition-all duration-500 cursor-pointer ${
          isAuthenticated ? 'cursor-grab active:cursor-grabbing' : ''
        } hover:border-purple-400 ${
          isDragging ? 'opacity-20 scale-95 border-purple-500' : 'opacity-100'
        }`}
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
             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center text-purple-700 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
               <div className="scale-125">{ICONS.Play}</div>
             </div>
          </div>
          {isAuthenticated && (
            <button 
              onClick={(e) => handleDeleteProject(e, project.id)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-red-500 shadow-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-20"
            >
              <div className="scale-90 sm:scale-110">{ICONS.Delete}</div>
            </button>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-purple-700 text-white rounded-[1rem] text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-200">
              {project.status}
            </span>
          </div>
          <h4 className="text-[14px] sm:text-[16px] font-black text-slate-950 uppercase tracking-tight group-hover:text-purple-700 transition-colors line-clamp-2 leading-tight">
            {project.title}
          </h4>
          <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-slate-100">
             <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">{project.lastEdited}</span>
             <div className="text-[9px] sm:text-[10px] font-black text-purple-700 uppercase flex items-center gap-2 group-hover:translate-x-1 transition-transform">
               LEARN {ICONS.External}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddPlaceholder = (trackId: string, subcategoryId?: string) => {
    if (!isAuthenticated) return null;
    return (
      <div 
        key={`add-${trackId}-${subcategoryId || 'main'}`}
        onClick={() => handleCreateProject(trackId, subcategoryId)}
        className="group aspect-video xl:aspect-auto xl:h-full min-h-[200px] sm:min-h-[250px] border-4 border-dashed border-slate-200 rounded-[2rem] sm:rounded-[3.5rem] bg-white/50 flex flex-col items-center justify-center gap-4 hover:border-purple-600 hover:bg-purple-50 transition-all cursor-pointer shadow-sm hover:shadow-xl"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
          <div className="scale-125 sm:scale-150 transition-transform group-hover:rotate-90">{ICONS.Plus}</div>
        </div>
        <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-purple-700 transition-colors">
          ADD TUTORIAL
        </span>
      </div>
    );
  };

  const visibleTracks = selectedTrackId 
    ? tracks.filter(t => t.id === selectedTrackId)
    : tracks;

  const getBreadcrumbs = () => {
    const crumbs = [];
    crumbs.push(
      <button key="all" onClick={() => { setSelectedTrackId(null); setSelectedSubcategoryId(null); }} className="hover:text-purple-700 transition-colors">
        CFF VIDEO HUB
      </button>
    );
    if (selectedTrackId) {
      const track = tracks.find(t => t.id === selectedTrackId);
      crumbs.push(<span key="s1" className="text-slate-300 mx-1 sm:mx-2">/</span>);
      crumbs.push(
        <button key="track" onClick={() => setSelectedSubcategoryId(null)} className={`hover:text-purple-700 transition-colors ${!selectedSubcategoryId ? 'text-purple-700' : ''}`}>
          {track?.title}
        </button>
      );
    }
    if (selectedSubcategoryId && selectedTrackId) {
      const track = tracks.find(t => t.id === selectedTrackId);
      const sub = track?.subcategories?.find(s => s.id === selectedSubcategoryId);
      crumbs.push(<span key="s2" className="text-slate-300 mx-1 sm:mx-2">/</span>);
      crumbs.push(<span key="sub" className="text-purple-700">{sub?.title}</span>);
    }
    return crumbs;
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl animate-slide-up">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${confirmModal.isDestructive ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700'}`}>
              <div className="scale-150">{confirmModal.isDestructive ? ICONS.Delete : ICONS.Settings}</div>
            </div>
            <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight mb-4">{confirmModal.title}</h3>
            <p className="text-slate-600 font-bold leading-relaxed mb-10">{confirmModal.message}</p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95 ${confirmModal.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-700 hover:bg-purple-800'}`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl animate-slide-up relative">
            <button 
              onClick={() => setShowLoginModal(null)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-950 transition-colors"
            >
              {ICONS.Back}
            </button>
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-purple-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-900/20 mb-6">
                <div className="w-8 h-8 border-4 border-white rounded-xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tighter text-center">
                {showLoginModal === 'admin' ? 'EP Admin' : 'Viewer Access'}
              </h1>
              <p className="text-[11px] font-black text-purple-700 uppercase tracking-[0.3em] mt-2">
                {showLoginModal === 'admin' ? 'Tutorial Management Hub' : 'Educational Content Hub'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                  {showLoginModal === 'admin' ? 'Username' : 'Email Address'}
                </label>
                <input 
                  type={showLoginModal === 'admin' ? "text" : "email"}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-8 py-4 bg-slate-100 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl text-sm font-bold focus:outline-none transition-all"
                  placeholder={showLoginModal === 'admin' ? "EPEDUSUPPORT" : "you@example.com"}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Password</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-8 py-4 bg-slate-100 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl text-sm font-bold focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <p className="text-[10px] font-bold text-red-500 uppercase text-center">{loginError}</p>
              )}

              <button 
                type="submit"
                className="w-full bg-purple-700 hover:bg-slate-950 text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-purple-700/20 transition-all active:scale-95"
              >
                Authorize Access
              </button>
              {showLoginModal === 'viewer' && (
                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider">
                  Password: EPedu123@
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {currentView === 'editor' && selectedProject ? (
        <div className="flex-1 h-full overflow-hidden">
          <ProjectEditor 
            project={selectedProject} 
            tracks={tracks} 
            onSave={handleSaveProject} 
            onBack={() => { setCurrentView('home'); setSelectedProject(null); }} 
          />
        </div>
      ) : currentView === 'viewer' && selectedProject ? (
        <div className="flex-1 h-full overflow-hidden">
          <ProjectViewer 
            project={selectedProject}
            track={tracks.find(t => t.id === selectedProject.trackId)}
            onBack={() => { setCurrentView('home'); setSelectedProject(null); }}
            onEdit={() => setCurrentView('editor')}
            onDelete={(e) => handleDeleteProject(e, selectedProject.id)}
            isAdmin={isAuthenticated}
          />
        </div>
      ) : (
        <>
          <Sidebar 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            tracks={tracks}
            onTracksReorder={handleTracksReorder}
            onDeleteTrack={handleDeleteTrack}
            onDeleteSub={handleDeleteSubcategory}
            selectedTrackId={selectedTrackId}
            onTrackSelect={setSelectedTrackId}
            selectedSubcategoryId={selectedSubcategoryId}
            onSubcategorySelect={setSelectedSubcategoryId}
            isAdmin={isAuthenticated}
            onAdminLogin={() => setShowLoginModal('admin')}
            onAdminLogout={handleLogout}
            isViewer={isViewerAuthenticated}
            onViewerLogin={() => setShowLoginModal('viewer')}
            onViewerLogout={handleLogout}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main className="flex-1 flex flex-col relative overflow-y-auto px-4 sm:px-12 py-6 sm:py-12 scroll-smooth no-scrollbar">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center text-white">
                  <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-950 uppercase tracking-tight">CFF HUB</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-slate-100 rounded-xl text-slate-900"
              >
                {ICONS.Menu}
              </button>
            </div>

            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12 sm:mb-16">
              <div className="group flex items-center gap-4">
                <div>
                  <h1 className="text-[28px] sm:text-[42px] font-black text-slate-950 leading-tight uppercase tracking-tighter flex items-center flex-wrap">
                    {getBreadcrumbs()}
                  </h1>
                  <p className="text-[11px] sm:text-[14px] font-black text-purple-700 uppercase tracking-[0.3em] mt-1">
                    EDUCATIONAL HUB • CURATED BY EXPERTS
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {(selectedTrackId || selectedSubcategoryId) && (
                    <button 
                      onClick={() => { 
                        if (selectedSubcategoryId) setSelectedSubcategoryId(null);
                        else setSelectedTrackId(null);
                      }}
                      className="text-[9px] sm:text-[11px] font-black text-slate-500 hover:text-purple-700 uppercase tracking-widest flex items-center gap-2 transition-colors bg-white px-4 py-3 rounded-2xl border-2 border-slate-200 shadow-sm"
                    >
                      {ICONS.Back} BACK
                    </button>
                  )}
                  <div className="relative flex-1 md:w-80">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 scale-75 sm:scale-100">
                      {ICONS.Search}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white border-2 border-slate-300 rounded-[1.5rem] sm:rounded-[2rem] text-[12px] sm:text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/20 shadow-xl transition-all text-slate-950 placeholder:text-slate-500"
                    />
                  </div>
                </div>
                {isAuthenticated && (
                  <button 
                    onClick={() => handleCreateProject()}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-purple-700 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-[11px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-slate-950 shadow-2xl transition-all active:scale-95"
                  >
                    {ICONS.Plus} ADD TUTORIAL
                  </button>
                )}
              </div>
            </header>
            <div className="space-y-24 sm:space-y-32 pb-20">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing with Cloud...</p>
                </div>
              ) : !isAuthenticated && !isViewerAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-32 sm:py-48 text-center animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white border-2 border-slate-200 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-8 sm:mb-12 shadow-xl">
                    <div className="scale-150 sm:scale-[2]">{ICONS.Lock}</div>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-950 uppercase tracking-tighter mb-4 sm:mb-6">Restricted Access</h2>
                  <p className="text-[11px] sm:text-[13px] font-black text-slate-500 uppercase tracking-[0.3em] max-w-sm mb-12 sm:mb-16 leading-loose">
                    Please log in via the sidebar to view tutorials and educational content.
                  </p>
                  <button 
                    onClick={() => setShowLoginModal('viewer')}
                    className="bg-purple-700 text-white px-10 sm:px-14 py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] text-[11px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-slate-950 shadow-2xl transition-all active:scale-95"
                  >
                    Viewer Login
                  </button>
                </div>
              ) : (Array.isArray(visibleTracks) ? visibleTracks : []).map((track) => {
                const trackProjects = filteredProjects.filter(p => p.trackId === track.id);
                const subcategoriesToRender = selectedSubcategoryId ? track.subcategories?.filter(s => s.id === selectedSubcategoryId) : track.subcategories;
                const hasSubcategories = subcategoriesToRender && subcategoriesToRender.length > 0;
                return (
                  <section key={track.id} className="space-y-10 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {!selectedTrackId && (
                      <div className="flex items-center justify-between border-b-4 border-slate-200 pb-6 sm:pb-8 cursor-pointer group" onClick={() => setSelectedTrackId(track.id)}>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <span className="text-3xl sm:text-5xl bg-white p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border-2 border-slate-100 group-hover:scale-105 transition-transform">{track.icon}</span>
                          <div>
                            <h3 className="text-xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-none group-hover:text-purple-700 transition-colors">{track.title}</h3>
                            <p className="text-[10px] sm:text-[13px] font-black text-slate-600 uppercase tracking-[0.2em] mt-2 sm:mt-3">{track.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {hasSubcategories ? (
                      <div className="space-y-12 sm:space-y-16">
                        {subcategoriesToRender?.map(sub => {
                          const subProjects = trackProjects.filter(p => p.subcategoryId === sub.id);
                          return (
                            <div key={sub.id} className="space-y-6 sm:space-y-8 pl-3 sm:pl-4 border-l-4 border-purple-100">
                              <h4 className={`text-lg sm:text-xl font-black uppercase tracking-widest flex items-center gap-3 sm:gap-4 cursor-pointer hover:text-purple-900 transition-colors ${selectedSubcategoryId === sub.id ? 'text-purple-900' : 'text-purple-700'}`} onClick={() => setSelectedSubcategoryId(sub.id)}>
                                <span className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${selectedSubcategoryId === sub.id ? 'bg-purple-900 scale-125' : 'bg-purple-600'}`} />
                                {sub.title}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12">
                                {subProjects.map(project => renderProjectCard(project))}
                                {renderAddPlaceholder(track.id, sub.id)}
                              </div>
                            </div>
                          );
                        })}
                        {!selectedSubcategoryId && trackProjects.filter(p => !p.subcategoryId).length > 0 && (
                          <div className="space-y-6 sm:space-y-8 pl-3 sm:pl-4">
                            <h4 className="text-lg sm:text-xl font-black text-slate-400 uppercase tracking-widest">Other Tutorials</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12">
                              {trackProjects.filter(p => !p.subcategoryId).map(project => renderProjectCard(project))}
                              {renderAddPlaceholder(track.id)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      (!selectedSubcategoryId) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12">
                          {trackProjects.map((project) => renderProjectCard(project))}
                          {renderAddPlaceholder(track.id)}
                        </div>
                      )
                    )}
                  </section>
                );
              })}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default App;
