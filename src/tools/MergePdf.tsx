import React, { useState } from 'react';
import {
  FileArchive,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  Layers,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { mergePdfDocuments } from '../utils/pdfUtils';
import { loadPdfDocument } from '../utils/pdfRenderUtils';
import { formatBytes, downloadBlob } from '../utils/fileUtils';

interface MergeItem {
  id: string;
  file: File;
  buffer: ArrayBuffer;
  pageCount: number;
}

export const MergePdf: React.FC = () => {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [outputFilename, setOutputFilename] = useState<string>('Vexora-merged');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mergedBlob, setMergedBlob] = useState<{ blob: Blob; size: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    setMergedBlob(null);

    const loaded: MergeItem[] = [];

    for (const file of newFiles) {
      try {
        const buffer = await file.arrayBuffer();
        const doc = await loadPdfDocument(buffer);
        loaded.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          buffer,
          pageCount: doc.numPages,
        });
      } catch (err) {
        console.error('Failed to load PDF for merging', err);
      }
    }

    if (loaded.length > 0) {
      setItems((prev) => [...prev, ...loaded]);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setItems(copy);
    setMergedBlob(null);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setMergedBlob(null);
  };

  const handleClearAll = () => {
    setItems([]);
    setMergedBlob(null);
    setErrorMessage(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMessage('Please select at least 2 PDF documents to merge');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const buffers = items.map((i) => i.buffer);
      const resultBlob = await mergePdfDocuments(buffers);

      setMergedBlob({
        blob: resultBlob,
        size: resultBlob.size,
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
      const msg = err instanceof Error ? err.message : 'Failed to merge PDF files';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    const name = outputFilename.trim() || 'Vexora-merged';
    downloadBlob(mergedBlob.blob, `${name}.pdf`);
  };

  const totalPages = items.reduce((acc, i) => acc + i.pageCount, 0);
  const totalOriginalBytes = items.reduce((acc, i) => acc + i.file.size, 0);

  return (
    <div className="space-y-8">
      {items.length === 0 && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={true}
          maxFiles={25}
          acceptedMimeTypes={['application/pdf']}
          title="Merge Multiple PDF Files"
          subtitle="Combine two or more PDF documents into one seamless file with vector preservation"
        />
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: PDF File List & Ordering */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                    PDF Documents to Merge ({items.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More PDFs</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                        if (e.target) e.target.value = '';
                      }}
                    />
                  </label>

                  <button
                    onClick={handleClearAll}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white truncate max-w-sm sm:max-w-md">
                          {item.file.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3 mt-0.5">
                          <span>{item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}</span>
                          <span>·</span>
                          <span>{formatBytes(item.file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0 || isProcessing}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === items.length - 1 || isProcessing}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Aggregate Summary */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[11px] block">Documents</span>
                  <span className="font-mono font-bold text-[#1E1B4B] dark:text-white">{items.length} files</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Combined Pages</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {totalPages} pages
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Raw Input Size</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatBytes(totalOriginalBytes)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Output Options & Merge Button */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Merge Settings
              </h3>

              {/* Filename setting */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Output Filename
                </label>
                <div className="flex rounded-lg shadow-xs">
                  <input
                    type="text"
                    value={outputFilename}
                    onChange={(e) => setOutputFilename(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 text-xs rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    placeholder="Vexora-merged"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 text-slate-500 text-xs font-mono">
                    .pdf
                  </span>
                </div>
              </div>

              {/* Vector notice */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                  Lossless Vector Merging
                </div>
                <p className="text-[11px] leading-relaxed">
                  Documents are merged natively without rasterizing text or vector lines. High-resolution print quality and searchability remain 100% intact.
                </p>
              </div>

              {/* Merge Action */}
              {!mergedBlob ? (
                <button
                  type="button"
                  onClick={handleMerge}
                  disabled={isProcessing || items.length < 2}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Merging {items.length} Documents...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Merge {items.length} PDF Files</span>
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
                    <span>Download Merged PDF ({formatBytes(mergedBlob.size)})</span>
                  </button>

                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Merged {items.length} files ({totalPages} pages)</span>
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
