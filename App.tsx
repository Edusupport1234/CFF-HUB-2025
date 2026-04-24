
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import ProjectEditor from './components/ProjectEditor';
import ProjectViewer from './components/ProjectViewer';
import { ICONS, DEFAULT_TRACKS } from './constants';
import { ViewState, Project, LearningTrack, ProjectStatus } from './types';
import { db, auth } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
    }],
    audience: 'all'
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
    }],
    audience: 'all'
  },
  {
    id: 'demo-trainer-1',
    title: 'TRAINER GUIDE: CLASSROOM MANAGEMENT',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop',
    status: ProjectStatus.PUBLISHED,
    lastEdited: 'New',
    trackId: 'trainer-code-2026',
    subcategoryId: 'code-block',
    sections: [{
      id: 'main-section',
      columns: 1,
      style: { background: 'white', padding: 'normal' },
      blocks: [
        { id: 'main-video', type: 'video', content: 'https://www.youtube.com/watch?v=M-5HkH6jXhM', gridSpan: 12 },
        { id: 'main-desc', type: 'text', content: 'This specialized video provides trainers with essential strategies for maintaining an engaging and controlled learning environment. Learn tips on pacing, student interaction, and technical troubleshooting.', gridSpan: 12 }
      ]
    }],
    audience: 'trainer'
  }
];

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isViewerAuthenticated, setIsViewerAuthenticated] = useState(false);

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainContentRef = React.useRef<HTMLElement>(null);
  
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

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
        
        // Migration: Ensure all DEFAULT_TRACKS exist and are up to date
        // and remove the old 'trainer-track'
        let hasChanges = false;
        let updatedTracks = [...tracksList].filter(t => t.id !== 'trainer-track');
        if (updatedTracks.length !== tracksList.length) hasChanges = true;

        DEFAULT_TRACKS.forEach(dt => {
          const existingIdx = updatedTracks.findIndex(t => t.id === dt.id);
          if (existingIdx === -1) {
            updatedTracks.push(dt);
            hasChanges = true;
          } else {
            // Check if subcategories need updating
            const existingTrack = updatedTracks[existingIdx];
            let currentSubs = [...(existingTrack.subcategories || [])];
            
            // Cleanup: Remove old placeholders if they exist
            const placeholders = ['t-code-2026-gen', 't-ai-2026-gen', 'trainer-videos', 'trainer-cff-2026', 'trainer-cff-2024', 'trainer-ai-2026'];
            const cleanedSubs = currentSubs.filter(s => !placeholders.includes(s.id));
            
            if (cleanedSubs.length !== currentSubs.length) {
                currentSubs = cleanedSubs;
                hasChanges = true;
            }

            // Deduplicate subcategories to prevent "Servo Motor" or others appearing twice
            // caused by merging code constants with potentially redundant database entries
            const seenIds = new Set<string>();
            const seenTitles = new Set<string>();
            const deduplicatedSubs = currentSubs.filter(sub => {
              const titleKey = sub.title.toLowerCase().trim();
              if (seenIds.has(sub.id) || seenTitles.has(titleKey)) {
                hasChanges = true;
                return false;
              }
              seenIds.add(sub.id);
              seenTitles.add(titleKey);
              return true;
            });
            currentSubs = deduplicatedSubs;

            const missingSubs = (dt.subcategories || []).filter(
              ds => !currentSubs.find((cs: any) => cs.id === ds.id || cs.title.toLowerCase().trim() === ds.title.toLowerCase().trim())
            );
            
            if (missingSubs.length > 0) {
              updatedTracks[existingIdx] = {
                ...existingTrack,
                subcategories: [...currentSubs, ...missingSubs]
              };
              hasChanges = true;
            } else if (hasChanges) {
               // Update the track with the cleaned/deduplicated subcategories
               updatedTracks[existingIdx] = {
                ...existingTrack,
                subcategories: currentSubs
              };
            }
          }
        });

        if (hasChanges) {
          set(tracksRef, updatedTracks);
        }
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

        // Migration: Ensure demo-trainer-1 exists and updated to new track if needed
        // Also migrate legacy time strings to realistic timestamps
        let pHasChanges = false;
        const ONE_MONTH_AGO = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        let updatedProjectList = projectsList.map(p => {
          if (typeof p.lastEdited === 'string' && ['Just now', 'New', '2 hours ago'].includes(p.lastEdited)) {
            pHasChanges = true;
            return { ...p, lastEdited: ONE_MONTH_AGO };
          }
          return p;
        });

        const trainerDemo = updatedProjectList.find(p => p.id === 'demo-trainer-1');
        if (!trainerDemo) {
          const freshTrainerDemo = DEMO_PROJECTS.find(p => p.id === 'demo-trainer-1');
          if (freshTrainerDemo) {
            updatedProjectList.push(freshTrainerDemo);
            pHasChanges = true;
          }
        } else if (trainerDemo.trackId === 'trainer-track' || trainerDemo.subcategoryId === 't-code-2026-gen') {
          // Update existing demo to new track structure or fix subcategory
          const freshTrainerDemo = DEMO_PROJECTS.find(p => p.id === 'demo-trainer-1');
          if (freshTrainerDemo) {
            const idx = updatedProjectList.findIndex(p => p.id === 'demo-trainer-1');
            updatedProjectList[idx] = { ...trainerDemo, trackId: freshTrainerDemo.trackId, subcategoryId: freshTrainerDemo.subcategoryId };
            pHasChanges = true;
          }
        }

        if (pHasChanges) {
          const cleanedProjects = JSON.parse(JSON.stringify(updatedProjectList));
          set(projectsRef, cleanedProjects);
        }
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
        // Any user successfully authenticated via Firebase is treated as an Admin
        setIsAuthenticated(true);
        setIsViewerAuthenticated(true);
      } else {
        // If Firebase Auth is cleared, we only automatically clear the Admin state.
        // We leave isViewerAuthenticated alone to allow the hardcoded Trainer session to persist independently
        setIsAuthenticated(false);
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

  const scrollToTop = () => {
    mainContentRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 100);
  };

  const getRelativeTime = (timestamp: string | number) => {
    let numericTime: number;

    if (typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp);
      if (!isNaN(parsed)) {
        numericTime = parsed;
      } else {
        return timestamp; // Return as-is if it's not a parsable date (e.g. "Legacy")
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

  const handleLogout = async () => {
    setIsAuthenticated(false);
    await signOut(auth);
    setIsViewerAuthenticated(false);
    setCurrentView('home');
    navigate('/');
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
      lastEdited: Date.now(),
      trackId: trackId || selectedTrackId || tracks[0]?.id || '',
      subcategoryId: subcategoryId || selectedSubcategoryId || null,
      sections: [],
      audience: 'all'
    };
    setSelectedProject(newProject);
    setCurrentView('editor');
  };

  const handleSaveProject = (updated: Project) => {
    const projectWithTime = { ...updated, lastEdited: Date.now() };
    const newProjects = projects.find(p => p.id === projectWithTime.id)
      ? projects.map(p => (p.id === projectWithTime.id ? projectWithTime : p))
      : [projectWithTime, ...projects];
    
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

  const renderMainHub = (role: 'student' | 'trainer' | 'admin') => {
    // Only admins have edit/delete permissions
    const canEdit = role === 'admin';

    const displayTracks = role === 'student' 
      ? tracks.filter(t => !t.id.startsWith('trainer-') && !t.title.toUpperCase().startsWith('TRAINER:'))
      : tracks;

    const displayProjects = projects.filter(p => {
      const audienceAllowed = !p.audience || p.audience === 'all' || p.audience === role || role === 'admin' || role === 'trainer';
      
      if (role === 'student') {
        const track = tracks.find(t => t.id === p.trackId);
        const isTrainerTrack = track && (track.id.startsWith('trainer-') || track.title.toUpperCase().startsWith('TRAINER:'));
        return audienceAllowed && !isTrainerTrack;
      }
      
      return audienceAllowed;
    });

    const visibleTracks = selectedTrackId 
      ? displayTracks.filter(t => t.id === selectedTrackId)
      : displayTracks;

    const filteredProjects = displayProjects.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getBreadcrumbs = () => {
      const crumbs = [];
      crumbs.push(
        <button key="all" onClick={() => { setSelectedTrackId(null); setSelectedSubcategoryId(null); }} className="hover:text-purple-700 transition-colors whitespace-nowrap">
          CFF VIDEO HUB
        </button>
      );
      if (selectedTrackId) {
        const track = tracks.find(t => t.id === selectedTrackId);
        crumbs.push(<span key="s1" className="text-slate-300 mx-1 sm:mx-2 shrink-0">/</span>);
        crumbs.push(
          <button key="track" onClick={() => setSelectedSubcategoryId(null)} className={`hover:text-purple-700 transition-colors text-left ${!selectedSubcategoryId ? 'text-purple-700' : ''}`}>
            {track?.title}
          </button>
        );
      }
      if (selectedSubcategoryId && selectedTrackId) {
        const track = tracks.find(t => t.id === selectedTrackId);
        const sub = track?.subcategories?.find(s => s.id === selectedSubcategoryId);
        crumbs.push(<span key="s2" className="text-slate-300 mx-1 sm:mx-2 shrink-0">/</span>);
        crumbs.push(<span key="sub" className="text-purple-700 text-left">{sub?.title}</span>);
      }
      return crumbs;
    };

    const getGridClasses = () => {
      if (isSidebarOpen) {
        return "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-10";
      }
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12";
    };

    const renderProjectCard = (project: Project) => {
      const displayImg = getProjectDisplayThumbnail(project);
      const isDragging = draggedProjectId === project.id;
      return (
        <div 
          key={project.id}
          draggable={canEdit}
          onDragStart={(e) => onProjectDragStart(e, project.id)}
          onDragOver={(e) => onProjectDragOver(e, project.id)}
          onDragEnd={onProjectDragEnd}
          className={`group rounded-[2rem] sm:rounded-[3rem] border-2 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer ${
            isDarkMode 
              ? 'bg-[#15171e] border-slate-800 hover:border-purple-500/50 hover:shadow-black/60' 
              : 'bg-white border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-purple-700/20'
          } ${
            canEdit ? 'cursor-grab active:cursor-grabbing' : ''
          } ${
            isDragging ? 'opacity-20 scale-95 border-purple-500' : 'opacity-100'
          }`}
          onClick={() => handleProjectClick(project)}
        >
          <div className={`relative aspect-video overflow-hidden border-b-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <img 
              src={displayImg} 
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-purple-950/40 transition-all duration-500" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-purple-700 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                 <div className="scale-110">{ICONS.Play}</div>
               </div>
            </div>
            {canEdit && (
              <button 
                onClick={(e) => handleDeleteProject(e, project.id)}
                className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-red-500 shadow-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-white z-20"
              >
                <div className="scale-90">{ICONS.Delete}</div>
              </button>
            )}
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className={`px-2.5 py-0.5 bg-purple-700 text-white rounded-[0.8rem] text-[8px] font-black uppercase tracking-widest shadow-lg ${isDarkMode ? 'shadow-black/50' : 'shadow-purple-200'}`}>
                {project.status}
              </span>
              {canEdit && (
                <span className={`px-2.5 py-0.5 bg-slate-900 text-white rounded-[0.8rem] text-[8px] font-black uppercase tracking-widest shadow-lg ${isDarkMode ? 'shadow-black/50' : 'shadow-slate-200'}`}>
                  {project.audience || 'ALL'}
                </span>
              )}
            </div>
            <h4 className={`text-[13px] sm:text-[15px] font-black uppercase tracking-tight group-hover:text-purple-700 transition-colors line-clamp-2 leading-tight min-h-[2.5rem] ${isDarkMode ? 'text-slate-200' : 'text-slate-950'}`}>
              {project.title}
            </h4>
            <div className={`flex items-center justify-between mt-4 sm:mt-5 pt-4 sm:pt-5 border-t-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
               <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{getRelativeTime(project.lastEdited)}</span>
               <div className={`text-[9px] font-black uppercase flex items-center gap-1.5 group-hover:translate-x-1 transition-transform ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                 LEARN {ICONS.External}
               </div>
            </div>
          </div>
        </div>
      );
    };

    const renderAddPlaceholder = (trackId: string, subcategoryId?: string) => {
      if (!canEdit) return null;
      return (
        <div 
          key={`add-${trackId}-${subcategoryId || 'main'}`}
          onClick={() => handleCreateProject(trackId, subcategoryId)}
          className={`group aspect-video xl:aspect-auto xl:h-full min-h-[180px] sm:min-h-[220px] border-4 border-dashed rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center gap-3 hover:border-purple-600 hover:bg-purple-50/10 transition-all cursor-pointer shadow-sm hover:shadow-xl ${
            isDarkMode 
              ? 'border-slate-800 bg-[#15171e]/50' 
              : 'border-slate-200 bg-white/50'
          }`}
        >
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-inner ${
            isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'
          } group-hover:bg-purple-600 group-hover:text-white`}>
            <div className="scale-110 sm:scale-125 transition-transform group-hover:rotate-90">{ICONS.Plus}</div>
          </div>
          <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-purple-700 transition-colors">
            ADD TUTORIAL
          </span>
        </div>
      );
    };

    return (
      <div className={`flex h-screen overflow-hidden relative flex-col md:flex-row transition-colors duration-500 ${isDarkMode ? 'dark bg-[#0a0b0d]' : 'bg-slate-100'}`}>
        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up ${isDarkMode ? 'bg-[#15171e]' : 'bg-white'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${confirmModal.isDestructive ? 'bg-red-50 text-red-600' : (isDarkMode ? 'bg-purple-950 text-purple-400' : 'bg-purple-50 text-purple-700')}`}>
                <div className="scale-150">{confirmModal.isDestructive ? ICONS.Delete : ICONS.Settings}</div>
              </div>
              <h3 className={`text-2xl font-black uppercase tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{confirmModal.title}</h3>
              <p className={`font-bold leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{confirmModal.message}</p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`flex-1 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
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

        {currentView === 'editor' && selectedProject ? (
          <div className="flex-1 h-full overflow-hidden">
            <ProjectEditor 
              project={selectedProject} 
              tracks={tracks} 
              onSave={handleSaveProject} 
              onBack={() => { setCurrentView('home'); setSelectedProject(null); }} 
              isDarkMode={isDarkMode}
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
              isAdmin={canEdit}
              isSidebarOpen={isSidebarOpen}
              isDarkMode={isDarkMode}
            />
          </div>
        ) : (
          <>
            <Sidebar 
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              currentView={currentView} 
              onViewChange={setCurrentView} 
              tracks={displayTracks}
              onTracksReorder={handleTracksReorder}
              onDeleteTrack={handleDeleteTrack}
              onDeleteSub={handleDeleteSubcategory}
              selectedTrackId={selectedTrackId}
              onTrackSelect={setSelectedTrackId}
              selectedSubcategoryId={selectedSubcategoryId}
              onSubcategorySelect={setSelectedSubcategoryId}
              isAdmin={canEdit}
              onLogout={handleLogout}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              onClose={() => setIsSidebarOpen(false)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <main 
              ref={mainContentRef} 
              onScroll={handleMainScroll}
              className={`flex-1 flex flex-col relative overflow-y-auto custom-scrollbar py-6 sm:py-12 scroll-smooth ${isSidebarOpen ? 'px-4 sm:px-6 lg:px-12' : 'px-4 sm:px-12 lg:px-20'}`}
            >
              {/* Back to Top Arrow */}
              {showScrollTop && (
                <button 
                  onClick={scrollToTop}
                  className={`fixed bottom-10 right-6 sm:right-10 z-[100] w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-2 transition-all scale-100 hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-5 duration-300 group ${
                    isDarkMode 
                      ? 'bg-slate-800/80 backdrop-blur-md text-purple-400 border-slate-700 hover:bg-purple-700 hover:text-white shadow-black/40' 
                      : 'bg-white/80 backdrop-blur-md text-purple-700 border-slate-100 hover:bg-purple-700 hover:text-white'
                  }`}
                  aria-label="Back to Top"
                >
                  <div className="group-hover:-translate-y-1 transition-transform">
                    {ICONS.Up}
                  </div>
                </button>
              )}
              {/* Mobile Header */}
              <div className={`md:hidden flex items-center justify-between mb-8 p-4 rounded-2xl border-2 shadow-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center text-white">
                    <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>CFF HUB</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-900'}`}
                >
                  {ICONS.Menu}
                </button>
              </div>

              <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12 sm:mb-16">
                <div className="group flex items-center gap-4">
                  <div>
                    <h1 className={`text-[18px] sm:text-[28px] font-black leading-tight uppercase tracking-tight flex items-center flex-wrap gap-y-1 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                      {getBreadcrumbs()}
                    </h1>
                    <p className={`text-[11px] sm:text-[14px] font-black uppercase tracking-[0.3em] mt-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                      {role === 'admin' ? 'ADMIN CONSOLE' : role === 'trainer' ? 'TRAINER HUB' : 'STUDENT PORTAL'}
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
                        className="text-[9px] sm:text-[11px] font-black text-slate-500 hover:text-purple-700 uppercase tracking-widest flex items-center gap-2 transition-colors group"
                      >
                        <span className="group-hover:-translate-x-1 transition-transform">{ICONS.Back}</span> BACK
                      </button>
                    )}
                  </div>
                  {canEdit && (
                    <button 
                      onClick={() => handleCreateProject()}
                      className={`w-full md:w-auto flex items-center justify-center gap-3 bg-purple-700 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-[11px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-slate-950 shadow-2xl transition-all active:scale-95 ${isDarkMode ? 'shadow-black/50 hover:bg-purple-600' : ''}`}
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
                ) : (Array.isArray(visibleTracks) ? visibleTracks : []).map((track) => {
                  const trackProjects = filteredProjects.filter(p => p.trackId === track.id);
                  const subcategoriesToRender = selectedSubcategoryId ? track.subcategories?.filter(s => s.id === selectedSubcategoryId) : track.subcategories;
                  const hasSubcategories = subcategoriesToRender && subcategoriesToRender.length > 0;
                  return (
                    <section key={track.id} className="space-y-10 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      {!selectedTrackId && (
                        <div className={`flex items-center justify-between border-b-4 pb-6 sm:pb-8 cursor-pointer group ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`} onClick={() => setSelectedTrackId(track.id)}>
                          <div className="flex items-center gap-4 sm:gap-6">
                            <span className={`text-3xl sm:text-5xl p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border-2 group-hover:scale-105 transition-transform ${isDarkMode ? 'bg-[#15171e] border-slate-700 shadow-black/40' : 'bg-white border-slate-100'}`}>{track.icon}</span>
                            <div>
                              <h3 className={`text-xl sm:text-3xl font-black uppercase tracking-tight leading-none group-hover:text-purple-700 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{track.title}</h3>
                              <p className={`text-[10px] sm:text-[13px] font-black uppercase tracking-[0.2em] mt-2 sm:mt-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{track.subtitle}</p>
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
                                <div className={getGridClasses()}>
                                  {subProjects.map(project => renderProjectCard(project))}
                                  {canEdit && renderAddPlaceholder(track.id, sub.id)}
                                </div>
                              </div>
                            );
                          })}
                          {!selectedSubcategoryId && trackProjects.filter(p => !p.subcategoryId).length > 0 && (
                            <div className="space-y-6 sm:space-y-8 pl-3 sm:pl-4">
                              <h4 className="text-lg sm:text-xl font-black text-slate-400 uppercase tracking-widest">Other Tutorials</h4>
                              <div className={getGridClasses()}>
                                {trackProjects.filter(p => !p.subcategoryId).map(project => renderProjectCard(project))}
                                {canEdit && renderAddPlaceholder(track.id)}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        (!selectedSubcategoryId) && (
                          <div className={getGridClasses()}>
                            {trackProjects.map((project) => renderProjectCard(project))}
                            {canEdit && renderAddPlaceholder(track.id)}
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

  return (
    <Routes>
      <Route path="/" element={
        <LandingPage 
          onAdminLoginSuccess={() => { setIsAuthenticated(true); }} 
          onTrainerLoginSuccess={() => { setIsViewerAuthenticated(true); }} 
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      } />
      <Route path="/student" element={renderMainHub('student')} />
      <Route path="/trainer-dashboard" element={
        isViewerAuthenticated ? renderMainHub('trainer') : <Navigate to="/" />
      } />
      <Route path="/admin-dashboard" element={
        isAuthenticated ? renderMainHub('admin') : <Navigate to="/" />
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
