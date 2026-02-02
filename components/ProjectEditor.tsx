
import React, { useState, useRef, useEffect } from 'react';
import { Project, Section, ContentBlock, BlockType, LearningTrack, ProjectStatus, SectionStyle } from '../types';
import { ICONS } from '../constants';
import VideoPlayer from './VideoPlayer';

interface ProjectEditorProps {
  project: Project;
  onSave: (updated: Project) => void;
  onBack: () => void;
  tracks: LearningTrack[];
}

const GRID_COLUMNS = 12;

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onSave, onBack, tracks }) => {
  const [sections, setSections] = useState<Section[]>(project.sections);
  const [title, setTitle] = useState(project.title);
  const [thumbnail, setThumbnail] = useState(project.thumbnail);
  const [trackId, setTrackId] = useState(project.trackId);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showThemeMenu, setShowThemeMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<{ sId: string, bId: string, type: BlockType } | null>(null);
  
  const [resizing, setResizing] = useState<{ sId: string, bId: string, startX: number, startSpan: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingBlock, setDraggingBlock] = useState<{ sId: string, bId: string } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing || !containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const colWidth = containerWidth / GRID_COLUMNS;
      const deltaX = e.clientX - resizing.startX;
      const deltaSpan = Math.round(deltaX / colWidth);
      const newSpan = Math.min(GRID_COLUMNS, Math.max(1, resizing.startSpan + deltaSpan));
      updateBlock(resizing.sId, resizing.bId, { gridSpan: newSpan });
    };

    const handleMouseUp = () => setResizing(null);

    if (resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const addSection = (cols: number = 1) => {
    const defaultSpan = Math.floor(GRID_COLUMNS / cols);
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      columns: cols,
      style: { background: 'white', padding: 'normal' },
      blocks: Array.from({ length: cols }).map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        content: '',
        gridSpan: defaultSpan
      }))
    };
    setSections([...sections, newSection]);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
    }
    setSections(newSections);
  };

  const updateSectionStyle = (sId: string, style: Partial<SectionStyle>) => {
    setSections(prev => prev.map(s => s.id === sId ? { ...s, style: { ...s.style!, ...style } } : s));
  };

  const handleBlockDragStart = (sId: string, bId: string) => {
    setDraggingBlock({ sId, bId });
  };

  const handleBlockDrop = (targetSId: string, targetIndex: number) => {
    if (!draggingBlock) return;
    const { sId: sourceSId, bId: sourceBId } = draggingBlock;
    const newSections = [...sections];
    const sourceSection = newSections.find(s => s.id === sourceSId);
    if (!sourceSection) return;
    const blockIndex = sourceSection.blocks.findIndex(b => b.id === sourceBId);
    const [movedBlock] = sourceSection.blocks.splice(blockIndex, 1);
    const targetSection = newSections.find(s => s.id === targetSId);
    if (targetSection) targetSection.blocks.splice(targetIndex, 0, movedBlock);
    setSections(newSections);
    setDraggingBlock(null);
  };

  const updateBlock = (sectionId: string, blockId: string, updates: Partial<ContentBlock>) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, blocks: s.blocks.map(b => (b.id === blockId ? { ...b, ...updates } : b)) };
    }));
  };

  const removeBlock = (sId: string, bId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sId) return s;
      return { ...s, blocks: s.blocks.filter(b => b.id !== bId) };
    }));
  };

  const addBlockToSection = (sId: string, type: BlockType) => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      gridSpan: 6
    };
    setSections(prev => prev.map(s => s.id === sId ? { ...s, blocks: [...s.blocks, newBlock] } : s));
  };

  const handleSave = () => {
    onSave({ ...project, title, trackId, sections, thumbnail, status: ProjectStatus.PUBLISHED, lastEdited: 'Just now' });
  };

  const getSectionBg = (bg?: string) => {
    switch(bg) {
      case 'gray': return 'bg-slate-100';
      case 'purple': return 'bg-purple-50';
      case 'dark': return 'bg-slate-900 text-white';
      default: return 'bg-white';
    }
  };

  return (
    <div className="flex h-screen bg-slate-200/50">
      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file && activeUpload) {
          const reader = new FileReader();
          reader.onload = (ev) => updateBlock(activeUpload.sId, activeUpload.bId, { content: ev.target?.result as string });
          reader.readAsDataURL(file);
        }
      }} />

      {/* Sidebar - Improved contrast */}
      <aside className="w-80 bg-white border-r border-slate-300 flex flex-col p-8 z-40 shadow-xl">
        <div className="mb-10">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Build Canvas</h3>
             <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-bold">GRID ACTIVE</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
             {[
               { type: 'text', icon: ICONS.Text, label: 'Text' },
               { type: 'heading', icon: ICONS.Heading, label: 'Heading' },
               { type: 'image', icon: ICONS.Image, label: 'Image' },
               { type: 'video', icon: ICONS.Video, label: 'Video' },
               { type: 'divider', icon: ICONS.Divider, label: 'Divider' },
               { type: 'spacer', icon: ICONS.Resize, label: 'Space' },
             ].map(item => (
               <button 
                key={item.label}
                onClick={() => {
                  if (sections.length === 0) addSection();
                  else addBlockToSection(sections[sections.length - 1].id, item.type as BlockType);
                }}
                className="flex flex-col items-center justify-center p-5 bg-white border-2 border-slate-200 rounded-3xl hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/10 transition-all group active:scale-95"
               >
                 <span className="mb-2 text-slate-500 group-hover:text-purple-600 transition-transform group-hover:scale-110">{item.icon}</span>
                 <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 group-hover:text-slate-950">{item.label}</span>
               </button>
             ))}
           </div>
        </div>

        <div className="mt-auto pt-8 border-t-2 border-slate-100">
           <button 
            onClick={() => addSection(1)}
            className="w-full flex items-center justify-center gap-3 py-5 bg-slate-950 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl active:scale-95"
           >
             {ICONS.Plus} ADD SECTION
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Improved contrast */}
        <header className="h-20 bg-white border-b-2 border-slate-300 px-10 flex items-center justify-between z-30">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-900 border border-slate-300">{ICONS.Back}</button>
            <div className="flex flex-col">
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="text-xl font-black uppercase tracking-tight focus:outline-none bg-transparent w-96 text-slate-950 placeholder:text-slate-400"
                placeholder="UNTITLED PROJECT"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[11px] font-black text-slate-600 tracking-widest uppercase">Live Editing Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button onClick={() => setDevice('desktop')} className={`p-2.5 rounded-xl transition-all ${device === 'desktop' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>{ICONS.Desktop}</button>
              <button onClick={() => setDevice('mobile')} className={`p-2.5 rounded-xl transition-all ${device === 'mobile' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>{ICONS.Mobile}</button>
            </div>
            <button onClick={handleSave} className="bg-purple-700 text-white px-10 py-3.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-950 transition-all shadow-2xl">
              Publish Tutorial
            </button>
          </div>
        </header>

        {/* Stage - Faded fix */}
        <main className="flex-1 overflow-y-auto p-12 editor-canvas no-scrollbar">
          <div className={`mx-auto transition-all duration-700 ease-in-out ${device === 'mobile' ? 'max-w-[440px] ring-[20px] ring-slate-950 rounded-[5rem] bg-white shadow-2xl overflow-hidden' : 'max-w-6xl'}`}>
            <div className="min-h-[90vh] bg-white rounded-[4rem] shadow-2xl border-2 border-slate-300 overflow-hidden relative" ref={containerRef}>
              
              {sections.length === 0 && (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center p-10 animate-slide-up">
                   <div className="w-24 h-24 bg-slate-100 border-2 border-slate-200 rounded-[3rem] flex items-center justify-center text-slate-400 mb-8">{ICONS.Plus}</div>
                   <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight mb-4">Your Canvas</h2>
                   <p className="text-slate-600 text-[14px] max-w-xs uppercase tracking-[0.2em] font-black leading-relaxed">Select a component to begin building.</p>
                </div>
              )}

              {sections.map((section, sIdx) => (
                <section 
                  key={section.id} 
                  className={`group relative border-b-2 border-slate-200 last:border-0 transition-all ${getSectionBg(section.style?.background)} ${section.style?.padding === 'compact' ? 'py-14' : section.style?.padding === 'large' ? 'py-44' : 'py-28'}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleBlockDrop(section.id, section.blocks.length)}
                >
                  {/* Grid Snap Overlay - Subtler but clear */}
                  {(resizing || draggingBlock) && (
                    <div className="absolute inset-0 z-0 pointer-events-none px-12 md:px-20 grid grid-cols-12 gap-10 opacity-5">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-full border-x border-slate-950" />
                      ))}
                    </div>
                  )}

                  {/* High Visibility Section Controls */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex flex-col gap-3 z-30 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
                    <button onClick={() => setShowThemeMenu(showThemeMenu === section.id ? null : section.id)} className="p-4 bg-slate-950 text-white rounded-[2rem] shadow-2xl hover:bg-purple-700 transition-all border border-slate-800">
                      {ICONS.Theme}
                    </button>
                    <div className="flex flex-col bg-slate-950 text-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800">
                      <button onClick={() => moveSection(sIdx, 'up')} className="p-4 hover:bg-purple-700 transition-colors border-b border-slate-800">
                        <div className="rotate-[-90deg] scale-110">{ICONS.ChevronRight}</div>
                      </button>
                      <button onClick={() => moveSection(sIdx, 'down')} className="p-4 hover:bg-purple-700 transition-colors">
                        <div className="rotate-[90deg] scale-110">{ICONS.ChevronRight}</div>
                      </button>
                    </div>
                    <button onClick={() => setSections(sections.filter(s => s.id !== section.id))} className="p-4 bg-red-600 text-white rounded-[2rem] shadow-2xl hover:bg-red-700 transition-all">
                      {ICONS.Delete}
                    </button>
                  </div>

                  {/* Theme Overlay - High Contrast */}
                  {showThemeMenu === section.id && (
                    <div className="absolute left-28 top-1/2 -translate-y-1/2 w-64 bg-slate-950 rounded-[3rem] shadow-2xl border border-slate-800 p-8 z-50 animate-slide-up">
                      <p className="text-[12px] font-black text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Appearance</p>
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        {['white', 'gray', 'purple', 'dark'].map(bg => (
                          <button 
                            key={bg} 
                            onClick={() => updateSectionStyle(section.id, { background: bg as any })}
                            className={`h-12 rounded-2xl border-4 transition-all ${section.style?.background === bg ? 'border-purple-500 scale-110' : 'border-transparent'} ${bg === 'dark' ? 'bg-slate-800' : bg === 'purple' ? 'bg-purple-200' : bg === 'gray' ? 'bg-slate-200' : 'bg-white'}`}
                          />
                        ))}
                      </div>
                      <p className="text-[12px] font-black text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Padding</p>
                      <div className="flex flex-col gap-2">
                        {['compact', 'normal', 'large'].map(p => (
                          <button 
                            key={p} 
                            onClick={() => updateSectionStyle(section.id, { padding: p as any })}
                            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${section.style?.padding === p ? 'bg-white text-slate-950 shadow-xl' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 px-16 md:px-24 grid grid-cols-12 gap-12 md:gap-16 min-h-[120px]">
                    {section.blocks.map((block, bIdx) => {
                      const span = block.gridSpan || 12;
                      const isResizingThis = resizing?.bId === block.id;

                      return (
                        <div 
                          key={block.id} 
                          draggable 
                          onDragStart={() => handleBlockDragStart(section.id, block.id)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.stopPropagation(); handleBlockDrop(section.id, bIdx); }}
                          className={`relative group/block col-span-12 md:col-span-${Math.round(span)} flex flex-col p-8 rounded-[3.5rem] border-2 border-transparent transition-all duration-300 ${isResizingThis ? 'border-purple-600 bg-purple-50/50 shadow-inner' : 'hover:bg-slate-100/60 hover:border-slate-300'} ${draggingBlock?.bId === block.id ? 'opacity-20 scale-95' : 'opacity-100'}`}
                        >
                          {/* Block Tool Handle */}
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover/block:opacity-100 transition-all z-20">
                            <div className="p-3 bg-slate-950 text-white rounded-full shadow-2xl cursor-grab active:cursor-grabbing hover:bg-purple-700">
                              {ICONS.Grip}
                            </div>
                            <button 
                              onClick={() => removeBlock(section.id, block.id)}
                              className="p-3 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700"
                            >
                              {ICONS.Delete}
                            </button>
                          </div>

                          {/* Stronger Resize Handle */}
                          <div 
                            onMouseDown={(e) => setResizing({ sId: section.id, bId: block.id, startX: e.clientX, startSpan: block.gridSpan || 12 })}
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 cursor-ew-resize opacity-0 group-hover/block:opacity-100 transition-opacity z-20 flex items-center justify-center"
                          >
                             <div className="w-2 h-12 bg-slate-950 rounded-full shadow-xl" />
                          </div>

                          {/* Resize Badge */}
                          {isResizingThis && (
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[12px] font-black px-6 py-3 rounded-full z-50 whitespace-nowrap uppercase tracking-[0.25em] shadow-2xl border-2 border-purple-500/50">
                              Width: {block.gridSpan} Units
                            </div>
                          )}

                          <div className="flex-1">
                            {block.type === 'heading' ? (
                              <input 
                                value={block.content}
                                onChange={e => updateBlock(section.id, block.id, { content: e.target.value })}
                                placeholder="SECTION HEADING"
                                className="w-full bg-transparent text-4xl font-black uppercase tracking-tight focus:outline-none placeholder:text-slate-400 leading-none text-slate-950"
                              />
                            ) : block.type === 'text' ? (
                              <textarea 
                                value={block.content}
                                onChange={e => updateBlock(section.id, block.id, { content: e.target.value })}
                                placeholder="Describe the steps for this tutorial part..."
                                className="w-full bg-transparent min-h-[160px] text-xl font-bold leading-relaxed focus:outline-none resize-none placeholder:text-slate-500 text-slate-900"
                              />
                            ) : block.type === 'image' ? (
                              <div className="aspect-video w-full rounded-[3rem] overflow-hidden bg-slate-100 border-4 border-dashed border-slate-300 flex flex-col items-center justify-center gap-6 group/media transition-all hover:bg-slate-200/50 hover:border-purple-600">
                                {block.content ? (
                                  <img src={block.content} className="w-full h-full object-cover" alt="Content" />
                                ) : (
                                  <div className="text-center p-12">
                                    <div className="text-slate-400 mb-8 scale-[2.5]">{ICONS.Image}</div>
                                    <button onClick={() => { setActiveUpload({ sId: section.id, bId: block.id, type: 'image' }); fileInputRef.current?.click(); }} className="text-[13px] font-black uppercase text-purple-700 hover:text-purple-900 underline underline-offset-8 tracking-widest decoration-[3px]">Upload Asset</button>
                                  </div>
                                )}
                              </div>
                            ) : block.type === 'video' ? (
                              <div className="w-full">
                                {block.content ? (
                                  <VideoPlayer url={block.content} className="rounded-[3rem] shadow-2xl" />
                                ) : (
                                  <div className="aspect-video rounded-[3rem] bg-slate-950 flex flex-col items-center justify-center p-12 shadow-2xl transition-transform hover:scale-[1.02]">
                                    <div className="text-white/40 mb-10 scale-[2]">{ICONS.Video}</div>
                                    <input 
                                      placeholder="PASTE VIDEO LINK"
                                      className="w-full max-w-sm bg-white/10 border-2 border-white/20 rounded-[2rem] px-8 py-5 text-[12px] font-black text-white placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-purple-600/50 uppercase tracking-[0.25em] text-center"
                                      onBlur={e => updateBlock(section.id, block.id, { content: e.target.value })}
                                    />
                                  </div>
                                )}
                              </div>
                            ) : block.type === 'divider' ? (
                              <div className="py-16"><div className="h-2 w-full bg-slate-200 rounded-full shadow-inner" /></div>
                            ) : (
                              <div className="h-40 flex items-center justify-center border-4 border-dashed border-slate-200 rounded-[3.5rem] text-[14px] text-slate-400 font-black uppercase tracking-[0.6em] bg-slate-100/50">Spacer Block</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* High Visibility Add Placeholder */}
                    <button 
                      onClick={() => addBlockToSection(section.id, 'text')}
                      className="col-span-12 md:col-span-1 border-4 border-dashed border-slate-300 rounded-[3.5rem] flex items-center justify-center text-slate-400 hover:border-slate-950 hover:text-slate-950 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100 min-h-[160px] group/add shadow-inner"
                    >
                      <div className="scale-150 transition-transform group-hover/add:rotate-90 group-hover/add:scale-[2]">{ICONS.Plus}</div>
                    </button>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectEditor;
