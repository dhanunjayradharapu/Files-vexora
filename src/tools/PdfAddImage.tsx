import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  PenTool,
  Move
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loadPdfDocument, renderPageThumbnail } from '../utils/pdfRenderUtils';
import {
  addImageToPdf,
  AddImageOptions,
  formatBytes
} from '../utils/pdfUtils';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export const PdfAddImage: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [options, setOptions] = useState<AddImageOptions>({
    position: 'bottom-right',
    scaleWidth: 140,
    opacity: 0.95,
    margin: 36,
    targetPages: 'last',
  });

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processPdf(file);
  };

  const processPdf = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDownloadBlob(null);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setPdfFile(file);

      const buffer = await file.arrayBuffer();
      setPdfBuffer(buffer);

      const pdfDoc: PDFDocumentProxy = await loadPdfDocument(buffer.slice(0));
      const pagesCount = pdfDoc.numPages;
      setTotalPages(pagesCount);

      // If target is 'last', render the last page thumbnail, otherwise first page
      const targetPageNum = options.targetPages === 'last' ? pagesCount : 1;
      const thumb = await renderPageThumbnail(pdfDoc, targetPageNum, 380);
      setPreviewThumbnail(thumb.dataUrl);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not load PDF document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG or JPG).');
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setDownloadBlob(null);
  };

  const handleApply = async () => {
    if (!pdfBuffer || !imageFile) {
      setError('Please select both a PDF document and an image to stamp.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const blob = await addImageToPdf(pdfBuffer.slice(0), imageFile, options);

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
      setError('Failed to embed image into PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setPdfFile(null);
    setPdfBuffer(null);
    setImageFile(null);
    setImageUrl(null);
    setTotalPages(0);
    setPreviewThumbnail(null);
    setDownloadBlob(null);
    setDownloadUrl(null);
    setError(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <PenTool className="w-3.5 h-3.5" />
          Stamp & Signature
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
          Add Image or Signature to PDF
        </h1>
        <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Insert digital signatures, official stamps, logos, or letterheads onto any page.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!pdfFile && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) processPdf(f);
          }}
          onClick={() => pdfInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handlePdfSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] mb-2">Select a PDF Document</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Upload the document you want to stamp or sign.
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

      {pdfFile && !isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Preview Panel */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Document Preview</h3>
                  <span className="text-xs text-slate-500">
                    {options.targetPages === 'last'
                      ? `Last Page (#${totalPages})`
                      : options.targetPages === 'first'
                      ? 'First Page (#1)'
                      : `All ${totalPages} pages`}
                  </span>
                </div>

                {/* PDF Page with Image Overlay */}
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

                  {/* Stamp placement indicator */}
                  {imageUrl ? (
                    <div
                      className={`absolute pointer-events-none transition-all p-1 ${
                        options.position === 'bottom-right'
                          ? 'bottom-3 right-3'
                          : options.position === 'bottom-left'
                          ? 'bottom-3 left-3'
                          : options.position === 'center'
                          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                          : options.position === 'top-right'
                          ? 'top-3 right-3'
                          : 'top-3 left-3'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt="Stamp Preview"
                        style={{
                          width: `${Math.round(options.scaleWidth * 0.42)}px`,
                          opacity: options.opacity,
                        }}
                        className="object-contain drop-shadow"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border border-dashed border-indigo-400 bg-indigo-50/60 rounded-lg p-3 text-center">
                        <p className="text-[11px] font-semibold text-indigo-700">
                          Select an image below to stamp
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-3 text-center">
                  Live preview shows placement on target page.
                </p>
              </div>
            </div>

            {/* Right: Controls Panel */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#1E1B4B]">Stamp / Signature Settings</h2>
                  <p className="text-xs text-slate-500">{pdfFile.name}</p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Change PDF
                </button>
              </div>

              {/* Image Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Image (Signature, Stamp, or Logo)
                </label>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imageFile && imageUrl ? (
                  <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                        <img src={imageUrl} alt="Uploaded Stamp" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1E1B4B] truncate max-w-[200px]">
                          {imageFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{formatBytes(imageFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => imgInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-white border border-indigo-200"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 rounded-xl flex items-center justify-center gap-2 text-indigo-700 font-semibold text-xs transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Choose PNG or JPG Image
                  </button>
                )}
              </div>

              {/* Target Page Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Target Pages</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'last', label: 'Last Page Only', desc: 'Signature line' },
                    { id: 'first', label: 'First Page Only', desc: 'Cover / Title' },
                    { id: 'all', label: 'All Pages', desc: 'Header / Logo' },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, targetPages: target.id as any });
                        setDownloadBlob(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        options.targetPages === target.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-[#1E1B4B]">{target.label}</p>
                      <p className="text-[11px] text-slate-500">{target.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Placement</label>
                <div className="grid grid-cols-3 gap-2 max-w-sm">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'center', label: 'Center' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-right', label: 'Bottom Right (Sign)' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => {
                        setOptions({ ...options, position: pos.id as any });
                        setDownloadBlob(null);
                      }}
                      className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                        options.position === pos.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale & Opacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Image Width</span>
                    <span className="text-indigo-600">{options.scaleWidth}pt</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="280"
                    step="10"
                    value={options.scaleWidth}
                    onChange={(e) => {
                      setOptions({ ...options, scaleWidth: parseInt(e.target.value) });
                      setDownloadBlob(null);
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Small (60pt)</span>
                    <span>Medium (140pt)</span>
                    <span>Large (280pt)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Opacity</span>
                    <span className="text-indigo-600">{Math.round(options.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={options.opacity}
                    onChange={(e) => {
                      setOptions({ ...options, opacity: parseFloat(e.target.value) });
                      setDownloadBlob(null);
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Faint (20%)</span>
                    <span>Solid (100%)</span>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isProcessing || !imageFile}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all text-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Add to PDF
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
                  <h3 className="font-extrabold text-lg text-white">Image Embedded Successfully!</h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    Target: {options.targetPages} &bull; Output Size: {formatBytes(downloadBlob.size)}
                  </p>
                </div>
              </div>

              <a
                href={downloadUrl}
                download={`${pdfFile.name.replace(/\.[^/.]+$/, '')}_signed.pdf`}
                className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Stamped PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
