import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Stamp,
  Sparkles,
  Sliders,
  Grid
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loadPdfDocument, renderPageThumbnail } from '../utils/pdfRenderUtils';
import {
  addWatermarkToPdf,
  WatermarkOptions,
  formatBytes
} from '../utils/pdfUtils';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export const PdfWatermark: React.FC = () => {
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
  const [options, setOptions] = useState<WatermarkOptions>({
    text: 'CONFIDENTIAL',
    angle: 'diagonal',
    fontSize: 48,
    opacity: 0.25,
    color: 'slate',
    repeatGrid: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = ['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'DO NOT COPY', 'INTERNAL ONLY', 'PREVIEW'];

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

      // Render first page as background preview
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
    if (!options.text.trim()) {
      setError('Please enter watermark text.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const blob = await addWatermarkToPdf(originalBuffer.slice(0), options);

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
      setError('Failed to add watermark to PDF.');
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

  // Color values for styling preview
  const colorMap = {
    slate: 'rgba(71, 85, 105, ',
    red: 'rgba(220, 38, 38, ',
    indigo: 'rgba(79, 70, 229, ',
    amber: 'rgba(217, 119, 6, ',
  };
  const activeColorRgba = `${colorMap[options.color]}${options.opacity})`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Stamp className="w-3.5 h-3.5" />
          PDF Watermark
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
          Add Text Watermark to PDF
        </h1>
        <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Protect sensitive documents with centered stamps or tiled grid watermarks. Text and vectors remain pristine.
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
          <h3 className="text-xl font-bold text-[#1E1B4B] mb-2">Select a PDF to Watermark</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Stamp "CONFIDENTIAL", "DRAFT", or your company brand across all pages.
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
          <p className="font-bold text-[#1E1B4B]">Loading PDF preview...</p>
        </div>
      )}

      {file && !isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Preview Panel */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Watermark Preview</h3>
                  <span className="text-xs text-slate-500">{totalPages} pages</span>
                </div>

                {/* PDF Page Container with Simulated Overlay */}
                <div className="relative w-64 aspect-[3/4] bg-white border-2 border-slate-300 rounded-lg shadow-md overflow-hidden flex items-center justify-center select-none">
                  {previewThumbnail ? (
                    <img
                      src={previewThumbnail}
                      alt="PDF Page Preview"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Loading document...</div>
                  )}

                  {/* Watermark Overlay Preview */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    {options.repeatGrid ? (
                      <div className="grid grid-cols-2 gap-8 p-4 transform -rotate-45 scale-90">
                        {[1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className="font-black text-center whitespace-nowrap tracking-wider"
                            style={{
                              color: activeColorRgba,
                              fontSize: `${Math.round(options.fontSize * 0.32)}px`,
                            }}
                          >
                            {options.text || 'WATERMARK'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span
                        className="font-black text-center whitespace-nowrap tracking-widest"
                        style={{
                          color: activeColorRgba,
                          fontSize: `${Math.round(options.fontSize * 0.42)}px`,
                          transform:
                            options.angle === 'diagonal'
                              ? 'rotate(-45deg)'
                              : options.angle === 'vertical'
                              ? 'rotate(-90deg)'
                              : 'none',
                        }}
                      >
                        {options.text || 'WATERMARK'}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-3 text-center">
                  Live interactive preview simulates watermark appearance on your document.
                </p>
              </div>
            </div>

            {/* Right: Controls Panel */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#1E1B4B]">Watermark Settings</h2>
                  <p className="text-xs text-slate-500">{file.name}</p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Watermark Text Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Watermark Text</label>
                <input
                  type="text"
                  value={options.text}
                  onChange={(e) => {
                    setOptions({ ...options, text: e.target.value });
                    setDownloadBlob(null);
                  }}
                  placeholder="e.g. CONFIDENTIAL"
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, text: preset });
                        setDownloadBlob(null);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                        options.text === preset
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout & Angle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Watermark Angle</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'diagonal', label: 'Diagonal 45°' },
                      { id: 'horizontal', label: 'Horizontal' },
                      { id: 'vertical', label: 'Vertical' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setOptions({ ...options, angle: item.id as any });
                          setDownloadBlob(null);
                        }}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all text-center ${
                          options.angle === item.id
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Layout Mode</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, repeatGrid: false });
                        setDownloadBlob(null);
                      }}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                        !options.repeatGrid
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Single Center
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, repeatGrid: true });
                        setDownloadBlob(null);
                      }}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-1 ${
                        options.repeatGrid
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      Repeated Grid
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Watermark Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'slate', label: 'Slate Gray', hex: '#64748B' },
                    { id: 'red', label: 'Security Red', hex: '#DC2626' },
                    { id: 'indigo', label: 'Indigo', hex: '#4F46E5' },
                    { id: 'amber', label: 'Warning Amber', hex: '#D97706' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, color: c.id as any });
                        setDownloadBlob(null);
                      }}
                      className={`py-2 px-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        options.color === c.id
                          ? 'border-indigo-600 bg-indigo-50 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders: Opacity & Font Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Opacity</span>
                    <span className="text-indigo-600">{Math.round(options.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.75"
                    step="0.02"
                    value={options.opacity}
                    onChange={(e) => {
                      setOptions({ ...options, opacity: parseFloat(e.target.value) });
                      setDownloadBlob(null);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Font Size</span>
                    <span className="text-indigo-600">{options.fontSize}pt</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    step="4"
                    value={options.fontSize}
                    onChange={(e) => {
                      setOptions({ ...options, fontSize: parseInt(e.target.value) });
                      setDownloadBlob(null);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isProcessing || !options.text.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all text-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Applying Watermark...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Apply Watermark
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
                  <h3 className="font-extrabold text-lg text-white">Watermark Applied!</h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {totalPages} pages updated &bull; Size: {formatBytes(downloadBlob.size)}
                  </p>
                </div>
              </div>

              <a
                href={downloadUrl}
                download={`${file.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`}
                className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Watermarked PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
