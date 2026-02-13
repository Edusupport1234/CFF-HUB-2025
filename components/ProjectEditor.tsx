
import React, { useState, useRef, useEffect } from 'react';
import { Project, LearningTrack, ProjectStatus, Section, ContentBlock } from '../types';
import { ICONS } from '../constants';
import VideoPlayer from './VideoPlayer';

interface ProjectEditorProps {
  project: Project;
  onSave: (updated: Project) => void;
  onBack: () => void;
  tracks: LearningTrack[];
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onSave, onBack, tracks }) => {
  const [title, setTitle] = useState(project.title);
  const [thumbnail, setThumbnail] = useState(project.thumbnail);
  const [trackId, setTrackId] = useState(project.trackId);
  const [subcategoryId, setSubcategoryId] = useState(project.subcategoryId || '');
  
  // Extract initial values from existing project structure if they exist
  const initialVideo = project.sections?.[0]?.blocks.find(b => b.type === 'video')?.content || '';
  const initialDesc = project.sections?.[0]?.blocks.find(b => b.type === 'text')?.content || '';
  
  const [videoLink, setVideoLink] = useState(initialVideo);
  const [description, setDescription] = useState(initialDesc);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // Construct the sections array to match the expected format for ProjectViewer
    const blocks: ContentBlock[] = [];
    
    if (videoLink) {
      blocks.push({
        id: 'main-video',
        type: 'video',
        content: videoLink,
        gridSpan: 12
      });
    }

    if (description) {
      blocks.push({
        id: 'main-desc',
        type: 'text',
        content: description,
        gridSpan: 12
      });
    }

    const simpleSection: Section = {
      id: 'main-section',
      columns: 1,
      style: { background: 'white', padding: 'normal' },
      blocks: blocks
    };

    onSave({ 
      ...project, 
      title, 
      trackId, 
      subcategoryId: subcategoryId || undefined,
      sections: [simpleSection], 
      thumbnail, 
      status: ProjectStatus.PUBLISHED, 
      lastEdited: 'Just now' 
    });
  };

  const currentTrack = tracks.find(t => t.id === trackId);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setThumbnail(ev.target?.result as string);
            reader.readAsDataURL(file);
          }
        }} 
      />

      {/* Header */}
      <header className="h-20 bg-white border-b-2 border-slate-200 px-10 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-900 border border-slate-200">
            {ICONS.Back}
          </button>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
            {project.id ? 'Edit Tutorial' : 'Create New Tutorial'}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="bg-purple-700 text-white px-10 py-3.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-950 transition-all shadow-xl"
          >
            Save & Publish
          </button>
        </div>
      </header>

      {/* Form Area */}
      <main className="flex-1 overflow-y-auto p-12 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12 animate-slide-up pb-20">
          
          {/* Section: Basic Info */}
          <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-200 shadow-sm space-y-8">
            <h3 className="text-[14px] font-black text-purple-700 uppercase tracking-[0.3em]">Basic Information</h3>
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tutorial Title</label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-bold text-slate-950 focus:outline-none focus:border-purple-600 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Target Track</label>
                <select 
                  value={trackId}
                  onChange={(e) => {
                    setTrackId(e.target.value);
                    setSubcategoryId('');
                  }}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-bold text-slate-950 focus:outline-none focus:border-purple-600 transition-all appearance-none"
                >
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Subcategory</label>
                <select 
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-bold text-slate-950 focus:outline-none focus:border-purple-600 transition-all appearance-none"
                >
                  <option value="">No Subcategory</option>
                  {currentTrack?.subcategories?.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Media & Link */}
          <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-200 shadow-sm space-y-8">
            <h3 className="text-[14px] font-black text-purple-700 uppercase tracking-[0.3em]">Tutorial Content</h3>
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Video URL (YouTube/Vimeo)</label>
              <input 
                value={videoLink} 
                onChange={e => setVideoLink(e.target.value)}
                placeholder="Paste video link here..."
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-bold text-slate-950 focus:outline-none focus:border-purple-600 transition-all"
              />
              {videoLink && (
                <div className="mt-4 rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner">
                  <VideoPlayer url={videoLink} className="rounded-none shadow-none border-0" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Description & Steps</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain the tutorial steps and concepts here..."
                rows={8}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-bold leading-relaxed text-slate-900 focus:outline-none focus:border-purple-600 transition-all resize-none"
              />
            </div>
          </div>

          {/* Section: Thumbnail */}
          <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-black text-purple-700 uppercase tracking-[0.3em]">Thumbnail Image</h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-purple-50 text-purple-700 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all"
              >
                Choose Image
              </button>
            </div>
            
            <div className="relative group aspect-video rounded-[2.5rem] overflow-hidden bg-slate-100 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center transition-all hover:border-purple-600">
              {thumbnail ? (
                <>
                  <img src={thumbnail} className="w-full h-full object-cover" alt="Tutorial Preview" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-slate-950 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      Change Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-12">
                  <div className="text-slate-300 mb-6 scale-[2.5]">{ICONS.Image}</div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload a banner image</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProjectEditor;
