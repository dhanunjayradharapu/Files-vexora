import React, { useState, useEffect } from 'react';
import {
  FileImage,
  RotateCcw,
  Maximize2,
  Minimize2,
  Crop,
  Repeat,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { extractDetailedMetadata, DetailedImageMetadata } from '../utils/imageUtils';
import { formatBytes } from '../utils/fileUtils';

interface ImageMetadataProps {
  onSelectTool?: (toolId: string) => void;
}

export const ImageMetadata: React.FC<ImageMetadataProps> = ({ onSelectTool }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<DetailedImageMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setErrorMessage(null);

    try {
      const { metadata, objectUrl } = await extractDetailedMetadata(selected);
      setFile(selected);
      setPreviewUrl(objectUrl);
      setMeta(metadata);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to inspect image';
      setErrorMessage(msg);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setErrorMessage(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Image Inspector & Technical Metadata"
          subtitle="Inspect dimensions, resolution, color depth, alpha transparency, and exact file size"
        />
      )}

      {file && meta && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Preview & Full Technical Specs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-xs">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Inspect Another</span>
                </button>
              </div>

              {/* Visual preview box */}
              <div className="mt-4 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 min-h-[300px] flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl || ''}
                  alt={file.name}
                  className="max-h-[360px] max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>

              {/* Comprehensive Technical Metadata Cards */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400">Dimensions</span>
                  <div className="font-mono font-bold text-[#1E1B4B] dark:text-white text-sm">
                    {meta.width} × {meta.height} px
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {meta.megapixels} Megapixels
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400">Aspect Ratio</span>
                  <div className="font-mono font-bold text-[#1E1B4B] dark:text-white text-sm">
                    {meta.aspectRatioText}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {meta.orientation} orientation
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400">Exact File Size</span>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {formatBytes(meta.size)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {meta.size.toLocaleString()} bytes
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400">Color Architecture</span>
                  <div className="font-mono font-bold text-[#1E1B4B] dark:text-white text-sm">
                    {meta.colorDepth}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {meta.hasAlpha ? 'Alpha channel active' : 'Opaque background'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400">Format & MIME</span>
                  <div className="font-mono font-bold text-[#1E1B4B] dark:text-white text-sm uppercase">
                    {meta.type.replace('image/', '')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {meta.type}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400">Alpha Transparency</span>
                  <div className={`font-mono font-bold text-sm ${meta.hasAlpha ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {meta.hasAlpha ? 'Present' : 'None'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {meta.hasAlpha ? 'Preserve with WebP/PNG' : 'Standard color channels'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Quick Tool Workflows */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Process This Image
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Take this analyzed photo directly into one of Vexora's specialized tools:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onSelectTool && onSelectTool('image-resizer')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                        Resize Dimensions
                      </div>
                      <div className="text-[10px] text-slate-400">Scale to 1080p, 4K, or custom px</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool && onSelectTool('image-compressor')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                      <Minimize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                        Compress File Size
                      </div>
                      <div className="text-[10px] text-slate-400">Reduce below target KB or MB</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool && onSelectTool('crop-image')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                      <Crop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                        Crop Image Area
                      </div>
                      <div className="text-[10px] text-slate-400">Trim with 1:1, 16:9, or free box</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool && onSelectTool('image-converter')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1E1B4B] dark:text-white group-hover:text-indigo-600">
                        Convert Format
                      </div>
                      <div className="text-[10px] text-slate-400">Switch to WebP, PNG, or JPG</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Privacy assurance pill */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
                <span>Inspected locally inside browser memory</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
