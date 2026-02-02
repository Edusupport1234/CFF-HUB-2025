
import React from 'react';
import { Project, ProjectStatus } from '../types';
import { ICONS } from '../constants';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, isSelected, onSelect }) => {
  const statusColors = {
    [ProjectStatus.DRAFT]: 'bg-gray-100 text-gray-600',
    [ProjectStatus.PUBLISHED]: 'bg-emerald-100 text-emerald-600',
    [ProjectStatus.IN_REVIEW]: 'bg-amber-100 text-amber-600'
  };

  return (
    <div 
      className={`group bg-white rounded-[2rem] border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-100'
      }`}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={project.thumbnail} 
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute top-4 left-4">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onSelect(project.id)}
            className="w-5 h-5 rounded-lg border-2 border-white/50 bg-white/20 backdrop-blur-md cursor-pointer checked:bg-indigo-500"
          />
        </div>
        <button className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {ICONS.More}
        </button>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[project.status]}`}>
            • {project.status}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {project.title}
        </h3>
        <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-400">
          <span>{project.lastEdited}</span>
          <button 
            onClick={() => onEdit(project)}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Edit Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
