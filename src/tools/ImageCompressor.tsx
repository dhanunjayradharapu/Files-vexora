import React, { useState, useEffect } from 'react';
import {
  Minimize2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import {
  loadImageFromFile,
  compressImageToTarget,
  checkImageTransparency,
  CompressionResult,
  calculateAspectRatioText,
} from '../utils/imageUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt } from '../utils/fileUtils';

export const ImageCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [hasAlpha, setHasAlpha] = useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  // Target size configuration: 'Bytes' | 'KB' | 'MB'
  const [targetUnit, setTargetUnit] = useState<'Bytes' | 'KB' | 'MB'>('KB');
  const [targetValue, setTargetValue] = useState<number>(200);
  const [allowDimensionScaling, setAllowDimensionScaling] = useState<boolean>(true);
  const [formatMode, setFormatMode] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{ result: CompressionResult; url: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setErrorMessage(null);
    setResult(null);

    try {
      const { img, objectUrl } = await loadImageFromFile(selectedFile);
      setFile(selectedFile);
      setImgElement(img);
      setPreviewUrl(objectUrl);

      // Check transparency for PNG or WebP
      const transparent = checkImageTransparency(img);
      setHasAlpha(transparent);

      // If has alpha, recommend WebP by default to preserve transparency
      if (transparent) {
        setFormatMode('image/webp');
      }

      // Default target to roughly 50% of original
      if (selectedFile.size > 2 * 1024 * 1024) {
        setTargetUnit('MB');
        setTargetValue(parseFloat((selectedFile.size / (1024 * 1024 * 2)).toFixed(1)));
      } else if (selectedFile.size > 50000) {
        setTargetUnit('KB');
        setTargetValue(Math.max(50, Math.round(selectedFile.size / 2048)));
      } else {
        setTargetUnit('Bytes');
        setTargetValue(Math.max(1024, Math.round(selectedFile.size * 0.7)));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load image';
      setErrorMessage(msg);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setImgElement(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setHasAlpha(false);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, []);

  const getTargetBytes = (): number => {
    if (targetUnit === 'Bytes') return Math.max(1, Math.round(targetValue));
    if (targetUnit === 'MB') return Math.max(1024, Math.round(targetValue * 1024 * 1024));
    return Math.max(1024, Math.round(targetValue * 1024));
  };

  const handleCompress = async (forceScaling?: boolean) => {
    if (!imgElement || !file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const targetBytes = getTargetBytes();
      const allowScaling = forceScaling !== undefined ? forceScaling : allowDimensionScaling;
      if (forceScaling !== undefined) {
        setAllowDimensionScaling(forceScaling);
      }

      const compressionRes = await compressImageToTarget(
        imgElement,
        file.size,
        targetBytes,
        formatMode,
        hasAlpha && formatMode === 'image/jpeg' ? backgroundColor : undefined,
        allowScaling
      );

      const url = URL.createObjectURL(compressionRes.blob);
      setResult({
        result: compressionRes,
        url,
      });

      if (compressionRes.targetReached) {
        try {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // Confetti optional
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compress image';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = getFileNameWithoutExt(file.name);
    const ext = formatMode === 'image/webp' ? 'webp' : 'jpg';
    downloadBlob(result.result.blob, `${baseName}_compressed_${formatBytes(result.result.actualBytes).replace(' ', '')}.${ext}`);
  };

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Target-Size Image Compressor"
          subtitle="Specify target file size in Bytes, KB, or MB with honest verification and transparency protection"
        />
      )}

      {file && imgElement && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Preview, Metrics & Metadata */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Minimize2 className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-xs">
                    {file.name}
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

              {/* Format explanation and transparency warning */}
              {hasAlpha && (
                <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Alpha Transparency Detected</p>
                    <p className="text-amber-800 dark:text-amber-300">
                      {formatMode === 'image/webp'
                        ? 'Using WebP format preserves your image transparency while achieving high compression rates.'
                        : 'JPEG does not support transparency! Transparent areas will turn into the selected solid background color. Switch to WebP to preserve transparency.'}
                    </p>
                    {formatMode === 'image/jpeg' ? (
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
                          onClick={() => setFormatMode('image/webp')}
                          className="text-[11px] font-semibold underline text-amber-900 dark:text-amber-100 hover:text-black cursor-pointer"
                        >
                          Switch to WebP (Recommended)
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Transparency preserved with WebP</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visual preview box */}
              <div className="mt-4 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 min-h-[320px] flex items-center justify-center overflow-hidden">
                <img
                  src={result?.url || previewUrl || ''}
                  alt="Compression Preview"
                  className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>

              {/* Metadata & Metric Cards */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Original Size</div>
                  <div className="font-mono font-medium text-[#1E1B4B] dark:text-slate-200">
                    {formatBytes(file.size)} ({file.size.toLocaleString()} B)
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Target Constraint</div>
                  <div className="font-mono font-medium text-[#1E1B4B] dark:text-slate-200">
                    ≤ {formatBytes(getTargetBytes())}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Actual Output Size</div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {result ? `${formatBytes(result.result.actualBytes)} (${result.result.actualBytes.toLocaleString()} B)` : '—'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Space Saved</div>
                  <div className="font-mono font-medium text-teal-600 dark:text-teal-400">
                    {result ? `${result.result.savingsPercentage}% (${formatBytes(result.result.savingsBytes)})` : '—'}
                  </div>
                </div>
              </div>

              {/* Dimensions and Aspect Ratio Strip */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
                <span>
                  Resolution: {result ? `${result.result.widthUsed}×${result.result.heightUsed} px` : `${imgElement.naturalWidth}×${imgElement.naturalHeight} px`}
                </span>
                <span>
                  Ratio: {calculateAspectRatioText(imgElement.naturalWidth, imgElement.naturalHeight)}
                </span>
                <span>Format: {formatMode === 'image/webp' ? 'WebP' : 'JPEG'}</span>
              </div>
            </div>
          </div>

          {/* Right Col: Target Size Setup & Compress Action */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Target Size Settings
              </h3>

              {/* Target Size Input with Bytes, KB, and MB options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Desired Target File Size
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Original: {formatBytes(file.size)}
                  </span>
                </div>

                <div className="flex rounded-lg shadow-xs">
                  <input
                    type="number"
                    min="1"
                    step={targetUnit === 'MB' ? '0.1' : targetUnit === 'KB' ? '5' : '100'}
                    value={targetValue}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setTargetValue(isNaN(v) ? 1 : v);
                      setResult(null);
                    }}
                    className="flex-1 min-w-0 block w-full px-3 py-2 text-xs font-mono rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <div className="inline-flex rounded-r-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
                    {(['Bytes', 'KB', 'MB'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          setTargetUnit(unit);
                          setResult(null);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                          targetUnit === unit
                            ? 'bg-white dark:bg-slate-700 text-[#1E1B4B] dark:text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target quick presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Quick:</span>
                  {[
                    { label: '50 KB', val: 50, unit: 'KB' as const },
                    { label: '200 KB', val: 200, unit: 'KB' as const },
                    { label: '500 KB', val: 500, unit: 'KB' as const },
                    { label: '1 MB', val: 1, unit: 'MB' as const },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setTargetUnit(p.unit);
                        setTargetValue(p.val);
                        setResult(null);
                      }}
                      className="px-2 py-0.5 text-[10px] font-medium rounded border border-slate-200 dark:border-slate-700 hover:border-indigo-600 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension scaling toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Allow dimension downscaling
                  </span>
                  <input
                    type="checkbox"
                    checked={allowDimensionScaling}
                    onChange={(e) => {
                      setAllowDimensionScaling(e.target.checked);
                      setResult(null);
                    }}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  If reducing encoding quality alone cannot reach your target size, Vexora will progressively reduce pixel dimensions to meet your byte limit.
                </p>
              </div>

              {/* Compression Algorithm */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormatMode('image/jpeg');
                      setResult(null);
                    }}
                    className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                      formatMode === 'image/jpeg'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-600 font-medium'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-xs">JPEG</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Universal compatibility</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormatMode('image/webp');
                      setResult(null);
                    }}
                    className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                      formatMode === 'image/webp'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-600 font-medium'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-xs">WebP</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Supports transparency</div>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              {!result ? (
                <button
                  type="button"
                  onClick={() => handleCompress()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing to Target Size...</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span>Compress Image Now</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Honest Verification Banner */}
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      result.result.targetReached
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {result.result.targetReached ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {result.result.targetReached
                          ? 'Target Size Verified & Confirmed'
                          : 'Target could not be reached at native resolution'}
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        {result.result.targetReached
                          ? `Achieved ${formatBytes(result.result.actualBytes)} (${result.result.savingsPercentage}% savings) at ${result.result.widthUsed}×${result.result.heightUsed}px.`
                          : `The image reached minimum encoding quality at ${formatBytes(result.result.actualBytes)}, but could not satisfy ≤ ${formatBytes(getTargetBytes())} without scaling dimensions.`}
                      </p>

                      {!result.result.targetReached && !allowDimensionScaling && (
                        <button
                          type="button"
                          onClick={() => handleCompress(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs cursor-pointer"
                        >
                          <span>Downscale dimensions to reach target</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Compressed Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="w-full text-center text-xs text-slate-500 hover:text-indigo-600 cursor-pointer"
                  >
                    Change target settings
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
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
