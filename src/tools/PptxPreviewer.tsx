import React, { useState, useRef } from 'react';
import {
  Presentation,
  Upload,
  Download,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  BookOpen,
  Copy,
  Check
} from 'lucide-react';
import { analyzePptxFile, PptxAnalysisResult, PptxSlideInfo } from '../utils/pptxUtils';
import { formatBytes } from '../utils/fileUtils';

export const PptxPreviewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PptxAnalysisResult | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      setCurrentSlideIndex(0);
      setFile(selectedFile);

      const result = await analyzePptxFile(selectedFile);
      setAnalysis(result);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not parse PowerPoint presentation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    if (!analysis) return;
    let fullDoc = `Vexora Presentation Text Export\n`;
    fullDoc += `File: ${analysis.fileName}\n`;
    if (analysis.title) fullDoc += `Title: ${analysis.title}\n`;
    if (analysis.author) fullDoc += `Author: ${analysis.author}\n`;
    fullDoc += `Total Slides: ${analysis.slideCount}\n\n`;
    fullDoc += `========================================================\n\n`;

    analysis.slides.forEach((slide) => {
      fullDoc += `--- SLIDE ${slide.slideNumber}: ${slide.title} ---\n\n`;
      if (slide.texts.length > 0) {
        fullDoc += slide.texts.join('\n') + '\n\n';
      } else {
        fullDoc += `(No text content)\n\n`;
      }
      if (slide.notes) {
        fullDoc += `[Presenter Notes]: ${slide.notes}\n\n`;
      }
    });

    const blob = new Blob([fullDoc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.fileName.replace(/\.[^/.]+$/, '')}_slides_text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (analysis) {
      analysis.media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    }
    setFile(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentSlide: PptxSlideInfo | undefined = analysis?.slides[currentSlideIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          Slide Inspector & Text Reader
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          Preview PowerPoint Slides & Text
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Read slide titles, body copy, and presenter speaker notes from OpenXML PPTX files directly in your browser.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Cannot read presentation</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-amber-300 dark:border-amber-800/80 hover:border-amber-500 bg-amber-50/40 dark:bg-slate-900 hover:bg-amber-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200 dark:shadow-none">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">Select a PowerPoint Presentation</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Upload any .pptx file to read slide texts, bullet points, and speaker notes locally.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-md shadow-amber-100 dark:shadow-none transition-all text-sm inline-flex items-center gap-2"
          >
            Choose PPTX File
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B] dark:text-white">Parsing slide structures and notes...</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-[#1E1B4B] dark:text-white text-sm truncate max-w-xs sm:max-w-md">
                  {analysis.fileName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {analysis.slideCount} slides &bull; {analysis.media.length} images &bull; {formatBytes(analysis.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadText}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Text (.txt)
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Main Slide Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Slide Navigation List */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm max-h-[600px] overflow-y-auto space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Slides ({analysis.slideCount})
              </p>
              {analysis.slides.map((s, idx) => (
                <button
                  key={s.slideNumber}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    currentSlideIndex === idx
                      ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded px-1.5 py-0.5 shrink-0">
                    {s.slideNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{s.title || `Slide ${s.slideNumber}`}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {s.texts.length} text blocks {s.notes ? '&bull; Has notes' : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Slide Detailed Text View */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              {currentSlide ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Slide {currentSlide.slideNumber} of {analysis.slideCount}
                      </span>
                      <h2 className="text-xl font-extrabold text-[#1E1B4B] dark:text-white mt-1">
                        {currentSlide.title || `Slide ${currentSlide.slideNumber}`}
                      </h2>
                    </div>

                    {/* Prev / Next controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={currentSlideIndex === analysis.slides.length - 1}
                        onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Slide Content Box */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Extracted Slide Text
                        </label>
                        {currentSlide.texts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(currentSlide.texts.join('\n\n'))}
                            className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy Text'}
                          </button>
                        )}
                      </div>

                      {currentSlide.texts.length > 0 ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed max-h-[300px] overflow-y-auto select-text">
                          {currentSlide.texts.map((t, idx) => (
                            <p key={idx} className="whitespace-pre-wrap">
                              {t}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-400 text-xs">
                          No text runs found on this slide (may be a graphic-only slide).
                        </div>
                      )}
                    </div>

                    {/* Presenter Speaker Notes */}
                    {currentSlide.notes && (
                      <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Presenter Speaker Notes</p>
                        <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                          {currentSlide.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
