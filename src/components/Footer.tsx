import React from 'react';
import { FileBox, Lock, Zap, HardDrive } from 'lucide-react';
import { ToolCategory } from '../data/tools';

interface FooterProps {
  onSelectCategory: (category: ToolCategory | null) => void;
  onSelectTool: (toolId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onSelectTool }) => {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
                <span className="font-extrabold text-sm font-mono">V</span>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-[#1E1B4B] dark:text-white">
                Vex<span className="text-indigo-600 dark:text-indigo-400">ora</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every File. One Powerful Workspace. High-performance, private file tools running locally inside your browser without uploading to external servers.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Zero server file uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant client-side processing</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                <span>Runs securely in browser memory</span>
              </div>
            </div>
          </div>

          {/* Col 2: Image Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1E1B4B] dark:text-slate-200 mb-3">
              Image Tools
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onSelectTool('crop-image')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Image Crop
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('image-resizer')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Image Resizer & Presets
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('image-compressor')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Image Compressor (Bytes/KB/MB)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('batch-compress')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Bulk Image Compressor (ZIP)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('image-converter')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Format Converter (JPG/PNG/WebP)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('image-rotator')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Image Rotator & Flip
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: PDF & PowerPoint */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1E1B4B] dark:text-slate-200 mb-3">
              PDF & PowerPoint
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onSelectTool('merge-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Merge PDF Documents
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-jpg')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  PDF to JPG & PNG
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('extract-pptx-images')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                >
                  Extract PPTX Images
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('images-to-pptx')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Images to PowerPoint
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('preview-pptx')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  PowerPoint Slide Inspector
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('powerpoint')}
                  className="font-medium text-amber-600 dark:text-amber-400 hover:underline transition-colors cursor-pointer"
                >
                  View all PowerPoint tools →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Document Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1E1B4B] dark:text-slate-200 mb-3">
              Document Tools
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onSelectTool('docx-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-violet-600 dark:text-violet-400 font-medium"
                >
                  Word (DOCX) to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('text-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Plain Text to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-extract-text')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Extract Text from PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('editor-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Document Editor to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('file-inspector')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  File Information & Hashes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('document')}
                  className="font-medium text-violet-600 dark:text-violet-400 hover:underline transition-colors cursor-pointer"
                >
                  View all Document tools →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} Vexora. Every File. One Powerful Workspace.
          </div>
          <div className="flex items-center gap-4">
            <span>Client-side HTML5 & WebAssembly</span>
            <span aria-hidden="true">·</span>
            <span>Zero Tracking Telemetry</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
