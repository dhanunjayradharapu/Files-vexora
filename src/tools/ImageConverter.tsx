import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  FileImage,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import {
  loadImageFromFile,
  resizeImage,
  checkImageTransparency,
} from '../utils/imageUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt } from '../utils/fileUtils';

type TargetFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export const ImageConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [hasAlpha, setHasAlpha] = useState<boolean>(false);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('image/png');
  const [quality, setQuality] = useState<number>(0.92);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);
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

      const transparent = checkImageTransparency(img);
      setHasAlpha(transparent);

      // Default target format: pick a different format from the input
      if (selectedFile.type === 'image/png') {
        setTargetFormat('image/webp');
      } else if (selectedFile.type === 'image/jpeg' || selectedFile.type === 'image/jpg') {
        setTargetFormat('image/png');
      } else {
        setTargetFormat('image/jpeg');
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

  const handleConvert = async () => {
    if (!imgElement || !file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const bg = hasAlpha && targetFormat === 'image/jpeg' ? backgroundColor : undefined;
      const convertedBlob = await resizeImage(
        imgElement,
        imgElement.naturalWidth,
        imgElement.naturalHeight,
        targetFormat,
        quality,
        bg
      );

      const url = URL.createObjectURL(convertedBlob);
      setResult({
        blob: convertedBlob,
        url,
        size: convertedBlob.size,
      });

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {
        // Confetti optional
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert image format';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = getFileNameWithoutExt(file.name);
    let ext = 'png';
    if (targetFormat === 'image/jpeg') ext = 'jpg';
    else if (targetFormat === 'image/webp') ext = 'webp';

    downloadBlob(result.blob, `${baseName}_converted.${ext}`);
  };

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Convert Image Format (JPEG, PNG, WebP)"
          subtitle="Change formats cleanly with transparency protection and quality tuning"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Preview & Size Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-indigo-600" />
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

              {/* Warning if converting transparent image to JPEG */}
              {hasAlpha && targetFormat === 'image/jpeg' && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Notice: Transparent Background</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      JPEG does not support transparency. Transparent areas will be rendered with the solid background color selected below.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px]">Fill Color:</span>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                        title="Pick background color"
                      />
                      <button
                        type="button"
                        onClick={() => setTargetFormat('image/png')}
                        className="text-[11px] underline text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer font-medium"
                      >
                        Keep PNG or WebP instead
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual preview box */}
              <div className="mt-4 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 min-h-[320px] flex items-center justify-center overflow-hidden">
                <img
                  src={result?.url || previewUrl || ''}
                  alt="Converted preview"
                  className="max-h-[360px] max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>

              {/* Comparison stats */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Input Format</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200 uppercase">
                    {file.type ? file.type.replace('image/', '') : 'image'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Target Format</div>
                  <div className="font-mono font-medium text-indigo-600 dark:text-indigo-400 uppercase">
                    {targetFormat.replace('image/', '')}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Original Size</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatBytes(file.size)}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Converted Size</div>
                  <div className="font-mono font-medium text-teal-600 dark:text-teal-400">
                    {result ? formatBytes(result.size) : 'Ready'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Format Options */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Conversion Options
              </h3>

              {/* Target Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Output Format
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'image/jpeg' as TargetFormat,
                      label: 'JPEG (.jpg)',
                      desc: 'Small file size, universal compatibility, no transparency',
                    },
                    {
                      id: 'image/png' as TargetFormat,
                      label: 'PNG (.png)',
                      desc: 'Lossless quality, full alpha transparency support',
                    },
                    {
                      id: 'image/webp' as TargetFormat,
                      label: 'WebP (.webp)',
                      desc: 'Modern web standard, small size with transparency',
                    },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setTargetFormat(fmt.id);
                        setResult(null);
                      }}
                      className={`w-full p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        targetFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:bg-indigo-950/50 dark:text-indigo-100 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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

              {/* Quality slider for lossy formats */}
              {targetFormat !== 'image/png' && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Encoding Quality
                    </span>
                    <span className="font-mono text-slate-500">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => {
                      setQuality(parseFloat(e.target.value));
                      setResult(null);
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Smaller Size</span>
                    <span>Higher Quality</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!result ? (
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Converting Format...</span>
                    </>
                  ) : (
                    <>
                      <FileImage className="w-4 h-4" />
                      <span>Convert to {targetFormat.replace('image/', '').toUpperCase()}</span>
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
                    <span>Download {targetFormat.replace('image/', '').toUpperCase()}</span>
                  </button>
                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conversion complete ({formatBytes(result.size)})</span>
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
