import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import { loadImageFromFile, rotateAndFlipImage, checkImageTransparency, calculateAspectRatioText } from '../utils/imageUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt, getFileExtension } from '../utils/fileUtils';

export const ImageRotator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAlpha, setHasAlpha] = useState<boolean>(false);

  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

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
      setRotationAngle(0);
      setFlipH(false);
      setFlipV(false);
      setHasAlpha(checkImageTransparency(img));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load image';
      setErrorMessage(msg);
    }
  };

  const handleRotate = (degrees: number) => {
    setRotationAngle((prev) => (prev + degrees + 360) % 360);
    setResult(null);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setImgElement(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setRotationAngle(0);
    setFlipH(false);
    setFlipV(false);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, []);

  const handleApplyTransform = async () => {
    if (!imgElement || !file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const mime = file.type || 'image/png';
      const transformedBlob = await rotateAndFlipImage(
        imgElement,
        rotationAngle,
        flipH,
        flipV,
        mime,
        0.95
      );

      const url = URL.createObjectURL(transformedBlob);
      setResult({
        blob: transformedBlob,
        url,
        size: transformedBlob.size,
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
      const msg = err instanceof Error ? err.message : 'Failed to process rotation';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = getFileNameWithoutExt(file.name);
    const ext = getFileExtension(file.name) || 'png';
    const tag = `_rot${rotationAngle}${flipH ? '_fliph' : ''}${flipV ? '_flipv' : ''}`;
    downloadBlob(result.blob, `${baseName}${tag}.${ext}`);
  };

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Rotate and Flip Images"
          subtitle="Turn photos 90°, 180°, or custom angles and mirror horizontally or vertically"
        />
      )}

      {file && imgElement && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Live Preview Canvas & Technical Metadata */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-xs">
                    {file.name}
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

              {/* Visual preview box with CSS transform for instantaneous feedback */}
              <div className="mt-4 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 min-h-[360px] flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl || ''}
                  alt="Rotation preview"
                  className="max-h-[360px] max-w-full object-contain rounded-lg transition-transform duration-200"
                  style={{
                    transform: `rotate(${rotationAngle}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  }}
                />
              </div>

              {/* Technical Metadata Bar */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Current Angle</div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {rotationAngle}°
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Dimensions</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {imgElement.naturalWidth} × {imgElement.naturalHeight} px
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">Aspect Ratio</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {calculateAspectRatioText(imgElement.naturalWidth, imgElement.naturalHeight)}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[11px] text-slate-400">File Size</div>
                  <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatBytes(file.size)}
                  </div>
                </div>
              </div>

              {/* Format & Alpha notice */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Color Depth: {hasAlpha ? '32-bit RGBA (Alpha channel)' : '24-bit RGB'}</span>
                <span>Flips: {flipH ? 'H' : ''}{flipV ? 'V' : ''}{!flipH && !flipV ? 'None' : ''}</span>
              </div>
            </div>
          </div>

          {/* Right Col: Rotation Controls */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Rotation & Mirror Tools
              </h3>

              {/* Quick Rotation Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rotate 90°
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotate(-90)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>90° Left</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRotate(90)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>90° Right</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        setRotationAngle(deg);
                        setResult(null);
                      }}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        rotationAngle === deg
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {deg === 0 ? '0° (Reset)' : `${deg}°`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flip Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Flip & Mirror
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlipH(!flipH);
                      setResult(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      flipH
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Flip Horizontal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFlipV(!flipV);
                      setResult(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      flipV
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span>Flip Vertical</span>
                  </button>
                </div>
              </div>

              {/* Custom Degree Angle Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Fine Angle Control
                  </span>
                  <span className="font-mono text-slate-500">{rotationAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={rotationAngle}
                  onChange={(e) => {
                    setRotationAngle(parseInt(e.target.value, 10));
                    setResult(null);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              {!result ? (
                <button
                  type="button"
                  onClick={handleApplyTransform}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Rotation...</span>
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4" />
                      <span>Apply & Prepare Download</span>
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
                    <span>Download Rotated Image</span>
                  </button>
                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready ({formatBytes(result.size)})</span>
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
