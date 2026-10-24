import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Lock,
  Unlock,
  Download,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ImageIcon,
  LayoutGrid,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { loadImageFromFile, resizeImage, checkImageTransparency, calculateAspectRatioText } from '../utils/imageUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt, getFileExtension } from '../utils/fileUtils';

interface DimensionPreset {
  category: 'social' | 'display';
  name: string;
  width: number;
  height: number;
  desc: string;
}

const DIMENSION_PRESETS: DimensionPreset[] = [
  // Social media presets
  { category: 'social', name: 'Instagram Square', width: 1080, height: 1080, desc: '1:1 Post' },
  { category: 'social', name: 'Instagram Story', width: 1080, height: 1920, desc: '9:16 Story / Reel' },
  { category: 'social', name: 'YouTube Thumbnail', width: 1280, height: 720, desc: '16:9 HD Thumbnail' },
  { category: 'social', name: 'Twitter / X Header', width: 1500, height: 500, desc: '3:1 Banner' },
  { category: 'social', name: 'Facebook Cover', width: 820, height: 312, desc: 'Banner' },
  // Display presets
  { category: 'display', name: '4K Ultra HD', width: 3840, height: 2160, desc: '2160p 16:9' },
  { category: 'display', name: '2K QHD', width: 2560, height: 1440, desc: '1440p 16:9' },
  { category: 'display', name: 'Full HD', width: 1920, height: 1080, desc: '1080p 16:9' },
  { category: 'display', name: '720p HD', width: 1280, height: 720, desc: '720p 16:9' },
  { category: 'display', name: 'SVGA Web', width: 800, height: 600, desc: '4:3 Standard' },
];

