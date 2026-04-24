
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { LearningTrack } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  tracks: LearningTrack[];
  onTracksReorder: (tracks: LearningTrack[]) => void;
  onDeleteTrack: (id: string) => void;
  onDeleteSub: (trackId: string, subId: string) => void;
  selectedTrackId: string | null;
  onTrackSelect: (id: string | null) => void;
  selectedSubcategoryId: string | null;
  onSubcategorySelect: (id: string | null) => void;
  isAdmin: boolean;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  tracks, 
  onTracksReorder, 
  onDeleteTrack,
  onDeleteSub,
  selectedTrackId, 
  onTrackSelect,
  selectedSubcategoryId,
  onSubcategorySelect,
  isAdmin,
  onLogout,
  isOpen,
  onToggle,
  onClose,
  searchQuery,
  onSearchChange,
  isDarkMode,
  toggleDarkMode
}) => {
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null);
  const [draggedSubIndex, setDraggedSubIndex] = useState<{ trackIdx: number, subIdx: number } | null>(null);
  const [expandedTrackIds, setExpandedTrackIds] = useState<Set<string>>(new Set());
  
  // Inline adding state
  const [addingTrack, setAddingTrack] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [addingSubToTrackId, setAddingSubToTrackId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTracks = (Array.isArray(tracks) ? tracks : []).filter(track => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const trackMatch = track.title.toLowerCase().includes(searchLower);
    const subMatch = track.subcategories?.some(sub => sub.title.toLowerCase().includes(searchLower));
    return trackMatch || subMatch;
  });

  useEffect(() => {
    if ((addingTrack || addingSubToTrackId) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingTrack, addingSubToTrackId]);

  const toggleTrackExpansion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedTrackIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedTrackIds(newExpanded);
  };

  const handleTrackClick = (id: string) => {
    onTrackSelect(id);
    onSubcategorySelect(null);
    onViewChange('home');
    if (!expandedTrackIds.has(id)) {
      setExpandedTrackIds(prev => new Set(prev).add(id));
    }
  };

  const handleSubcategoryClick = (e: React.MouseEvent, trackId: string, subId: string) => {
    e.stopPropagation();
    onTrackSelect(trackId);
    onSubcategorySelect(subId);
    onViewChange('home');
  };

  const submitNewTrack = () => {
    if (!newTrackName.trim()) {
      setAddingTrack(false);
      return;
    }
    
    const newTrack: LearningTrack = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTrackName.toUpperCase(),
      subtitle: `VIDEO TUTORIALS FOR ${newTrackName.toUpperCase()}`,
      icon: '📚',
      subcategories: []
    };
    
    onTracksReorder([...tracks, newTrack]);
    setExpandedTrackIds(prev => new Set(prev).add(newTrack.id));
    setNewTrackName('');
    setAddingTrack(false);
  };

  const submitNewSubcategory = (trackId: string) => {
    if (!newSubName.trim()) {
      setAddingSubToTrackId(null);
      return;
    }

    const newTracks = tracks.map(track => {
      if (track.id === trackId) {
        const subs = track.subcategories || [];
        return {
          ...track,
          subcategories: [...subs, { id: Math.random().toString(36).substr(2, 9), title: newSubName }]
        };
      }
      return track;
    });
    
    onTracksReorder(newTracks);
    setNewSubName('');
    setAddingSubToTrackId(null);
  };

  const handleDeleteTrack = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    onDeleteTrack(id);
  };

  const handleDeleteSub = (e: React.MouseEvent, trackId: string, subId: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    onDeleteSub(trackId, subId);
  };

  // Drag & Drop logic
  const onTrackDragStart = (_e: React.DragEvent, index: number) => {
    if (!isAdmin) return;
    setDraggedTrackIndex(index);
    setDraggedSubIndex(null);
  };

  const onTrackDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isAdmin || draggedTrackIndex === null || draggedTrackIndex === index) return;
    const newTracks = [...tracks];
    const [item] = newTracks.splice(draggedTrackIndex, 1);
    newTracks.splice(index, 0, item);
    setDraggedTrackIndex(index);
    onTracksReorder(newTracks);
  };

  const onSubDragStart = (e: React.DragEvent, trackIdx: number, subIdx: number) => {
    if (!isAdmin) return;
    e.stopPropagation();
    setDraggedSubIndex({ trackIdx, subIdx });
    setDraggedTrackIndex(null);
  };

  const onSubDragOver = (e: React.DragEvent, trackIdx: number, subIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin || !draggedSubIndex || draggedSubIndex.trackIdx !== trackIdx || draggedSubIndex.subIdx === subIdx) return;

    const newTracks = JSON.parse(JSON.stringify(tracks)) as LearningTrack[];
    const track = newTracks[trackIdx];
    if (!track.subcategories) return;

    const [item] = track.subcategories.splice(draggedSubIndex.subIdx, 1);
    track.subcategories.splice(subIdx, 0, item);

    setDraggedSubIndex({ trackIdx, subIdx });
    onTracksReorder(newTracks);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`fixed md:relative z-[70] h-screen border-r transition-all duration-500 ease-in-out flex flex-col py-8 shadow-sm shrink-0 ${
        isDarkMode 
          ? 'bg-[#15171e] border-slate-800' 
          : 'bg-white border-slate-200'
      } ${isOpen ? 'translate-x-0 w-80 px-4' : '-translate-x-full md:translate-x-0 md:w-20 px-2'}`}>
        {/* Desktop Toggle Button */}
        <button 
          onClick={onToggle}
          className={`hidden md:flex absolute -right-4 top-10 w-8 h-8 border-2 rounded-full items-center justify-center transition-all shadow-sm z-[80] ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-purple-400' 
              : 'bg-white border-slate-200 text-slate-400 hover:text-purple-700'
          }`}
        >
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            {ICONS.ChevronRight}
          </div>
        </button>

        <div className={`flex items-center mb-4 overflow-hidden whitespace-nowrap ${isOpen ? 'justify-between px-2' : 'justify-center'}`}>
          <button
            onClick={() => {
              onViewChange('home');
              onTrackSelect(null);
              onSubcategorySelect(null);
              if (window.innerWidth < 768) onClose();
            }}
            className={`group relative flex items-center rounded-xl transition-all overflow-hidden whitespace-nowrap ${
              isOpen ? 'w-full gap-4 px-2 py-3' : 'w-12 h-12 justify-center'
            } ${
              currentView === 'home' && selectedTrackId === null
              ? (isDarkMode ? 'text-purple-400 bg-purple-500/10' : 'text-purple-700 bg-purple-50/50')
              : (isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-50')
            }`}
          >
            <span className={`shrink-0 transition-colors ${currentView === 'home' && selectedTrackId === null ? (isDarkMode ? 'text-purple-400' : 'text-purple-700') : (isDarkMode ? 'text-slate-400' : 'text-slate-700')}`}>{ICONS.Home}</span>
            <span className={`text-[15px] font-black uppercase tracking-tight ${!isOpen ? 'md:hidden' : ''}`}>HOME PAGE</span>

            {/* Custom Tooltip for collapsed state */}
            {!isOpen && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                Home
                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            )}
          </button>
          <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-950 ml-auto">
            {ICONS.Back}
          </button>
        </div>

        {/* Quick Search */}
        {isOpen && (
          <div className="px-3 mb-6">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 scale-75">
                {ICONS.Search}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold focus:outline-none transition-all placeholder:text-slate-400 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-2 border-slate-700 text-white focus:border-purple-500' 
                    : 'bg-slate-50 border-2 border-slate-100 text-slate-950 focus:border-purple-600'
                }`}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {isAdmin && isOpen && (
            <div className="px-3 mb-6 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigation</span>
              <button 
                onClick={() => setAddingTrack(true)}
                className={`p-1 px-2 flex items-center gap-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                  isDarkMode 
                    ? 'bg-purple-900/30 text-purple-400 border-purple-800 hover:bg-purple-900/50' 
                    : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
                }`}
              >
                {ICONS.Plus} Track
              </button>
            </div>
          )}
          
          {isAdmin && isOpen && addingTrack && (
            <div className="px-2 mb-4">
              <input
                ref={inputRef}
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitNewTrack()}
                onBlur={submitNewTrack}
                placeholder="New Track..."
                className={`w-full px-3 py-2 text-[11px] font-black uppercase tracking-widest border-2 rounded-lg focus:outline-none transition-all shadow-sm ${
                  isDarkMode 
                    ? 'bg-slate-800 border-purple-900 text-white focus:border-purple-500' 
                    : 'bg-white border-purple-300 text-slate-950 focus:border-purple-600'
                }`}
              />
            </div>
          )}
          
          <div className={`space-y-4 ${!isOpen ? 'flex flex-col items-center' : ''}`}>
            {filteredTracks.map((track, tIdx) => (
              <div key={track.id} className="w-full space-y-1">
                <div
                  draggable={isAdmin}
                  onDragStart={(e) => onTrackDragStart(e, tIdx)}
                  onDragOver={(e) => onTrackDragOver(e, tIdx)}
                  onDragEnd={() => setDraggedTrackIndex(null)}
                  onClick={() => handleTrackClick(track.id)}
                  className={`group flex items-center transition-all border ${
                    isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${
                    isOpen ? 'gap-4 px-3 py-4 rounded-[1.2rem]' : 'w-12 h-12 justify-center rounded-xl mx-auto'
                  } ${
                    selectedTrackId === track.id && selectedSubcategoryId === null
                      ? (isDarkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-none' : 'bg-[#F3E8FF] text-[#6B21A8] border-transparent shadow-sm') 
                      : isDarkMode ? 'hover:bg-slate-800 text-slate-200 border-transparent' : 'hover:bg-slate-50 text-slate-900 border-transparent'
                  } ${draggedTrackIndex === tIdx ? 'opacity-40 bg-purple-50 scale-95' : 'opacity-100'}`}
                >
                  <span className="text-2xl shrink-0 grayscale-[0.2] group-hover:grayscale-0 transition-all">{track.icon}</span>
                  <span className={`flex-1 text-[13px] font-black uppercase tracking-tight truncate ${!isOpen ? 'md:hidden' : ''}`}>
                    {track.title}
                  </span>
                  
                  {isAdmin && isOpen && (
                    <button 
                      onClick={(e) => handleDeleteTrack(e, track.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      {ICONS.Delete}
                    </button>
                  )}
                  
                  <div 
                    onClick={(e) => { e.stopPropagation(); toggleTrackExpansion(e, track.id); }}
                    className={`p-1 transition-all duration-300 ${expandedTrackIds.has(track.id) ? 'rotate-180 text-purple-600' : 'text-slate-400 group-hover:text-purple-400'} ${!isOpen ? 'md:hidden' : ''}`}
                  >
                    {ICONS.ChevronDown}
                  </div>

                  {/* Custom Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                      {track.title}
                      <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </div>

              {(expandedTrackIds.has(track.id) || (searchQuery && track.subcategories?.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())))) && isOpen && (
                <div className="ml-10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {track.subcategories?.filter(sub => searchQuery ? sub.title.toLowerCase().includes(searchQuery.toLowerCase()) : true).map((sub, sIdx) => (
                    <div
                      key={sub.id}
                      draggable={isAdmin}
                      onDragStart={(e) => onSubDragStart(e, tIdx, sIdx)}
                      onDragOver={(e) => onSubDragOver(e, tIdx, sIdx)}
                      onDragEnd={() => setDraggedSubIndex(null)}
                      onClick={(e) => handleSubcategoryClick(e, track.id, sub.id)}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all border border-transparent ${
                        isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      } ${
                        selectedSubcategoryId === sub.id 
                          ? (isDarkMode ? 'bg-purple-900/30 border-purple-800 text-purple-400' : 'bg-purple-50 border-purple-100 text-purple-700')
                          : (isDarkMode ? 'hover:bg-slate-800 hover:border-slate-700 text-slate-400' : 'hover:bg-slate-50 hover:border-slate-200 text-slate-600')
                      } ${draggedSubIndex?.trackIdx === tIdx && draggedSubIndex?.subIdx === sIdx ? 'opacity-40 bg-purple-50 scale-95' : 'opacity-100'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${selectedSubcategoryId === sub.id ? 'bg-purple-700' : 'bg-slate-300 group-hover:bg-purple-500'}`} />
                      <span className={`flex-1 text-[11px] font-bold tracking-wide uppercase truncate ${
                        selectedSubcategoryId === sub.id 
                          ? (isDarkMode ? 'text-purple-300' : 'text-purple-900') 
                          : (isDarkMode ? 'group-hover:text-white' : 'group-hover:text-slate-900')
                      }`}>
                        {sub.title}
                      </span>
                      {isAdmin && (
                        <button 
                          onClick={(e) => handleDeleteSub(e, track.id, sub.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all scale-75"
                        >
                          {ICONS.Delete}
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {isAdmin && (addingSubToTrackId === track.id ? (
                    <div className="px-4 py-2">
                      <input
                        ref={inputRef}
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitNewSubcategory(track.id)}
                        onBlur={() => submitNewSubcategory(track.id)}
                        placeholder="Subcategory..."
                        className={`w-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest border rounded focus:outline-none transition-all shadow-sm ${
                          isDarkMode 
                            ? 'bg-slate-800 border-purple-900 text-white focus:border-purple-500' 
                            : 'bg-white border-purple-300 text-slate-950 focus:border-purple-600'
                        }`}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddingSubToTrackId(track.id); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        isDarkMode 
                          ? 'text-purple-400/60 hover:text-purple-400 hover:bg-purple-900/20' 
                          : 'text-purple-600/60 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      <span className="scale-75">{ICONS.Plus}</span>
                      ADD SUBCATEGORY
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-auto pt-6 border-t px-3 pb-4 space-y-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        {/* Theme Toggle - Sidebar */}
        <button
          onClick={toggleDarkMode}
          className={`group/theme relative w-full flex items-center transition-all shadow-xl active:scale-95 ${
            isOpen ? 'gap-3 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest' : 'w-12 h-12 rounded-xl mx-auto justify-center'
          } ${
            isDarkMode 
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-black/40' 
              : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm'
          }`}
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="shrink-0 scale-110">{isDarkMode ? ICONS.Sun : ICONS.Moon}</span>
          {isOpen && <span className="font-black uppercase tracking-widest">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>}

          {/* Tooltip for closed sidebar */}
          {!isOpen && (
            <div className={`absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/theme:opacity-100 translate-x-2 group-hover/theme:translate-x-0 transition-all pointer-events-none shadow-xl border z-50 ${
              isDarkMode 
                ? 'bg-slate-800 text-white border-slate-700' 
                : 'bg-white text-slate-900 border-slate-100'
            }`}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-l border-b ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}></div>
            </div>
          )}
        </button>

        <button 
          onClick={onLogout}
          title="Logout"
          className={`group relative w-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
            isOpen ? 'gap-3 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-red-600' : 'w-12 h-12 mx-auto hover:bg-red-600'
          } ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-white rounded-2xl'}`}
          style={{ borderRadius: isOpen ? '1rem' : '0.75rem' }}
        >
          <span className="shrink-0 scale-110">{ICONS.Back}</span>
          {isOpen && <span className="font-black uppercase tracking-widest">LOG OUT</span>}
          
          {/* Custom Tooltip for collapsed state */}
          {!isOpen && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
              Logout
              <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          )}
        </button>
      </div>
    </div>
  </>
);
};

export default Sidebar;
