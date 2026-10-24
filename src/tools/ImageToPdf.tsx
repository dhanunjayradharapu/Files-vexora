import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Download,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import {
  createPdfFromImages,
  PdfImageItem,
  PageSizeOption,
  PageOrientationOption,
  PageMarginOption,
} from '../utils/pdfUtils';
import { loadImageFromFile } from '../utils/imageUtils';
import { formatBytes, downloadBlob, getFileNameWithoutExt } from '../utils/fileUtils';

export const ImageToPdf: React.FC = () => {
  const [items, setItems] = useState<PdfImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<PageOrientationOption>('auto');
  const [margin, setMargin] = useState<PageMarginOption>('none');
  const [customFilename, setCustomFilename] = useState<string>('Vexora-document');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<{ blob: Blob; size: number } | null>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    setGeneratedPdfBlob(null);

    const loadedItems: PdfImageItem[] = [];

    for (const file of newFiles) {
      try {
        const { img, objectUrl } = await loadImageFromFile(file);
        loadedItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: objectUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          rotation: 0,
        });
      } catch (err) {
        console.error('Error loading image', err);
      }
    }

    if (loadedItems.length > 0) {
      setItems((prev) => [...prev, ...loadedItems]);
      if (items.length === 0 && newFiles.length > 0) {
        setCustomFilename(`${getFileNameWithoutExt(newFiles[0].name)}-document`);
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const itemToRemove = prev.find((i) => i.id === id);
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
    setGeneratedPdfBlob(null);
  };

  const handleClearAll = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    setGeneratedPdfBlob(null);
    setErrorMessage(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
    setGeneratedPdfBlob(null);
  };

  const handleRotateItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextRotation = ((item.rotation || 0) + 90) % 360;
          return { ...item, rotation: nextRotation };
        }
        return item;
      })
    );
    setGeneratedPdfBlob(null);
  };

  const handleGeneratePdf = async () => {
    if (items.length === 0) {
      setErrorMessage('Please add at least one image to create a PDF.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressState({ current: 1, total: items.length });

      const pdfBlob = await createPdfFromImages(
        items,
        { pageSize, orientation, margin },
        (current, total) => setProgressState({ current, total })
      );

      setGeneratedPdfBlob({
        blob: pdfBlob,
        size: pdfBlob.size,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Confetti optional
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF document';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setProgressState(null);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfBlob) return;
    const cleanName = customFilename.trim().replace(/[^\w\d-_.]/gi, '_') || 'document';
    const filename = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
    downloadBlob(generatedPdfBlob.blob, filename);
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone when empty */}
      {items.length === 0 && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={true}
          maxFiles={50}
          title="Convert JPG, PNG, and WebP to PDF"
          subtitle="Select multiple images to combine into a single portable PDF document"
        />
      )}

      {/* Main Workspace when items exist */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Image Grid & Ordering */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                    Pages ({items.length})
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {/* Add more files button */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Images</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Grid of reorderable image cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col justify-between transition-all"
                  >
                    {/* Page number badge */}
                    <div className="absolute top-3 left-3 z-10 w-5 h-5 rounded-md bg-slate-900/80 text-white text-[11px] font-mono flex items-center justify-center backdrop-blur-xs">
                      {index + 1}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-3 right-3 z-10 p-1 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-600 hover:text-rose-600 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Thumbnail preview */}
                    <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-slate-200/50 dark:bg-slate-900 flex items-center justify-center p-1">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                      />
                    </div>

                    {/* Item info */}
                    <div className="mt-2 text-left space-y-1">
                      <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.file.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>{formatBytes(item.file.size)}</span>
                        <span>{item.width}×{item.height}</span>
                      </div>
                    </div>

                    {/* Action controls row */}
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRotateItem(item.id)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                        title="Rotate 90° clockwise"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: PDF Page Setup & Convert Action */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                PDF Layout Options
              </h3>

              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Size
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['a4', 'letter', 'fit'] as PageSizeOption[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setGeneratedPdfBlob(null);
                      }}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        pageSize === size
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {size === 'a4' ? 'A4' : size === 'letter' ? 'US Letter' : 'Fit Image'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Orientation
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['auto', 'portrait', 'landscape'] as PageOrientationOption[]).map((orient) => (
                    <button
                      key={orient}
                      type="button"
                      onClick={() => {
                        setOrientation(orient);
                        setGeneratedPdfBlob(null);
                      }}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer capitalize ${
                        orientation === orient
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {orient}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Margin
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['none', 'small', 'medium'] as PageMarginOption[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMargin(m);
                        setGeneratedPdfBlob(null);
                      }}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer capitalize ${
                        margin === m
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {m === 'none' ? 'No Margin' : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output File Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  PDF File Name
                </label>
                <div className="flex rounded-lg shadow-xs">
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 text-xs rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    placeholder="document-name"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 text-slate-500 text-xs font-mono">
                    .pdf
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              {!generatedPdfBlob ? (
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Processing {progressState ? `${progressState.current}/${progressState.total}` : 'PDF'}...
                      </span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Create PDF ({items.length} {items.length === 1 ? 'Page' : 'Pages'})</span>
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
                    <span>Download PDF ({formatBytes(generatedPdfBlob.size)})</span>
                  </button>
                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PDF ready for instant download</span>
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
