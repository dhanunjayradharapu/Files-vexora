import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Type,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createPdfFromText, TextToPdfOptions } from '../utils/documentPdfUtils';
import { formatBytes } from '../utils/fileUtils';

export const TextToPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [options, setOptions] = useState<TextToPdfOptions>({
    fontSize: 11,
    fontFamily: 'Helvetica',
    pageSize: 'a4',
    margin: 40,
    lineHeight: 1.4,
    includeLineNumbers: false,
    includePageNumbers: true,
    documentTitle: '',
    author: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
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

  const processFile = async (selectedFile: File) => {
    try {
      setError(null);
      setDownloadBlob(null);
      setFile(selectedFile);

      const content = await selectedFile.text();
      setText(content);
      if (!options.documentTitle) {
        setOptions((prev) => ({
          ...prev,
          documentTitle: selectedFile.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Could not read text file. Ensure it is a valid plaintext document.');
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter or upload text to convert into a PDF.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const result = await createPdfFromText(text, options);
      setDownloadBlob(result.blob);
      setPageCount(result.pageCount);

      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setText('');
    setDownloadBlob(null);
    setDownloadUrl(null);
    setPageCount(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = text ? text.split('\n').length : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 text-violet-700 dark:text-violet-400 text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" />
          Text to PDF Converter
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          Convert Plain Text to PDF
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Format code snippets, TXT documents, markdown, or logs into clean, paginated, print-ready PDF files.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Text Input / Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#1E1B4B] dark:text-white text-sm">
                  {file ? file.name : 'Text Content'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lineCount} lines &bull; {wordCount} words &bull; {text.length} characters
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.log,.csv,.json,.xml,.js,.ts,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Text File
                </button>
                {text && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Main Textarea */}
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setDownloadBlob(null);
              }}
              placeholder="Type, paste, or drop text content here..."
              rows={16}
              className={`w-full p-4 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y leading-relaxed ${
                options.fontFamily === 'Courier' ? 'font-mono' : ''
              }`}
            />
          </div>
        </div>

        {/* Right: PDF Layout Settings */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-[#1E1B4B] dark:text-white text-base">Page & Font Styling</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure layout and typography</p>
          </div>

          {/* Document Header Title & Author */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Document Title (Optional)
              </label>
              <input
                type="text"
                value={options.documentTitle || ''}
                onChange={(e) => {
                  setOptions({ ...options, documentTitle: e.target.value });
                  setDownloadBlob(null);
                }}
                placeholder="e.g. Server Access Logs"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Author / Department (Optional)
              </label>
              <input
                type="text"
                value={options.author || ''}
                onChange={(e) => {
                  setOptions({ ...options, author: e.target.value });
                  setDownloadBlob(null);
                }}
                placeholder="e.g. Systems Engineering Team"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Typography Font Family
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Helvetica', label: 'Sans-Serif', family: 'Helvetica' },
                { id: 'Times', label: 'Serif', family: 'Times' },
                { id: 'Courier', label: 'Monospace', family: 'Courier' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setOptions({ ...options, fontFamily: f.id as any });
                    setDownloadBlob(null);
                  }}
                  className={`py-2 px-2 text-xs rounded-xl border text-center transition-all ${
                    options.fontFamily === f.id
                      ? 'bg-violet-600 text-white border-violet-600 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Page Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Font Size: {options.fontSize}pt
              </label>
              <div className="flex gap-1.5">
                {[9, 11, 13, 15].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setOptions({ ...options, fontSize: size });
                      setDownloadBlob(null);
                    }}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      options.fontSize === size
                        ? 'bg-violet-600 text-white border-violet-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Page Size
              </label>
              <div className="flex gap-1.5">
                {[
                  { id: 'a4', label: 'A4' },
                  { id: 'letter', label: 'Letter' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setOptions({ ...options, pageSize: s.id as any });
                      setDownloadBlob(null);
                    }}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      options.pageSize === s.id
                        ? 'bg-violet-600 text-white border-violet-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Line Numbers & Page Numbers Toggles */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeLineNumbers}
                onChange={(e) => {
                  setOptions({ ...options, includeLineNumbers: e.target.checked });
                  setDownloadBlob(null);
                }}
                className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Include line numbers (ideal for code / logs)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includePageNumbers !== false}
                onChange={(e) => {
                  setOptions({ ...options, includePageNumbers: e.target.checked });
                  setDownloadBlob(null);
                }}
                className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Include "Page X of Y" footer
              </span>
            </label>
          </div>

          {/* Generate Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing || !text.trim()}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-md shadow-violet-200 dark:shadow-none transition-all text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Convert to PDF Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Download Success Card */}
      {downloadBlob && downloadUrl && (
        <div className="mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">PDF Generated Successfully!</h3>
              <p className="text-white/80 text-xs sm:text-sm">
                {pageCount} {pageCount === 1 ? 'page' : 'pages'} &bull; Size: {formatBytes(downloadBlob.size)}
              </p>
            </div>
          </div>

          <a
            href={downloadUrl}
            download={`${(options.documentTitle || file?.name || 'document').replace(/\.[^/.]+$/, '')}.pdf`}
            className="px-6 py-3 bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF File
          </a>
        </div>
      )}
    </div>
  );
};
