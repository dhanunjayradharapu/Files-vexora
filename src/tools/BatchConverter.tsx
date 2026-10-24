import React, { useState } from 'react';
import {
  Sliders,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileArchive,
  Plus,
  AlertTriangle,
  Repeat,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { loadImageFromFile, resizeImage, checkImageTransparency } from '../utils/imageUtils';
import { formatBytes, downloadBlob, downloadZip, getFileNameWithoutExt } from '../utils/fileUtils';

type TargetMime = 'image/jpeg' | 'image/png' | 'image/webp';

interface BatchConvertItem {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  hasAlpha?: boolean;
  convertedBlob?: Blob;
  convertedSize?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

export const BatchConverter: React.FC = () => {
  const [items, setItems] = useState<BatchConvertItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetMime>('image/webp');
  const [quality, setQuality] = useState<number>(0.92);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressCount, setProgressCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    const newItems: BatchConvertItem[] = [];

    for (const file of newFiles) {
      try {
        const { img, objectUrl } = await loadImageFromFile(file);
        const hasAlpha = checkImageTransparency(img);
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: objectUrl,
          originalSize: file.size,
          hasAlpha,
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

  const hasAnyAlpha = items.some((i) => i.hasAlpha);

  const handleStartBatchConversion = async () => {
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
          const bg = item.hasAlpha && targetFormat === 'image/jpeg' ? backgroundColor : undefined;
          const convertedBlob = await resizeImage(
            img,
            img.naturalWidth,
            img.naturalHeight,
            targetFormat,
            quality,
            bg
          );

          item.convertedBlob = convertedBlob;
          item.convertedSize = convertedBlob.size;
          item.status = 'done';
        } catch (err: unknown) {
          item.status = 'error';
          item.error = err instanceof Error ? err.message : 'Conversion failed';
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
      const msg = err instanceof Error ? err.message : 'Batch conversion error';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const getExtForTarget = (): string => {
    if (targetFormat === 'image/jpeg') return 'jpg';
    if (targetFormat === 'image/webp') return 'webp';
    return 'png';
  };

  const handleDownloadSingle = (item: BatchConvertItem) => {
    if (!item.convertedBlob) return;
    const baseName = getFileNameWithoutExt(item.file.name);
    downloadBlob(item.convertedBlob, `${baseName}_converted.${getExtForTarget()}`);
  };

  const handleDownloadZip = async () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.convertedBlob);
    if (doneItems.length === 0) return;

    const ext = getExtForTarget();
    const filesToZip = doneItems.map((item) => ({
      name: `${getFileNameWithoutExt(item.file.name)}.${ext}`,
      blob: item.convertedBlob!,
    }));

    await downloadZip(filesToZip, `Vexora-converted-${ext}.zip`);
  };

  const completedCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-8">
      {items.length === 0 && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={true}
          maxFiles={30}
          title="Batch Format Converter"
          subtitle="Convert up to 30 images simultaneously to JPG, PNG, or WebP with ZIP export"
        />
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: File list & Before/After stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                    Files to Convert ({items.length})
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

              {/* Transparency Warning Notice */}
              {hasAnyAlpha && targetFormat === 'image/jpeg' && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Transparency Loss Warning for JPEG</p>
                    <p className="text-amber-800 dark:text-amber-300">
                      Some uploaded files contain transparency. JPEG does not support alpha channels. Transparent pixels will be filled with the selected color below, or select WebP to preserve transparency.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px]">Fill Color:</span>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setTargetFormat('image/webp')}
                        className="text-[11px] underline font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                      >
                        Switch to WebP instead
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {isProcessing && (
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-medium text-indigo-800 dark:text-indigo-200">
                    <span>Converting image {progressCount} of {items.length}...</span>
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

              {/* Files List */}
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
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span>{formatBytes(item.originalSize)}</span>
                          {item.hasAlpha && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">· Alpha</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {item.status === 'pending' && (
                        <span className="text-slate-400 text-[11px]">Ready</span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-indigo-600 flex items-center gap-1 text-[11px] font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Converting</span>
                        </span>
                      )}
                      {item.status === 'done' && (
                        <div className="text-right">
                          <div className="font-mono font-bold text-teal-600 dark:text-teal-400">
                            {formatBytes(item.convertedSize!)}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">
                            {getExtForTarget()}
                          </div>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <span className="text-red-600 text-[11px] font-medium">Failed</span>
                      )}

                      {item.status === 'done' ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(item)}
                          className="p-1.5 text-slate-600 hover:text-teal-600 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Download converted image"
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
            </div>
          </div>

          {/* Right Col: Conversion Format & Controls */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Conversion Target
              </h3>

              {/* Target Format Options with clear explanations */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Format
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'image/webp' as TargetMime,
                      label: 'WebP (.webp)',
                      desc: 'Modern standard: small file size with alpha transparency',
                    },
                    {
                      id: 'image/jpeg' as TargetMime,
                      label: 'JPEG (.jpg)',
                      desc: 'Universal compatibility across all devices, lossy, no alpha',
                    },
                    {
                      id: 'image/png' as TargetMime,
                      label: 'PNG (.png)',
                      desc: 'Lossless quality with full alpha transparency',
                    },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setTargetFormat(fmt.id)}
                      className={`w-full p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        targetFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{fmt.label}</span>
                        {targetFormat === fmt.id && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {fmt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider for lossy formats */}
              {targetFormat !== 'image/png' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Encoding Quality
                    </span>
                    <span className="font-mono text-slate-500">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Smaller Size</span>
                    <span>Higher Quality</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleStartBatchConversion}
                disabled={isProcessing || items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Converting {items.length} Files...</span>
                  </>
                ) : (
                  <>
                    <Repeat className="w-4 h-4" />
                    <span>Convert {items.length} Files to {getExtForTarget().toUpperCase()}</span>
                  </>
                )}
              </button>

              {/* ZIP Download Button */}
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
