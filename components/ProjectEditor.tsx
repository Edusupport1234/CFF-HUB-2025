
import React, { useState, useRef } from 'react';
import { Project, LearningTrack, Subcategory, ProjectStatus, Section, ContentBlock } from '../types';
import { ICONS } from '../constants';
import VideoPlayer from './VideoPlayer';

interface ProjectEditorProps {
  project: Project;
  onSave: (updated: Project, newTrack?: LearningTrack, newSubcategory?: { trackId: string, sub: Subcategory }) => void;
  onBack: () => void;
  tracks: LearningTrack[];
  isDarkMode?: boolean;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onSave, onBack, tracks, isDarkMode }) => {
  const [title, setTitle] = useState(project.title);
  const [thumbnail, setThumbnail] = useState(project.thumbnail);
  const [trackId, setTrackId] = useState(project.trackId);
  const [subcategoryId, setSubcategoryId] = useState(project.subcategoryId || '');
  const [audience, setAudience] = useState<'all' | 'trainer' | 'student'>(project.audience || 'all');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // New Track/Subcategory state
  const [isAddingNewTrack, setIsAddingNewTrack] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackSubtitle, setNewTrackSubtitle] = useState('');
  const [newTrackAudience, setNewTrackAudience] = useState<'all' | 'trainer' | 'student'>('all');
  
  const [isAddingNewSub, setIsAddingNewSub] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  
  // Extract initial values from existing project structure if they exist
  const initialVideo = project.sections?.[0]?.blocks?.find(b => b && b.type === 'video')?.content || '';
  const initialDesc = project.sections?.[0]?.blocks?.find(b => b && b.type === 'text')?.content || '';
  
  const [videoLink, setVideoLink] = useState(initialVideo);
  const [description, setDescription] = useState(initialDesc);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!videoLink.trim()) newErrors.videoLink = 'Video URL is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!thumbnail) newErrors.thumbnail = 'Thumbnail is required';

    if (isAddingNewTrack) {
      if (!newTrackTitle.trim()) newErrors.newTrackTitle = 'Track title is required';
    } else if (!trackId) {
      newErrors.trackId = 'Track selection is required';
    }

    if (isAddingNewSub) {
      if (!newSubTitle.trim()) newErrors.newSubTitle = 'Subcategory title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    let finalTrackId = trackId;
    let finalSubId = subcategoryId || null;
    let createdTrack: LearningTrack | undefined;
    let createdSub: { trackId: string, sub: Subcategory } | undefined;

    if (isAddingNewTrack) {
      finalTrackId = `track-${Math.random().toString(36).substr(2, 5)}`;
      createdTrack = {
        id: finalTrackId,
        title: newTrackTitle.trim(),
        subtitle: newTrackSubtitle.trim() || 'NEW TRACK',
        icon: '📚',
        subcategories: [],
        audience: newTrackAudience
      };
      
      if (isAddingNewSub) {
        finalSubId = `sub-${Math.random().toString(36).substr(2, 5)}`;
        createdTrack.subcategories = [{
          id: finalSubId,
          title: newSubTitle.trim()
        }];
      }
    } else if (isAddingNewSub && trackId) {
      finalSubId = `sub-${Math.random().toString(36).substr(2, 5)}`;
      createdSub = {
        trackId,
        sub: {
          id: finalSubId,
          title: newSubTitle.trim()
        }
      };
    }

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
      trackId: finalTrackId, 
      subcategoryId: finalSubId,
      sections: [simpleSection], 
      thumbnail, 
      status: ProjectStatus.PUBLISHED, 
      lastEdited: Date.now(), // Fixed to use actual timestamp
      audience
    }, createdTrack, createdSub);
  };

  const currentTrack = tracks.find(t => t.id === trackId);

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-[#0a0b0d]' : 'bg-slate-50'}`}>
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
      <header className={`h-16 sm:h-20 border-b-2 px-4 sm:px-10 flex items-center justify-between z-30 shrink-0 transition-colors duration-500 ${
        isDarkMode ? 'bg-[#0a0b0d] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3 sm:gap-6">
          <button onClick={onBack} className={`p-2 sm:p-3 hover:text-purple-700 transition-colors group ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="group-hover:-translate-x-1 transition-transform inline-block">{ICONS.Back}</span>
          </button>
          <h2 className={`text-sm sm:text-xl font-black uppercase tracking-tight truncate max-w-[120px] sm:max-w-none ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
            {project.id ? 'Edit Tutorial' : 'New Tutorial'}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onBack} 
            className={`px-4 sm:px-8 py-2 sm:py-3.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${isDarkMode ? 'text-slate-400 hover:text-purple-400' : 'text-slate-500 hover:text-purple-700'}`}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className={`bg-purple-700 text-white px-4 sm:px-10 py-2 sm:py-3.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-950 transition-all shadow-xl ${isDarkMode ? 'shadow-black/50 hover:bg-purple-600' : ''}`}
          >
            Save
          </button>
        </div>
      </header>

      {/* Form Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-12">
        <div className="max-w-4xl mx-auto space-y-8 sm:y-12 animate-slide-up pb-20">
          
          {/* Section: Basic Info */}
          <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 shadow-sm space-y-6 sm:space-y-8 transition-colors duration-500 ${
            isDarkMode ? 'bg-[#15171e] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="text-[12px] sm:text-[14px] font-black text-purple-700 uppercase tracking-[0.3em] dark:text-purple-400">Basic Information</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">Tutorial Title</label>
              <input 
                value={title} 
                onChange={e => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => { const n = {...prev}; delete n.title; return n; });
                }}
                placeholder="Enter a descriptive title..."
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl text-[14px] sm:text-[16px] font-bold focus:outline-none transition-all ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-100 text-slate-950 focus:border-purple-600'
                } ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Target Track</label>
                  <select 
                    value={isAddingNewTrack ? "add-new" : trackId}
                    onChange={(e) => {
                      if (e.target.value === "add-new") {
                        setIsAddingNewTrack(true);
                      } else {
                        setIsAddingNewTrack(false);
                        setTrackId(e.target.value);
                      }
                      setSubcategoryId('');
                      setIsAddingNewSub(false);
                    }}
                    className={`w-full px-6 py-4 border-2 rounded-2xl text-[14px] font-bold focus:outline-none transition-all appearance-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-100 text-slate-950 focus:border-purple-600'
                    }`}
                  >
                    {!isAddingNewTrack && <option value="">Select a track...</option>}
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                    <option value="add-new" className="text-purple-600 font-black">+ Add New Track...</option>
                  </select>
                </div>
                
                {isAddingNewTrack && (
                  <div className="space-y-4 p-6 rounded-2xl border-2 border-purple-500/30 bg-purple-50/5 animate-slide-up">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">New Track Title</label>
                      <input 
                        value={newTrackTitle}
                        onChange={e => setNewTrackTitle(e.target.value)}
                        placeholder="e.g., ADVANCED AI 2027"
                        className={`w-full px-4 py-3 border-2 rounded-xl text-xs font-bold focus:outline-none ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      />
                      {errors.newTrackTitle && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{errors.newTrackTitle}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">New Track Subtitle</label>
                      <input 
                        value={newTrackSubtitle}
                        onChange={e => setNewTrackSubtitle(e.target.value)}
                        placeholder="e.g., THE FUTURE OF INTELLIGENCE"
                        className={`w-full px-4 py-3 border-2 rounded-xl text-xs font-bold focus:outline-none ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">Track Audience</label>
                      <div className="flex gap-2">
                        {['all', 'trainer'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setNewTrackAudience(v as any)}
                            className={`flex-1 py-2 px-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                              newTrackAudience === v
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')
                            }`}
                          >
                            {v === 'all' ? 'Public' : 'Trainers Only'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Subcategory</label>
                  <select 
                    value={isAddingNewSub ? "add-new" : subcategoryId}
                    onChange={(e) => {
                      if (e.target.value === "add-new") {
                        setIsAddingNewSub(true);
                      } else {
                        setIsAddingNewSub(false);
                        setSubcategoryId(e.target.value);
                      }
                    }}
                    className={`w-full px-6 py-4 border-2 rounded-2xl text-[14px] font-bold focus:outline-none transition-all appearance-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-100 text-slate-950 focus:border-purple-600'
                    }`}
                  >
                    {!isAddingNewSub && <option value="">{isAddingNewTrack ? "Select Track First" : "No Subcategory"}</option>}
                    {!isAddingNewTrack && currentTrack?.subcategories?.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                    <option value="add-new" className="text-purple-600 font-black">
                      {isAddingNewTrack ? "+ Add Sub-cat to New Track..." : "+ Add New Subcategory..."}
                    </option>
                  </select>
                </div>

                {isAddingNewSub && (
                  <div className="space-y-2 p-6 rounded-2xl border-2 border-purple-500/30 bg-purple-50/5 animate-slide-up">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">New Subcategory Title</label>
                    <input 
                      value={newSubTitle}
                      onChange={e => setNewSubTitle(e.target.value)}
                      placeholder="e.g., ADVANCED SENSORS"
                      className={`w-full px-4 py-3 border-2 rounded-xl text-xs font-bold focus:outline-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    />
                    {errors.newSubTitle && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{errors.newSubTitle}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Who is this for? (Audience)</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { value: 'all', label: 'All Users', icon: ICONS.Home },
                  { value: 'trainer', label: 'Trainers Only', icon: ICONS.Admin }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAudience(opt.value as any)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                      audience === opt.value 
                        ? (isDarkMode ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-black/50' : 'bg-purple-700 border-purple-700 text-white shadow-lg') 
                        : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-purple-500' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-purple-200')
                    }`}
                  >
                    <span className="scale-110">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Media & Link */}
          <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 shadow-sm space-y-6 sm:space-y-8 transition-colors duration-500 ${
            isDarkMode ? 'bg-[#15171e] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="text-[12px] sm:text-[14px] font-black text-purple-700 uppercase tracking-[0.3em] dark:text-purple-400">Tutorial Content</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">Video URL (YouTube/Vimeo)</label>
              <input 
                value={videoLink} 
                onChange={e => {
                  setVideoLink(e.target.value);
                  if (errors.videoLink) setErrors(prev => { const n = {...prev}; delete n.videoLink; return n; });
                }}
                placeholder="Paste video link here..."
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl text-[14px] sm:text-[16px] font-bold focus:outline-none transition-all ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-100 text-slate-950 focus:border-purple-600'
                } ${errors.videoLink ? 'border-red-500' : ''}`}
              />
              {errors.videoLink && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">{errors.videoLink}</p>}
              {videoLink && (
                <div className={`mt-4 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-2 shadow-inner ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <VideoPlayer url={videoLink} className="rounded-none shadow-none border-0" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">Description & Steps</label>
              <textarea 
                value={description} 
                onChange={e => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => { const n = {...prev}; delete n.description; return n; });
                }}
                placeholder="Explain the tutorial steps and concepts here..."
                rows={8}
                className={`w-full px-4 sm:px-6 py-4 sm:py-5 border-2 rounded-xl sm:rounded-2xl text-[14px] sm:text-[16px] font-bold leading-relaxed focus:outline-none transition-all resize-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 focus:border-purple-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-purple-600'
                } ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">{errors.description}</p>}
            </div>
          </div>

          {/* Section: Thumbnail */}
          <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 shadow-sm space-y-6 sm:space-y-8 transition-colors duration-500 ${
            isDarkMode ? 'bg-[#15171e] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] sm:text-[14px] font-black text-purple-700 uppercase tracking-[0.3em] dark:text-purple-400">Thumbnail Image</h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all underline decoration-2 underline-offset-4 ${
                    isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-900'
                }`}
              >
                Choose Image
              </button>
            </div>
            
            <div className={`relative group aspect-video rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border-4 border-dashed flex flex-col items-center justify-center transition-all ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'
            } ${errors.thumbnail ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-purple-600'}`}>
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
