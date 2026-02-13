
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface VideoPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, className = "", autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (autoPlay) setIsPlaying(true);
  }, [autoPlay, url]);

  const getYoutubeId = (videoUrl: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const getVimeoInfo = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl);
      if (!urlObj.hostname.includes('vimeo.com')) return null;
      
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      // Handle standard: /12345 or unlisted: /12345/abcde
      const id = pathParts[0];
      const hash = pathParts[1]; // Usually the second part in shared links
      
      if (id && /^\d+$/.test(id)) {
        return { id, hash };
      }
    } catch (e) {}
    return null;
  };

  const ytId = getYoutubeId(url);
  const vimeoInfo = getVimeoInfo(url);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ytId || vimeoInfo) {
      setIsPlaying(true);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isPlaying && (ytId || vimeoInfo)) {
    const origin = window.location.origin;
    let embedSrc = '';
    
    if (ytId) {
      embedSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    } else if (vimeoInfo) {
      const hashParam = vimeoInfo.hash ? `&h=${vimeoInfo.hash}` : '';
      embedSrc = `https://player.vimeo.com/video/${vimeoInfo.id}?autoplay=1&dnt=1${hashParam}`;
    }

    return (
      <div className={`relative aspect-video w-full rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden bg-black shadow-2xl ${className}`}>
        <iframe
          src={embedSrc}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>
    );
  }

  const thumbnail = ytId 
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop";

  const platform = ytId ? 'YouTube' : vimeoInfo ? 'Vimeo' : 'Video';

  return (
    <div 
      onClick={handlePlay}
      className={`group relative aspect-video w-full rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden bg-slate-900 cursor-pointer shadow-2xl transition-all hover:shadow-purple-500/40 border-4 border-transparent hover:border-purple-500/30 ${className}`}
    >
      <img 
        src={thumbnail} 
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60" 
        alt="Video content"
        onError={(e) => {
          if (ytId) (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }}
      />
      
      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/60 transition-all duration-500 flex flex-col items-center justify-center">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-purple-700 shadow-2xl transform transition-all group-hover:scale-110 group-active:scale-95">
          <div className="ml-1 sm:ml-2 scale-[1.5] sm:scale-[2.2]">{ICONS.Play}</div>
        </div>
        
        <div className="mt-4 sm:mt-8 px-4 sm:px-8 py-2 sm:py-4 bg-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-full text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.2em] group-hover:bg-white group-hover:text-slate-950 transition-all">
          Play on {platform}
        </div>
      </div>

      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-slate-950/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[9px] sm:text-[11px] font-black text-white uppercase tracking-[0.2em]">Live Stream</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
