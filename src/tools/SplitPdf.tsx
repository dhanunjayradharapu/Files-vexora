import React, { useState } from 'react';
import {
  Scissors,
  Download,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileArchive,
  Layers,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { splitPdfIntoRanges, parsePageRangeString } from '../utils/pdfUtils';
import { loadPdfDocument, renderPageThumbnail } from '../utils/pdfRenderUtils';
import { formatBytes, downloadBlob, downloadZip, getFileNameWithoutExt } from '../utils/fileUtils';

interface PagePreview {
  pageNumber: number;
  thumbnailUrl: string;
}

interface SplitRangeEntry {
  id: string;
  label: string;
  rangeText: string;
}

export const SplitPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // Split Modes
  const [mode, setMode] = useState<'custom' | 'every-n' | 'all-individual'>('custom');
  const [customRanges, setCustomRanges] = useState<SplitRangeEntry[]>([
    { id: '1', label: 'Part 1', rangeText: '1' },
  ]);
  const [everyNPages, setEveryNPages] = useState<number>(1);

  // Results
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [splitResults, setSplitResults] = useState<{ filename: string; blob: Blob }[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setErrorMessage(null);
    setSplitResults(null);
    setIsLoadingPdf(true);
    setPagePreviews([]);

    try {
      const buffer = await selected.arrayBuffer();
      setPdfBuffer(buffer);

      const pdfDoc = await loadPdfDocument(buffer);
      const count = pdfDoc.numPages;
      setTotalPages(count);

      // Default custom ranges
      if (count >= 2) {
        const mid = Math.floor(count / 2);
        setCustomRanges([
          { id: '1', label: 'Part 1', rangeText: `1-${mid}` },
          { id: '2', label: 'Part 2', rangeText: `${mid + 1}-${count}` },
        ]);
      } else {
        setCustomRanges([{ id: '1', label: 'Page 1', rangeText: '1' }]);
      }

      // Render thumbnails
      const previews: PagePreview[] = [];
      const previewLimit = Math.min(count, 40);

      for (let i = 1; i <= previewLimit; i++) {
        const thumb = await renderPageThumbnail(pdfDoc, i, 160);
        previews.push({
          pageNumber: i,
          thumbnailUrl: thumb.dataUrl,
        });
      }
      setPagePreviews(previews);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load PDF';
      setErrorMessage(msg);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfBuffer(null);
    setTotalPages(0);
    setPagePreviews([]);
    setSplitResults(null);
    setErrorMessage(null);
  };

  const handleAddRange = () => {
    const nextIdx = customRanges.length + 1;
    setCustomRanges((prev) => [
      ...prev,
      { id: `${Date.now()}`, label: `Part ${nextIdx}`, rangeText: `${Math.min(nextIdx, totalPages)}` },
    ]);
  };

  const handleRemoveRange = (id: string) => {
    if (customRanges.length <= 1) return;
    setCustomRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRangeChange = (id: string, text: string) => {
    setCustomRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rangeText: text } : r))
    );
  };

  const handleSplit = async () => {
    if (!pdfBuffer || !file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const rangesToProcess: { label: string; indices: number[] }[] = [];

      if (mode === 'custom') {
        for (const entry of customRanges) {
          const indices = parsePageRangeString(entry.rangeText, totalPages);
          if (indices.length > 0) {
            rangesToProcess.push({
              label: entry.label.replace(/\s+/g, '_') || `part_${entry.rangeText}`,
              indices,
            });
          }
        }
      } else if (mode === 'every-n') {
        const n = Math.max(1, everyNPages);
        let part = 1;
        for (let i = 0; i < totalPages; i += n) {
          const indices: number[] = [];
          for (let j = i; j < Math.min(i + n, totalPages); j++) {
            indices.push(j);
          }
          rangesToProcess.push({
            label: `part_${part}_pages_${i + 1}-${Math.min(i + n, totalPages)}`,
            indices,
          });
          part++;
        }
      } else {
        // all individual
        for (let i = 0; i < totalPages; i++) {
          rangesToProcess.push({
            label: `page_${i + 1}`,
            indices: [i],
          });
        }
      }

      if (rangesToProcess.length === 0) {
        throw new Error('Please specify at least one valid page range');
      }

      const results = await splitPdfIntoRanges(pdfBuffer, rangesToProcess);
      setSplitResults(results);

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // optional confetti
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to split PDF';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (res: { filename: string; blob: Blob }) => {
    if (!file) return;
    const base = getFileNameWithoutExt(file.name);
    downloadBlob(res.blob, `${base}_${res.filename}`);
  };

  const handleDownloadZip = async () => {
    if (!splitResults || !file) return;
    const base = getFileNameWithoutExt(file.name);

    const filesToZip = splitResults.map((res) => ({
      name: `${base}_${res.filename}`,
      blob: res.blob,
    }));

    await downloadZip(filesToZip, `Vexora-${base}-split-files.zip`);
  };

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          acceptedMimeTypes={['application/pdf']}
          title="Split PDF by Page Ranges"
          subtitle="Extract ranges, split every N pages, or separate into individual PDF documents with preserved vectors"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Document Page Previews */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-xs">
                    {file.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {totalPages} pages
                  </span>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Another</span>
                </button>
              </div>

              {isLoadingPdf ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs">Rendering page thumbnails...</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Page Thumbnails Preview ({pagePreviews.length} shown):</span>
                    <span className="font-mono text-[11px]">{formatBytes(file.size)}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {pagePreviews.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="relative bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col justify-between"
                      >
                        <div className="absolute top-3 left-3 z-10 w-5 h-5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono flex items-center justify-center">
                          {page.pageNumber}
                        </div>

                        <div className="aspect-3/4 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center p-1">
                          <img
                            src={page.thumbnailUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="mt-1.5 text-center text-[10px] text-slate-400 font-mono">
                          Page {page.pageNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Split Settings */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Split Settings
              </h3>

              {/* Mode switch */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Split Method
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('custom');
                      setSplitResults(null);
                    }}
                    className={`py-1.5 rounded transition-all cursor-pointer ${
                      mode === 'custom'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    Custom Ranges
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('every-n');
                      setSplitResults(null);
                    }}
                    className={`py-1.5 rounded transition-all cursor-pointer ${
                      mode === 'every-n'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    Every N Pages
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('all-individual');
                      setSplitResults(null);
                    }}
                    className={`py-1.5 rounded transition-all cursor-pointer ${
                      mode === 'all-individual'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    All Pages
                  </button>
                </div>
              </div>

              {/* Custom Ranges Input */}
              {mode === 'custom' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Define Output Ranges
                    </span>
                    <button
                      type="button"
                      onClick={handleAddRange}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Range</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {customRanges.map((range, idx) => (
                      <div key={range.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={range.label}
                          onChange={(e) =>
                            setCustomRanges((prev) =>
                              prev.map((r) => (r.id === range.id ? { ...r, label: e.target.value } : r))
                            )
                          }
                          className="w-24 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                          placeholder="Label"
                        />
                        <input
                          type="text"
                          value={range.rangeText}
                          onChange={(e) => handleRangeChange(range.id, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                          placeholder="e.g. 1-3, 5"
                        />
                        {customRanges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRange(range.id)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Format: ranges like <span className="font-mono">1-4</span> or single pages like <span className="font-mono">5</span>.
                  </p>
                </div>
              )}

              {/* Every N Pages input */}
              {mode === 'every-n' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Split Every N Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={everyNPages}
                    onChange={(e) => setEveryNPages(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    Will create {Math.ceil(totalPages / (everyNPages || 1))} separate documents.
                  </p>
                </div>
              )}

              {mode === 'all-individual' && (
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                  Every page in this document ({totalPages} pages) will be extracted into its own separate single-page PDF.
                </div>
              )}

              {/* Action Buttons */}
              {!splitResults ? (
                <button
                  type="button"
                  onClick={handleSplit}
                  disabled={isProcessing || totalPages === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting Pages...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>Split PDF Document</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <FileArchive className="w-4 h-4" />
                    <span>Download All as ZIP ({splitResults.length} files)</span>
                  </button>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                    {splitResults.map((res, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <span className="font-mono truncate max-w-xs">{res.filename}</span>
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(res)}
                          className="text-teal-600 hover:underline font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Split into {splitResults.length} documents</span>
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
