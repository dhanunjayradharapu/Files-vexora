import React, { useState } from 'react';
import {
  FileCheck2,
  Download,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { extractPagesFromPdf, parsePageRangeString } from '../utils/pdfUtils';
import { loadPdfDocument, renderPageThumbnail } from '../utils/pdfRenderUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt } from '../utils/fileUtils';

interface PagePreview {
  pageNumber: number;
  thumbnailUrl: string;
}

export const ExtractPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // Selected 0-based page indices
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState<string>('');

  // Results
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultBlob, setResultBlob] = useState<{ blob: Blob; size: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setErrorMessage(null);
    setResultBlob(null);
    setIsLoadingPdf(true);
    setPagePreviews([]);

    try {
      const buffer = await selected.arrayBuffer();
      setPdfBuffer(buffer);

      const pdfDoc = await loadPdfDocument(buffer);
      const count = pdfDoc.numPages;
      setTotalPages(count);

      // Default: select first page
      setSelectedIndices(new Set([0]));
      setRangeInput('1');

      // Render thumbnails
      const previews: PagePreview[] = [];
      const previewLimit = Math.min(count, 50);

      for (let i = 1; i <= previewLimit; i++) {
        const thumb = await renderPageThumbnail(pdfDoc, i, 180);
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
    setSelectedIndices(new Set());
    setResultBlob(null);
    setErrorMessage(null);
  };

  const togglePage = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      // sync text input
      const arr = Array.from(next).sort((a, b) => a - b).map((i) => i + 1);
      setRangeInput(arr.join(', '));
      return next;
    });
    setResultBlob(null);
  };

  const handleSelectAll = () => {
    const all = new Set<number>();
    for (let i = 0; i < totalPages; i++) all.add(i);
    setSelectedIndices(all);
    setRangeInput(`1-${totalPages}`);
    setResultBlob(null);
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
    setRangeInput('');
    setResultBlob(null);
  };

  const handleInvert = () => {
    const next = new Set<number>();
    for (let i = 0; i < totalPages; i++) {
      if (!selectedIndices.has(i)) next.add(i);
    }
    setSelectedIndices(next);
    const arr = Array.from(next).sort((a, b) => a - b).map((i) => i + 1);
    setRangeInput(arr.join(', '));
    setResultBlob(null);
  };

  const handleRangeInputChange = (text: string) => {
    setRangeInput(text);
    const parsed = parsePageRangeString(text, totalPages);
    setSelectedIndices(new Set(parsed));
    setResultBlob(null);
  };

  const handleExtract = async () => {
    if (!pdfBuffer || !file) return;

    if (selectedIndices.size === 0) {
      setErrorMessage('Please select at least one page to extract');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
      const blob = await extractPagesFromPdf(pdfBuffer, sortedIndices);

      setResultBlob({
        blob,
        size: blob.size,
      });

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
      const msg = err instanceof Error ? err.message : 'Failed to extract pages';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const base = getFileNameWithoutExt(file.name);
    downloadBlob(resultBlob.blob, `${base}_extracted_${selectedIndices.size}_pages.pdf`);
  };

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          acceptedMimeTypes={['application/pdf']}
          title="Extract Selected PDF Pages"
          subtitle="Pick individual pages or type ranges to extract into a fresh, standalone vector PDF"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Page Selection Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-xs">
                    {file.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {totalPages} pages
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Choose Another</span>
                  </button>
                </div>
              </div>

              {/* Selection action strip */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={handleInvert}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Invert
                  </button>
                </div>

                <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedIndices.size} of {totalPages} pages selected
                </div>
              </div>

              {isLoadingPdf ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs">Loading page thumbnails...</p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {pagePreviews.map((page, index) => {
                    const isSelected = selectedIndices.has(index);

                    return (
                      <div
                        key={page.pageNumber}
                        onClick={() => togglePage(index)}
                        className={`relative group rounded-xl p-2.5 border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 opacity-70 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        {/* Checkbox badge */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900/60 text-white'
                            }`}
                          >
                            {isSelected ? '✓' : page.pageNumber}
                          </div>
                        </div>

                        <div className="aspect-3/4 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center p-1">
                          <img
                            src={page.thumbnailUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="mt-1.5 text-center text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                          Page {page.pageNumber}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Range text & Extract action */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Extraction Settings
              </h3>

              {/* Range input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Selection Input
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => handleRangeInputChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="e.g. 1-3, 5, 8"
                />
                <p className="text-[11px] text-slate-400">
                  Click any thumbnail on the left or type comma-separated ranges.
                </p>
              </div>

              {/* Summary card */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Original Document:</span>
                  <span className="font-mono">{totalPages} pages</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Pages to Extract:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {selectedIndices.size} pages
                  </span>
                </div>
              </div>

              {/* Extract action */}
              {!resultBlob ? (
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={isProcessing || selectedIndices.size === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting {selectedIndices.size} Pages...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>Extract {selectedIndices.size} {selectedIndices.size === 1 ? 'Page' : 'Pages'}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Extracted PDF ({formatBytes(resultBlob.size)})</span>
                  </button>

                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Extracted {selectedIndices.size} pages</span>
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
