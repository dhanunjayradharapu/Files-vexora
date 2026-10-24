import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loadPdfDocument, renderPageThumbnail } from '../utils/pdfRenderUtils';
import {
  addPageNumbersToPdf,
  PageNumberOptions,
  PageNumberPosition,
  formatBytes
} from '../utils/pdfUtils';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export const PdfPageNumbers: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'page-x-of-y',
    startPageNumber: 1,
    fontSize: 11,
    margin: 36,
    color: 'gray',
    skipFirstPage: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (pdfFile: File) => {
    if (!pdfFile.name.toLowerCase().endsWith('.pdf') && pdfFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDownloadBlob(null);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setFile(pdfFile);

      const buffer = await pdfFile.arrayBuffer();
      setOriginalBuffer(buffer);

      const pdfDoc: PDFDocumentProxy = await loadPdfDocument(buffer.slice(0));
      setTotalPages(pdfDoc.numPages);

      // Render first page as live preview canvas thumbnail
      const thumb = await renderPageThumbnail(pdfDoc, 1, 380);
      setPreviewThumbnail(thumb.dataUrl);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not load PDF document. The file may be password protected or corrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!originalBuffer) return;
    try {
      setIsProcessing(true);
      setError(null);
      const blob = await addPageNumbersToPdf(originalBuffer.slice(0), options);

      setDownloadBlob(blob);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {
        // Confetti fallback
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to insert page numbers into PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setOriginalBuffer(null);
    setTotalPages(0);
    setPreviewThumbnail(null);
    setDownloadBlob(null);
    setDownloadUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Preview formatted text
  const previewText = () => {
    const pageNum = options.skipFirstPage ? options.startPageNumber : options.startPageNumber;
    if (options.format === 'page-x-of-y') return `Page ${pageNum} of ${totalPages || 12}`;
    if (options.format === 'x-of-y') return `${pageNum} / ${totalPages || 12}`;
    return `${pageNum}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Hash className="w-3.5 h-3.5" />
          Page Numbering
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
          Add Page Numbers to PDF
        </h1>
        <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Customize header and footer numbers, fonts, colors, and margins while preserving document vectors.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] mb-2">Select a PDF Document</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Choose where to position numbers, select formatting, and skip title pages if desired.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 transition-all text-sm inline-flex items-center gap-2"
          >
            Choose PDF File
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B]">Inspecting PDF pages...</p>
        </div>
      )}

      {file && !isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Interactive Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Page Preview</h3>
                  <span className="text-xs text-slate-500">
                    {totalPages} total {totalPages === 1 ? 'page' : 'pages'}
                  </span>
                </div>

                {/* PDF Page Simulation Card */}
                <div className="relative w-64 aspect-[3/4] bg-white border-2 border-slate-300 rounded-lg shadow-md overflow-hidden flex flex-col justify-between p-3 select-none">
                  {previewThumbnail ? (
                    <img
                      src={previewThumbnail}
                      alt="PDF Page Preview"
                      className="absolute inset-0 w-full h-full object-contain opacity-80 pointer-events-none"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                      Page preview
                    </div>
                  )}

                  {/* Visual Indicator of Number Position */}
                  <div className="relative z-10 w-full h-full pointer-events-none">
                    {/* Top Row */}
                    <div className="absolute top-2 left-0 right-0 flex justify-between px-2 text-[10px]">
                      <span
                        className={`transition-all rounded px-1 ${
                          options.position === 'top-left'
                            ? 'bg-indigo-600 text-white font-bold shadow'
                            : 'opacity-0'
                        }`}
                      >
                        {previewText()}
                      </span>
                      <span
                        className={`transition-all rounded px-1 ${
                          options.position === 'top-center'
                            ? 'bg-indigo-600 text-white font-bold shadow'
                            : 'opacity-0'
                        }`}
                      >
                        {previewText()}
                      </span>
                      <span
                        className={`transition-all rounded px-1 ${
                          options.position === 'top-right'
                            ? 'bg-indigo-600 text-white font-bold shadow'
                            : 'opacity-0'
                        }`}
                      >
                        {previewText()}
                      </span>
                    </div>

                    {/* Bottom Row */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2 text-[10px]">
                      <span
                        className={`transition-all rounded px-1 ${
                          options.position === 'bottom-left'
                            ? 'bg-indigo-600 text-white font-bold shadow'
                            : 'opacity-0'
                        }`}
                      >
                        {previewText()}
                      </span>
                      <span
                        className={`transition-all rounded px-1 ${
                          options.position === 'bottom-center'
                            ? 'bg-indigo-600 text-white font-bold shadow'
                            : 'opacity-0'
                        }`}
                      >
                        {previewText()}
                      </span>
                      <span
                        className={`transition-all rounded px-1 ${
                          options.position === 'bottom-right'
                            ? 'bg-indigo-600 text-white font-bold shadow'
                            : 'opacity-0'
                        }`}
                      >
                        {previewText()}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-3 text-center">
                  Position preview highlights the placement of your page number text.
                </p>
              </div>
            </div>

            {/* Right: Controls Panel */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#1E1B4B]">Numbering Settings</h2>
                  <p className="text-xs text-slate-500">Fine-tune placement, format, and typography</p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Placement Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Number Placement (Header or Footer)
                </label>
                <div className="grid grid-cols-3 gap-2 max-w-sm">
                  {(
                    [
                      ['top-left', 'Top Left'],
                      ['top-center', 'Top Center'],
                      ['top-right', 'Top Right'],
                      ['bottom-left', 'Bottom Left'],
                      ['bottom-center', 'Bottom Center'],
                      ['bottom-right', 'Bottom Right'],
                    ] as [PageNumberPosition, string][]
                  ).map(([pos, label]) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, position: pos });
                        setDownloadBlob(null);
                      }}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                        options.position === pos
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Number Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'page-x-of-y', label: 'Page X of Y', example: `Page 1 of ${totalPages}` },
                    { id: 'x-of-y', label: 'X / Y', example: `1 / ${totalPages}` },
                    { id: 'only-x', label: 'Only X', example: '1' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, format: fmt.id as any });
                        setDownloadBlob(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        options.format === fmt.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-[#1E1B4B]">{fmt.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fmt.example}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Font Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Text Color</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'black', label: 'Dark', color: '#1E1B4B' },
                      { id: 'gray', label: 'Slate Gray', color: '#64748B' },
                      { id: 'indigo', label: 'Indigo', color: '#4F46E5' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setOptions({ ...options, color: c.id as any });
                          setDownloadBlob(null);
                        }}
                        className={`flex-1 py-2 px-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          options.color === c.id
                            ? 'border-indigo-600 bg-indigo-50 font-bold'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Font Size: {options.fontSize}pt
                  </label>
                  <div className="flex gap-2">
                    {[9, 11, 13, 15].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setOptions({ ...options, fontSize: size });
                          setDownloadBlob(null);
                        }}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                          options.fontSize === size
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {size}pt
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Number & Skip Cover */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Page Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={options.startPageNumber}
                    onChange={(e) => {
                      setOptions({
                        ...options,
                        startPageNumber: Math.max(1, parseInt(e.target.value) || 1),
                      });
                      setDownloadBlob(null);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.skipFirstPage}
                      onChange={(e) => {
                        setOptions({ ...options, skipFirstPage: e.target.checked });
                        setDownloadBlob(null);
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Skip first page (Cover / Title Page)
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all text-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding Numbers...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Add Page Numbers
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Download Success Card */}
          {downloadBlob && downloadUrl && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    Page Numbers Added Successfully!
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {totalPages} pages numbered &bull; Size: {formatBytes(downloadBlob.size)}
                  </p>
                </div>
              </div>

              <a
                href={downloadUrl}
                download={`${file.name.replace(/\.[^/.]+$/, '')}_numbered.pdf`}
                className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Numbered PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
