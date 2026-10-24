import React, { useState } from 'react';
import {
  Layers,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileArchive,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { loadImageFromFile, compressImageToTarget, resizeImage } from '../utils/imageUtils';
import { formatBytes, downloadBlob, downloadZip, getFileNameWithoutExt } from '../utils/fileUtils';

interface BatchCompressItem {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedBlob?: Blob;
  compressedSize?: number;
  savingsPercentage?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

export const BatchCompressor: React.FC = () => {
  const [items, setItems] = useState<BatchCompressItem[]>([]);
  const [mode, setMode] = useState<'target' | 'quality'>('quality');
  const [targetKb, setTargetKb] = useState<number>(200);
  const [qualityPct, setQualityPct] = useState<number>(75);
  const [formatMode, setFormatMode] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressCount, setProgressCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    const newItems: BatchCompressItem[] = [];

    for (const file of newFiles) {
      try {
        const { objectUrl } = await loadImageFromFile(file);
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: objectUrl,
          originalSize: file.size,
          status: 'pending',
        });
      } catch (err) {
        console.error('Failed to load file', err);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleClearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setErrorMessage(null);
  };

  const handleStartBatchCompression = async () => {
    if (items.length === 0) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressCount(0);

      const updated = [...items];

      for (let i = 0; i < updated.length; i++) {
        const item = updated[i];
        item.status = 'processing';
        setItems([...updated]);
        setProgressCount(i + 1);

        try {
          const { img } = await loadImageFromFile(item.file);
          let finalBlob: Blob;

          if (mode === 'target') {
            const targetBytes = Math.max(1024, targetKb * 1024);
            const res = await compressImageToTarget(
              img,
              item.originalSize,
              targetBytes,
              formatMode,
              undefined,
              true
            );
            finalBlob = res.blob;
          } else {
            const q = qualityPct / 100;
            finalBlob = await resizeImage(
              img,
              img.naturalWidth,
              img.naturalHeight,
              formatMode,
              q
            );
          }

          item.compressedBlob = finalBlob;
          item.compressedSize = finalBlob.size;
          const savings = item.originalSize > 0 ? ((item.originalSize - finalBlob.size) / item.originalSize) * 100 : 0;
          item.savingsPercentage = Math.max(0, Math.round(savings * 10) / 10);
          item.status = 'done';
        } catch (err: unknown) {
          item.status = 'error';
          item.error = err instanceof Error ? err.message : 'Compression failed';
        }

        setItems([...updated]);
      }

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {
        // Confetti optional
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Batch processing error';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (item: BatchCompressItem) => {
    if (!item.compressedBlob) return;
    const baseName = getFileNameWithoutExt(item.file.name);
    const ext = formatMode === 'image/webp' ? 'webp' : 'jpg';
    downloadBlob(item.compressedBlob, `${baseName}_compressed.${ext}`);
  };

  const handleDownloadZip = async () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.compressedBlob);
    if (doneItems.length === 0) return;

    const ext = formatMode === 'image/webp' ? 'webp' : 'jpg';
    const filesToZip = doneItems.map((item) => ({
      name: `${getFileNameWithoutExt(item.file.name)}_compressed.${ext}`,
      blob: item.compressedBlob!,
    }));

    await downloadZip(filesToZip, 'Vexora-compressed-images.zip');
  };

  const completedCount = items.filter((i) => i.status === 'done').length;
  const totalOriginalBytes = items.reduce((acc, i) => acc + i.originalSize, 0);
  const totalCompressedBytes = items.reduce((acc, i) => acc + (i.compressedSize || i.originalSize), 0);
  const totalSavings = totalOriginalBytes > 0 ? Math.round(((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100) : 0;

  return (
    <div className="space-y-8">
      {items.length === 0 && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={true}
          maxFiles={30}
          title="Bulk Image Compressor"
          subtitle="Select up to 30 JPG, PNG, and WebP images to compress in batch with ZIP export"
        />
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Batch File List with Before/After Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                    Selected Files ({items.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                    <input
                      type="file"
                      accept="image/*"
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
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Progress bar during batch execution */}
              {isProcessing && (
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-medium text-indigo-800 dark:text-indigo-200">
                    <span>Compressing image {progressCount} of {items.length}...</span>
                    <span className="font-mono">{Math.round((progressCount / items.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-200"
                      style={{ width: `${(progressCount / items.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Files Table / List */}
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-[#1E1B4B] dark:text-white truncate max-w-xs">
                          {item.file.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {formatBytes(item.originalSize)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Status indicator and after size */}
                      {item.status === 'pending' && (
                        <span className="text-slate-400 text-[11px]">Ready</span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-indigo-600 flex items-center gap-1 text-[11px] font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Compressing</span>
                        </span>
                      )}
                      {item.status === 'done' && (
                        <div className="text-right">
                          <div className="font-mono font-bold text-teal-600 dark:text-teal-400">
                            {formatBytes(item.compressedSize!)}
                          </div>
                          <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                            -{item.savingsPercentage}%
                          </div>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <span className="text-red-600 text-[11px] font-medium">Failed</span>
                      )}

                      {/* Download or Remove button */}
                      {item.status === 'done' ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(item)}
                          className="p-1.5 text-slate-600 hover:text-teal-600 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Download compressed image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isProcessing}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Aggregate Summary */}
              {completedCount > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Before</span>
                    <span className="font-mono font-medium">{formatBytes(totalOriginalBytes)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total After</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {formatBytes(totalCompressedBytes)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Overall Savings</span>
                    <span className="font-mono font-medium text-teal-600 dark:text-teal-400">
                      {totalSavings}% saved
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Batch Compression Settings & Action */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Bulk Compression Settings
              </h3>

              {/* Mode Switcher: Quality % vs Target Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Compression Mode
                </label>
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMode('quality')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                      mode === 'quality'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Quality Preset (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('target')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                      mode === 'target'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Target KB Cap
                  </button>
                </div>
              </div>

              {/* Setting Inputs based on mode */}
              {mode === 'quality' ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Quality Level
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                      {qualityPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="95"
                    step="5"
                    value={qualityPct}
                    onChange={(e) => setQualityPct(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {[
                      { l: 'Max Savings', q: 50 },
                      { l: 'Balanced', q: 75 },
                      { l: 'High Quality', q: 85 },
                    ].map((btn) => (
                      <button
                        key={btn.q}
                        type="button"
                        onClick={() => setQualityPct(btn.q)}
                        className={`py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                          qualityPct === btn.q
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 ring-1 ring-indigo-600 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Target Max Size
                    </span>
                    <span className="font-mono text-slate-500 font-bold">{targetKb} KB</span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={targetKb}
                    onChange={(e) => setTargetKb(Math.max(10, parseInt(e.target.value, 10) || 10))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <div className="flex gap-1 pt-1">
                    {[100, 200, 500, 1000].map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setTargetKb(kb)}
                        className="flex-1 py-1 text-[10px] rounded border border-slate-200 dark:border-slate-700 hover:border-indigo-600 text-slate-500 hover:text-indigo-600"
                      >
                        {kb} KB
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormatMode('image/jpeg')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      formatMode === 'image/jpeg'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    JPEG (.jpg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatMode('image/webp')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      formatMode === 'image/webp'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    WebP (.webp)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleStartBatchCompression}
                disabled={isProcessing || items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing {items.length} Files...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Compress {items.length} Files</span>
                  </>
                )}
              </button>

              {/* ZIP Download Button when items done */}
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>Download All as ZIP ({completedCount} files)</span>
                </button>
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
