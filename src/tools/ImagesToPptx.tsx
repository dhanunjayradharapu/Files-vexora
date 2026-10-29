import React, { useState, useRef } from 'react';
import {
  Presentation,
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  MoveLeft,
  MoveRight,
  Trash2,
  Sparkles,
  Sliders,
  FilePlus,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  createPptxFromImages,
  ImagePptxItem,
  ImageToPptxOptions
} from '../utils/pptxUtils';
import { formatBytes } from '../utils/fileUtils';

export const ImagesToPptx: React.FC = () => {
  const [items, setItems] = useState<ImagePptxItem[]>([]);
  const [options, setOptions] = useState<ImageToPptxOptions>({
    presentationTitle: 'My Photo Presentation',
    author: '',
    layout: '16x9',
    fitMode: 'fit',
    backgroundColor: '#ffffff',
    includeTitleSlide: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setDownloadBlob(null);

    const newItems: ImagePptxItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        caption: file.name.replace(/\.[^/.]+$/, ''),
      });
    }

    if (newItems.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP, GIF).');
      return;
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  const moveItem = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setItems(copy);
    setDownloadBlob(null);
  };

  const removeItem = (index: number) => {
    const removed = items[index];
    URL.revokeObjectURL(removed.previewUrl);
    setItems(items.filter((_, i) => i !== index));
    setDownloadBlob(null);
  };

  const updateCaption = (index: number, caption: string) => {
    const copy = [...items];
    copy[index].caption = caption;
    setItems(copy);
  };

  const handleGenerate = async () => {
    if (items.length === 0) {
      setError('Please add at least one image to create a PowerPoint presentation.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress({ current: 0, total: items.length });

      const blob = await createPptxFromImages(items, options, (current, total) => {
        setProgress({ current, total });
      });

      setDownloadBlob(blob);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate PowerPoint presentation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setItems([]);
    setDownloadBlob(null);
    setDownloadUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (appendInputRef.current) appendInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-3">
          <Presentation className="w-3.5 h-3.5" />
          PowerPoint Generator
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          Create PowerPoint from Images
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Transform photos and charts into a downloadable PPTX presentation using PptxGenJS in your browser.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-amber-300 dark:border-amber-800/80 hover:border-amber-500 bg-amber-50/40 dark:bg-slate-900 hover:bg-amber-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200 dark:shadow-none">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">Select Images for Presentation</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Choose JPG, PNG, or WebP images. Each image will be placed onto its own PowerPoint slide.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-md shadow-amber-100 dark:shadow-none transition-all text-sm inline-flex items-center gap-2"
          >
            Choose Images
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Images List / Slides Grid */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-[#1E1B4B] dark:text-white text-sm">
                    {items.length} {items.length === 1 ? 'Slide' : 'Slides'} Planned
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Drag or reorder slides before generating</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={appendInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => appendInputRef.current?.click()}
                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add More Images
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Grid of Slides */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 rounded px-1.5 py-0.5">
                        Slide {options.includeTitleSlide ? idx + 2 : idx + 1}
                      </span>
                      <span className="text-slate-400 truncate max-w-[80px]">{formatBytes(item.file.size)}</span>
                    </div>

                    <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center p-1 relative">
                      <img
                        src={item.previewUrl}
                        alt={`Slide ${idx + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {options.fitMode === 'contain-caption' && (
                      <input
                        type="text"
                        value={item.caption || ''}
                        onChange={(e) => updateCaption(idx, e.target.value)}
                        placeholder="Slide caption..."
                        className="mt-1.5 px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 dark:text-white w-full"
                      />
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveItem(idx, 'left')}
                          className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                          title="Move earlier"
                        >
                          <MoveLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => moveItem(idx, 'right')}
                          className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                          title="Move later"
                        >
                          <MoveRight className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                        title="Remove slide"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Presentation Settings Panel */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-[#1E1B4B] dark:text-white text-base">Presentation Settings</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure slide layout and typography</p>
              </div>

              {/* Title & Author */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Presentation Title
                  </label>
                  <input
                    type="text"
                    value={options.presentationTitle}
                    onChange={(e) => setOptions({ ...options, presentationTitle: e.target.value })}
                    placeholder="e.g. Q4 Executive Report"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Author / Presenter (Optional)
                  </label>
                  <input
                    type="text"
                    value={options.author}
                    onChange={(e) => setOptions({ ...options, author: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={options.includeTitleSlide}
                    onChange={(e) => setOptions({ ...options, includeTitleSlide: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Include introductory title slide
                  </span>
                </label>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Slide Format / Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '16x9', label: '16:9 Widescreen (Modern)' },
                    { id: '4x3', label: '4:3 Standard' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setOptions({ ...options, layout: r.id as any })}
                      className={`py-2 px-2 text-xs rounded-xl border transition-all text-center ${
                        options.layout === r.id
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Image Positioning
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'fit', label: 'Fit With Margins', desc: 'Preserves full image with clean margins' },
                    { id: 'cover', label: 'Full Bleed', desc: 'Expands image to cover entire slide' },
                    { id: 'contain-caption', label: 'Image + Caption Bar', desc: 'Displays image with editable caption below' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setOptions({ ...options, fitMode: mode.id as any })}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                        options.fitMode === mode.id
                          ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-600'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <p className="text-xs font-bold text-[#1E1B4B] dark:text-white">{mode.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Slide Background
                </label>
                <div className="flex gap-2">
                  {[
                    { id: '#ffffff', label: 'White', border: true },
                    { id: '#f8fafc', label: 'Slate', border: true },
                    { id: '#0f172a', label: 'Dark', border: false },
                    { id: '#1e1b4b', label: 'Indigo', border: false },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setOptions({ ...options, backgroundColor: bg.id })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        options.backgroundColor === bg.id
                          ? 'border-amber-600 ring-2 ring-amber-600/30'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: bg.id }}
                      />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300">{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-200 dark:shadow-none transition-all text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Slide {progress.current} of {progress.total}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate PowerPoint (.pptx)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Download Success Card */}
          {downloadBlob && downloadUrl && (
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">PowerPoint Presentation Ready!</h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {items.length + (options.includeTitleSlide ? 1 : 0)} slides created &bull; Size: {formatBytes(downloadBlob.size)}
                  </p>
                </div>
              </div>

              <a
                href={downloadUrl}
                download={`${(options.presentationTitle || 'presentation').toLowerCase().replace(/\s+/g, '_')}.pptx`}
                className="px-6 py-3 bg-white text-amber-700 hover:bg-amber-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Presentation (.pptx)
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
