import React, { useState, useRef } from 'react';
import {
  Presentation,
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Archive,
  Sparkles,
  Info,
  Layers,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { analyzePptxFile, PptxAnalysisResult, ExtractedPptxMedia } from '../utils/pptxUtils';
import { formatBytes } from '../utils/fileUtils';

export const PptxExtractMedia: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PptxAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterExt, setFilterExt] = useState<string>('all');
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (selectedFile: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      setFile(selectedFile);

      const result = await analyzePptxFile(selectedFile);
      setAnalysis(result);

      if (result.media.length > 0) {
        try {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to parse PowerPoint presentation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (!analysis || analysis.media.length === 0) return;
    try {
      setIsZipping(true);
      const zip = new JSZip();
      analysis.media.forEach((item) => {
        zip.file(item.name, item.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'presentation';
      link.download = `${baseName}_extracted_images.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not package extracted media into a ZIP file.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleReset = () => {
    if (analysis) {
      analysis.media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    }
    setFile(null);
    setAnalysis(null);
    setError(null);
    setFilterExt('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredMedia = analysis
    ? filterExt === 'all'
      ? analysis.media
      : analysis.media.filter((m) => m.extension.toLowerCase() === filterExt.toLowerCase())
    : [];

  const uniqueExtensions = analysis
    ? Array.from(new Set(analysis.media.map((m) => m.extension.toLowerCase())))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-3">
          <Presentation className="w-3.5 h-3.5" />
          PowerPoint Media Unpacker
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          Extract Images from PowerPoint
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Inspect modern OpenXML PPTX packages and extract embedded photos, illustrations, and media at original resolution.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Error reading presentation</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-amber-300 dark:border-amber-800/80 hover:border-amber-500 bg-amber-50/40 dark:bg-slate-900 hover:bg-amber-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200 dark:shadow-none">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">Select a PowerPoint (.pptx) File</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Drag and drop your presentation. Embedded images are extracted directly in your browser without uploading to any server.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-md shadow-amber-100 dark:shadow-none transition-all text-sm inline-flex items-center gap-2"
          >
            Choose PPTX File
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B] dark:text-white">Unpacking OpenXML presentation media...</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Reading internal zip structures locally</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Overview Info Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Presentation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1B4B] dark:text-white text-base truncate max-w-md">
                  {analysis.fileName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {analysis.slideCount} slides &bull; {analysis.media.length} embedded images &bull; {formatBytes(analysis.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {analysis.media.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  {isZipping ? 'Creating ZIP...' : `Download All (${analysis.media.length}) as ZIP`}
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Inspect Another File
              </button>
            </div>
          </div>

          {/* Format Filter Bar */}
          {uniqueExtensions.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium">Filter format:</span>
              <button
                onClick={() => setFilterExt('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterExt === 'all'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                All Formats ({analysis.media.length})
              </button>
              {uniqueExtensions.map((ext) => (
                <button
                  key={ext}
                  onClick={() => setFilterExt(ext)}
                  className={`px-3 py-1.5 rounded-lg font-medium uppercase transition-colors ${
                    filterExt === ext
                      ? 'bg-amber-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {ext} ({analysis.media.filter((m) => m.extension.toLowerCase() === ext).length})
                </button>
              ))}
            </div>
          )}

          {/* Media Grid */}
          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map((item, idx) => (
                <div
                  key={item.name + idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between group"
                >
                  <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center relative p-2">
                    {item.mimeType.startsWith('image/') ? (
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <span className="text-[10px] uppercase font-bold">{item.extension}</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-white backdrop-blur-sm">
                      {item.extension}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs">
                    <div className="truncate min-w-0">
                      <p className="font-semibold text-[#1E1B4B] dark:text-white truncate text-[11px]">{item.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatBytes(item.size)}</p>
                    </div>
                    <a
                      href={item.previewUrl}
                      download={item.name}
                      className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-600 text-amber-700 dark:text-amber-400 hover:text-white transition-colors shrink-0"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-[#1E1B4B] dark:text-white">No embedded media found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                This presentation does not contain any embedded images inside its OpenXML media directory.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