export const ImageResizer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [hasAlpha, setHasAlpha] = useState<boolean>(false);

  const [presetCategory, setPresetCategory] = useState<'social' | 'display'>('social');
  const [outputFormat, setOutputFormat] = useState<string>('same');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultBlob, setResultBlob] = useState<{ blob: Blob; size: number; url: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setErrorMessage(null);
    setResultBlob(null);

    try {
      const { img, objectUrl } = await loadImageFromFile(selectedFile);
      setFile(selectedFile);
      setImgElement(img);
      setPreviewUrl(objectUrl);
      setOrigWidth(img.naturalWidth);
      setOrigHeight(img.naturalHeight);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
      setAspectRatio(img.naturalWidth / img.naturalHeight);
      setHasAlpha(checkImageTransparency(img));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load image';
      setErrorMessage(msg);
    }
  };

  const handleWidthChange = (val: number) => {
    const w = Math.max(1, isNaN(val) ? 1 : val);
    setTargetWidth(w);
    if (lockAspectRatio && aspectRatio > 0) {
      setTargetHeight(Math.max(1, Math.round(w / aspectRatio)));
    }
    setResultBlob(null);
  };

  const handleHeightChange = (val: number) => {
    const h = Math.max(1, isNaN(val) ? 1 : val);
    setTargetHeight(h);
    if (lockAspectRatio && aspectRatio > 0) {
      setTargetWidth(Math.max(1, Math.round(h * aspectRatio)));
    }
    setResultBlob(null);
  };

  const applyScalePreset = (percent: number) => {
    if (origWidth === 0 || origHeight === 0) return;
    const factor = percent / 100;
    const newW = Math.max(1, Math.round(origWidth * factor));
    const newH = Math.max(1, Math.round(origHeight * factor));
    setTargetWidth(newW);
    setTargetHeight(newH);
    setResultBlob(null);
  };

  const applyDimensionPreset = (p: DimensionPreset) => {
    setLockAspectRatio(false);
    setTargetWidth(p.width);
    setTargetHeight(p.height);
    setResultBlob(null);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultBlob?.url) URL.revokeObjectURL(resultBlob.url);
    setFile(null);
    setImgElement(null);
    setPreviewUrl(null);
    setResultBlob(null);
    setErrorMessage(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultBlob?.url) URL.revokeObjectURL(resultBlob.url);
    };
  }, []);

  const handleResize = async () => {
    if (!imgElement || !file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      let mime = file.type || 'image/jpeg';
      if (outputFormat === 'jpeg') mime = 'image/jpeg';
      else if (outputFormat === 'png') mime = 'image/png';
      else if (outputFormat === 'webp') mime = 'image/webp';

      const blob = await resizeImage(imgElement, targetWidth, targetHeight, mime, 0.95);
      const url = URL.createObjectURL(blob);

      setResultBlob({
        blob,
        size: blob.size,
        url,
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
      const msg = err instanceof Error ? err.message : 'Failed to resize image';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const baseName = getFileNameWithoutExt(file.name);
    let ext = getFileExtension(file.name) || 'jpg';

    if (outputFormat === 'jpeg') ext = 'jpg';
    else if (outputFormat === 'png') ext = 'png';
    else if (outputFormat === 'webp') ext = 'webp';

    const filename = `${baseName}_${targetWidth}x${targetHeight}.${ext}`;
    downloadBlob(resultBlob.blob, filename);
  };

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Resize Image by Presets or Exact Pixels"
          subtitle="Choose from Instagram, YouTube, 4K, HD presets or enter custom dimensions"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Visual Canvas Preview & Technical Metadata */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
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

              {/* Image Preview Box */}
              <div className="mt-4 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 min-h-[320px] flex items-center justify-center overflow-hidden">
                <img
                  src={resultBlob?.url || previewUrl || ''}
                  alt="Preview"
                  className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>

              {/* Technical Metadata Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Original Dimensions</div>
                  <div className="font-mono font-medium text-[#1E1B4B] dark:text-slate-200">
                    {origWidth} × {origHeight} px
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Target Dimensions</div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {targetWidth} × {targetHeight} px
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Aspect Ratio</div>
                  <div className="font-mono font-medium text-[#1E1B4B] dark:text-slate-200">
                    {calculateAspectRatioText(targetWidth, targetHeight)}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">File Size</div>
                  <div className="font-mono font-medium text-[#1E1B4B] dark:text-slate-200">
                    {resultBlob ? formatBytes(resultBlob.size) : formatBytes(file.size)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Presets & Controls */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Dimension Presets</span>
                <LayoutGrid className="w-4 h-4 text-slate-400" />
              </h3>

              {/* Preset Category Switcher */}
              <div className="space-y-2">
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPresetCategory('social')}
                    className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                      presetCategory === 'social'
                        ? 'bg-white dark:bg-slate-700 text-[#1E1B4B] dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Social Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetCategory('display')}
                    className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                      presetCategory === 'display'
                        ? 'bg-white dark:bg-slate-700 text-[#1E1B4B] dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    HD & 4K Displays
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {DIMENSION_PRESETS.filter((p) => p.category === presetCategory).map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyDimensionPreset(preset)}
                      className={`w-full p-2 text-left rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        targetWidth === preset.width && targetHeight === preset.height
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 font-medium'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{preset.name}</div>
                        <div className="text-[10px] text-slate-400">{preset.desc}</div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Percentage Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Scale By Percentage
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[25, 50, 75, 200].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyScalePreset(pct)}
                      className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Pixel Dimensions Input */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Custom Dimensions (px)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      lockAspectRatio
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}
                    title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                  >
                    {lockAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{lockAspectRatio ? 'Ratio Locked' : 'Free Ratio'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Width (px)</label>
                    <input
                      type="number"
                      min="1"
                      max="15000"
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Height (px)</label>
                    <input
                      type="number"
                      min="1"
                      max="15000"
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Export Format
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'same', label: 'Original' },
                    { id: 'jpeg', label: 'JPG' },
                    { id: 'png', label: 'PNG' },
                    { id: 'webp', label: 'WebP' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setOutputFormat(fmt.id);
                        setResultBlob(null);
                      }}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        outputFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {!resultBlob ? (
                <button
                  type="button"
                  onClick={handleResize}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resizing Image...</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span>Resize Image ({targetWidth}×{targetHeight})</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resized Image</span>
                  </button>
                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resized to {targetWidth}×{targetHeight} px ({formatBytes(resultBlob.size)})</span>
                  </p>
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
