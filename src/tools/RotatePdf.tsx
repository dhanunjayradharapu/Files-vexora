import React, { useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { rotatePdfDocumentPages } from '../utils/pdfUtils';
import { loadPdfDocument, renderPageThumbnail } from '../utils/pdfRenderUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt } from '../utils/fileUtils';

interface PageRotateItem {
  pageNumber: number;
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
}

export const RotatePdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pages, setPages] = useState<PageRotateItem[]>([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

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
    setPages([]);

    try {
      const buffer = await selected.arrayBuffer();
      setPdfBuffer(buffer);

      const pdfDoc = await loadPdfDocument(buffer);
      const count = pdfDoc.numPages;
      setTotalPages(count);

      // Render thumbnails
      const items: PageRotateItem[] = [];
      const limit = Math.min(count, 50);

      for (let i = 1; i <= limit; i++) {
        const thumb = await renderPageThumbnail(pdfDoc, i, 180);
        items.push({
          pageNumber: i,
          thumbnailUrl: thumb.dataUrl,
          rotation: 0,
        });
      }
      setPages(items);
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
    setPages([]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  const rotateSingle = (pageNumber: number, delta: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber
          ? { ...p, rotation: (p.rotation + delta + 360) % 360 }
          : p
      )
    );
    setResultBlob(null);
  };

  const rotateAll = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + delta + 360) % 360,
      }))
    );
    setResultBlob(null);
  };

  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
    setResultBlob(null);
  };

  const handleSaveRotated = async () => {
    if (!pdfBuffer || !file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // Build 0-based page rotation map
      const rotationMap: Record<number, number> = {};
      pages.forEach((p) => {
        if (p.rotation !== 0) {
          rotationMap[p.pageNumber - 1] = p.rotation;
        }
      });

      const blob = await rotatePdfDocumentPages(pdfBuffer, rotationMap);
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
      const msg = err instanceof Error ? err.message : 'Failed to apply page rotations';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const base = getFileNameWithoutExt(file.name);
    downloadBlob(resultBlob.blob, `${base}_rotated.pdf`);
  };

  const changedCount = pages.filter((p) => p.rotation !== 0).length;

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          acceptedMimeTypes={['application/pdf']}
          title="Rotate PDF Pages"
          subtitle="Rotate individual pages or entire documents 90°, 180°, or 270° with permanent vector preservation"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Page Thumbnails with Rotation Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-indigo-600" />
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
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another</span>
                </button>
              </div>

              {/* Bulk rotation controls strip */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => rotateAll(90)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate All Right (+90°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => rotateAll(-90)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rotate All Left (-90°)</span>
                  </button>

                  {changedCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllRotations}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-red-600 text-xs cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  {changedCount > 0 ? (
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {changedCount} {changedCount === 1 ? 'page' : 'pages'} modified
                    </span>
                  ) : (
                    <span>Click rotate on any page</span>
                  )}
                </div>
              </div>

              {isLoadingPdf ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs">Loading page thumbnails...</p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {pages.map((p) => (
                    <div
                      key={p.pageNumber}
                      className="relative group bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col justify-between transition-all"
                    >
                      {/* Page badge and rotation badge */}
                      <div className="flex items-center justify-between pb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          #{p.pageNumber}
                        </span>
                        {p.rotation !== 0 && (
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                            {p.rotation}°
                          </span>
                        )}
                      </div>

                      {/* Thumbnail with live CSS rotation preview */}
                      <div className="aspect-3/4 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center p-1 relative">
                        <img
                          src={p.thumbnailUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-200"
                          style={{ transform: `rotate(${p.rotation}deg)` }}
                        />
                      </div>

                      {/* Interactive rotate button */}
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => rotateSingle(p.pageNumber, -90)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                          title="Rotate 90° counter-clockwise"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => rotateSingle(p.pageNumber, 90)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                          title="Rotate 90° clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Save Rotated PDF */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Rotation Summary
              </h3>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                  Lossless Page Rotation
                </div>
                <p className="text-[11px] leading-relaxed">
                  Rotations are saved directly into the PDF coordinate structure without re-rendering or losing vector sharpness.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Total Pages:</span>
                  <span className="font-mono font-medium">{totalPages}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rotated Pages:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {changedCount}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {!resultBlob ? (
                <button
                  type="button"
                  onClick={handleSaveRotated}
                  disabled={isProcessing || totalPages === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Applying Rotations...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Save Rotated PDF</span>
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
                    <span>Download Rotated PDF ({formatBytes(resultBlob.size)})</span>
                  </button>

                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rotations saved successfully</span>
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
