
import React from 'react';
import { 
  Home,
  Search,
  Lock,
  LayoutGrid,
  MoreVertical,
  ArrowLeft,
  Monitor,
  Smartphone,
  Trash2,
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Plus,
  Settings,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Minus,
  Maximize2,
  Heading1,
  Palette,
  Layers
} from 'lucide-react';
import { LearningTrack } from './types';

export const ICONS = {
  Home: <Home size={18} />,
  Search: <Search size={18} />,
  Admin: <Lock size={14} />,
  Grid: <LayoutGrid size={18} />,
  More: <MoreVertical size={18} />,
  Back: <ArrowLeft size={18} />,
  Desktop: <Monitor size={18} />,
  Mobile: <Smartphone size={18} />,
  Delete: <Trash2 size={18} />,
  Text: <Type size={18} />,
  Image: <ImageIcon size={18} />,
  Video: <VideoIcon size={18} />,
  Play: <Play size={18} />,
  Plus: <Plus size={18} />,
  Settings: <Settings size={18} />,
  ChevronRight: <ChevronRight size={14} />,
  External: <ExternalLink size={14} />,
  Grip: <GripVertical size={16} />,
  Divider: <Minus size={18} />,
  Resize: <Maximize2 size={14} />,
  Heading: <Heading1 size={18} />,
  Theme: <Palette size={16} />,
  Layout: <Layers size={16} />
};

export const DEFAULT_TRACKS: LearningTrack[] = [
  {
    id: 'ai-2026',
    title: 'AI FOR FUN 2026',
    subtitle: 'VIDEO TUTORIALS FOR AI FOR FUN 2026',
    icon: '🤖'
  },
  {
    id: 'code-2026',
    title: 'CODE FOR FUN 2026',
    subtitle: 'VIDEO TUTORIALS FOR CODE FOR FUN 2026',
    icon: '🚀'
  },
  {
    id: 'code-2024',
    title: 'CODE FOR FUN 2024',
    subtitle: 'VIDEO TUTORIALS FOR CODE FOR FUN 2024',
    icon: '📜'
  }
];
