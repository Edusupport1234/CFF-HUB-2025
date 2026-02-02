
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { LearningTrack } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  tracks: LearningTrack[];
  onTracksReorder: (tracks: LearningTrack[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, tracks, onTracksReorder }) => {
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 64rem = 256px
  const isResizing = useRef(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Handle Sidebar Resizing
  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(Math.max(220, e.clientX), 450);
    setSidebarWidth(newWidth);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  };

  // Handle Track Drag & Drop
  const onDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newTracks = [...tracks];
    const item = newTracks[draggedItemIndex];
    newTracks.splice(draggedItemIndex, 1);
    newTracks.splice(index, 0, item);
    
    setDraggedItemIndex(index);
    onTracksReorder(newTracks);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  return (
    <div 
      style={{ width: `${sidebarWidth}px` }} 
      className="h-screen bg-white border-r border-slate-200 flex flex-col py-8 px-4 relative transition-[width] duration-75 shadow-sm"
    >
      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-purple-500/20 active:bg-purple-600/40 transition-colors z-50 group"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-slate-300 group-hover:bg-purple-500 rounded-full" />
      </div>

      {/* Logo */}
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

      {/* Main Nav */}
      <div className="space-y-1">
        <button
          onClick={() => onViewChange('home')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all overflow-hidden whitespace-nowrap ${
            currentView === 'home' 
            ? 'bg-purple-700 text-white shadow-lg shadow-purple-200' 
            : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {ICONS.Home}
          <span>HOME PAGE</span>
        </button>
      </div>

      {/* Learning Tracks Section */}
      <div className="mt-10 flex-1 overflow-y-auto no-scrollbar">
        <h3 className="px-4 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">LEARNING TRACKS</h3>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-grab active:cursor-grabbing transition-all border border-transparent hover:bg-slate-50 hover:border-slate-200 ${
                draggedItemIndex === index ? 'opacity-40 bg-purple-50 scale-95' : 'opacity-100'
              }`}
            >
              <div className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-0.5 h-0.5 bg-current rounded-full" />
                  <div className="w-0.5 h-0.5 bg-current rounded-full" />
                  <div className="w-0.5 h-0.5 bg-current rounded-full" />
                  <div className="w-0.5 h-0.5 bg-current rounded-full" />
                </div>
              </div>
              <span className="text-xl shrink-0">{track.icon}</span>
              <span className="text-[12px] font-bold text-slate-900 tracking-wide uppercase truncate">
                {track.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Login */}
      <button className="mt-auto mx-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-purple-800 transition-all shadow-md whitespace-nowrap overflow-hidden">
        {ICONS.Admin}
        ADMIN LOGIN
      </button>
    </div>
  );
};

export default Sidebar;