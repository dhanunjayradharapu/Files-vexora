import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  RotateCcw,
  MoveLeft,
  MoveRight,
  Copy,
  Trash2,
  CheckCircle2,
  ArrowUpDown,
  Sparkles,
  Layers,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loadPdfDocument, renderPageThumbnail } from '../utils/pdfRenderUtils';
import { reorderPdfDocumentPages, formatBytes } from '../utils/pdfUtils';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageItem {
  id: string; // unique key
  originalIndex: number; // 0-based index in the original PDF
  displayNumber: number; // original 1-based page number
  thumbnailUrl: string;
}

export const OrganizePdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [initialPages, setInitialPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const processFile = async (pdfFile: File) => {
    if (!pdfFile.name.toLowerCase().endsWith('.pdf') && pdfFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDownloadBlob(null);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setFile(pdfFile);

      const buffer = await pdfFile.arrayBuffer();
      setOriginalBuffer(buffer);

      const pdfDoc: PDFDocumentProxy = await loadPdfDocument(buffer.slice(0));
      const totalPages = pdfDoc.numPages;
      setLoadingProgress({ current: 0, total: totalPages });

      const loadedPages: PageItem[] = [];
      for (let i = 1; i <= totalPages; i++) {
        setLoadingProgress({ current: i, total: totalPages });
        const thumb = await renderPageThumbnail(pdfDoc, i, 160);
        loadedPages.push({
          id: `orig-${i}-${Math.random().toString(36).substring(2, 7)}`,
          originalIndex: i - 1,
          displayNumber: i,
          thumbnailUrl: thumb.dataUrl,
        });
      }

      setPages(loadedPages);
      setInitialPages([...loadedPages]);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not load PDF document. The file may be password protected or corrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setPages(newPages);
    setDownloadBlob(null);
  };

  const duplicatePage = (index: number) => {
    const pageToDup = pages[index];
    const newPage: PageItem = {
      ...pageToDup,
      id: `copy-${pageToDup.displayNumber}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, newPage);
    setPages(newPages);
    setDownloadBlob(null);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      setError('A document must have at least one page.');
      return;
    }
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setDownloadBlob(null);
  };

  const reverseOrder = () => {
    setPages([...pages].reverse());
    setDownloadBlob(null);
  };

  const resetOrder = () => {
    setPages([...initialPages]);
    setDownloadBlob(null);
  };

  const handleSave = async () => {
    if (!originalBuffer || pages.length === 0) return;
    try {
      setIsProcessing(true);
      setError(null);
      const indices = pages.map((p) => p.originalIndex);
      const blob = await reorderPdfDocumentPages(originalBuffer.slice(0), indices);

      setDownloadBlob(blob);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {
        // Confetti fallback
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to organize and save PDF pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAll = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setOriginalBuffer(null);
    setPages([]);
    setInitialPages([]);
    setDownloadBlob(null);
    setDownloadUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Layers className="w-3.5 h-3.5" />
          Page Organizer
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
          Organize & Reorder PDF Pages
        </h1>
        <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Drag or sort pages, duplicate slides, or remove unwanted sheets. Your vector text and graphics remain 100% crisp.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] mb-2">Select a PDF to Organize</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Rearrange, duplicate, or delete pages easily. All processed locally in your browser.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 transition-all text-sm inline-flex items-center gap-2"
          >
            Choose PDF File
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B]">Generating page thumbnails...</p>
          <p className="text-sm text-slate-500 mt-1">
            Loading page {loadingProgress.current} of {loadingProgress.total}
          </p>
        </div>
      )}

      {file && !isLoading && pages.length > 0 && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-[#1E1B4B] text-sm truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'} in final document &bull; Original: {initialPages.length}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={reverseOrder}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Reverse current page sequence"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Reverse
              </button>
              <button
                onClick={resetOrder}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Reset to original order"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Order
              </button>
              <button
                onClick={handleResetAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Choose Another File
              </button>
            </div>
          </div>

          {/* Page Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                <span>Page Order</span>
                <span className="text-xs font-normal text-slate-500">
                  (Use arrows to move pages, copy icon to duplicate, or trash to remove)
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((p, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === pages.length - 1;

                return (
                  <div
                    key={p.id}
                    className="group border border-slate-200 rounded-xl bg-slate-50/60 p-2.5 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col items-center"
                  >
                    {/* Header badge */}
                    <div className="w-full flex items-center justify-between text-xs mb-2 px-1">
                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] text-slate-400">Orig p.{p.displayNumber}</span>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-full aspect-[3/4] bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-sm">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <div className="text-xs text-slate-400">Loading...</div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="w-full flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => movePage(idx, 'left')}
                          className="p-1 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move earlier"
                        >
                          <MoveLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => movePage(idx, 'right')}
                          className="p-1 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move later"
                        >
                          <MoveRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicatePage(idx)}
                          className="p-1 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
                          title="Duplicate page"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePage(idx)}
                          className="p-1 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-600 hover:text-red-600 transition-colors"
                          title="Remove page"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Action */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Total output document will have <strong className="text-slate-700">{pages.length}</strong> pages.
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all text-sm inline-flex items-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Save & Reorganize PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Download Card */}
          {downloadBlob && downloadUrl && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Your Reorganized PDF is Ready!</h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {pages.length} pages &bull; Size: {formatBytes(downloadBlob.size)}
                  </p>
                </div>
              </div>

              <a
                href={downloadUrl}
                download={`${file.name.replace(/\.[^/.]+$/, '')}_organized.pdf`}
                className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
