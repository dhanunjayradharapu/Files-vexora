import React, { useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { ToolDef, getToolById, TOOLS } from '../data/tools';
import { ImageToPdf } from '../tools/ImageToPdf';
import { ImageResizer } from '../tools/ImageResizer';
import { ImageCompressor } from '../tools/ImageCompressor';
import { ImageConverter } from '../tools/ImageConverter';
import { ImageRotator } from '../tools/ImageRotator';
import { ImageCrop } from '../tools/ImageCrop';
import { BatchCompressor } from '../tools/BatchCompressor';
import { BatchConverter } from '../tools/BatchConverter';
import { ImageMetadata } from '../tools/ImageMetadata';
import { PdfToImage } from '../tools/PdfToImage';
import { MergePdf } from '../tools/MergePdf';
import { SplitPdf } from '../tools/SplitPdf';
import { ExtractPdf } from '../tools/ExtractPdf';
import { RotatePdf } from '../tools/RotatePdf';
import { OrganizePdf } from '../tools/OrganizePdf';
import { PdfPageNumbers } from '../tools/PdfPageNumbers';
import { PdfWatermark } from '../tools/PdfWatermark';
import { PdfAddImage } from '../tools/PdfAddImage';
import { CompressPdf } from '../tools/CompressPdf';
import { ToolCard } from '../components/ToolCard';

interface ToolPageProps {
  toolId: string;
  onNavigateHome: () => void;
  onSelectTool: (id: string) => void;
}

export const ToolPage: React.FC<ToolPageProps> = ({
  toolId,
  onNavigateHome,
  onSelectTool,
}) => {
  const tool = getToolById(toolId);

  // Track recent tool usage in localStorage
  useEffect(() => {
    if (tool && tool.status === 'ready') {
      try {
        const saved = localStorage.getItem('vexora-recent-tools') || localStorage.getItem('filegenius-recent-tools');
        const recent: string[] = saved ? JSON.parse(saved) : [];
        const updated = [tool.id, ...recent.filter((id) => id !== tool.id)].slice(0, 6);
        localStorage.setItem('vexora-recent-tools', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving recent tool', err);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [toolId, tool]);

  if (!tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#1E1B4B] dark:text-white">Tool Not Found</h2>
        <p className="text-slate-500 text-sm">The tool you requested could not be located.</p>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm shadow-indigo-600/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tools</span>
        </button>
      </div>
    );
  }

  const renderToolComponent = () => {
    switch (tool.id) {
      // PDF Tools
      case 'image-to-pdf':
        return <ImageToPdf />;
      case 'pdf-to-jpg':
        return <PdfToImage defaultFormat="image/jpeg" />;
      case 'pdf-to-png':
        return <PdfToImage defaultFormat="image/png" />;
      case 'merge-pdf':
        return <MergePdf />;
      case 'split-pdf':
        return <SplitPdf />;
      case 'extract-pdf':
        return <ExtractPdf />;
      case 'rotate-pdf':
        return <RotatePdf />;
      case 'organize-pdf':
        return <OrganizePdf />;
      case 'pdf-page-numbers':
        return <PdfPageNumbers />;
      case 'pdf-watermark':
        return <PdfWatermark />;
      case 'pdf-add-image':
        return <PdfAddImage />;
      case 'compress-pdf':
        return <CompressPdf />;

      // Image Tools
      case 'crop-image':
        return <ImageCrop />;
      case 'image-resizer':
        return <ImageResizer />;
      case 'image-compressor':
        return <ImageCompressor />;
      case 'batch-compress':
        return <BatchCompressor />;
      case 'image-converter':
        return <ImageConverter />;
      case 'batch-converter':
        return <BatchConverter />;
      case 'image-rotator':
        return <ImageRotator />;
      case 'image-metadata':
        return <ImageMetadata onSelectTool={onSelectTool} />;
      default:
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                In Active Development
              </span>
              <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white">
                {tool.title} is coming soon
              </h3>
              <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 text-left space-y-1">
              <div className="flex items-center gap-2 font-semibold text-[#1E1B4B] dark:text-slate-300">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Client-Side Processing Notice</span>
              </div>
              <p>
                Vexora tools process documents and media purely inside browser memory. Additional converters are being prepared with client-side WebAssembly engines.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateHome}
                className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Browse Ready Tools
              </button>
              <button
                onClick={() => onSelectTool('image-to-pdf')}
                className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors cursor-pointer"
              >
                Try Image to PDF
              </button>
            </div>
          </div>
        );
    }
  };

  // Find related tools in same category or ready tools
  const relatedTools = TOOLS.filter(
    (t) => t.id !== tool.id && (t.category === tool.category || t.status === 'ready')
  ).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={onNavigateHome}
            className="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Tools</span>
          </button>
          <span aria-hidden="true">/</span>
          <span className="capitalize">{tool.category}</span>
          <span aria-hidden="true">/</span>
          <span className="text-[#1E1B4B] dark:text-white font-medium">{tool.title}</span>
        </div>

        {/* Client side privacy guarantee */}
        <div className="flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-md px-2.5 py-1">
          <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
          <span>Local Device Processing: Your files are never uploaded</span>
        </div>
      </div>

      {/* Tool Header banner */}
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          {tool.title}
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 max-w-3xl leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Tool Work Area */}
      <main className="min-h-[400px]">
        {renderToolComponent()}
      </main>

      {/* Related Tools Strip */}
      <div className="pt-12 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
            More Tools You Might Need
          </h3>
          <button
            onClick={onNavigateHome}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {relatedTools.map((t) => (
            <ToolCard key={t.id} tool={t} onSelect={onSelectTool} />
          ))}
        </div>
      </div>
    </div>
  );
};
