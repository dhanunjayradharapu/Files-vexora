import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Sliders,
  Eye,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  validateDocxFile,
  parseDocxFile,
  convertDocxToPdf,
  DocxParseResult,
  DocxToPdfOptions
} from '../utils/docxUtils';
import { formatBytes } from '../utils/fileUtils';

export const DocxToPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<DocxParseResult | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [options, setOptions] = useState<DocxToPdfOptions>({
    fontSize: 11,
    fontFamily: 'Helvetica',
    pageSize: 'a4',
    margin: 40,
    lineHeight: 1.4,
    includePageNumbers: true,
    documentTitle: '',
  });

  const [isLoading, setIsLoading] = useState(false);
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

  const processFile = async (docxFile: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setParsed(null);
      setDownloadBlob(null);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setFile(docxFile);

      const arrayBuffer = await docxFile.arrayBuffer();
      const validation = validateDocxFile(docxFile, arrayBuffer);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid Word document');
      }

      setBuffer(arrayBuffer);
      const parseResult = await parseDocxFile(arrayBuffer);
      setParsed(parseResult);

      setOptions((prev) => ({
        ...prev,
        documentTitle: docxFile.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not parse Word document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!buffer) return;

    try {
      setIsProcessing(true);
      setError(null);

      const result = await convertDocxToPdf(buffer.slice(0), options);
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
      setError('Failed to convert Word document to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setBuffer(null);
    setParsed(null);
    setDownloadBlob(null);
    setDownloadUrl(null);
    setPageCount(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 text-violet-700 dark:text-violet-400 text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" />
          Word to PDF Converter
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          Convert DOCX to PDF
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Parse Microsoft Word documents in your browser and generate clean, standardized PDF documents with zero cloud uploads.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Conversion Note</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Formatting Limitations Notice */}
      <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
          <p className="font-bold">Client-Side Formatting Capabilities & Transparency</p>
          <p className="leading-relaxed">
            Vexora converts DOCX documents using browser-side OpenXML parsing (Mammoth + PDF-Lib). It faithfully extracts document headings, paragraphs, bullet lists, bold/italics, and text structure into a standardized, paginated PDF. Proprietary desktop Word macros, custom WordArt, or exact millimeter print layout margins from desktop Word are normalized into a clean, universally readable vector PDF document without sending your private files to any server.
          </p>
        </div>
      </div>

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
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200 dark:shadow-none">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">Select a Word (.docx) Document</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Choose any modern Microsoft Word document to convert to PDF.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md shadow-violet-100 dark:shadow-none transition-all text-sm inline-flex items-center gap-2"
          >
            Choose DOCX File
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B] dark:text-white">Parsing Word document XML structure...</p>
        </div>
      )}

      {file && parsed && !isLoading && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-[#1E1B4B] dark:text-white text-sm truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {parsed.paragraphsCount} paragraphs &bull; {parsed.wordCount.toLocaleString()} words &bull; {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Choose Another File
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Document Content Preview */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-[#1E1B4B] dark:text-white text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-violet-600" />
                  Extracted Document Preview
                </h3>
                <span className="text-xs text-slate-400">Standardized layout</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-[460px] overflow-y-auto text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-3 select-text">
                {parsed.rawText.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  const isHeading =
                    trimmed.length < 70 &&
                    !trimmed.endsWith('.') &&
                    (trimmed.toUpperCase() === trimmed || /^[A-Z0-9\s:,-]+$/.test(trimmed));
                  return (
                    <p
                      key={idx}
                      className={
                        isHeading
                          ? 'font-bold text-sm text-[#1E1B4B] dark:text-white pt-2'
                          : 'leading-relaxed'
                      }
                    >
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Right: PDF Output Settings */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-[#1E1B4B] dark:text-white text-base">PDF Typography & Margins</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize generated PDF layout</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Heading / Title
                </label>
                <input
                  type="text"
                  value={options.documentTitle || ''}
                  onChange={(e) => {
                    setOptions({ ...options, documentTitle: e.target.value });
                    setDownloadBlob(null);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Font Family
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Helvetica', label: 'Helvetica' },
                    { id: 'Times', label: 'Times Roman' },
                    { id: 'Courier', label: 'Courier' },
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
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
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
                    {[10, 11, 12, 14].map((size) => (
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
                    Paper Size
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

              {/* Page numbers toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={options.includePageNumbers}
                  onChange={(e) => {
                    setOptions({ ...options, includePageNumbers: e.target.checked });
                    setDownloadBlob(null);
                  }}
                  className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Include "Page X of Y" footer numbers
                </span>
              </label>

              {/* Convert Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-md shadow-violet-200 dark:shadow-none transition-all text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Converting DOCX to PDF...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate PDF from Word
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Download Success Card */}
          {downloadBlob && downloadUrl && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">PDF Converted Successfully!</h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {pageCount} {pageCount === 1 ? 'page' : 'pages'} &bull; Size: {formatBytes(downloadBlob.size)}
                  </p>
                </div>
              </div>

              <a
                href={downloadUrl}
                download={`${file.name.replace(/\.[^/.]+$/, '')}.pdf`}
                className="px-6 py-3 bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Converted PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
