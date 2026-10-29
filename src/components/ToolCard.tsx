import React from 'react';
import {
  FileText,
  Maximize2,
  Minimize2,
  Repeat,
  RotateCw,
  Layers,
  FileArchive,
  FileImage,
  Presentation,
  Sliders,
  Crop,
  FileBox,
  ArrowRight,
  Sparkles,
  Scissors,
  Copy,
  Image,
  Hash,
  Stamp,
  PenTool,
  FileDown,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { ToolDef } from '../data/tools';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  FileText,
  Maximize2,
  Minimize2,
  Repeat,
  RotateCw,
  Layers,
  FileArchive,
  FileImage,
  Presentation,
  Sliders,
  Crop,
  FileBox,
  Scissors,
  Copy,
  Image,
  Hash,
  Stamp,
  PenTool,
  FileDown,
  BookOpen,
  FileCheck,
};

interface ToolCardProps {
  tool: ToolDef;
  onSelect: (toolId: string) => void;
  isRecent?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect, isRecent }) => {
  const IconComponent = ICON_MAP[tool.iconName] || FileBox;
  const isReady = tool.status === 'ready';

  // Distinct, coordinated category icon styling
  const getCategoryIconStyles = () => {
    if (!isReady) {
      return 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500';
    }

    switch (tool.category) {
      case 'pdf':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white';
      case 'image':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white';
      case 'powerpoint':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white';
      case 'document':
        return 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white';
    }
  };

  return (
    <div
      onClick={() => isReady && onSelect(tool.id)}
      role={isReady ? 'button' : undefined}
      tabIndex={isReady ? 0 : undefined}
      onKeyDown={(e) => {
        if (isReady && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(tool.id);
        }
      }}
      className={`group relative text-left rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
        isReady
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600'
          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 opacity-80 cursor-default'
      }`}
    >
      <div>
        {/* Top bar inside card */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${getCategoryIconStyles()}`}
          >
            <IconComponent className="w-5 h-5 transition-transform group-hover:scale-105" />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {isRecent && (
              <span className="text-teal-600 dark:text-teal-400 font-medium text-[11px]">
                Recent
              </span>
            )}
            {tool.popular && (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Popular
              </span>
            )}
            {!isReady && (
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                Coming Soon
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-[#1E1B4B] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5 flex items-center justify-between">
          <span>{tool.title}</span>
          {isReady && (
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600 dark:text-indigo-400" />
          )}
        </h3>

        {/* Description */}
        <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed line-clamp-2">
          {tool.shortDescription}
        </p>
      </div>

      {/* Card footer metadata */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span className="capitalize">{tool.category} Tool</span>
        <span className="font-mono text-[10px]">{isReady ? 'Ready' : 'In Dev'}</span>
      </div>
    </div>
  );
};
