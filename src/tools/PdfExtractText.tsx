import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  Search,
  AlertCircle,
  Info,
  BookOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { extractTextFromPdf, PdfTextExtractionResult } from '../utils/documentPdfUtils';
import { formatBytes } from '../utils/fileUtils';

export const PdfExtractText: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PdfTextExtractionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedView, setSelectedView] = useState<'all' | 'by-page'>('all');
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setResult(null);
      setFile(pdfFile);

      const buffer = await pdfFile.arrayBuffer();
      const extraction = await extractTextFromPdf(buffer, pdfFile.name, (current, total) => {
        setProgress({ current, total });
      });

      setResult(extraction);
      setSelectedPageNum(1);

      if (extraction.totalCharacters > 0) {
        try {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Could not extract text from this PDF. It may be password-protected or corrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result.fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName.replace(/\.[^/.]+$/, '')}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSearchQuery('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentPage = result?.pages.find((p) => p.pageNumber === selectedPageNum);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 text-violet-700 dark:text-violet-400 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          PDF Text Extractor
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          Extract Text from PDF
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Extract selectable digital text, headings, and paragraphs from PDF documents directly in your browser using PDF.js.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-violet-300 dark:border-violet-800/80 hover:border-violet-500 bg-violet-50/40 dark:bg-slate-900 hover:bg-violet-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200 dark:shadow-none">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">Select a PDF to Extract Text</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Extract copy, paragraphs, and words into clean TXT format without uploading your document.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md shadow-violet-100 dark:shadow-none transition-all text-sm inline-flex items-center gap-2"
          >
            Choose PDF File
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B] dark:text-white">Extracting text layers...</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyzing page {progress.current} of {progress.total}
          </p>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-6">
          {/* Top Bar with Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-[#1E1B4B] dark:text-white text-sm truncate max-w-xs sm:max-w-md">
                  {result.fileName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {result.totalPages} pages &bull; {result.totalWords.toLocaleString()} words &bull; {result.totalCharacters.toLocaleString()} characters
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(selectedView === 'all' ? result.fullText : currentPage?.text || '')}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Text'}
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .txt File
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Extract Another
              </button>
            </div>
          </div>

          {/* Scanned PDF Honest Warning */}
          {result.isScannedOrEmpty && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Scanned Document Notice</p>
                <p className="leading-relaxed">
                  Very little or no digital text was detected in this PDF. This document likely consists of scanned raster images or photographs without an embedded OCR (Optical Character Recognition) text layer. Browser-side PDF.js extracts genuine digital text characters embedded in the PDF dictionary.
                </p>
              </div>
            </div>
          )}

          {/* Main Content Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            {/* View Switcher & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedView('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedView === 'all'
                      ? 'bg-white dark:bg-slate-700 text-[#1E1B4B] dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Full Document Text
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedView('by-page')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedView === 'by-page'
                      ? 'bg-white dark:bg-slate-700 text-[#1E1B4B] dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  By Page View
                </button>
              </div>

              {selectedView === 'by-page' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Page:</span>
                  <select
                    value={selectedPageNum}
                    onChange={(e) => setSelectedPageNum(parseInt(e.target.value))}
                    className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                  >
                    {result.pages.map((p) => (
                      <option key={p.pageNumber} value={p.pageNumber}>
                        Page {p.pageNumber} ({p.wordCount} words)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Extracted Text Viewer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
              {selectedView === 'all' ? (
                result.fullText || 'No text content extracted.'
              ) : currentPage ? (
                currentPage.text || `No selectable text on page ${selectedPageNum}.`
              ) : (
                'Select a page to view text.'
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
