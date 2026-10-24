import React, { useState, useEffect } from 'react';
import {
  FileImage,
  Download,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileArchive,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DropZone } from '../components/DropZone';
import {
  loadPdfDocument,
  exportPdfPagesToImages,
  renderPageThumbnail,
} from '../utils/pdfRenderUtils';
import { formatBytes, downloadBlob, downloadZip, getFileNameWithoutExt } from '../utils/fileUtils';

interface PagePreviewItem {
  pageNumber: number;
  thumbnailUrl: string;
  width: number;
  height: number;
}

interface ExportedImageItem {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

interface PdfToImageProps {
  defaultFormat?: 'image/jpeg' | 'image/png';
}

export const PdfToImage: React.FC<PdfToImageProps> = ({ defaultFormat = 'image/jpeg' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pagePreviews, setPagePreviews] = useState<PagePreviewItem[]>([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // Settings
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>(defaultFormat);
  const [quality, setQuality] = useState<number>(0.92);
  const [resolutionScale, setResolutionScale] = useState<number>(2.0); // 1.5x = 108 DPI, 2x = 144 DPI, 3x = 216 DPI

  // Export results
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [exportedImages, setExportedImages] = useState<ExportedImageItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setErrorMessage(null);
    setExportedImages(null);
    setIsLoadingPdf(true);
    setPagePreviews([]);

    try {
      const buffer = await selected.arrayBuffer();
      setPdfBuffer(buffer);

      const pdfDoc = await loadPdfDocument(buffer);
      const pagesCount = pdfDoc.numPages;
      setTotalPages(pagesCount);

      // Render thumbnails for all pages (up to first 50)
      const previews: PagePreviewItem[] = [];
      const previewLimit = Math.min(pagesCount, 50);

      for (let i = 1; i <= previewLimit; i++) {
        const thumb = await renderPageThumbnail(pdfDoc, i, 200);
        previews.push({
          pageNumber: i,
          thumbnailUrl: thumb.dataUrl,
          width: thumb.width,
          height: thumb.height,
        });
      }

      setPagePreviews(previews);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse PDF document';
      setErrorMessage(msg);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfBuffer(null);
    setTotalPages(0);
    setPagePreviews([]);
    setExportedImages(null);
    setErrorMessage(null);
    setExportProgress(null);
  };

  const handleExportAll = async () => {
    if (!pdfBuffer) return;

    try {
      setIsExporting(true);
      setErrorMessage(null);
      setExportProgress({ current: 0, total: totalPages });

      const pdfDoc = await loadPdfDocument(pdfBuffer);
      const results = await exportPdfPagesToImages(
        pdfDoc,
        format,
        quality,
        resolutionScale,
        (current, total) => {
          setExportProgress({ current, total });
        }
      );

      setExportedImages(results);

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
      const msg = err instanceof Error ? err.message : 'Failed to render PDF pages';
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingle = (item: ExportedImageItem) => {
    if (!file) return;
    const base = getFileNameWithoutExt(file.name);
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    downloadBlob(item.blob, `${base}_page_${item.pageNumber}.${ext}`);
  };

  const handleDownloadZip = async () => {
    if (!exportedImages || !file) return;
    const base = getFileNameWithoutExt(file.name);
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';

    const filesToZip = exportedImages.map((img) => ({
      name: `${base}_page_${img.pageNumber}.${ext}`,
      blob: img.blob,
    }));

    await downloadZip(filesToZip, `Vexora-${base}-${ext}-pages.zip`);
  };

  const extName = format === 'image/jpeg' ? 'JPG' : 'PNG';

  return (
    <div className="space-y-8">
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          acceptedMimeTypes={['application/pdf']}
          title={`Convert PDF to ${extName}`}
          subtitle="Render every PDF page to crisp, high-resolution standalone images with zero server uploads"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Page Previews & Rendering Status */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-xs">
                    {file.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {totalPages} {totalPages === 1 ? 'page' : 'pages'}
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

              {/* Loading PDF spinner */}
              {isLoadingPdf && (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs">Parsing document and generating page thumbnails...</p>
                </div>
              )}

              {/* Progress bar during export */}
              {isExporting && exportProgress && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-medium text-indigo-800 dark:text-indigo-200">
                    <span>
                      Rendering page {exportProgress.current} of {exportProgress.total} to {extName}...
                    </span>
                    <span className="font-mono">
                      {Math.round((exportProgress.current / exportProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-200"
                      style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Page Thumbnails Grid */}
              {!isLoadingPdf && pagePreviews.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Document Page Previews:</span>
                    <span className="font-mono text-[11px]">{formatBytes(file.size)}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {pagePreviews.map((page) => {
                      const exported = exportedImages?.find((e) => e.pageNumber === page.pageNumber);

                      return (
                        <div
                          key={page.pageNumber}
                          className="relative group bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col justify-between transition-all"
                        >
                          {/* Page badge */}
                          <div className="absolute top-3 left-3 z-10 w-5 h-5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono flex items-center justify-center">
                            {page.pageNumber}
                          </div>

                          {/* Thumbnail image */}
                          <div className="aspect-3/4 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center p-1">
                            <img
                              src={page.thumbnailUrl}
                              alt={`Page ${page.pageNumber}`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

                          {/* Footer on card */}
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">
                              {exported ? formatBytes(exported.blob.size) : `${page.width}×${page.height}`}
                            </span>

                            {exported ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadSingle(exported)}
                                className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
                                title="Download this page image"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">Page {page.pageNumber}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Conversion Options & Actions */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Image Export Settings
              </h3>

              {/* Format Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Image Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormat('image/jpeg');
                      setExportedImages(null);
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      format === 'image/jpeg'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    JPEG (.jpg)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormat('image/png');
                      setExportedImages(null);
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      format === 'image/png'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    PNG (.png)
                  </button>
                </div>
              </div>

              {/* Quality slider for JPG */}
              {format === 'image/jpeg' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      JPEG Quality
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => {
                      setQuality(parseFloat(e.target.value));
                      setExportedImages(null);
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Smaller Size</span>
                    <span>Crisp Details</span>
                  </div>
                </div>
              )}

              {/* Resolution DPI Scaling */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rendering Resolution (DPI)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Standard', scale: 1.5, desc: '108 DPI' },
                    { label: 'High-Res', scale: 2.0, desc: '144 DPI' },
                    { label: 'Ultra 3x', scale: 3.0, desc: '216 DPI' },
                  ].map((res) => (
                    <button
                      key={res.scale}
                      type="button"
                      onClick={() => {
                        setResolutionScale(res.scale);
                        setExportedImages(null);
                      }}
                      className={`p-2 text-center rounded-lg border transition-all cursor-pointer ${
                        resolutionScale === res.scale
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs">{res.label}</div>
                      <div className="text-[10px] text-slate-400">{res.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              {!exportedImages ? (
                <button
                  type="button"
                  onClick={handleExportAll}
                  disabled={isExporting || isLoadingPdf || totalPages === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering Pages...</span>
                    </>
                  ) : (
                    <>
                      <FileImage className="w-4 h-4" />
                      <span>Convert {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} to {extName}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <FileArchive className="w-4 h-4" />
                    <span>Download All as ZIP ({exportedImages.length} images)</span>
                  </button>

                  <p className="text-[11px] text-center text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rendered {exportedImages.length} pages cleanly</span>
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
