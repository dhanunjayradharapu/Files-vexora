import React, { useState, useEffect } from 'react';
import {
  FileBox,
  Shield,
  Zap,
  HardDrive,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  History,
  Trash2,
} from 'lucide-react';
import { ToolDef, ToolCategory, TOOLS, CATEGORIES, searchTools } from '../data/tools';
import { ToolCard } from '../components/ToolCard';
import { DropZone } from '../components/DropZone';

interface HomePageProps {
  onSelectTool: (toolId: string) => void;
  selectedCategory: ToolCategory | null;
  onSelectCategory: (cat: ToolCategory | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTool,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
}) => {
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [quickUploadFiles, setQuickUploadFiles] = useState<File[]>([]);

  // Load recent tools from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vexora-recent-tools') || localStorage.getItem('filegenius-recent-tools');
      if (saved) {
        setRecentToolIds(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearRecentTools = () => {
    localStorage.removeItem('vexora-recent-tools');
    localStorage.removeItem('filegenius-recent-tools');
    setRecentToolIds([]);
  };

  const filteredTools = searchTools(searchQuery, selectedCategory || undefined);
  const recentTools = recentToolIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is ToolDef => Boolean(t));

  const handleQuickDrop = (files: File[]) => {
    setQuickUploadFiles(files);
  };

  const faqs = [
    {
      q: 'Are my confidential files uploaded to any external server?',
      a: 'Never. Vexora operates 100% locally inside your web browser using HTML5 Canvas, Blob APIs, and WebAssembly. Your files are processed entirely in your device memory and never leave your machine.',
    },
    {
      q: 'How does the target size image compressor work?',
      a: 'Our smart compressor uses an iterative bounded search algorithm to test encoding quality against the exact byte size you specify. If maximum compression at native resolution cannot reach your target, it can progressively scale dimensions to honor your requested constraint.',
    },
    {
      q: 'What happens to transparent backgrounds when converting to JPEG?',
      a: 'Because the JPEG specification has no alpha channel, transparent areas would typically turn black. Vexora proactively detects transparency, warns you, and allows you to choose a custom background fill color (white by default) or switch to WebP.',
    },
    {
      q: 'What image formats can I convert and process?',
      a: 'Vexora supports JPG, JPEG, PNG, WebP, GIF, and BMP. You can convert seamlessly between JPEG, PNG, and modern WebP formats individually or in bulk.',
    },
    {
      q: 'Do I need an account or have to pay for high resolutions?',
      a: 'No accounts, no subscriptions, and no watermarks. Vexora is completely free to use with all processing powered directly by your computer or phone CPU.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-14 pb-4 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Privacy kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 rounded-full">
            <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>100% Private In-Browser Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight leading-[1.1] text-balance">
            Every File. <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">One Powerful Workspace.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Convert, compress, resize, crop, and organize your images and documents locally in your browser with Vexora. Fast, private, and 100% free with zero server uploads.
          </p>

          {/* Feature Highlights Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748B] dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Zero Server Uploads</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Instant Local Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>No Accounts or Watermarks</span>
            </div>
          </div>
        </div>

        {/* Quick Dropzone on Hero */}
        <div className="max-w-3xl mx-auto px-4 mt-8">
          {!quickUploadFiles.length ? (
            <DropZone
              onFilesSelected={handleQuickDrop}
              multiple={true}
              maxFiles={20}
              title="Drop files here to start immediately"
              subtitle="Drop an image to resize, compress, rotate, or convert to PDF in one click"
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                    {quickUploadFiles.length} {quickUploadFiles.length === 1 ? 'file' : 'files'} selected
                  </span>
                </div>
                <button
                  onClick={() => setQuickUploadFiles([])}
                  className="text-xs text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>

              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Choose what you want to do with your {quickUploadFiles.length === 1 ? 'file' : 'files'}:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  onClick={() => onSelectTool('image-to-pdf')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                    Convert to PDF
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Combine into PDF doc</div>
                </button>

                <button
                  onClick={() => onSelectTool(quickUploadFiles.length > 1 ? 'batch-compress' : 'image-compressor')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                    {quickUploadFiles.length > 1 ? 'Bulk Compress' : 'Compress Size'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Target Bytes, KB or MB</div>
                </button>

                <button
                  onClick={() => onSelectTool('crop-image')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                    Crop Area
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">1:1, 16:9, custom area</div>
                </button>

                <button
                  onClick={() => onSelectTool('image-resizer')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                    Resize Dimensions
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Social & 4K presets</div>
                </button>

                <button
                  onClick={() => onSelectTool(quickUploadFiles.length > 1 ? 'batch-converter' : 'image-converter')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                    {quickUploadFiles.length > 1 ? 'Batch Convert' : 'Change Format'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP</div>
                </button>

                <button
                  onClick={() => onSelectTool('image-rotator')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                    Rotate & Flip
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">90°, 180°, or mirror</div>
                </button>

                <button
                  onClick={() => onSelectTool('images-to-pptx')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-amber-600">
                    Images to PowerPoint
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Generate .pptx presentation</div>
                </button>

                <button
                  onClick={() => onSelectTool('file-inspector')}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                    File Inspector & Hashes
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">SHA-256 & magic signatures</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recently Used Tools Strip (if any) */}
      {recentTools.length > 0 && !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E1B4B] dark:text-slate-200">
                Recently Used
              </h2>
            </div>
            <button
              onClick={clearRecentTools}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentTools.map((t) => (
              <ToolCard key={`recent-${t.id}`} tool={t} onSelect={onSelectTool} isRecent={true} />
            ))}
          </div>
        </section>
      )}

      {/* Main Tools Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Filter & Category Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All Tools ({TOOLS.length})
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input Filter */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword (e.g. compress)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[#1E1B4B] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <p className="text-sm font-semibold text-[#1E1B4B] dark:text-slate-200">
              No tools matched your search "{searchQuery}"
            </p>
            <p className="text-xs text-slate-500">
              Try searching for "resize", "compress", "rotate", or "pdf"
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                onSelectCategory(null);
              }}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
              How Vexora Works
            </h2>
            <p className="text-sm text-[#64748B] dark:text-slate-400">
              Transform, compress, and organize your files with three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
                Select Your Files
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Pick or drag-and-drop your images and documents directly into any tool. Or paste directly from your clipboard with Ctrl+V.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
                Configure & Preview Locally
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Set exact pixel dimensions, choose target file sizes in KB or MB, rotate angles, and reorder document pages with instant visual feedback.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
                Instant Safe Download
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Export clean, optimized files created directly in your browser. Download single files or multiple results as a ZIP archive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#64748B] dark:text-slate-400">
            Clear answers on privacy, supported formats, and performance.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#1E1B4B] dark:text-white hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-5 pb-4 pt-1 text-xs text-[#64748B] dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
