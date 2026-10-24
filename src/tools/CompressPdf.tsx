import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Info,
  Archive,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import {
  optimizePdfDocument,
  PdfCompressionResult,
  formatBytes
} from '../utils/pdfUtils';

interface ProcessedFileItem {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savingsPercentage: number;
  reduced: boolean;
  notes: string;
  blob: Blob;
  downloadUrl: string;
}

export const CompressPdf: React.FC = () => {
  const [items, setItems] = useState<ProcessedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
  };

  const processFiles = async (files: File[]) => {
    const validPdfFiles = files.filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (validPdfFiles.length === 0) {
      setError('Please select valid PDF documents.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const results: ProcessedFileItem[] = [];

      for (const file of validPdfFiles) {
        const buffer = await file.arrayBuffer();
        const res: PdfCompressionResult = await optimizePdfDocument(buffer);
        const url = URL.createObjectURL(res.blob);

        results.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
          savedBytes: res.savedBytes,
          savingsPercentage: res.savingsPercentage,
          reduced: res.reduced,
          notes: res.notes,
          blob: res.blob,
          downloadUrl: url,
        });
      }

      setItems(results);

      const anyReduced = results.some((r) => r.reduced);
      if (anyReduced) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } catch {
          // Confetti fallback
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Could not process PDF documents. Some files may be password encrypted or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (items.length === 0) return;
    try {
      const zip = new JSZip();
      items.forEach((item) => {
        const base = item.name.replace(/\.[^/.]+$/, '');
        zip.file(`${base}_optimized.pdf`, item.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'vexora_optimized_pdfs.zip';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to build ZIP archive.');
    }
  };

  const handleReset = () => {
    items.forEach((item) => URL.revokeObjectURL(item.downloadUrl));
    setItems([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalOriginal = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompressed = items.reduce((acc, curr) => acc + curr.compressedSize, 0);
  const totalSaved = Math.max(0, totalOriginal - totalCompressed);
  const totalPct = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 1000) / 10 : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <FileDown className="w-3.5 h-3.5" />
          Lossless Stream Optimization
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
          Compress & Optimize PDF
        </h1>
        <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Restructure PDF cross-reference tables and strip unneeded metadata trees directly in your browser. All vector content remains 100% untouched.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Honest Transparency Note */}
      <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-1">
          <p className="font-bold">How browser-side PDF compression works</p>
          <p className="text-indigo-900/80 leading-relaxed">
            Vexora compresses PDF files without sending your documents to any remote server. It repacks internal cross-reference tables into compressed object streams and removes redundant document history dictionaries. PDFs already tightly compressed with JPEG raster streams may not see large reductions, as lossy image downsampling would degrade text and drawing sharpness.
          </p>
        </div>
      </div>

      {items.length === 0 && !isProcessing && (
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
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] mb-2">Select PDF Documents to Optimize</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Choose one or more PDFs. No files ever leave your device.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 transition-all text-sm inline-flex items-center gap-2"
          >
            Choose PDF Files
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B]">Analyzing and restructuring PDF object streams...</p>
          <p className="text-xs text-slate-500 mt-1">This runs completely inside your browser.</p>
        </div>
      )}

      {items.length > 0 && !isProcessing && (
        <div className="space-y-6">
          {/* Top Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Original Total</p>
              <p className="text-2xl font-black text-[#1E1B4B] mt-1">{formatBytes(totalOriginal)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Optimized Total</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{formatBytes(totalCompressed)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Space Saved</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {totalSaved > 0 ? `-${formatBytes(totalSaved)} (${totalPct}%)` : 'Already Optimal'}
              </p>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-bold text-[#1E1B4B]">
                {items.length} {items.length === 1 ? 'file' : 'files'} processed
              </span>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Download All as ZIP
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Optimize More Files
              </button>
            </div>
          </div>

          {/* Individual File Results List */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E1B4B] truncate max-w-xs">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Size Comparison */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 line-through">{formatBytes(item.originalSize)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-[#1E1B4B]">{formatBytes(item.compressedSize)}</span>
                  </div>

                  {/* Savings Badge */}
                  {item.reduced ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      -{item.savingsPercentage}%
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      Optimal
                    </span>
                  )}

                  {/* Download button */}
                  <a
                    href={item.downloadUrl}
                    download={`${item.name.replace(/\.[^/.]+$/, '')}_optimized.pdf`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
