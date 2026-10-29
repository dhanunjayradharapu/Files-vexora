import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Heading,
  List,
  Quote,
  Sliders,
  Type,
  FileDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createPdfFromText, TextToPdfOptions } from '../utils/documentPdfUtils';
import { formatBytes } from '../utils/fileUtils';

export const EditorToPdf: React.FC = () => {
  const [title, setTitle] = useState<string>('Project Proposal & Executive Summary');
  const [author, setAuthor] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>(
    `1. EXECUTIVE OVERVIEW\nThis document outlines the core technical architecture, project milestones, and privacy principles for our client-side file workspace.\n\n2. KEY OBJECTIVES\n• Eliminate external server dependency and latency.\n• Guarantee zero data exfiltration by running all processing within local browser memory.\n• Deliver responsive PDF, image, and PowerPoint document utilities.\n\n3. TECHNICAL IMPLEMENTATION\n• Vector PDF generation and manipulation using pdf-lib.\n• OpenXML package extraction using JSZip and Mammoth.\n• Modern presentation authoring with PptxGenJS.\n\n4. CONCLUSION\nBy keeping computation inside client memory, user documents remain 100% private and confidential.`
  );

  const [options, setOptions] = useState<TextToPdfOptions>({
    fontSize: 11,
    fontFamily: 'Helvetica',
    pageSize: 'a4',
    margin: 40,
    lineHeight: 1.45,
    includePageNumbers: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const insertSnippet = (snippet: string) => {
    setBodyText((prev) => prev + '\n' + snippet);
  };

  const handleGenerate = async () => {
    if (!bodyText.trim()) {
      setError('Please enter document content to generate a PDF.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const result = await createPdfFromText(bodyText, {
        ...options,
        documentTitle: title || undefined,
        author: author || undefined,
      });

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
      setError('Failed to generate PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = bodyText ? bodyText.split('\n').length : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 text-violet-700 dark:text-violet-400 text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" />
          Document Editor
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          Write & Generate PDF Documents
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Type or paste text directly into the editor, configure typography and margins, and download a publication-ready PDF.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Editor */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title..."
                className="w-full px-3.5 py-2.5 text-base font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Author / Subtitle (Optional)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Engineering Lead, Operations Dept"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Quick Snippet Insert Toolbar */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
            <span className="text-slate-400 text-[11px] font-semibold shrink-0">Insert:</span>
            <button
              type="button"
              onClick={() => insertSnippet('\nSECTION HEADING\n')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 shrink-0"
            >
              <Heading className="w-3 h-3" /> Heading
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('• Bullet point item\n• Second key takeaway')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 shrink-0"
            >
              <List className="w-3 h-3" /> Bullet List
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('> "Important citation, note, or principle."')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 shrink-0"
            >
              <Quote className="w-3 h-3" /> Quote Block
            </button>
          </div>

          {/* Body Text Editor */}
          <div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write your document text here..."
              rows={16}
              className={`w-full p-4 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y leading-relaxed ${
                options.fontFamily === 'Courier' ? 'font-mono' : ''
              }`}
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 px-1">
              <span>{lineCount} lines &bull; {wordCount} words &bull; {bodyText.length} characters</span>
              <span>Estimated: ~{Math.max(1, Math.ceil(lineCount / 40))} pages</span>
            </div>
          </div>
        </div>

        {/* Right: Typography & PDF Settings */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-[#1E1B4B] dark:text-white text-base">Layout & Typography</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure font and paper settings</p>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Font Family
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Helvetica', label: 'Helvetica' },
                { id: 'Times', label: 'Times Serif' },
                { id: 'Courier', label: 'Courier Mono' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOptions({ ...options, fontFamily: f.id as any })}
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
                    onClick={() => setOptions({ ...options, fontSize: size })}
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
                    onClick={() => setOptions({ ...options, pageSize: s.id as any })}
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
              checked={options.includePageNumbers !== false}
              onChange={(e) => setOptions({ ...options, includePageNumbers: e.target.checked })}
              className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Include "Page X of Y" footer numbers
            </span>
          </label>

          {/* Generate Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing || !bodyText.trim()}
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
                  Generate PDF Document
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
              <h3 className="font-extrabold text-lg text-white">Your PDF Document is Ready!</h3>
              <p className="text-white/80 text-xs sm:text-sm">
                {pageCount} {pageCount === 1 ? 'page' : 'pages'} &bull; Size: {formatBytes(downloadBlob.size)}
              </p>
            </div>
          </div>

          <a
            href={downloadUrl}
            download={`${(title || 'document').toLowerCase().replace(/\s+/g, '_')}.pdf`}
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
