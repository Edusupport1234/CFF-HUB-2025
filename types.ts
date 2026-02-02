
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_REVIEW = 'IN_REVIEW'
}

export type BlockType = 'text' | 'image' | 'video' | 'spacer' | 'divider' | 'heading';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  gridSpan?: number; // 1-12 for fine-grained grid control
}

export interface SectionStyle {
  background: 'white' | 'gray' | 'purple' | 'dark';
  padding: 'compact' | 'normal' | 'large';
}

export interface Section {
  id: string;
  columns: number; 
  style?: SectionStyle;
  blocks: ContentBlock[];
}

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail: string;
  status: ProjectStatus;
  lastEdited: string;
  trackId: string;
  sections: Section[];
}

export interface LearningTrack {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export type ViewState = 'home' | 'editor' | 'admin' | 'viewer';
