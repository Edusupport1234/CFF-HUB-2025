
import React from 'react';
import { ICONS } from '../constants';

interface VideoPlayerProps {
  url: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, className = "" }) => {
  const getYoutubeInfo = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl);
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      }
      
      if (videoId) {
        return {
          id: videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          platform: 'YouTube'
        };
      }
    } catch (e) {}
    return null;
  };

  const getVimeoInfo = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl);
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        return {
          id: videoId,
          platform: 'Vimeo'
        };
      }
    } catch (e) {}
    return null;
  };

  const handleRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const yt = getYoutubeInfo(url);
  const vimeo = getVimeoInfo(url);
  const platform = yt?.platform || vimeo?.platform || 'Video';

  // For YouTube we show the dynamic thumbnail, for others we show a themed placeholder
  const thumbnail = yt?.thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop";

  return (
    <div 
      onClick={handleRedirect}
      className={`group relative aspect-video w-full rounded-[3.5rem] overflow-hidden bg-slate-900 cursor-pointer shadow-2xl transition-all hover:shadow-purple-500/40 border-4 border-transparent hover:border-purple-500/30 ${className}`}
    >
      {/* Background Image */}
      <img 
        src={thumbnail} 
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60" 
        alt="Video content"
        onError={(e) => {
          if (yt) (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${yt.id}/hqdefault.jpg`;
        }}
      />
      
      {/* Interaction Overlay */}
      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/60 transition-all duration-500 flex flex-col items-center justify-center">
        {/* Main Play Button - Now Redirects */}
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-purple-700 shadow-[0_0_50px_rgba(255,255,255,0.3)] transform transition-all group-hover:scale-110 group-active:scale-90 mb-8">
          <div className="ml-2 scale-[2.5]">{ICONS.Play}</div>
        </div>
        
        {/* Label Button */}
        <div className="flex items-center gap-4 px-10 py-5 bg-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-full text-[13px] font-black text-white uppercase tracking-[0.25em] group-hover:bg-white group-hover:text-slate-950 transition-all shadow-2xl">
          {ICONS.External} Watch on {platform}
        </div>
      </div>

      {/* Decorative Metadata */}
      <div className="absolute top-8 left-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-950/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Source Content Active</span>
        </div>
      </div>

      {/* Corner Hint */}
      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
          Opens in new tab
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
