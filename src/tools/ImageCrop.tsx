import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  Download,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Maximize,
  Ratio,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { loadImageFromFile, cropImage, checkImageTransparency } from '../utils/imageUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt, getFileExtension } from '../utils/fileUtils';

type AspectPreset = 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16';

export const ImageCrop: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAlpha, setHasAlpha] = useState<boolean>(false);

  // Original image dimensions
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  // Interactive crop box in natural image coordinates
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(0);
  const [cropH, setCropH] = useState<number>(0);

  // Aspect preset
  const [preset, setPreset] = useState<AspectPreset>('free');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

  // Interactive dragging states
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragAction, setDragAction] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; cropX: number; cropY: number; cropW: number; cropH: number } | null>(null);

  // Result state
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
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);

      const alpha = checkImageTransparency(img);
      setHasAlpha(alpha);

      // Default format
      if (selectedFile.type === 'image/jpeg' || selectedFile.type === 'image/jpg') {
        setOutputFormat('jpeg');
      } else if (selectedFile.type === 'image/webp') {
        setOutputFormat('webp');
      } else {
        setOutputFormat('png');
      }

      // Initialize crop to 80% centered
      const initialW = Math.round(img.naturalWidth * 0.8);
      const initialH = Math.round(img.naturalHeight * 0.8);
      const initialX = Math.round((img.naturalWidth - initialW) / 2);
      const initialY = Math.round((img.naturalHeight - initialH) / 2);

      setCropX(initialX);
      setCropY(initialY);
      setCropW(initialW);
      setCropH(initialH);
      setPreset('free');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load image';
      setErrorMessage(msg);
    }
  };

  const applyAspectPreset = (newPreset: AspectPreset) => {
    setPreset(newPreset);
    setResult(null);

    if (newPreset === 'free' || naturalWidth === 0 || naturalHeight === 0) return;

    let ratio = 1;
    switch (newPreset) {
      case '1:1':
        ratio = 1;
        break;
      case '16:9':
        ratio = 16 / 9;
        break;
      case '4:3':
        ratio = 4 / 3;
        break;
      case '3:2':
        ratio = 3 / 2;
        break;
      case '9:16':
        ratio = 9 / 16;
        break;
    }

    let targetW = cropW;
    let targetH = Math.round(targetW / ratio);

    if (targetH > naturalHeight) {
      targetH = Math.round(naturalHeight * 0.8);
      targetW = Math.round(targetH * ratio);
    }

    if (targetW > naturalWidth) {
      targetW = Math.round(naturalWidth * 0.8);
      targetH = Math.round(targetW / ratio);
    }

    // Keep centered
    const newX = Math.max(0, Math.min(naturalWidth - targetW, Math.round((naturalWidth - targetW) / 2)));
    const newY = Math.max(0, Math.min(naturalHeight - targetH, Math.round((naturalHeight - targetH) / 2)));

    setCropX(newX);
    setCropY(newY);
    setCropW(targetW);
    setCropH(targetH);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setImgElement(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, []);

  // Mouse interaction for crop box
  const handleMouseDown = (e: React.MouseEvent, action: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragAction(action);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      cropX,
      cropY,
      cropW,
      cropH,
    });
    setResult(null);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStart || !containerRef.current || naturalWidth === 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scale = naturalWidth / rect.width;

      const deltaX = (e.clientX - dragStart.x) * scale;
      const deltaY = (e.clientY - dragStart.y) * scale;

      if (dragAction === 'move') {
        const nextX = Math.max(0, Math.min(naturalWidth - dragStart.cropW, Math.round(dragStart.cropX + deltaX)));
        const nextY = Math.max(0, Math.min(naturalHeight - dragStart.cropH, Math.round(dragStart.cropY + deltaY)));
        setCropX(nextX);
        setCropY(nextY);
      } else if (dragAction === 'se') {
        let nextW = Math.max(50, Math.min(naturalWidth - dragStart.cropX, Math.round(dragStart.cropW + deltaX)));
        let nextH = Math.max(50, Math.min(naturalHeight - dragStart.cropY, Math.round(dragStart.cropH + deltaY)));

        if (preset !== 'free') {
          const ratioMap: Record<string, number> = {
            '1:1': 1,
            '16:9': 16 / 9,
            '4:3': 4 / 3,
            '3:2': 3 / 2,
            '9:16': 9 / 16,
          };
          const r = ratioMap[preset] || 1;
          nextH = Math.round(nextW / r);
          if (dragStart.cropY + nextH > naturalHeight) {
            nextH = naturalHeight - dragStart.cropY;
            nextW = Math.round(nextH * r);
          }
        }
        setCropW(nextW);
        setCropH(nextH);
      } else if (dragAction === 'sw') {
        let nextW = Math.max(50, Math.min(dragStart.cropX + dragStart.cropW, Math.round(dragStart.cropW - deltaX)));
        let nextH = Math.max(50, Math.min(naturalHeight - dragStart.cropY, Math.round(dragStart.cropH + deltaY)));
        const nextX = Math.max(0, Math.round(dragStart.cropX + dragStart.cropW - nextW));

        setCropX(nextX);
        setCropW(nextW);
        setCropH(nextH);
      } else if (dragAction === 'ne') {
        let nextW = Math.max(50, Math.min(naturalWidth - dragStart.cropX, Math.round(dragStart.cropW + deltaX)));
        let nextH = Math.max(50, Math.min(dragStart.cropY + dragStart.cropH, Math.round(dragStart.cropH - deltaY)));
        const nextY = Math.max(0, Math.round(dragStart.cropY + dragStart.cropH - nextH));

        setCropY(nextY);
        setCropW(nextW);
        setCropH(nextH);
      } else if (dragAction === 'nw') {
        let nextW = Math.max(50, Math.min(dragStart.cropX + dragStart.cropW, Math.round(dragStart.cropW - deltaX)));
        let nextH = Math.max(50, Math.min(dragStart.cropY + dragStart.cropH, Math.round(dragStart.cropH - deltaY)));
        const nextX = Math.max(0, Math.round(dragStart.cropX + dragStart.cropW - nextW));
        const nextY = Math.max(0, Math.round(dragStart.cropY + dragStart.cropH - nextH));

        setCropX(nextX);
        setCropY(nextY);
        setCropW(nextW);
        setCropH(nextH);
      }
    },
    [isDragging, dragStart, dragAction, naturalWidth, naturalHeight, preset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragAction(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleApplyCrop = async () => {
    if (!imgElement || !file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const mime = outputFormat === 'jpeg' ? 'image/jpeg' : outputFormat === 'webp' ? 'image/webp' : 'image/png';
      const croppedBlob = await cropImage(
        imgElement,
        cropX,
        cropY,
        cropW,
        cropH,
        mime,
        0.95
      );

      const url = URL.createObjectURL(croppedBlob);
      setResult({
        blob: croppedBlob,
        url,
        size: croppedBlob.size,
      });

      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {
        // Confetti optional
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to crop image';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = getFileNameWithoutExt(file.name);
    const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat === 'webp' ? 'webp' : 'png';
    downloadBlob(result.blob, `${baseName}_cropped_${cropW}x${cropH}.${ext}`);
  };

  // Coordinates percentages for overlay
  const leftPct = naturalWidth > 0 ? (cropX / naturalWidth) * 100 : 0;
  const topPct = naturalHeight > 0 ? (cropY / naturalHeight) * 100 : 0;
  const widthPct = naturalWidth > 0 ? (cropW / naturalWidth) * 100 : 100;
  const heightPct = naturalHeight > 0 ? (cropH / naturalHeight) * 100 : 100;

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Interactive Image Crop Tool"
          subtitle="Adjust crop area freely or choose aspect ratio presets (1:1 Square, 16:9, 4:3)"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Interactive Canvas Crop View */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Crop className="w-5 h-5 text-indigo-600" />
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

              {/* Crop Box Container */}
              <div className="mt-4 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-2 min-h-[380px] flex items-center justify-center select-none overflow-hidden">
                <div
                  ref={containerRef}
                  className="relative max-w-full max-h-[500px] inline-block shadow-md"
                >
                  <img
                    src={previewUrl || ''}
                    alt="Original"
                    className="max-h-[480px] max-w-full block object-contain pointer-events-none"
                  />

                  {/* Darkened overlay outside crop */}
                  <div
                    className="absolute inset-0 bg-black/60 pointer-events-none"
                    style={{
                      clipPath: `polygon(
                        0% 0%, 0% 100%, 
                        ${leftPct}% 100%, 
                        ${leftPct}% ${topPct}%, 
                        ${leftPct + widthPct}% ${topPct}%, 
                        ${leftPct + widthPct}% ${topPct + heightPct}%, 
                        ${leftPct}% ${topPct + heightPct}%, 
                        ${leftPct}% 100%, 
                        100% 100%, 100% 0%
                      )`,
                    }}
                  />

                  {/* Active Bounding Crop Box */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                    className="absolute border-2 border-white cursor-move shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                  >
                    {/* Rule of thirds grid lines */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>

                    {/* Dimensions Pill at center of crop box */}
                    <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none">
                      {cropW} × {cropH} px
                    </div>

                    {/* Corner resize handles */}
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'nw')}
                      className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-nw-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'ne')}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-ne-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-sw-resize shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Live Info Bar */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Original Resolution</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {naturalWidth} × {naturalHeight} px
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Cropped Resolution</div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {cropW} × {cropH} px
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Aspect Ratio</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {(cropW / (cropH || 1)).toFixed(2)}:1 ({preset})
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Original File Size</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatBytes(file.size)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Crop Controls & Aspect Presets */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Crop Settings
              </h3>

              {/* Aspect Ratio Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Aspect Ratio</span>
                  <Ratio className="w-3.5 h-3.5 text-slate-400" />
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'free' as AspectPreset, label: 'Free' },
                    { id: '1:1' as AspectPreset, label: '1:1 Square' },
                    { id: '16:9' as AspectPreset, label: '16:9 Widescreen' },
                    { id: '4:3' as AspectPreset, label: '4:3 Standard' },
                    { id: '3:2' as AspectPreset, label: '3:2 Photo' },
                    { id: '9:16' as AspectPreset, label: '9:16 Story' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyAspectPreset(p.id)}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        preset === p.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Dimension Inputs */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Crop Dimensions (px)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Width</label>
                    <input
                      type="number"
                      min="20"
                      max={naturalWidth}
                      value={cropW}
                      onChange={(e) => {
                        const val = Math.max(20, Math.min(naturalWidth, parseInt(e.target.value, 10) || 20));
                        setCropW(val);
                        setPreset('free');
                        setResult(null);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Height</label>
                    <input
                      type="number"
                      min="20"
                      max={naturalHeight}
                      value={cropH}
                      onChange={(e) => {
                        const val = Math.max(20, Math.min(naturalHeight, parseInt(e.target.value, 10) || 20));
                        setCropH(val);
                        setPreset('free');
                        setResult(null);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Output Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        setOutputFormat(fmt);
                        setResult(null);
                      }}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer uppercase ${
                        outputFormat === fmt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {!result ? (
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cropping...</span>
                    </>
                  ) : (
                    <>
                      <Crop className="w-4 h-4" />
                      <span>Apply Crop ({cropW}×{cropH})</span>
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
                    <span>Download Cropped Image</span>
                  </button>
                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cropped ({formatBytes(result.size)})</span>
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
