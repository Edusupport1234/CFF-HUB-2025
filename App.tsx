
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import ProjectEditor from './components/ProjectEditor';
import ProjectViewer from './components/ProjectViewer';
import LoadingScreen from './components/LoadingScreen';
import { ICONS, DEFAULT_TRACKS } from './constants';
import { ViewState, Project, LearningTrack, Subcategory, ProjectStatus } from './types';
import { db, auth } from './firebase';
import { AnimatePresence, motion } from 'motion/react';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [lastView, setLastView] = useState<ViewState>('home');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const [watchHistory, setWatchHistory] = useState<string[]>([]);
  const mainContentRef = React.useRef<HTMLElement>(null);
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

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

  // Undo State
  const [undoAction, setUndoAction] = useState<{
    type: 'PROJECT' | 'TRACK' | 'SUBCATEGORY';
    data: any;
    trackId?: string; // For subcategory
    message: string;
  } | null>(null);

  const triggerUndo = () => {
    if (!undoAction) return;

    if (undoAction.type === 'PROJECT') {
      const restoredProject = undoAction.data as Project;
      const newProjects = [restoredProject, ...projects];
      setProjects(newProjects);
      set(ref(db, 'projects'), JSON.parse(JSON.stringify(newProjects)));
    } 
    else if (undoAction.type === 'TRACK') {
      const restoredTrack = undoAction.data as LearningTrack;
      const newTracks = [...tracks, restoredTrack];
      handleTracksReorder(newTracks);
    }
    else if (undoAction.type === 'SUBCATEGORY') {
      const restoredSub = undoAction.data as Subcategory;
      const targetTrackId = undoAction.trackId;
      const newTracks = tracks.map(t => {
        if (t.id === targetTrackId) {
          return {
            ...t,
            subcategories: [...(t.subcategories || []), restoredSub]
          };
        }
        return t;
      });
      handleTracksReorder(newTracks);
    }

    setUndoAction(null);
  };

  useEffect(() => {
    if ((currentView === 'home' || currentView === 'history') && savedScrollPosition > 0) {
      let attempts = 0;
      const restoreScroll = () => {
        if (mainContentRef.current) {
          mainContentRef.current.scrollTo({
            top: savedScrollPosition,
            behavior: 'auto'
          });
          
          // Verify if it stuck. If not, content might still be loading or rendering
          const currentPos = mainContentRef.current.scrollTop;
          if (Math.abs(currentPos - savedScrollPosition) < 2 || attempts > 15) {
            setSavedScrollPosition(0);
          } else {
            attempts++;
            setTimeout(restoreScroll, 50);
          }
        } else if (attempts < 20) {
          attempts++;
          setTimeout(restoreScroll, 50);
        }
      };

      // Wait for the exit animation of ProjectViewer or Editor (approx 500ms)
      const timeoutId = setTimeout(restoreScroll, 550);
      return () => clearTimeout(timeoutId);
    }
  }, [currentView, savedScrollPosition]);

  useEffect(() => {
    if (undoAction) {
      const timer = setTimeout(() => {
        setUndoAction(null);
      }, 10000); // 10 seconds to undo
      return () => clearTimeout(timer);
    }
  }, [undoAction]);

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

  const [activeTip, setActiveTip] = useState<string | null>(null);
  const [suggestedProject, setSuggestedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Determine role for tips
    const path = window.location.pathname;
    const role: 'admin' | 'trainer' | 'student' = path.includes('admin') ? 'admin' : path.includes('trainer') ? 'trainer' : 'student';
    
    const learningTips = {
      admin: [
        "Keep the Registry Trash tidy - items are permanently purged after 30 days.",
        "Use descriptive subcategories to group similar tutorial videos together.",
        "Check the 'Student Portal' view occasionally to see exactly what students see.",
        "The 'All Audiences' tag is great for general platform guides.",
        "Batch upload tutorials to maintain a consistent learning schedule.",
        "Track titles work best when kept under 15 characters for mobile display."
      ],
      trainer: [
        "Direct students to specific subcategories for focused objective-based learning.",
        "Watch history helps you see which modules students are engaging with most.",
        "Add 'Key Takeaways' in the tutorial sections to highlight critical concepts.",
        "Group complex tasks into multiple short videos rather than one long tutorial.",
        "Encourage students to use the 'Watch Again' feature for technical mastery.",
        "Use the search bar during sessions to quickly pull up reference material."
      ],
      student: [
        "Watching tutorials at 1.5x speed is great for review, but use 1x for new skills.",
        "The 'History' tab keeps track of everything you've started - never lose your spot.",
        "Try the 'Search' feature if you're looking for a specific software tool or tip.",
        "Take short breaks between modules to improve your technical retention.",
        "Practice alongside the video - pause frequently to replicate the steps.",
        "Master one track before jumping into another to build a solid foundation.",
        "Stuck on a problem? Look for a 'Troubleshooting' subcategory in the module.",
        "Use 'Fullscreen' mode on mobile to see smaller interface details in videos."
      ]
    };

    const roleKey = role === 'admin' ? 'admin' : role === 'trainer' ? 'trainer' : 'student';
    const tips = learningTips[roleKey];
    setActiveTip(tips[Math.floor(Math.random() * tips.length)]);
    
    // Pick a suggested project
    if (projects.length > 0) {
      const validProjects = projects.filter(p => !p.isDeleted);
      if (validProjects.length > 0) {
        setSuggestedProject(validProjects[Math.floor(Math.random() * validProjects.length)]);
      }
    }
  }, [isLoading, projects.length]);

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

  // Sync Watch History
  useEffect(() => {
    const saved = localStorage.getItem('watch_history');
    if (saved) {
      try {
        setWatchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('watch_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  const addToHistory = (projectId: string) => {
    setWatchHistory(prev => {
      // Remove if already exists and prepend to make it most recent
      const filtered = prev.filter(id => id !== projectId);
      return [projectId, ...filtered].slice(0, 50); // Keep last 50
    });
  };

  const removeFromHistory = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setWatchHistory(prev => prev.filter(id => id !== projectId));
  };

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
    if (mainContentRef.current) {
      setSavedScrollPosition(mainContentRef.current.scrollTop);
    }
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

  const handleSaveProject = (updated: Project, newTrack?: LearningTrack, newSubcategory?: { trackId: string, sub: Subcategory }) => {
    // 1. Handle New Track if created
    if (newTrack) {
      const updatedTracks = [...tracks, newTrack];
      setTracks(updatedTracks);
      set(ref(db, 'tracks'), JSON.parse(JSON.stringify(updatedTracks)));
    } 
    // 2. Handle New Subcategory if created for an existing track
    else if (newSubcategory) {
      const updatedTracks = tracks.map(t => {
        if (t.id === newSubcategory.trackId) {
          return {
            ...t,
            subcategories: [...(t.subcategories || []), newSubcategory.sub]
          };
        }
        return t;
      });
      setTracks(updatedTracks);
      set(ref(db, 'tracks'), JSON.parse(JSON.stringify(updatedTracks)));
    }

    // 3. Handle Project Saving
    const projectWithTime = { ...updated, lastEdited: Date.now() };
    const newProjects = projects.find(p => p.id === projectWithTime.id)
      ? projects.map(p => (p.id === projectWithTime.id ? projectWithTime : p))
      : [projectWithTime, ...projects];
    
    setProjects(newProjects);
    setIsLoading(true);
    // Remove undefined values before saving to Firebase
    const cleanedProjects = JSON.parse(JSON.stringify(newProjects));
    set(ref(db, 'projects'), cleanedProjects);
    
    setCurrentView('home');
    setSelectedProject(null);
  };

  const handleProjectClick = (p: Project) => {
    if (mainContentRef.current) {
      setSavedScrollPosition(mainContentRef.current.scrollTop);
    }
    setLastView(currentView);
    addToHistory(p.id);
    setSelectedProject(p);
    setCurrentView('viewer');
  };
  
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Move to Trash',
      message: 'Are you sure you want to move this tutorial to the recent deletions? It can be recovered for up to 30 days or permanently deleted by an administrator.',
      confirmText: 'Move to Trash',
      isDestructive: true,
      onConfirm: () => {
        setIsLoading(true);
        const newProjects = projects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              isDeleted: true,
              deletedAt: Date.now()
            };
          }
          return p;
        });
        
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

  const handleRecoverProject = (projectId: string) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    
    const newProjects = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          isDeleted: false,
          deletedAt: undefined
        };
      }
      return p;
    });
    
    setProjects(newProjects);
    const cleanedProjects = JSON.parse(JSON.stringify(newProjects));
    set(ref(db, 'projects'), cleanedProjects);
  };

  const handlePermanentDelete = (projectId: string) => {
    if (!isAuthenticated) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete',
      message: 'This will permanently remove the video and all its data. This action cannot be undone.',
      confirmText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: () => {
        setIsLoading(true);
        const newProjects = projects.filter(p => p.id !== projectId);
        setProjects(newProjects);
        const cleanedProjects = JSON.parse(JSON.stringify(newProjects));
        set(ref(db, 'projects'), cleanedProjects);
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
        setIsLoading(true);
        const trackToDelete = tracks.find(t => t.id === trackId);
        const newTracks = tracks.filter(t => t.id !== trackId);
        handleTracksReorder(newTracks);
        
        if (trackToDelete) {
          setUndoAction({
            type: 'TRACK',
            data: trackToDelete,
            message: `Deleted track "${trackToDelete.title}"`
          });
        }

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
        const track = tracks.find(t => t.id === trackId);
        const subToDelete = track?.subcategories?.find(s => s.id === subId);
        
        const newTracks = tracks.map(t => {
          if (t.id === trackId) {
            return { ...t, subcategories: t.subcategories?.filter(s => s.id !== subId) };
          }
          return t;
        });
        handleTracksReorder(newTracks);

        if (subToDelete) {
          setUndoAction({
            type: 'SUBCATEGORY',
            trackId,
            data: subToDelete,
            message: `Deleted subcategory "${subToDelete.title}"`
          });
        }

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

  const renderMobileHeader = () => (
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
  );

  const renderHistoryView = () => {
    const historyProjects = watchHistory
      .map(id => projects.find(p => p.id === id))
      .filter((p): p is Project => !!p && !p.isDeleted);

    return (
      <main ref={mainContentRef} onScroll={handleMainScroll} className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 custom-scrollbar relative h-screen">
        {renderMobileHeader()}
        <header className="mb-16">
          <h1 className={`text-4xl font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Watch History
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Tutorials you've recently viewed
          </p>
        </header>

        <AnimatePresence mode="wait">
          {historyProjects.length === 0 ? (
            <motion.div 
              key="empty-history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Your history is empty</p>
            </motion.div>
          ) : (
            <motion.div 
              key="history-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {historyProjects.map((p) => {
                  const track = tracks.find(t => t.id === p.trackId);
                  return (
                    <motion.div 
                      layout
                      key={p.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ 
                        scale: [1, 1.1, 0],
                        opacity: [1, 1, 0],
                        transition: { 
                          duration: 0.25, 
                          ease: [0.175, 0.885, 0.32, 1.275],
                          opacity: { duration: 0.1, delay: 0.1 }
                        } 
                      }}
                      onClick={() => handleProjectClick(p)}
                      className={`group relative rounded-[2rem] p-6 border-2 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98] ${
                        isDarkMode 
                          ? 'bg-[#1a1c26] border-slate-800 hover:border-purple-500/50' 
                          : 'bg-white border-slate-100 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-500 flex items-center justify-center text-xl">
                          {track?.icon || '📦'}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-1">
                            {track?.title || 'Unknown Track'}
                          </span>
                          <h3 className={`text-[13px] font-black uppercase tracking-tight leading-tight group-hover:text-purple-600 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{p.title}</h3>
                        </div>
                        <button
                          onClick={(e) => removeFromHistory(e, p.id)}
                          className={`p-2 rounded-xl transition-all ${
                            isDarkMode ? 'hover:bg-red-900/20 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                          }`}
                          title="Remove from history"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </div>
                      <div className={`p-4 rounded-2xl mb-6 text-[11px] font-bold leading-relaxed line-clamp-2 ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                        {p.subtitle}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                           }`}>
                             Tutorial
                           </span>
                        </div>
                        <div className="text-purple-600 flex items-center gap-2 group-hover:gap-3 transition-all">
                          <span className="text-[10px] font-black uppercase tracking-widest">Re-watch</span>
                          {ICONS.ChevronRight}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-16 pt-10 border-t border-slate-800/10">
          <button 
            onClick={() => setWatchHistory([])}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
              isDarkMode 
                ? 'bg-red-900/10 border-red-900/30 text-red-400 hover:bg-red-900/20' 
                : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
            }`}
          >
            Clear History
          </button>
        </div>
      </main>
    );
  };

  const renderTrashView = () => {
    const trashProjects = projects
      .filter(p => p.isDeleted)
      .sort((a, b) => {
        const timeA = typeof a.deletedAt === 'number' ? a.deletedAt : 0;
        const timeB = typeof b.deletedAt === 'number' ? b.deletedAt : 0;
        return timeB - timeA;
      });

    return (
      <main 
        ref={mainContentRef} 
        onScroll={handleMainScroll}
        className={`flex-1 flex flex-col relative overflow-y-auto custom-scrollbar py-6 sm:py-12 ${isSidebarOpen ? 'px-4 sm:px-6 lg:px-12' : 'px-4 sm:px-12 lg:px-20'}`}
      >
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-red-600/20 text-red-400' : 'bg-red-600/10 text-red-600'}`}>
              {ICONS.Delete}
            </div>
            <div>
              <h1 className={`text-4xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Recently Deleted
              </h1>
              <p className="text-slate-500 font-bold tracking-tight">Videos can be recovered or permanently removed.</p>
            </div>
          </div>
        </header>

        {trashProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-20">
            <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mb-6 ${isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
              <div className="scale-150">{ICONS.Delete}</div>
            </div>
            <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Trash is Empty</h3>
            <p className="text-slate-500 font-bold max-w-xs">Items you delete will appear here for management.</p>
            <button 
              onClick={() => setCurrentView('home')}
              className="mt-8 px-8 py-3 rounded-2xl bg-purple-600 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all active:scale-95"
            >
              Back to Hub
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
            <AnimatePresence mode="popLayout">
              {trashProjects.map((p) => {
                const track = tracks.find(t => t.id === p.trackId);
                const deletedDate = p.deletedAt ? new Date(p.deletedAt).toLocaleTimeString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
                
                return (
                  <motion.div 
                    layout
                    key={p.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`group relative rounded-[2.5rem] p-8 border-2 transition-all flex flex-col ${
                      isDarkMode 
                        ? 'bg-[#1a1c26] border-slate-800' 
                        : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center text-2xl">
                        {track?.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                         <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-1">
                          {track?.title || 'System'}
                        </span>
                        <h3 className={`text-lg font-black uppercase tracking-tight leading-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{p.title}</h3>
                      </div>
                    </div>
                    
                    <div className={`mb-8 p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 text-center">Moved to Trash</p>
                      <p className={`font-black text-xs text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{deletedDate}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRecoverProject(p.id)}
                        className="flex-1 px-4 py-4 rounded-2xl bg-purple-600/10 text-purple-600 text-[9px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        Recover
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(p.id)}
                        className="flex-1 px-4 py-4 rounded-2xl bg-red-600/10 text-red-600 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {ICONS.Delete}
                        Purge
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    );
  };

  const renderMainHub = (role: 'student' | 'trainer' | 'admin') => {
    // Only admins have edit/delete permissions
    const canEdit = role === 'admin';

    const displayTracks = role === 'student' 
      ? tracks.filter(t => {
          const isTrainerTrack = t.audience === 'trainer' || t.id.startsWith('trainer-') || t.title.toUpperCase().startsWith('TRAINER:');
          return !isTrainerTrack;
        })
      : tracks;

    const displayProjects = projects.filter(p => {
      if (p.isDeleted) return false;
      const audienceAllowed = !p.audience || p.audience === 'all' || p.audience === role || role === 'admin' || role === 'trainer';
      
      if (role === 'student') {
        const track = tracks.find(t => t.id === p.trackId);
        const isTrainerTrack = track && (track.audience === 'trainer' || track.id.startsWith('trainer-') || track.title.toUpperCase().startsWith('TRAINER:'));
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
        <button key="all" onClick={() => { setSelectedTrackId(null); setSelectedSubcategoryId(null); }} className={`hover:text-purple-700 transition-colors whitespace-nowrap ${!selectedTrackId ? 'text-2xl sm:text-5xl font-black mb-2' : 'text-lg sm:text-2xl font-black'}`}>
          CFF VIDEO HUB
        </button>
      );
      if (selectedTrackId) {
        const track = tracks.find(t => t.id === selectedTrackId);
        crumbs.push(<span key="s1" className="text-slate-300 mx-1 sm:mx-2 shrink-0 text-xl">/</span>);
        crumbs.push(
          <button key="track" onClick={() => setSelectedSubcategoryId(null)} className={`hover:text-purple-700 transition-colors text-left font-black ${!selectedSubcategoryId ? 'text-purple-700 text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
            {track?.title}
          </button>
        );
      }
      if (selectedSubcategoryId && selectedTrackId) {
        const track = tracks.find(t => t.id === selectedTrackId);
        const sub = track?.subcategories?.find(s => s.id === selectedSubcategoryId);
        crumbs.push(<span key="s2" className="text-slate-300 mx-1 sm:mx-2 shrink-0 text-xl">/</span>);
        crumbs.push(<span key="sub" className="text-purple-700 text-left font-black text-xl sm:text-2xl">{sub?.title}</span>);
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`flex h-screen overflow-hidden relative flex-col md:flex-row transition-colors duration-500 ${isDarkMode ? 'dark bg-[#0a0b0d]' : 'bg-slate-50'}`}
      >
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

        <AnimatePresence mode="wait">
          {currentView === 'editor' && selectedProject ? (
            <motion.div 
              key="editor"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="flex-1 h-full overflow-hidden z-[100]"
            >
              <ProjectEditor 
                project={selectedProject} 
                tracks={tracks} 
                onSave={handleSaveProject} 
                onBack={() => { setCurrentView(lastView); setSelectedProject(null); }} 
                isDarkMode={isDarkMode}
              />
            </motion.div>
          ) : currentView === 'viewer' && selectedProject ? (
            <motion.div 
              key="viewer"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 h-full overflow-hidden"
            >
              <ProjectViewer 
                project={selectedProject}
                track={tracks.find(t => t.id === selectedProject.trackId)}
                onBack={() => { setCurrentView(lastView); setSelectedProject(null); }}
                onEdit={() => setCurrentView('editor')}
                onDelete={(e) => handleDeleteProject(e, selectedProject.id)}
                isAdmin={canEdit}
                isSidebarOpen={isSidebarOpen}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          ) : (currentView === 'home' || currentView === 'history' || currentView === 'trash') ? (
            <motion.div 
              key="main-hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex overflow-hidden relative"
            >
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
              {currentView === 'trash' ? renderTrashView() : currentView === 'history' ? renderHistoryView() : (
                <main 
                  ref={mainContentRef} 
                  onScroll={handleMainScroll}
                  className={`flex-1 flex flex-col relative overflow-y-auto custom-scrollbar py-6 sm:py-12 ${isSidebarOpen ? 'px-4 sm:px-6 lg:px-12' : 'px-4 sm:px-12 lg:px-20'}`}
                >
                  {/* Undo Toast */}
                  <AnimatePresence>
                    {undoAction && (
                      <motion.div 
                        key="undo-toast"
                        initial={{ y: 50, opacity: 0, x: '-50%', scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, x: '-50%', scale: 1 }}
                        exit={{ y: 50, opacity: 0, x: '-50%', scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 z-[100]"
                      >
                        <div className={`flex items-center gap-6 px-6 py-4 rounded-[2rem] shadow-2xl border-2 transition-all ${
                          isDarkMode 
                            ? 'bg-[#15171e] text-white border-slate-800 shadow-black/60' 
                            : 'bg-white text-slate-950 border-slate-100 shadow-slate-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                              {ICONS.Delete}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                              {undoAction.message}
                            </span>
                          </div>
                          <div className={`w-[2px] h-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                          <button 
                            onClick={triggerUndo}
                            className="text-[11px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-2"
                          >
                            <span>UNDO</span>
                            <span className="scale-75">{ICONS.Back}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Back to Top Arrow */}
                  <AnimatePresence>
                    {showScrollTop && (
                      <motion.button 
                        key="scroll-top"
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        onClick={scrollToTop}
                        className={`fixed bottom-10 right-6 sm:right-10 z-[100] w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-2 transition-all hover:scale-110 active:scale-95 group ${
                          isDarkMode 
                            ? 'bg-slate-800/80 backdrop-blur-md text-purple-400 border-slate-700 hover:bg-purple-700 hover:text-white shadow-black/40' 
                            : 'bg-white/80 backdrop-blur-md text-purple-700 border-slate-100 hover:bg-purple-700 hover:text-white'
                        }`}
                        aria-label="Back to Top"
                      >
                        <div className="group-hover:-translate-y-1 transition-transform">
                          {ICONS.Up}
                        </div>
                      </motion.button>
                    )}
                  </AnimatePresence>
                  
                  {renderMobileHeader()}
                  
                  <header className="flex flex-col gap-10 mb-12 sm:mb-20">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                      <div className="group flex items-center gap-4">
                        <div>
                          <h1 className={`font-black leading-tight uppercase tracking-tight flex items-center flex-wrap gap-y-1 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                            {getBreadcrumbs()}
                          </h1>
                          <p className={`text-[12px] sm:text-[16px] font-black uppercase tracking-[0.4em] mt-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                            {role === 'admin' ? 'ADMIN CONSOLE' : role === 'trainer' ? 'TRAINER HUB' : 'STUDENT PORTAL'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 w-full xl:w-auto">
                        <div className="relative w-full md:w-80 group">
                          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                            {ICONS.Search}
                          </div>
                          <input 
                            type="text"
                            placeholder="SEARCH VIDEOS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full h-14 pl-14 pr-6 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border-2 outline-none transition-all ${
                              isDarkMode 
                                ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500 shadow-2xl shadow-black/40' 
                                : 'bg-white border-slate-100 text-slate-950 focus:border-purple-400 shadow-md focus:shadow-xl focus:shadow-purple-700/10'
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                          {(selectedTrackId || selectedSubcategoryId) && (
                            <button 
                              onClick={() => { 
                                if (selectedSubcategoryId) setSelectedSubcategoryId(null);
                                else setSelectedTrackId(null);
                              }}
                              className="text-[11px] font-black text-slate-500 hover:text-purple-700 uppercase tracking-widest flex items-center gap-2 transition-colors group"
                            >
                              <span className="group-hover:-translate-x-1 transition-transform">{ICONS.Back}</span> BACK
                            </button>
                          )}
                          {canEdit && (
                            <button 
                              onClick={() => handleCreateProject()}
                              className={`flex-1 md:flex-none flex items-center justify-center gap-3 bg-purple-700 text-white px-8 sm:px-10 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-950 shadow-xl transition-all active:scale-95 ${isDarkMode ? 'shadow-black/50 hover:bg-purple-600' : ''}`}
                            >
                              {ICONS.Plus} ADD VIDEO
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </header>

                  {!selectedTrackId && !searchQuery && null}
                  <div className="space-y-24 sm:space-y-32 pb-20">
                    {(Array.isArray(visibleTracks) ? visibleTracks : []).map((track) => {
                      const trackProjects = filteredProjects.filter(p => p.trackId === track.id);
                      const subcategoriesToRender = selectedSubcategoryId ? track.subcategories?.filter(s => s.id === selectedSubcategoryId) : track.subcategories;
                      const hasSubcategories = subcategoriesToRender && subcategoriesToRender.length > 0;
                      return (
                        <section key={track.id} className="space-y-10 sm:space-y-12">
                          {!selectedTrackId && (
                            <div className="flex items-center justify-between pb-8 cursor-pointer group" onClick={() => setSelectedTrackId(track.id)}>
                              <div className="flex items-center gap-4 sm:gap-6">
                                <span className="text-4xl sm:text-7xl group-hover:scale-110 transition-transform">{track.icon}</span>
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
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  };

  const location = useLocation();

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-[#0a0b0d]' : 'bg-slate-50'}`}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen 
            isDarkMode={isDarkMode} 
            key="loading" 
            tip={activeTip}
            suggestedProject={suggestedProject}
            tracks={tracks}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
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
      </AnimatePresence>
    </div>
  );
};

export default App;
