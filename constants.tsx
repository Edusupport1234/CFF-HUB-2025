
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
  ChevronDown,
  ExternalLink,
  GripVertical,
  Minus,
  Maximize2,
  Heading1,
  Palette,
  Layers,
  Menu,
  ShieldCheck,
  BookOpen,
  Presentation,
  ArrowUp,
  Sun,
  Moon
} from 'lucide-react';
import { LearningTrack } from './types';

export const ICONS = {
  Home: <Home size={18} />,
  Search: <Search size={18} />,
  Admin: <Lock size={14} />,
  Lock: <Lock size={24} />,
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
  ChevronDown: <ChevronDown size={14} />,
  External: <ExternalLink size={14} />,
  Grip: <GripVertical size={16} />,
  Divider: <Minus size={18} />,
  Resize: <Maximize2 size={14} />,
  Heading: <Heading1 size={18} />,
  Theme: <Palette size={16} />,
  Layout: <Layers size={16} />,
  Menu: <Menu size={20} />,
  Student: <BookOpen size={32} />,
  Trainer: <Presentation size={32} />,
  Shield: <ShieldCheck size={32} />,
  Up: <ArrowUp size={20} />,
  Sun: <Sun size={20} />,
  Moon: <Moon size={20} />
};

export const DEFAULT_TRACKS: LearningTrack[] = [
  {
    id: 'ai-2026',
    title: 'AI FOR FUN 2026',
    subtitle: 'VIDEO TUTORIALS FOR AI FOR FUN 2026',
    icon: '🤖',
    subcategories: [
      { id: 'ai-intro', title: 'Getting Started' },
      { id: 'ai-vision', title: 'Computer Vision' },
      { id: 'ai-nlp', title: 'Natural Language' }
    ]
  },
  {
    id: 'code-2024',
    title: 'CODE FOR FUN 2024',
    subtitle: 'VIDEO TUTORIALS FOR CODE FOR FUN 2024',
    icon: '📜',
    subcategories: [
      { id: 'servo-motor', title: 'Servo Motor' }
    ]
  },
  {
    id: 'code-2026',
    title: 'CODE FOR FUN 2026',
    subtitle: 'VIDEO TUTORIALS FOR CODE FOR FUN 2026',
    icon: '🚀',
    subcategories: [
      { id: 'code-block', title: 'Block Programming' },
      { id: 'code-python', title: 'Python Basics' }
    ]
  },
  {
    id: 'trainer-code-2026',
    title: 'TRAINER: CODE FOR FUN 2026',
    subtitle: 'TRAINER RESOURCES FOR CFF 2026',
    icon: '👨‍🏫',
    subcategories: [
      { id: 'code-block', title: 'Block Programming' },
      { id: 'code-python', title: 'Python Basics' }
    ]
  },
  {
    id: 'trainer-code-2024',
    title: 'TRAINER: CODE FOR FUN 2024',
    subtitle: 'TRAINER RESOURCES FOR CFF 2024',
    icon: '🔧',
    subcategories: [
      { id: 'servo-motor', title: 'Servo Motor' }
    ]
  },
  {
    id: 'trainer-ai-2026',
    title: 'TRAINER: AI FOR FUN 2026',
    subtitle: 'TRAINER RESOURCES FOR AI 2026',
    icon: '🧠',
    subcategories: [
      { id: 'ai-intro', title: 'Getting Started' },
      { id: 'ai-vision', title: 'Computer Vision' },
      { id: 'ai-nlp', title: 'Natural Language' }
    ]
  }
];
