
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { LearningTrack } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  tracks: LearningTrack[];
  onTracksReorder: (tracks: LearningTrack[]) => void;
  selectedTrackId: string | null;
  onTrackSelect: (id: string | null) => void;
  selectedSubcategoryId: string | null;
  onSubcategorySelect: (id: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  tracks, 
  onTracksReorder, 
  selectedTrackId, 
  onTrackSelect,
  selectedSubcategoryId,
  onSubcategorySelect
}) => {
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null);
  const [draggedSubIndex, setDraggedSubIndex] = useState<{ trackIdx: number, subIdx: number } | null>(null);
  const [expandedTrackIds, setExpandedTrackIds] = useState<Set<string>>(new Set(tracks.map(t => t.id)));
  
  // Inline adding state
  const [addingTrack, setAddingTrack] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [addingSubToTrackId, setAddingSubToTrackId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

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
    if (confirm("Delete this track and all its contents?")) {
      onTracksReorder(tracks.filter(t => t.id !== id));
      if (selectedTrackId === id) {
        onTrackSelect(null);
        onSubcategorySelect(null);
      }
    }
  };

  const handleDeleteSub = (e: React.MouseEvent, trackId: string, subId: string) => {
    e.stopPropagation();
    const newTracks = tracks.map(t => {
      if (t.id === trackId) {
        return { ...t, subcategories: t.subcategories?.filter(s => s.id !== subId) };
      }
      return t;
    });
    onTracksReorder(newTracks);
    if (selectedSubcategoryId === subId) onSubcategorySelect(null);
  };

  // Drag & Drop logic
  const onTrackDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedTrackIndex(index);
    setDraggedSubIndex(null);
  };

  const onTrackDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTrackIndex === null || draggedTrackIndex === index) return;
    const newTracks = [...tracks];
    const [item] = newTracks.splice(draggedTrackIndex, 1);
    newTracks.splice(index, 0, item);
    setDraggedTrackIndex(index);
    onTracksReorder(newTracks);
  };

  const onSubDragStart = (e: React.DragEvent, trackIdx: number, subIdx: number) => {
    e.stopPropagation();
    setDraggedSubIndex({ trackIdx, subIdx });
    setDraggedTrackIndex(null);
  };

  const onSubDragOver = (e: React.DragEvent, trackIdx: number, subIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedSubIndex || draggedSubIndex.trackIdx !== trackIdx || draggedSubIndex.subIdx === subIdx) return;

    const newTracks = JSON.parse(JSON.stringify(tracks)) as LearningTrack[];
    const track = newTracks[trackIdx];
    if (!track.subcategories) return;

    const [item] = track.subcategories.splice(draggedSubIndex.subIdx, 1);
    track.subcategories.splice(subIdx, 0, item);

    setDraggedSubIndex({ trackIdx, subIdx });
    onTracksReorder(newTracks);
  };

  return (
    <div className="w-80 h-screen bg-white border-r border-slate-200 flex flex-col py-8 px-4 relative shadow-sm shrink-0">
      <div className="flex items-center gap-3 px-2 mb-10 overflow-hidden whitespace-nowrap">
        <div className="w-10 h-10 shrink-0 bg-purple-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <div className="w-5 h-5 border-2 border-white rounded-lg flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 leading-none tracking-tight">LEARNING</h2>
          <p className="text-[11px] font-bold text-purple-700 tracking-widest mt-0.5">GALLERY</p>
        </div>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => {
            onViewChange('home');
            onTrackSelect(null);
            onSubcategorySelect(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all overflow-hidden whitespace-nowrap ${
            currentView === 'home' && selectedTrackId === null
            ? 'bg-purple-700 text-white shadow-lg shadow-purple-200' 
            : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {ICONS.Home}
          <span>HOME PAGE</span>
        </button>
      </div>

      <div className="mt-10 flex-1 overflow-y-auto no-scrollbar">
        <div className="px-4 flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">LEARNING TRACKS</h3>
          <button 
            onClick={() => setAddingTrack(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-purple-700 transition-colors"
          >
            {ICONS.Plus}
          </button>
        </div>

        {addingTrack && (
          <div className="px-4 mb-4">
            <input
              ref={inputRef}
              value={newTrackName}
              onChange={(e) => setNewTrackName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNewTrack()}
              onBlur={submitNewTrack}
              placeholder="New Track Name..."
              className="w-full px-3 py-2 text-xs font-bold uppercase tracking-widest border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 bg-white text-slate-950 shadow-sm"
            />
          </div>
        )}
        
        <div className="space-y-2">
          {tracks.map((track, tIdx) => (
            <div key={track.id} className="space-y-1">
              <div
                draggable
                onDragStart={(e) => onTrackDragStart(e, tIdx)}
                onDragOver={(e) => onTrackDragOver(e, tIdx)}
                onDragEnd={() => setDraggedTrackIndex(null)}
                onClick={() => handleTrackClick(track.id)}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-grab active:cursor-grabbing transition-all border border-transparent ${
                  selectedTrackId === track.id && selectedSubcategoryId === null
                    ? 'bg-purple-100 border-purple-200 text-purple-900 shadow-sm' 
                    : 'hover:bg-slate-50 hover:border-slate-200 text-slate-900'
                } ${draggedTrackIndex === tIdx ? 'opacity-40 bg-purple-50 scale-95' : 'opacity-100'}`}
              >
                <span className="text-xl shrink-0">{track.icon}</span>
                <span className="flex-1 text-[12px] font-bold tracking-wide uppercase truncate">
                  {track.title}
                </span>
                <button 
                  onClick={(e) => handleDeleteTrack(e, track.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                >
                  {ICONS.Delete}
                </button>
                <div 
                  onClick={(e) => toggleTrackExpansion(e, track.id)}
                  className={`p-1 text-slate-400 hover:text-purple-600 transition-transform duration-300 ${expandedTrackIds.has(track.id) ? 'rotate-180' : ''}`}
                >
                  {ICONS.ChevronDown}
                </div>
              </div>

              {expandedTrackIds.has(track.id) && (
                <div className="ml-10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {track.subcategories?.map((sub, sIdx) => (
                    <div
                      key={sub.id}
                      draggable
                      onDragStart={(e) => onSubDragStart(e, tIdx, sIdx)}
                      onDragOver={(e) => onSubDragOver(e, tIdx, sIdx)}
                      onDragEnd={() => setDraggedSubIndex(null)}
                      onClick={(e) => handleSubcategoryClick(e, track.id, sub.id)}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all border border-transparent ${
                        selectedSubcategoryId === sub.id 
                          ? 'bg-purple-50 border-purple-100 text-purple-700' 
                          : 'hover:bg-slate-50 hover:border-slate-200 text-slate-600'
                      } ${draggedSubIndex?.trackIdx === tIdx && draggedSubIndex?.subIdx === sIdx ? 'opacity-40 bg-purple-50 scale-95' : 'opacity-100'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${selectedSubcategoryId === sub.id ? 'bg-purple-700' : 'bg-slate-300 group-hover:bg-purple-500'}`} />
                      <span className={`flex-1 text-[11px] font-bold tracking-wide uppercase truncate ${selectedSubcategoryId === sub.id ? 'text-purple-900' : 'group-hover:text-slate-900'}`}>
                        {sub.title}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteSub(e, track.id, sub.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all scale-75"
                      >
                        {ICONS.Delete}
                      </button>
                    </div>
                  ))}
                  
                  {addingSubToTrackId === track.id ? (
                    <div className="px-4 py-2">
                      <input
                        ref={inputRef}
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitNewSubcategory(track.id)}
                        onBlur={() => submitNewSubcategory(track.id)}
                        placeholder="Subcategory..."
                        className="w-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-purple-300 rounded focus:outline-none bg-white text-slate-950 shadow-sm"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddingSubToTrackId(track.id); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black text-purple-600/60 uppercase tracking-widest hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                    >
                      <span className="scale-75">{ICONS.Plus}</span>
                      ADD SUBCATEGORY
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="mt-auto mx-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-purple-800 transition-all shadow-md">
        {ICONS.Admin}
        ADMIN LOGIN
      </button>
    </div>
  );
};

export default Sidebar;
